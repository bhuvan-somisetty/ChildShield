// Help & Support ecosystem — tickets, threaded comments, history, attachments,
// feature requests, announcements, changelog and ratings. Mutations + realtime
// fan-out live here (same pattern as services.js). User-facing notifications go
// through addNotification; admin dashboards get live updates via the `admin`
// room. No mock data — everything is persisted in PostgreSQL.
import { Repo, now } from './db.js';
import { room, addNotification } from './services.js';
import { adminRoom } from './admin.js';

const tickets = Repo('supportTickets');
const comments = Repo('ticketComments');
const history = Repo('ticketHistory');
const attachments = Repo('ticketAttachments');
const features = Repo('featureRequests');
const announcements = Repo('announcements');
const changelog = Repo('changelog');
const ratings = Repo('appRatings');

export const TICKET_STATUSES = ['open', 'investigating', 'in_progress', 'waiting_user', 'resolved', 'closed'];
export const PRIORITIES = ['low', 'medium', 'high', 'critical'];
export const ISSUE_TYPES = ['bug', 'login', 'pairing', 'location', 'tasks', 'rewards', 'notifications', 'ai_reports', 'performance', 'payment', 'other'];
export const FEATURE_STATUSES = ['requested', 'under_review', 'planned', 'in_development', 'released', 'rejected'];

const ATTACH_MAX = 800 * 1024; // cap inline screenshots so they fit the JSON body

/* ── Ticket serialization ──────────────────────────────────────────────── */
export const publicTicket = (t, { includeInternal = false } = {}) => ({
  id: t.id, ticketNumber: t.ticketNumber, familyId: t.familyId, userId: t.userId,
  issueType: t.issueType, title: t.title, description: t.description || '',
  expected: t.expected || '', actual: t.actual || '', steps: t.steps || '',
  priority: t.priority, status: t.status, assignedTo: t.assignedTo || null,
  device: t.device || '', browser: t.browser || '', appVersion: t.appVersion || '',
  createdAt: t.createdAt, updatedAt: t.updatedAt || t.createdAt,
  _internal: includeInternal,
});
const publicComment = (c) => ({ id: c.id, ticketId: c.ticketId, authorRole: c.authorRole, authorId: c.authorId || null, body: c.body, internal: !!c.internal, at: c.at });
const publicHistoryRow = (h) => ({ id: h.id, ticketId: h.ticketId, actorRole: h.actorRole, changeType: h.changeType, field: h.field || null, oldValue: h.oldValue ?? null, newValue: h.newValue ?? null, at: h.at });
const publicAttachment = (a) => ({ id: a.id, ticketId: a.ticketId, commentId: a.commentId || null, name: a.name || 'attachment', mime: a.mime, kind: a.kind, dataUrl: a.dataUrl || null, at: a.at });

const logTicket = (t, e) => history.insert({ ticketId: t.id, actorRole: e.actorRole, actorId: e.actorId || null, changeType: e.changeType, field: e.field || null, oldValue: e.oldValue ?? null, newValue: e.newValue ?? null, at: now() });
const nextTicketNumber = () => tickets.all().reduce((m, t) => Math.max(m, t.ticketNumber || 0), 144) + 1; // human numbering starts at #145

const saveAttachment = (io, { ticketId, familyId, commentId, att }) => {
  if (!att || !att.dataUrl) return null;
  if (typeof att.dataUrl !== 'string' || att.dataUrl.length > ATTACH_MAX || !/^data:(image\/|application\/pdf)/.test(att.dataUrl)) return null;
  return attachments.insert({ ticketId, familyId, commentId: commentId || null, name: att.name || 'screenshot', mime: (att.dataUrl.match(/^data:([^;]+)/) || [])[1] || 'image/png', kind: att.dataUrl.startsWith('data:application/pdf') ? 'pdf' : 'image', dataUrl: att.dataUrl, at: now() });
};

/* ── Create / read tickets ─────────────────────────────────────────────── */
export const createTicket = (io, { familyId, userId, issueType, title, description, expected, actual, steps, priority, device, browser, appVersion, attachment }) => {
  const t = tickets.insert({
    familyId, userId, ticketNumber: nextTicketNumber(),
    issueType: ISSUE_TYPES.includes(issueType) ? issueType : 'other',
    title: String(title || '').trim() || 'Untitled issue',
    description: description || '', expected: expected || '', actual: actual || '', steps: steps || '',
    priority: PRIORITIES.includes(priority) ? priority : 'medium',
    status: 'open', assignedTo: null,
    device: device || '', browser: browser || '', appVersion: appVersion || '',
    updatedAt: now(),
  });
  logTicket(t, { actorRole: 'user', actorId: userId, changeType: 'create', newValue: { title: t.title } });
  if (attachment) saveAttachment(io, { ticketId: t.id, familyId, att: attachment });
  // Notify every admin dashboard in real time.
  io.to(adminRoom()).emit('support:ticket-new', publicTicket(t, { includeInternal: true }));
  return t;
};

export const listUserTickets = (familyId, userId) => tickets.filter((t) => t.familyId === familyId && t.userId === userId).sort((a, b) => b.createdAt - a.createdAt).map((t) => publicTicket(t));
export const getTicketThread = (ticket, { includeInternal }) => ({
  ticket: publicTicket(ticket, { includeInternal }),
  comments: comments.filter((c) => c.ticketId === ticket.id && (includeInternal || !c.internal)).sort((a, b) => a.at - b.at).map(publicComment),
  history: history.filter((h) => h.ticketId === ticket.id).sort((a, b) => a.at - b.at).map(publicHistoryRow),
  attachments: attachments.filter((a) => a.ticketId === ticket.id).sort((a, b) => a.at - b.at).map(publicAttachment),
});

export const addComment = (io, ticket, { authorRole, authorId, body, internal, attachment }) => {
  const c = comments.insert({ ticketId: ticket.id, familyId: ticket.familyId, authorRole, authorId: authorId || null, body: String(body || '').trim(), internal: authorRole === 'admin' ? !!internal : false, at: now() });
  if (attachment) saveAttachment(io, { ticketId: ticket.id, familyId: ticket.familyId, commentId: c.id, att: attachment });
  tickets.update(ticket.id, { updatedAt: now() });
  const payload = publicComment(c);
  if (authorRole === 'admin') {
    io.to(adminRoom()).emit('support:ticket-comment', { ticketId: ticket.id, comment: payload });
    if (!c.internal) {
      io.to(room.parent(ticket.familyId)).emit('support:ticket-comment', { ticketId: ticket.id, comment: payload });
      addNotification(io, { parentId: ticket.familyId, type: 'support', title: `Support replied · Ticket #${ticket.ticketNumber}`, body: c.body.slice(0, 120), data: { ticketId: ticket.id } });
    }
  } else {
    io.to(adminRoom()).emit('support:ticket-comment', { ticketId: ticket.id, comment: payload });
  }
  return c;
};

// Admin updates status / priority / assignment. User-visible changes notify them.
export const updateTicket = (io, ticket, { actorRole, actorId, patch }) => {
  const changes = {};
  if (patch.status && TICKET_STATUSES.includes(patch.status) && patch.status !== ticket.status) changes.status = patch.status;
  if (patch.priority && PRIORITIES.includes(patch.priority) && patch.priority !== ticket.priority) changes.priority = patch.priority;
  if (patch.assignedTo !== undefined && patch.assignedTo !== ticket.assignedTo) changes.assignedTo = patch.assignedTo;
  if (Object.keys(changes).length === 0) return ticket;
  const updated = tickets.update(ticket.id, { ...changes, updatedAt: now() });
  Object.entries(changes).forEach(([field, newValue]) => logTicket(updated, { actorRole, actorId, changeType: field, field, oldValue: ticket[field] ?? null, newValue }));
  io.to(adminRoom()).emit('support:ticket-update', publicTicket(updated, { includeInternal: true }));
  io.to(room.parent(updated.familyId)).emit('support:ticket-update', publicTicket(updated));
  if (changes.status) {
    const label = { open: 'Open', investigating: 'Investigating', in_progress: 'In Progress', waiting_user: 'needs more information', resolved: 'Resolved', closed: 'Closed' }[changes.status];
    addNotification(io, { parentId: updated.familyId, type: 'support', title: `Ticket #${updated.ticketNumber} is now ${label}`, body: updated.title, data: { ticketId: updated.id, status: changes.status } });
  }
  return updated;
};

export const closeTicketByUser = (io, ticket, { userId }) => updateTicket(io, ticket, { actorRole: 'user', actorId: userId, patch: { status: 'closed' } });

export const supportStats = () => {
  const all = tickets.all();
  const resolved = all.filter((t) => t.status === 'resolved' || t.status === 'closed');
  const resTimes = resolved.map((t) => (t.updatedAt || t.createdAt) - t.createdAt).filter((x) => x > 0);
  const avgMs = resTimes.length ? Math.round(resTimes.reduce((a, b) => a + b, 0) / resTimes.length) : 0;
  return {
    open: all.filter((t) => !['resolved', 'closed'].includes(t.status)).length,
    critical: all.filter((t) => t.priority === 'critical' && !['resolved', 'closed'].includes(t.status)).length,
    resolved: resolved.length,
    total: all.length,
    avgResolutionHours: avgMs ? Math.round(avgMs / 3600000 * 10) / 10 : 0,
  };
};
export const listAllTickets = () => tickets.all().sort((a, b) => b.createdAt - a.createdAt).map((t) => publicTicket(t, { includeInternal: true }));

/* ── Feature requests ──────────────────────────────────────────────────── */
export const publicFeature = (f) => ({ id: f.id, familyId: f.familyId, userId: f.userId, title: f.title, description: f.description || '', category: f.category || 'general', useCase: f.useCase || '', priority: f.priority || 'medium', status: f.status, createdAt: f.createdAt, updatedAt: f.updatedAt || f.createdAt });
export const createFeature = (io, { familyId, userId, title, description, category, useCase, priority }) => {
  const f = features.insert({ familyId, userId, title: String(title || '').trim() || 'Feature request', description: description || '', category: category || 'general', useCase: useCase || '', priority: PRIORITIES.includes(priority) ? priority : 'medium', status: 'requested', updatedAt: now() });
  io.to(adminRoom()).emit('feature:new', publicFeature(f));
  return f;
};
export const listUserFeatures = (familyId, userId) => features.filter((f) => f.familyId === familyId && f.userId === userId).sort((a, b) => b.createdAt - a.createdAt).map(publicFeature);
export const listAllFeatures = () => features.all().sort((a, b) => b.createdAt - a.createdAt).map(publicFeature);
export const updateFeature = (io, feature, { patch }) => {
  const changes = {};
  if (patch.status && FEATURE_STATUSES.includes(patch.status)) changes.status = patch.status;
  if (patch.priority && PRIORITIES.includes(patch.priority)) changes.priority = patch.priority;
  if (Object.keys(changes).length === 0) return feature;
  const u = features.update(feature.id, { ...changes, updatedAt: now() });
  io.to(adminRoom()).emit('feature:update', publicFeature(u));
  if (changes.status) addNotification(io, { parentId: u.familyId, type: 'feature', title: `Your feature request is now ${changes.status.replace('_', ' ')}`, body: u.title, data: { featureId: u.id } });
  return u;
};

/* ── Announcements ─────────────────────────────────────────────────────── */
export const publicAnnouncement = (a) => ({ id: a.id, title: a.title, description: a.description || '', banner: a.banner || null, priority: a.priority || 'normal', audience: a.audience || 'all', status: a.status, at: a.at, createdAt: a.createdAt });
export const createAnnouncement = (io, { title, description, banner, priority, audience, status }) => {
  const a = announcements.insert({ title: String(title || '').trim() || 'Announcement', description: description || '', banner: banner || null, priority: priority || 'normal', audience: audience || 'all', status: status === 'draft' ? 'draft' : 'published', at: now() });
  if (a.status === 'published') io.emit('announcement:new', publicAnnouncement(a)); // broadcast to all connected clients
  return a;
};
export const listPublishedAnnouncements = () => announcements.filter((a) => a.status === 'published').sort((a, b) => b.at - a.at).map(publicAnnouncement);
export const listAllAnnouncements = () => announcements.all().sort((a, b) => b.at - a.at).map(publicAnnouncement);

/* ── Changelog ─────────────────────────────────────────────────────────── */
export const publicChangelog = (c) => ({ id: c.id, version: c.version, date: c.date || null, added: c.added || [], fixed: c.fixed || [], improved: c.improved || [], at: c.at });
export const createChangelog = (io, { version, date, added, fixed, improved }) => {
  const c = changelog.insert({ version: String(version || '').trim() || 'Unversioned', date: date || new Date().toISOString().slice(0, 10), added: added || [], fixed: fixed || [], improved: improved || [], at: now() });
  io.emit('changelog:new', publicChangelog(c));
  return c;
};
export const listChangelog = () => changelog.all().sort((a, b) => b.at - a.at).map(publicChangelog);

/* ── Ratings ───────────────────────────────────────────────────────────── */
export const createRating = (io, { familyId, userId, stars, feedback }) => {
  const r = ratings.insert({ familyId, userId, stars: Math.max(1, Math.min(5, Number(stars) || 0)), feedback: feedback || '', at: now() });
  io.to(adminRoom()).emit('rating:new', { id: r.id, stars: r.stars, feedback: r.feedback, at: r.at });
  return { id: r.id, stars: r.stars, feedback: r.feedback, at: r.at };
};
export const ratingStats = () => {
  const all = ratings.all();
  const avg = all.length ? Math.round((all.reduce((s, r) => s + (r.stars || 0), 0) / all.length) * 10) / 10 : 0;
  return { count: all.length, average: avg, ratings: all.sort((a, b) => b.at - a.at).map((r) => ({ id: r.id, stars: r.stars, feedback: r.feedback, at: r.at })) };
};
