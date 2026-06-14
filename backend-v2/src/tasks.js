// Phase 1 — shared parent/child Task system with the triple-state UX and a full
// per-task edit history. All mutations + realtime fan-out live here (same pattern
// as services.js) so REST routes behave identically over any transport.
//
// Triple state cycles: not_started (⬜) → completed (✅) → failed (❌) → ⬜.
// Every transition AND every field edit is appended to task_history (who/what/
// when) — both the parent-facing history and the future AI analysis read it.
import { Repo, now } from './db.js';
import { room } from './services.js';

const tasks = Repo('tasks');
const history = Repo('taskHistory');
const pairings = Repo('pairings');

export const STATES = ['not_started', 'completed', 'failed'];
export const nextState = (s) => STATES[(STATES.indexOf(s) + 1) % STATES.length];

// The parent is always joined to every one of their pairing rooms (any status),
// and the child joins its pairing room once connected — so emitting to the
// pairing room reaches BOTH sides exactly once. Falls back to the parent room if
// no pairing exists yet.
const pairingForChild = (childId) => pairings.find((p) => p.childId === childId);

export const publicTask = (t) => ({
  id: t.id,
  familyId: t.familyId,
  childId: t.childId,
  title: t.title,
  description: t.description || '',
  note: t.note || '',
  category: t.category || '',
  priority: t.priority || 'normal',
  startTime: t.startTime || null,
  endTime: t.endTime || null,
  source: t.source,
  createdByRole: t.createdByRole,
  createdById: t.createdById,
  completionState: t.completionState,
  stateChangedAt: t.stateChangedAt || null,
  dueAt: t.dueAt || null,
  version: t.version || 1,
  createdAt: t.createdAt,
  updatedAt: t.updatedAt || t.createdAt,
});

export const publicHistory = (h) => ({
  id: h.id, taskId: h.taskId, actorRole: h.actorRole, actorId: h.actorId || null,
  changeType: h.changeType, field: h.field || null,
  oldValue: h.oldValue ?? null, newValue: h.newValue ?? null, at: h.at,
});

const logHistory = (task, { actorRole, actorId, changeType, field, oldValue, newValue }) =>
  history.insert({
    familyId: task.familyId, taskId: task.id,
    actorRole, actorId: actorId || null, changeType,
    field: field || null, oldValue: oldValue ?? null, newValue: newValue ?? null, at: now(),
  });

const emit = (io, task, event, body) => {
  const p = pairingForChild(task.childId);
  if (p) io.to(room.pairing(p.id)).emit(event, body);
  else io.to(room.parent(task.familyId)).emit(event, body);
};

export const createTask = (io, { familyId, childId, source, actorRole, actorId, title, description, category, note, priority, startTime, endTime, dueAt }) => {
  const t = tasks.insert({
    familyId, childId, listId: null,
    title: String(title || '').trim() || 'Untitled task',
    description: description || '', note: note || '', category: category || '',
    priority: priority || 'normal', startTime: startTime || null, endTime: endTime || null,
    source, createdByRole: actorRole, createdById: actorId,
    completionState: 'not_started', stateChangedAt: null,
    approvalStatus: 'none', dueAt: dueAt || null,
    version: 1, deletedAt: null, updatedAt: now(),
  });
  logHistory(t, { actorRole, actorId, changeType: 'create', newValue: { title: t.title } });
  emit(io, t, 'task:upserted', publicTask(t));
  return t;
};

const EDITABLE = ['title', 'description', 'note', 'category', 'priority', 'startTime', 'endTime', 'dueAt'];

export const updateTask = (io, task, { actorRole, actorId, patch }) => {
  const changes = {};
  EDITABLE.forEach((f) => {
    if (patch[f] !== undefined && patch[f] !== task[f]) changes[f] = f === 'title' ? (String(patch[f]).trim() || task.title) : patch[f];
  });
  if (Object.keys(changes).length === 0) return task;
  const updated = tasks.update(task.id, { ...changes, version: (task.version || 1) + 1, updatedAt: now() });
  Object.entries(changes).forEach(([field, newValue]) =>
    logHistory(updated, { actorRole, actorId, changeType: field === 'note' ? 'note' : 'field_edit', field, oldValue: task[field] ?? null, newValue }));
  emit(io, updated, 'task:upserted', publicTask(updated));
  return updated;
};

// Advance the triple state by one step (⬜→✅→❌→⬜).
export const cycleTask = (io, task, { actorRole, actorId }) => {
  const from = task.completionState;
  const to = nextState(from);
  const updated = tasks.update(task.id, {
    completionState: to,
    stateChangedAt: now(),
    completedAt: to === 'completed' ? now() : null,
    failedAt: to === 'failed' ? now() : null,
    updatedAt: now(),
  });
  logHistory(updated, { actorRole, actorId, changeType: 'state_change', field: 'completionState', oldValue: from, newValue: to });
  emit(io, updated, 'task:upserted', publicTask(updated));
  return updated;
};

// Soft delete — keeps the history queryable for the parent.
export const deleteTask = (io, task, { actorRole, actorId }) => {
  tasks.update(task.id, { deletedAt: now(), updatedAt: now() });
  logHistory(task, { actorRole, actorId, changeType: 'delete' });
  emit(io, task, 'task:deleted', { id: task.id, childId: task.childId });
  return { ok: true, id: task.id };
};

export const getHistory = (taskId) =>
  history.filter((h) => h.taskId === taskId).sort((a, b) => a.at - b.at).map(publicHistory);
