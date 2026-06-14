// Phase 2.5 — Productivity & Planning. Extends the existing task system with:
// task categories, recurring task generation (materialised into real tasks), and
// per-task comment threads. Realtime fan-out via the shared pairing room, same
// pattern as tasks.js/growth.js. No mock data — recurring instances become real
// rows in `tasks` so streaks/achievements/AI reports/calendar all see them.
import { Repo, now } from './db.js';
import { room } from './services.js';
import { createTask } from './tasks.js';

const tasks = Repo('tasks');
const categories = Repo('taskCategories');
const comments = Repo('taskComments');
const recurring = Repo('recurringTasks');
const calendar = Repo('calendarEvents');
const pairings = Repo('pairings');

export const BUILTIN_CATEGORIES = ['Homework', 'Study', 'Reading', 'Coding', 'Exercise', 'Chores', 'Health', 'School', 'Custom'];
export const FREQUENCIES = ['daily', 'weekdays', 'weekly', 'monthly', 'custom'];

const pairingForChild = (childId) => pairings.find((p) => p.childId === childId);
const emit = (io, familyId, childId, event, body) => {
  const p = pairingForChild(childId);
  if (p) io.to(room.pairing(p.id)).emit(event, body);
  else io.to(room.parent(familyId)).emit(event, body);
};

/* ── Categories ────────────────────────────────────────────────────────── */
export const listCategories = (familyId) => {
  const custom = categories.filter((c) => c.familyId === familyId).map((c) => ({ id: c.id, name: c.name, color: c.color || '#64748b', custom: true }));
  return [...BUILTIN_CATEGORIES.map((name) => ({ id: name, name, builtin: true })), ...custom];
};
export const addCategory = (io, { familyId, name, color }) => {
  const clean = String(name || '').trim();
  if (!clean) return null;
  if (BUILTIN_CATEGORIES.some((b) => b.toLowerCase() === clean.toLowerCase()) || categories.find((c) => c.familyId === familyId && c.name.toLowerCase() === clean.toLowerCase())) return null;
  const c = categories.insert({ familyId, name: clean, color: color || '#64748b', custom: true });
  io.to(room.parent(familyId)).emit('category:upserted', { id: c.id, name: c.name, color: c.color, custom: true });
  return c;
};

/* ── Task comments ─────────────────────────────────────────────────────── */
export const publicComment = (c) => ({ id: c.id, taskId: c.taskId, authorRole: c.authorRole, authorId: c.authorId || null, body: c.body, at: c.at });
export const addTaskComment = (io, task, { authorRole, authorId, body }) => {
  const c = comments.insert({ taskId: task.id, familyId: task.familyId, authorRole, authorId: authorId || null, body: String(body || '').trim(), at: now() });
  emit(io, task.familyId, task.childId, 'task:comment', publicComment(c));
  return c;
};
export const listTaskComments = (taskId) => comments.filter((c) => c.taskId === taskId).sort((a, b) => a.at - b.at).map(publicComment);

/* ── Recurring tasks ───────────────────────────────────────────────────── */
const HORIZON_DAYS = 14;
const dayKey = (ms = Date.now()) => new Date(ms).toISOString().slice(0, 10);
const addDays = (key, n) => { const d = new Date(key + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
const weekdayOf = (key) => new Date(key + 'T00:00:00Z').getUTCDay(); // 0=Sun..6=Sat

const occursOn = (rule, key) => {
  const wd = weekdayOf(key);
  switch (rule.frequency) {
    case 'daily': return true;
    case 'weekdays': return wd >= 1 && wd <= 5;
    case 'weekly': return (rule.weekdays || []).includes(wd) || (!rule.weekdays?.length && wd === weekdayOf(rule.startDate || dayKey()));
    case 'custom': return (rule.weekdays || []).includes(wd);
    case 'monthly': return new Date(key + 'T00:00:00Z').getUTCDate() === (rule.dayOfMonth || 1);
    default: return false;
  }
};

export const publicRecurring = (r) => ({ id: r.id, familyId: r.familyId, childId: r.childId, title: r.title, category: r.category, priority: r.priority, note: r.note || '', frequency: r.frequency, weekdays: r.weekdays || [], dayOfMonth: r.dayOfMonth || null, status: r.status, createdAt: r.createdAt });

// Materialise concrete task rows for any rule-occurrence inside the horizon that
// doesn't already exist (idempotent). Each instance is a normal task with a
// dueAt date, so it flows through streaks/achievements/AI/calendar unchanged.
const materializeRule = (io, rule) => {
  if (rule.status !== 'active') return 0;
  let made = 0;
  for (let i = 0; i < HORIZON_DAYS; i += 1) {
    const key = addDays(dayKey(), i);
    if (!occursOn(rule, key)) continue;
    const exists = tasks.find((t) => t.recurringId === rule.id && t.dueAt === key && !t.deletedAt);
    if (exists) continue;
    const t = createTask(io, {
      familyId: rule.familyId, childId: rule.childId, source: rule.createdByRole || 'parent',
      actorRole: rule.createdByRole || 'parent', actorId: rule.createdById,
      title: rule.title, description: rule.description || '', category: rule.category, note: rule.note || '',
      priority: rule.priority || 'normal', dueAt: key,
    });
    tasks.update(t.id, { recurringId: rule.id });
    calendar.insert({ familyId: rule.familyId, childId: rule.childId, taskId: t.id, recurringId: rule.id, title: rule.title, category: rule.category, date: key, at: new Date(key + 'T00:00:00Z').getTime() });
    made += 1;
  }
  return made;
};

export const createRecurring = (io, { familyId, childId, createdByRole, createdById, title, description, category, priority, note, frequency, weekdays, dayOfMonth }) => {
  const rule = recurring.insert({
    familyId, childId, createdByRole, createdById,
    title: String(title || '').trim() || 'Recurring task', description: description || '', category: category || 'Custom',
    priority: priority || 'normal', note: note || '',
    frequency: FREQUENCIES.includes(frequency) ? frequency : 'daily',
    weekdays: Array.isArray(weekdays) ? weekdays.filter((d) => d >= 0 && d <= 6) : [],
    dayOfMonth: dayOfMonth || null, startDate: dayKey(), status: 'active',
  });
  materializeRule(io, rule);
  emit(io, familyId, childId, 'recurring:upserted', publicRecurring(rule));
  return rule;
};
export const listRecurring = (familyId, childId) => recurring.filter((r) => r.familyId === familyId && (!childId || r.childId === childId) && r.status === 'active').map(publicRecurring);
export const deleteRecurring = (io, rule) => {
  recurring.update(rule.id, { status: 'cancelled' });
  // Remove not-yet-started future instances; keep past/in-progress ones + history.
  tasks.filter((t) => t.recurringId === rule.id && t.completionState === 'not_started' && t.dueAt > dayKey() && !t.deletedAt).forEach((t) => tasks.update(t.id, { deletedAt: now() }));
  emit(io, rule.familyId, rule.childId, 'recurring:deleted', { id: rule.id, childId: rule.childId });
  return { ok: true, id: rule.id };
};

// Scheduler — top up the horizon for every active rule (boot + interval).
export const materializeAll = (io) => recurring.filter((r) => r.status === 'active').reduce((n, r) => n + materializeRule(io, r), 0);
export const startRecurringScheduler = (io) => { materializeAll(io); return setInterval(() => materializeAll(io), 3600000); };
