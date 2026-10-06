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
const proofs = Repo('taskProofs');

export const STATES = ['not_started', 'completed', 'failed'];
export const nextState = (s) => STATES[(STATES.indexOf(s) + 1) % STATES.length];

// Photo-proof blobs: raster images only (no SVG — stored-XSS guard), capped so a
// data-URL fits the request-body limit. Child captures a photo/screenshot.
const PROOF_MAX = 4 * 1024 * 1024; // ~4MB data-URL
const PROOF_MIME = /^data:image\/(png|jpe?g|gif|webp);/i;
const proofCount = (taskId) => proofs.filter((p) => p.taskId === taskId).length;
export const publicProof = (p) => ({ id: p.id, taskId: p.taskId, childId: p.childId, kind: p.kind, name: p.name || 'proof', mime: p.mime, dataUrl: p.dataUrl, at: p.at });

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
  recurringId: t.recurringId || null,
  // Photo proof + parent approval.
  requireProof: !!t.requireProof,
  requireApproval: !!t.requireApproval,
  approvalStatus: t.approvalStatus || 'none', // none | pending | approved | rejected
  approvalComment: t.approvalComment || '',
  approvedAt: t.approvedAt || null,
  approvedBy: t.approvedBy || null,
  proofCount: proofCount(t.id),
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

export const createTask = (io, { familyId, childId, source, actorRole, actorId, title, description, category, note, priority, startTime, endTime, dueAt, requireProof, requireApproval }) => {
  const t = tasks.insert({
    familyId, childId, listId: null,
    title: String(title || '').trim() || 'Untitled task',
    description: description || '', note: note || '', category: category || '',
    priority: priority || 'normal', startTime: startTime || null, endTime: endTime || null,
    source, createdByRole: actorRole, createdById: actorId,
    completionState: 'not_started', stateChangedAt: null,
    requireProof: !!requireProof, requireApproval: !!requireApproval,
    approvalStatus: 'none', approvalComment: '', dueAt: dueAt || null,
    version: 1, deletedAt: null, updatedAt: now(),
  });
  logHistory(t, { actorRole, actorId, changeType: 'create', newValue: { title: t.title } });
  emit(io, t, 'task:upserted', publicTask(t));
  return t;
};

const EDITABLE = ['title', 'description', 'note', 'category', 'priority', 'startTime', 'endTime', 'dueAt', 'requireProof', 'requireApproval'];

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
// When a task requires parent approval, the child completing it sets the task to
// "pending approval" rather than counting immediately — the parent then approves
// or rejects (see approveTask/rejectTask). Cycling off completed clears approval.
export const cycleTask = (io, task, { actorRole, actorId }) => {
  const from = task.completionState;
  const to = nextState(from);
  const needsApproval = to === 'completed' && task.requireApproval && actorRole === 'child';
  const updated = tasks.update(task.id, {
    completionState: to,
    stateChangedAt: now(),
    completedAt: to === 'completed' ? now() : null,
    failedAt: to === 'failed' ? now() : null,
    approvalStatus: to === 'completed' ? (needsApproval ? 'pending' : 'approved') : 'none',
    approvalComment: to === 'completed' ? task.approvalComment || '' : '',
    updatedAt: now(),
  });
  logHistory(updated, { actorRole, actorId, changeType: 'state_change', field: 'completionState', oldValue: from, newValue: to });
  if (needsApproval) logHistory(updated, { actorRole, actorId, changeType: 'approval', field: 'approvalStatus', oldValue: 'none', newValue: 'pending' });
  emit(io, updated, 'task:upserted', publicTask(updated));
  return updated;
};

// Whether a completion should count toward streaks/achievements/reports. Tasks
// awaiting approval do NOT count until the parent approves.
export const countsAsCompleted = (task) => task.completionState === 'completed' && task.approvalStatus !== 'pending' && task.approvalStatus !== 'rejected';

/* ── Photo proof ───────────────────────────────────────────────────────────── */
// Child attaches a photo/screenshot as proof of completion. Stored as a data-URL
// blob in task_proofs and linked to the task history + realtime.
export const addProof = (io, task, { childId, kind, dataUrl, name }) => {
  if (typeof dataUrl !== 'string' || dataUrl.length > PROOF_MAX || !PROOF_MIME.test(dataUrl)) return { error: 'Proof must be an image (png/jpg/gif/webp) under 4MB' };
  const p = proofs.insert({
    taskId: task.id, familyId: task.familyId, childId: childId || task.childId,
    kind: kind === 'screenshot' ? 'screenshot' : 'photo',
    mime: (dataUrl.match(/^data:([^;]+)/) || [])[1] || 'image/jpeg',
    name: String(name || 'proof').slice(0, 120), dataUrl, at: now(),
  });
  logHistory(task, { actorRole: 'child', actorId: childId, changeType: 'proof', field: 'proof', newValue: { kind: p.kind, name: p.name } });
  emit(io, task, 'task:proof', { taskId: task.id, proof: publicProof(p) });
  emit(io, task, 'task:upserted', publicTask(tasks.byId(task.id))); // refresh proofCount
  return { proof: p };
};
export const listProofs = (taskId) => proofs.filter((p) => p.taskId === taskId).sort((a, b) => a.at - b.at).map(publicProof);

/* ── Parent approval ───────────────────────────────────────────────────────── */
export const approveTask = (io, task, { actorRole, actorId }) => {
  const updated = tasks.update(task.id, { approvalStatus: 'approved', approvalComment: '', approvedAt: now(), approvedBy: actorId, completionState: 'completed', updatedAt: now() });
  logHistory(updated, { actorRole, actorId, changeType: 'approval', field: 'approvalStatus', oldValue: task.approvalStatus || 'pending', newValue: 'approved' });
  emit(io, updated, 'task:upserted', publicTask(updated));
  return updated;
};
// Reject sends the task back to "not started" so the child can redo it, and
// records the parent's comment (e.g. "Please clean under the bed too.").
export const rejectTask = (io, task, { actorRole, actorId, comment }) => {
  const note = String(comment || '').trim();
  const updated = tasks.update(task.id, { approvalStatus: 'rejected', approvalComment: note, completionState: 'not_started', stateChangedAt: now(), completedAt: null, updatedAt: now() });
  logHistory(updated, { actorRole, actorId, changeType: 'approval', field: 'approvalStatus', oldValue: task.approvalStatus || 'pending', newValue: 'rejected' });
  if (note) logHistory(updated, { actorRole, actorId, changeType: 'reject_comment', field: 'approvalComment', newValue: note });
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
