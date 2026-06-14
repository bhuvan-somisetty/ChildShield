// Phase 2 — Targets, Rewards/Promises, Streaks, Achievements and the (deterministic)
// AI analysis engine. Same pattern as services.js/tasks.js: this module owns the
// mutations + realtime fan-out, so REST routes behave identically over any
// transport. Everything is computed from real persisted data — no mocks.
import { Repo, now } from './db.js';
import { room } from './services.js';

const targets = Repo('targets');
const targetHistory = Repo('targetHistory');
const rewards = Repo('rewards');
const rewardHistory = Repo('rewardHistory');
const achievements = Repo('achievements');
const streaks = Repo('streaks');
const aiReports = Repo('aiReports');
const tasks = Repo('tasks');
const pairings = Repo('pairings');

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
  // Completing a target unlocks any rewards promised against it.
  if (statusChanged && updated.status === 'completed') unlockRewardsForTarget(io, updated.id);
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
  if (c.includes('study') || c.includes('math') || c.includes('homework')) return 'study';
  if (c.includes('read')) return 'reading';
  if (c.includes('exercise') || c.includes('fitness') || c.includes('sport') || c.includes('workout')) return 'exercise';
  return null;
};

export const publicStreak = (s) => ({ childId: s.childId, kind: s.kind, current: s.current || 0, longest: s.longest || 0, lastQualifiedDate: s.lastQualifiedDate || null });
export const publicAchievement = (a) => ({ id: a.id, childId: a.childId, kind: a.kind, streakKind: a.streakKind, milestone: a.milestone, title: a.title, at: a.at });

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
  return updated;
};

// Called when a task transitions; only 'completed' qualifies a day.
export const onTaskCompleted = (io, task) => {
  if (!task || task.completionState !== 'completed') return;
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
  const risk = completionPct >= 80 ? 'Low' : completionPct >= 50 ? 'Medium' : 'High';

  // Rule-based recommendation from the weakest real signal.
  let recommendation = 'Keep up the consistent effort.';
  if (total === 0) recommendation = 'Create a few tasks to start tracking progress.';
  else if (completionPct < 50) recommendation = 'Break work into smaller daily tasks to lift completion.';
  else if (failurePct >= 30) recommendation = 'Several tasks were marked failed — review what is blocking them.';
  else {
    const reading = childStreaks.find((s) => s.kind === 'reading')?.current || 0;
    const exercise = childStreaks.find((s) => s.kind === 'exercise')?.current || 0;
    if (reading < 3) recommendation = 'Increase Reading Sessions.';
    else if (exercise < 3) recommendation = 'Add a short daily exercise habit.';
  }

  const metrics = {
    period, taskCompletionPct: completionPct, taskFailurePct: failurePct,
    tasksTotal: total, tasksCompleted: completed.length, tasksFailed: failed.length,
    currentTaskStreak: taskStreak, mostProductiveTime,
    avgTargetProgress, targets: targetProgress,
    streaks: childStreaks, riskLevel: risk, recommendation,
  };
  const summary = `Task completion ${completionPct}% · ${taskStreak}-day streak · ${childTargets.length} target(s) at ${avgTargetProgress}% avg · Risk: ${risk}. ${recommendation}`;
  const rec = aiReports.insert({ familyId, childId, period, metrics, summary, at: now() });
  emit(io, familyId, childId, 'report:ready', { id: rec.id, period, childId });
  return { id: rec.id, childId, period, metrics, summary, at: rec.at };
};
