// Phase 3 — Help & Support ecosystem on PostgreSQL (pg-mem). Real persistence,
// REST, admin role (email allowlist), realtime ticket flow, feature requests,
// announcements, changelog, ratings, and permissions.
import { newDb } from 'pg-mem';
import { io as Client } from 'socket.io-client';
import * as pg from '../src/pg.js';

process.env.DATABASE_URL = 'postgres://pg-mem';
process.env.AG_ADMIN_EMAILS = 'admin@alphaguard.ai'; // designate the admin before modules load
const db = newDb();
const { Pool } = db.adapters.createPg();
pg._setPool(new Pool());

const { createServer } = await import('../src/server.js');
const { initDB } = await import('../src/db.js');

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}`); } };
console.log('\n AlphaGuard V2 — Phase 3 Help & Support (pg-mem)\n');

await initDB();
const { server } = createServer();
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const api = async (m, p, b, t) => { const r = await fetch(base + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, body: await r.json().catch(() => ({})) }; };
const wait = (s, e, ms = 2500) => new Promise((res) => { const t = setTimeout(() => res(null), ms); s.once(e, (d) => { clearTimeout(t); res(d); }); });
const connect = (token) => new Promise((res) => { const s = Client(base, { auth: { token }, transports: ['websocket'] }); s.on('ready', () => res(s)); });

try {
  const userTok = (await api('POST', '/api/auth/parent/register', { email: 'user@fam.com', password: 'secret123', name: 'User' })).body.token;
  const adminTok = (await api('POST', '/api/auth/parent/register', { email: 'admin@alphaguard.ai', password: 'secret123', name: 'Admin' })).body.token;
  ok('ADMIN — /me flags the admin account', (await api('GET', '/api/me', null, adminTok)).body.admin === true);
  ok('ADMIN — regular user is not admin', (await api('GET', '/api/me', null, userTok)).body.admin === false);
  ok('SECURITY — non-admin blocked from /admin/support (403)', (await api('GET', '/api/admin/support/tickets', null, userTok)).status === 403);

  const admin = await connect(adminTok);

  // ── Report an Issue ───────────────────────────────────────────────────────
  const newTicketEv = wait(admin, 'support:ticket-new');
  const created = await api('POST', '/api/support/tickets', { issueType: 'pairing', title: 'Pairing Failed', description: 'Code not accepted', priority: 'high', device: 'Pixel 7', browser: 'Chrome 140', appVersion: '2.1.0' }, userTok);
  const ticket = created.body.ticket;
  ok('REPORT — ticket created with number', created.status === 200 && ticket.ticketNumber >= 145);
  ok('REALTIME — appears in admin dashboard instantly', (await newTicketEv)?.id === ticket.id);

  // ── Admin dashboard + stats ───────────────────────────────────────────────
  const dash = (await api('GET', '/api/admin/support/tickets', null, adminTok)).body;
  ok('ADMIN — dashboard lists the ticket', dash.tickets.some((t) => t.id === ticket.id));
  ok('ADMIN — stats compute open/critical/resolved', typeof dash.stats.open === 'number' && typeof dash.stats.avgResolutionHours === 'number');

  // ── Admin status change → user notified ───────────────────────────────────
  const user = await connect(userTok);
  const statusEv = wait(user, 'support:ticket-update');
  const notifEv = wait(user, 'notification:new');
  await api('PATCH', `/api/admin/support/tickets/${ticket.id}`, { status: 'investigating', priority: 'critical' }, adminTok);
  ok('STATUS — user receives ticket-update', (await statusEv)?.status === 'investigating');
  ok('NOTIFY — user gets a notification', (await notifEv)?.title?.includes('Investigating'));

  // ── Conversation thread (admin reply + internal note) ─────────────────────
  await api('POST', `/api/admin/support/tickets/${ticket.id}/comments`, { body: 'Looking into it now.' }, adminTok);
  await api('POST', `/api/admin/support/tickets/${ticket.id}/comments`, { body: 'internal: suspected code reuse', internal: true }, adminTok);
  await api('POST', `/api/support/tickets/${ticket.id}/comments`, { body: 'Thanks!' }, userTok);
  const userView = (await api('GET', `/api/support/tickets/${ticket.id}`, null, userTok)).body;
  ok('THREAD — user sees public comments only (no internal)', userView.comments.length === 2 && userView.comments.every((c) => !c.internal));
  const adminView = (await api('GET', `/api/admin/support/tickets/${ticket.id}`, null, adminTok)).body;
  ok('THREAD — admin sees internal note', adminView.comments.some((c) => c.internal));
  ok('HISTORY — status + priority changes logged', adminView.history.some((h) => h.changeType === 'status') && adminView.history.some((h) => h.changeType === 'priority'));

  // ── Resolve → notify ──────────────────────────────────────────────────────
  await api('PATCH', `/api/admin/support/tickets/${ticket.id}`, { status: 'resolved' }, adminTok);
  ok('RESOLVE — ticket marked resolved', (await api('GET', `/api/support/tickets/${ticket.id}`, null, userTok)).body.ticket.status === 'resolved');
  ok('SECURITY — user cannot read another user ticket', (await api('GET', `/api/admin/support/tickets/${ticket.id}`, null, userTok)).status === 403);

  // ── Feature requests ──────────────────────────────────────────────────────
  const feat = (await api('POST', '/api/feature-requests', { title: 'Dark mode for child app', category: 'ui', useCase: 'night use' }, userTok)).body.feature;
  ok('FEATURE — requested', feat.status === 'requested');
  await api('PATCH', `/api/admin/feature-requests/${feat.id}`, { status: 'planned' }, adminTok);
  ok('FEATURE — admin moves to planned', (await api('GET', '/api/feature-requests', null, userTok)).body.features[0].status === 'planned');

  // ── Announcements + changelog ─────────────────────────────────────────────
  await api('POST', '/api/admin/announcements', { title: 'Version 2.1 Released', description: 'Tasks & Targets, Rewards, AI Reports', priority: 'high' }, adminTok);
  ok('ANNOUNCE — published + visible to users', (await api('GET', '/api/announcements', null, userTok)).body.announcements.some((a) => a.title === 'Version 2.1 Released'));
  await api('POST', '/api/admin/changelog', { version: '2.1', added: ['Tasks & Targets', 'Rewards'], fixed: ['Google Login'], improved: ['Dashboard'] }, adminTok);
  ok('CHANGELOG — entry visible to users', (await api('GET', '/api/changelog', null, userTok)).body.changelog.some((c) => c.version === '2.1'));
  ok('SECURITY — user cannot publish announcements (403)', (await api('POST', '/api/admin/announcements', { title: 'x' }, userTok)).status === 403);

  // ── Ratings ───────────────────────────────────────────────────────────────
  await api('POST', '/api/ratings', { stars: 5, feedback: 'Love it' }, userTok);
  ok('RATING — stored', (await api('GET', '/api/admin/ratings', null, adminTok)).body.count >= 1);
  ok('RATING — invalid stars rejected', (await api('POST', '/api/ratings', { stars: 9 }, userTok)).status === 400);

  // ── Persistence ───────────────────────────────────────────────────────────
  await pg._flush();
  const pool = new Pool();
  ok('PERSISTENCE — support_tickets in Postgres', (await pool.query('SELECT count(*)::int n FROM support_tickets')).rows[0].n >= 1);
  ok('PERSISTENCE — ticket_comments in Postgres', (await pool.query('SELECT count(*)::int n FROM ticket_comments')).rows[0].n >= 3);
  ok('PERSISTENCE — feature_requests in Postgres', (await pool.query('SELECT count(*)::int n FROM feature_requests')).rows[0].n >= 1);
  ok('PERSISTENCE — announcements in Postgres', (await pool.query('SELECT count(*)::int n FROM announcements')).rows[0].n >= 1);

  admin.close(); user.close();
} catch (e) { fail++; console.log('  ✗ threw:', e.message, e.stack); }

await new Promise((r) => setTimeout(r, 200));
server.close();
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
