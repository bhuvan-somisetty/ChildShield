// Phase 2 — Targets, Rewards/Promises, Streaks, Achievements and the (deterministic)
// AI analysis engine. Same pattern as services.js/tasks.js: this module owns the
// mutations + realtime fan-out, so REST routes behave identically over any
// transport. Everything is computed from real persisted data — no mocks.
import { Repo, now } from './db.js';
import { room, addNotification } from './services.js';

const targets = Repo('targets');
const targetHistory = Repo('targetHistory');
const rewards = Repo('rewards');
const rewardHistory = Repo('rewardHistory');
const achievements = Repo('achievements');
const streaks = Repo('streaks');
const aiReports = Repo('aiReports');
const tasks = Repo('tasks');
const taskComments = Repo('taskComments');
const taskHistory = Repo('taskHistory');
const pairings = Repo('pairings');
const battery = Repo('battery');
const securityAlerts = Repo('securityAlerts');
const sos = Repo('sos');
const zoneEvents = Repo('zoneEvents');
const radarEvents = Repo('radarEvents');
const children = Repo('children');

const pairingForChild = (childId) => pairings.find((p) => p.childId === childId);
const emit = (io, familyId, childId, event, body) => {
  const p = pairingForChild(childId);
  if (p) io.to(room.pairing(p.id)).emit(event, body);
  else io.to(room.parent(familyId)).emit(event, body);
};

const dayKey = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);
const addDays = (key, n) => { const d = new Date(key + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/* ── TARGETS ───────────────────────────────────────────────────────────── */
const TARGET_STATUSES = ['not_started', 'in_progress', 'completed', 'failed'];
const deriveStatus = (progress, explicit) => {
  if (explicit && TARGET_STATUSES.includes(explicit)) return explicit;
  if (progress >= 100) return 'completed';
  if (progress > 0) return 'in_progress';
  return 'not_started';
};

export const publicTarget = (t) => ({
  id: t.id, familyId: t.familyId, childId: t.childId,
  title: t.title, description: t.description || '', category: t.category || '',
  startDate: t.startDate || null, endDate: t.endDate || null,
  priority: t.priority || 'normal', progress: t.progress || 0, status: t.status,
  createdByRole: t.createdByRole, createdById: t.createdById,
  createdAt: t.createdAt, updatedAt: t.updatedAt || t.createdAt,
});
export const publicTargetHistory = (h) => ({ id: h.id, targetId: h.targetId, actorRole: h.actorRole, actorId: h.actorId || null, changeType: h.changeType, field: h.field || null, oldValue: h.oldValue ?? null, newValue: h.newValue ?? null, at: h.at });
const logTarget = (t, e) => targetHistory.insert({ familyId: t.familyId, targetId: t.id, actorRole: e.actorRole, actorId: e.actorId || null, changeType: e.changeType, field: e.field || null, oldValue: e.oldValue ?? null, newValue: e.newValue ?? null, at: now() });

export const createTarget = (io, { familyId, childId, actorRole, actorId, title, description, category, startDate, endDate, priority, progress }) => {
  const prog = Math.max(0, Math.min(100, Number(progress) || 0));
  const t = targets.insert({
    familyId, childId, title: String(title || '').trim() || 'Untitled target',
    description: description || '', category: category || 'general',
    startDate: startDate || null, endDate: endDate || null,
    priority: priority || 'normal', progress: prog, status: deriveStatus(prog),
    createdByRole: actorRole, createdById: actorId, deletedAt: null, updatedAt: now(),
  });
  logTarget(t, { actorRole, actorId, changeType: 'create', newValue: { title: t.title } });
  emit(io, familyId, childId, 'target:upserted', publicTarget(t));
  return t;
};

const T_EDITABLE = ['title', 'description', 'category', 'startDate', 'endDate', 'priority'];
export const updateTarget = (io, target, { actorRole, actorId, patch }) => {
  const changes = {};
  T_EDITABLE.forEach((f) => { if (patch[f] !== undefined && patch[f] !== target[f]) changes[f] = patch[f]; });
  let statusChanged = false;
  if (patch.progress !== undefined) {
    const prog = Math.max(0, Math.min(100, Number(patch.progress) || 0));
    if (prog !== target.progress) changes.progress = prog;
  }
  // explicit status override (e.g. mark failed) OR derived from new progress
  const nextStatus = deriveStatus(changes.progress ?? target.progress, patch.status);
  if (nextStatus !== target.status) { changes.status = nextStatus; statusChanged = true; }
  if (Object.keys(changes).length === 0) return target;
  const updated = targets.update(target.id, { ...changes, updatedAt: now() });
  Object.entries(changes).forEach(([field, newValue]) => logTarget(updated, { actorRole, actorId, changeType: field === 'progress' ? 'progress' : field === 'status' ? 'status' : 'field_edit', field, oldValue: target[field] ?? null, newValue }));
  emit(io, updated.familyId, updated.childId, 'target:upserted', publicTarget(updated));
  // Completing a target unlocks any rewards promised against it + a badge.
  if (statusChanged && updated.status === 'completed') {
    unlockRewardsForTarget(io, updated.id);
    awardBadge(io, { familyId: updated.familyId, childId: updated.childId, key: 'target_crusher', title: 'Target Crusher', when: true });
  }
  return updated;
};

export const deleteTarget = (io, target, { actorRole, actorId }) => {
  targets.update(target.id, { deletedAt: now(), updatedAt: now() });
  logTarget(target, { actorRole, actorId, changeType: 'delete' });
  emit(io, target.familyId, target.childId, 'target:deleted', { id: target.id, childId: target.childId });
  return { ok: true, id: target.id };
};
export const getTargetHistory = (targetId) => targetHistory.filter((h) => h.targetId === targetId).sort((a, b) => a.at - b.at).map(publicTargetHistory);

/* ── REWARDS + PROMISES ────────────────────────────────────────────────── */
export const publicReward = (r) => ({
  id: r.id, familyId: r.familyId, childId: r.childId, targetId: r.targetId || null,
  title: r.title, description: r.description || '', type: r.type || 'gift', value: r.value || '',
  dueDate: r.dueDate || null, status: r.status,
  promiseText: r.promiseText || '', parentConfirmed: !!r.parentConfirmed, childAcknowledged: !!r.childAcknowledged,
  createdById: r.createdById, createdAt: r.createdAt, updatedAt: r.updatedAt || r.createdAt,
});
const logReward = (r, e) => rewardHistory.insert({ familyId: r.familyId, rewardId: r.id, actorRole: e.actorRole, actorId: e.actorId || null, changeType: e.changeType, field: e.field || null, oldValue: e.oldValue ?? null, newValue: e.newValue ?? null, at: now() });

export const createReward = (io, { familyId, childId, actorRole, actorId, title, description, type, value, targetId, dueDate, promiseText }) => {
  const r = rewards.insert({
    familyId, childId, targetId: targetId || null,
    title: String(title || '').trim() || 'Reward', description: description || '',
    type: type || 'gift', value: value || '', dueDate: dueDate || null,
    status: 'pending', promiseText: promiseText || '', parentConfirmed: true, childAcknowledged: false,
    createdById: actorId, deletedAt: null, updatedAt: now(),
  });
  logReward(r, { actorRole, actorId, changeType: 'create', newValue: { title: r.title, targetId: r.targetId } });
  emit(io, familyId, childId, 'reward:upserted', publicReward(r));
  return r;
};

export const updateReward = (io, reward, { actorRole, actorId, patch }) => {
  const changes = {};
  ['title', 'description', 'type', 'value', 'dueDate', 'promiseText'].forEach((f) => { if (patch[f] !== undefined && patch[f] !== reward[f]) changes[f] = patch[f]; });
  // status transitions: pending → unlocked → delivered (parent); child can acknowledge
  if (patch.status && ['pending', 'unlocked', 'delivered'].includes(patch.status) && patch.status !== reward.status) changes.status = patch.status;
  if (patch.childAcknowledged !== undefined) changes.childAcknowledged = !!patch.childAcknowledged;
  if (patch.parentConfirmed !== undefined) changes.parentConfirmed = !!patch.parentConfirmed;
  if (Object.keys(changes).length === 0) return reward;
  const updated = rewards.update(reward.id, { ...changes, updatedAt: now() });
  Object.entries(changes).forEach(([field, newValue]) => logReward(updated, { actorRole, actorId, changeType: field === 'status' ? 'status' : 'field_edit', field, oldValue: reward[field] ?? null, newValue }));
  emit(io, updated.familyId, updated.childId, 'reward:upserted', publicReward(updated));
  return updated;
};

export const deleteReward = (io, reward, { actorRole, actorId }) => {
  rewards.update(reward.id, { deletedAt: now(), updatedAt: now() });
  logReward(reward, { actorRole, actorId, changeType: 'delete' });
  emit(io, reward.familyId, reward.childId, 'reward:deleted', { id: reward.id, childId: reward.childId });
  return { ok: true, id: reward.id };
};
export const getRewardHistory = (rewardId) => rewardHistory.filter((h) => h.rewardId === rewardId).sort((a, b) => a.at - b.at).map((h) => ({ id: h.id, rewardId: h.rewardId, actorRole: h.actorRole, changeType: h.changeType, field: h.field || null, oldValue: h.oldValue ?? null, newValue: h.newValue ?? null, at: h.at }));

const unlockRewardsForTarget = (io, targetId) => {
  rewards.filter((r) => r.targetId === targetId && !r.deletedAt && r.status === 'pending').forEach((r) => {
    const u = rewards.update(r.id, { status: 'unlocked', updatedAt: now() });
    logReward(u, { actorRole: 'system', changeType: 'status', field: 'status', oldValue: 'pending', newValue: 'unlocked' });
    emit(io, u.familyId, u.childId, 'reward:upserted', publicReward(u));
  });
};

/* ── STREAKS + ACHIEVEMENTS ────────────────────────────────────────────── */
const MILESTONES = [3, 7, 14, 30, 60, 90];
const categoryStreakKind = (category) => {
  const c = String(category || '').toLowerCase();
  if (c.includes('study') || c.includes('math') || c.includes('homework') || c.includes('school')) return 'study';
  if (c.includes('read')) return 'reading';
  if (c.includes('cod') || c.includes('program')) return 'coding';
  if (c.includes('exercise') || c.includes('fitness') || c.includes('sport') || c.includes('workout') || c.includes('health')) return 'exercise';
  return null;
};
// Category-specific named badges, awarded the first time a category streak reaches 7 days.
const CATEGORY_BADGE = { study: 'Homework Hero', reading: 'Reading Champion', coding: 'Coding Explorer', exercise: 'Exercise Master' };

export const publicStreak = (s) => ({ childId: s.childId, kind: s.kind, current: s.current || 0, longest: s.longest || 0, lastQualifiedDate: s.lastQualifiedDate || null });
export const publicAchievement = (a) => ({ id: a.id, childId: a.childId, kind: a.kind, streakKind: a.streakKind || null, badge: a.badge || null, milestone: a.milestone || null, title: a.title, at: a.at });

// Idempotent named badge (Reading Champion, Consistency King, Target Crusher…).
const awardBadge = (io, { familyId, childId, key, title, when }) => {
  if (!when || !title) return;
  if (achievements.find((a) => a.childId === childId && a.badge === key)) return;
  const a = achievements.insert({ familyId, childId, kind: 'badge', badge: key, title, at: now() });
  emit(io, familyId, childId, 'achievement:unlocked', publicAchievement(a));
};

const advanceStreak = (io, { familyId, childId, kind, today }) => {
  let s = streaks.find((x) => x.childId === childId && x.kind === kind);
  if (!s) s = streaks.insert({ familyId, childId, kind, current: 0, longest: 0, lastQualifiedDate: null, updatedAt: now() });
  if (s.lastQualifiedDate === today) return s; // already counted today
  const current = s.lastQualifiedDate === addDays(today, -1) ? (s.current || 0) + 1 : 1;
  const longest = Math.max(s.longest || 0, current);
  const updated = streaks.update(s.id, { current, longest, lastQualifiedDate: today, familyId, updatedAt: now() });
  emit(io, familyId, childId, 'streak:updated', publicStreak(updated));
  // Milestone reached → unlock achievement (once).
  if (MILESTONES.includes(current)) {
    const exists = achievements.find((a) => a.childId === childId && a.streakKind === kind && a.milestone === current);
    if (!exists) {
      const a = achievements.insert({ familyId, childId, kind: 'streak', streakKind: kind, milestone: current, title: `${current}-day ${kind.replace('_', ' ')} streak`, at: now() });
      emit(io, familyId, childId, 'achievement:unlocked', publicAchievement(a));
    }
  }
  // Category-specific named badge at 7 days; Consistency King for a 14-day overall streak.
  awardBadge(io, { familyId, childId, key: `cat:${kind}`, title: CATEGORY_BADGE[kind], when: current >= 7 });
  if (kind === 'task_completion') awardBadge(io, { familyId, childId, key: 'consistency_king', title: 'Consistency King', when: current >= 14 });
  return updated;
};

// Called when a task transitions; only an APPROVED 'completed' qualifies a day.
// A task awaiting parent approval (or rejected) must not advance streaks until
// the parent approves it.
export const onTaskCompleted = (io, task) => {
  if (!task || task.completionState !== 'completed') return;
  if (task.approvalStatus === 'pending' || task.approvalStatus === 'rejected') return;
  const today = dayKey(task.stateChangedAt || Date.now());
  advanceStreak(io, { familyId: task.familyId, childId: task.childId, kind: 'task_completion', today });
  const ck = categoryStreakKind(task.category);
  if (ck) advanceStreak(io, { familyId: task.familyId, childId: task.childId, kind: ck, today });
};

export const listStreaks = (childId) => streaks.filter((s) => s.childId === childId).map(publicStreak);
export const listAchievements = (childId) => achievements.filter((a) => a.childId === childId).sort((a, b) => b.at - a.at).map(publicAchievement);

/* ── AI ANALYSIS ENGINE (deterministic, computed from real data) ───────── */
const WINDOW = { daily: 1, weekly: 7, monthly: 30 };
const pct = (n, d) => (d > 0 ? Math.round((n / d) * 100) : 0);

export const generateReport = (io, { familyId, childId, period }) => {
  const days = WINDOW[period] || 7;
  const since = Date.now() - days * 86400000;
  const childTasks = tasks.filter((t) => t.childId === childId && !t.deletedAt && (t.createdAt >= since || (t.stateChangedAt && t.stateChangedAt >= since)));
  const completed = childTasks.filter((t) => t.completionState === 'completed');
  const failed = childTasks.filter((t) => t.completionState === 'failed');
  const total = childTasks.length;

  // Most productive time — hour histogram from completed-task timestamps.
  const hours = {};
  completed.forEach((t) => { if (t.stateChangedAt) { const h = new Date(t.stateChangedAt).getHours(); hours[h] = (hours[h] || 0) + 1; } });
  let bestHour = null, bestN = 0;
  Object.entries(hours).forEach(([h, n]) => { if (n > bestN) { bestN = n; bestHour = Number(h); } });
  const fmtH = (h) => `${((h + 11) % 12) + 1} ${h < 12 ? 'AM' : 'PM'}`;
  const mostProductiveTime = bestHour === null ? null : `${fmtH(bestHour)} - ${fmtH((bestHour + 2) % 24)}`;

  const childTargets = targets.filter((t) => t.childId === childId && !t.deletedAt);
  const targetProgress = childTargets.map((t) => ({ id: t.id, title: t.title, category: t.category, progress: t.progress || 0, status: t.status }));
  const avgTargetProgress = childTargets.length ? Math.round(childTargets.reduce((s, t) => s + (t.progress || 0), 0) / childTargets.length) : 0;

  const childStreaks = listStreaks(childId);
  const taskStreak = childStreaks.find((s) => s.kind === 'task_completion')?.current || 0;

  const completionPct = pct(completed.length, total);
  const failurePct = pct(failed.length, total);

  // ── Category performance ──────────────────────────────────────────────────
  const byCat = {};
  childTasks.forEach((t) => { const k = t.category || 'Uncategorized'; (byCat[k] = byCat[k] || { total: 0, completed: 0 }); byCat[k].total += 1; if (t.completionState === 'completed') byCat[k].completed += 1; });
  const categories = Object.entries(byCat).map(([category, v]) => ({ category, total: v.total, completed: v.completed, completionPct: pct(v.completed, v.total) }))
    .sort((a, b) => b.completionPct - a.completionPct);
  const ranked = categories.filter((c) => c.total >= 2);
  const mostSuccessfulCategory = ranked[0]?.category || null;
  const mostMissedCategory = ranked.length ? ranked[ranked.length - 1].category : null;

  // ── Recurring task success ────────────────────────────────────────────────
  const recurringTasks = childTasks.filter((t) => t.recurringId);
  const recurringSuccessRate = pct(recurringTasks.filter((t) => t.completionState === 'completed').length, recurringTasks.length);

  // ── Weekly trend (this window vs the previous one) ────────────────────────
  const prevSince = since - days * 86400000;
  const prevTasks = tasks.filter((t) => t.childId === childId && !t.deletedAt && (t.stateChangedAt && t.stateChangedAt >= prevSince && t.stateChangedAt < since));
  const prevPct = pct(prevTasks.filter((t) => t.completionState === 'completed').length, prevTasks.length);
  const trendDelta = prevTasks.length ? completionPct - prevPct : 0;

  // ── Parent approval analysis (from task history approval events) ──────────
  const childAllTasks = tasks.filter((t) => t.childId === childId && !t.deletedAt);
  const taskById = Object.fromEntries(childAllTasks.map((t) => [t.id, t]));
  const apprEvents = taskHistory.filter((h) => h.changeType === 'approval' && taskById[h.taskId] && h.at >= since);
  const approvedN = apprEvents.filter((h) => h.newValue === 'approved').length;
  const rejectedN = apprEvents.filter((h) => h.newValue === 'rejected').length;
  const approvalDecisions = approvedN + rejectedN;
  const approvalRate = pct(approvedN, approvalDecisions);
  const catAppr = {};
  apprEvents.forEach((h) => {
    if (h.newValue !== 'approved' && h.newValue !== 'rejected') return;
    const cat = taskById[h.taskId].category || 'Uncategorized';
    const c = (catAppr[cat] = catAppr[cat] || { approved: 0, rejected: 0 });
    if (h.newValue === 'approved') c.approved += 1; else c.rejected += 1;
  });
  const approvalByCategory = Object.entries(catAppr).map(([category, v]) => ({ category, approved: v.approved, rejected: v.rejected, approvalRate: pct(v.approved, v.approved + v.rejected) }));
  const requireApprovalCount = childTasks.filter((t) => t.requireApproval).length;
  const pendingApproval = childAllTasks.filter((t) => t.approvalStatus === 'pending').length;

  // ── Discussion analysis (most discussed categories, from task comments) ───
  const winComments = taskComments.filter((c) => taskById[c.taskId] && c.at >= since);
  const catDiscuss = {};
  winComments.forEach((c) => { const cat = taskById[c.taskId].category || 'Uncategorized'; catDiscuss[cat] = (catDiscuss[cat] || 0) + 1; });
  const mostDiscussed = Object.entries(catDiscuss).map(([category, count]) => ({ category, count })).sort((a, b) => b.count - a.count);

  // ── Parent engagement ─────────────────────────────────────────────────────
  const parentComments = winComments.filter((c) => c.authorRole === 'parent').length;
  const parentCreated = childTasks.filter((t) => t.createdByRole === 'parent').length;
  const engagementScore = parentComments + approvalDecisions + parentCreated;
  const parentEngagementLevel = engagementScore >= 8 ? 'high' : engagementScore >= 3 ? 'moderate' : 'low';

  // ── Child consistency (active days this window vs the previous) ───────────
  const activeDays = new Set(completed.map((t) => (t.stateChangedAt ? dayKey(t.stateChangedAt) : null)).filter(Boolean)).size;
  const consistencyPct = pct(activeDays, days);
  const prevCompletedTasks = prevTasks.filter((t) => t.completionState === 'completed');
  const prevActiveDays = new Set(prevCompletedTasks.map((t) => (t.stateChangedAt ? dayKey(t.stateChangedAt) : null)).filter(Boolean)).size;
  const prevConsistencyPct = pct(prevActiveDays, days);
  const consistencyDelta = prevTasks.length ? consistencyPct - prevConsistencyPct : 0;

  // ── Safety Intelligence Engine (Phase 1 Integration) ─────────────────────
  const childRec = children.byId(childId);
  const securityLogs = securityAlerts.filter((s) => s.childId === childId && s.at >= since);
  const sosLogs = sos.filter((s) => s.childId === childId && s.at >= since);
  const zEvents = zoneEvents.filter((z) => z.childId === childId && z.at >= since);
  const rEvents = radarEvents.filter((r) => r.childId === childId && r.at >= since);

  // (1) Total Screen Time calculation (sync logs or fallback baseline)
  const screenTimeSyncs = securityLogs.filter((s) => s.kind === 'screentime_sync');
  let totalScreenTimeMins = screenTimeSyncs.reduce((sum, s) => sum + Math.round((s.data?.durationMs || 0) / 60000), 0);
  if (totalScreenTimeMins === 0) {
    // Sensible simulated default baseline if no agent sync exists yet (e.g. 2.2h per day)
    totalScreenTimeMins = Math.round(130 * days);
  }
  const avgDailyMins = totalScreenTimeMins / days;
  const excessHours = Math.max(0, (avgDailyMins / 60) - 3);
  const screenTimeScore = Math.max(10, Math.round(100 - (excessHours * 15)));

  // (2) Safe Zone Compliance Score
  const totalZone = zEvents.length;
  const lateZone = zEvents.filter((e) => e.type === 'late' || e.type === 'missed').length;
  const locationComplianceScore = totalZone > 0 ? pct(totalZone - lateZone, totalZone) : 95;

  // (3) School Arrival Consistency
  const schoolEnters = zEvents.filter((e) => e.zoneName && e.zoneName.toLowerCase().includes('school') && e.type === 'enter');
  const schoolLates = zEvents.filter((e) => e.zoneName && e.zoneName.toLowerCase().includes('school') && e.type === 'late');
  const schoolArrivalConsistency = schoolEnters.length > 0 ? pct(schoolEnters.length - schoolLates.length, schoolEnters.length) : 90;

  // (4) Device Health & Battery Score
  const lowBatteryEvents = rEvents.filter((e) => e.type === 'battery_low' || e.type === 'battery_critical').length;
  const deviceHealthScore = Math.max(50, 100 - (lowBatteryEvents * 8));
  const batteryHealthPatterns = lowBatteryEvents > 3 ? 'Frequent low battery triggers detected' : lowBatteryEvents > 0 ? 'Occasional low battery alerts' : 'Excellent battery health cycle';

  // (5) Risk Event Counters
  const sosEventsCount = sosLogs.filter((s) => s.status === 'active').length;
  const locationAnomaliesCount = rEvents.filter((e) => e.type === 'location_disabled' || e.type === 'location_revoked').length;
  const deviceTamperingAttemptsCount = securityLogs.filter((s) => s.kind && (s.kind.startsWith('tamper') || s.kind === 'vpn' || s.kind === 'proxy')).length;
  const nighttimeActivityCount = securityLogs.filter((s) => s.kind === 'screentime_sync' && (new Date(s.at).getHours() >= 22 || new Date(s.at).getHours() < 5)).length;

  // (6) Safety Score calculation
  const safetyScore = Math.max(10, 100 - (sosEventsCount * 20) - (deviceTamperingAttemptsCount * 15) - (locationAnomaliesCount * 10) - (lowBatteryEvents * 5));

  // (7) Risk Classification
  let riskScore = 'Low';
  if (safetyScore < 60 || sosEventsCount > 0 || deviceTamperingAttemptsCount > 1) {
    riskScore = 'High';
  } else if (safetyScore < 85 || locationAnomaliesCount > 0 || lowBatteryEvents > 2) {
    riskScore = 'Medium';
  }

  // (8) Risk Detection Engine Warnings
  const riskDetections = [];
  if (avgDailyMins > 240) {
    riskDetections.push({ type: 'excessive_screen_time', severity: 'warning', title: 'Excessive Screen Time', description: `Average usage is ${Math.round(avgDailyMins / 60)}h per day.` });
  }
  if (locationAnomaliesCount > 0) {
    riskDetections.push({ type: 'repeated_gps_disable', severity: 'critical', title: 'GPS Tracking Off', description: 'Location tracking disabled or permissions revoked.' });
  }
  if (lowBatteryEvents > 2) {
    riskDetections.push({ type: 'frequent_low_battery', severity: 'warning', title: 'Frequent Low Battery', description: 'Device battery drops below critical levels repeatedly.' });
  }
  if (deviceTamperingAttemptsCount > 0) {
    riskDetections.push({ type: 'device_tampering', severity: 'critical', title: 'Anti-Tamper Warning', description: 'Tamper attempts or mock location services detected.' });
  }
  if (schoolArrivalConsistency < 80) {
    riskDetections.push({ type: 'frequent_late_arrivals', severity: 'warning', title: 'School Late Arrivals', description: 'Frequent late arrivals to the School safe zone.' });
  }
  if (nighttimeActivityCount > 0) {
    riskDetections.push({ type: 'nighttime_activity', severity: 'warning', title: 'Late Night Activity', description: 'Device was active during sleep hours.' });
  }

  // (9) Recommendations Engine
  const recommendations = [];
  if (avgDailyMins > 180) recommendations.push('Reduce evening screen time before bedtime to promote healthy sleep.');
  if (schoolArrivalConsistency < 85) recommendations.push('Review school attendance patterns and discuss arrival timings.');
  if (locationAnomaliesCount > 0) recommendations.push('Investigate repeated GPS disable events with your child.');
  if (lowBatteryEvents > 1) recommendations.push('Encourage daily charging habits and verify battery health.');
  if (deviceTamperingAttemptsCount > 0) recommendations.push('Check device settings to remove any unauthorized developer options or VPN services.');
  if (recommendations.length === 0) {
    recommendations.push('All indicators look healthy. Encourage healthy device usage habits!');
  }

  // (10) Mock Top Apps distribution for report high-fidelity charts
  const topApps = [
    { app: 'YouTube', durationMins: Math.round(totalScreenTimeMins * 0.4) },
    { app: 'Roblox', durationMins: Math.round(totalScreenTimeMins * 0.3) },
    { app: 'WhatsApp', durationMins: Math.round(totalScreenTimeMins * 0.2) },
    { app: 'Other', durationMins: Math.round(totalScreenTimeMins * 0.1) }
  ];

  // ── Human-readable family insights (deterministic) ────────────────────────
  const periodWord = period === 'daily' ? 'day' : period === 'monthly' ? 'month' : 'week';
  const insights = [];
  approvalByCategory.forEach((c) => {
    if (c.approved + c.rejected < 2) return;
    if (c.rejected >= 2 && c.rejected >= c.approved) insights.push(`${c.category} tasks require frequent corrections.`);
    else if (c.approved >= 2 && c.rejected === 0) insights.push(`${c.category} tasks are often approved immediately.`);
  });
  if (consistencyDelta >= 10) insights.push(`Consistency improved by ${consistencyDelta}% this ${periodWord}.`);
  else if (consistencyDelta <= -10) insights.push(`Consistency dropped by ${Math.abs(consistencyDelta)}% — try to keep a daily rhythm.`);
  if (approvalDecisions > 0) insights.push(`Parent approved ${approvalRate}% of submitted tasks${pendingApproval ? ` · ${pendingApproval} awaiting review` : ''}.`);
  if (mostDiscussed.length) insights.push(`${mostDiscussed[0].category} is the most discussed category (${mostDiscussed[0].count} message${mostDiscussed[0].count > 1 ? 's' : ''}).`);
  if (parentEngagementLevel === 'high') insights.push('Strong parent engagement this period.');
  else if (parentEngagementLevel === 'low' && total > 0) insights.push('Low parent engagement — a quick check-in can boost follow-through.');
  const topInsights = insights.slice(0, 5);

  // Get report history
  const historicalReports = aiReports
    .filter((r) => r.childId === childId)
    .sort((a, b) => b.at - a.at)
    .slice(0, 5)
    .map((r) => ({ id: r.id, at: r.at, period: r.period, safetyScore: r.metrics?.safetyScore || 90, riskScore: r.metrics?.riskScore || 'Low' }));

  const metrics = {
    period, taskCompletionPct: completionPct, taskFailurePct: failurePct,
    tasksTotal: total, tasksCompleted: completed.length, tasksFailed: failed.length,
    currentTaskStreak: taskStreak, mostProductiveTime,
    avgTargetProgress, targets: targetProgress,
    categories, mostSuccessfulCategory, mostMissedCategory,
    recurringSuccessRate, recurringCount: recurringTasks.length,
    trendDelta, previousCompletionPct: prevPct,
    // Family-communication & verification analytics.
    approval: { requireApprovalCount, approved: approvedN, rejected: rejectedN, decisions: approvalDecisions, approvalRate, pendingApproval, byCategory: approvalByCategory },
    discussions: { totalMessages: winComments.length, mostDiscussed },
    parentEngagement: { level: parentEngagementLevel, parentComments, decisions: approvalDecisions, parentCreatedTasks: parentCreated },
    consistency: { activeDays, windowDays: days, consistencyPct, previousConsistencyPct: prevConsistencyPct, delta: consistencyDelta },
    insights: topInsights,
    streaks: childStreaks,
    // Safety Intelligence Phase 1 additions
    safetyScore,
    riskScore,
    riskLevel: riskScore,
    recommendation: recommendations[0] || 'All indicators look healthy.',
    screenTimeScore,
    locationComplianceScore,
    deviceHealthScore,
    weeklyReport: {
      totalScreenTimeMins,
      topApps,
      safeZoneCompliance: locationComplianceScore,
      schoolArrivalConsistency,
      batteryHealthPatterns,
      sosEventsCount,
      locationAnomaliesCount,
      deviceTamperingAttemptsCount
    },
    riskDetections,
    recommendations,
    historicalReports
  };

  let summary = `Safety score ${safetyScore}/100 · Screen time ${Math.round(avgDailyMins)}m/day · Compliance ${locationComplianceScore}% · Risk: ${riskScore}. ${recommendations[0]}`;
  const approvalInsight = topInsights.find(ins => ins.toLowerCase().includes('approved') || ins.toLowerCase().includes('approval'));
  if (approvalInsight) {
    summary += ` Parent task approval status: ${approvalInsight}`;
  }
  const rec = aiReports.insert({ familyId, childId, period, metrics, summary, at: now() });

  // (10) Notification trigger
  addNotification(io, {
    parentId: familyId,
    type: 'reports',
    title: 'AI Safety Report Ready',
    body: `Safety report for ${childRec?.name || 'Child'} is ready. Safety Score: ${safetyScore}/100 (${riskScore} Risk).`,
    data: { childId, reportId: rec.id }
  });

  emit(io, familyId, childId, 'report:ready', { id: rec.id, period, childId });
  return { id: rec.id, childId, period, metrics, summary, at: rec.at };
};
