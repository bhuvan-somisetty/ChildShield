// Security regression test — proves the access-control, isolation, authz and
// abuse-resistance fixes from the V2 hardening pass. Two independent families
// (A and B) are provisioned, then we assert that neither can reach the other's
// data over REST or Socket.IO, that role gates hold, that admin routes are
// closed to non-admins, that forged tokens are rejected, that abuse-prone
// endpoints are rate limited, and that dangerous uploads are refused.
import { io as Client } from 'socket.io-client';
import jwt from 'jsonwebtoken';
import { createServer } from '../src/server.js';
import { resetDB } from '../src/db.js';

process.env.AG_DB_FILE = 'sec-test.json';
resetDB();

const { server } = createServer();
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const base = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };

const req = async (method, path, body, token) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body == null ? undefined : JSON.stringify(body),
  });
  let json = null; try { json = await res.json(); } catch { /* no body */ }
  return { status: res.status, json };
};
const post = (p, b, t) => req('POST', p, b, t);
const get = (p, t) => req('GET', p, null, t);
const del = (p, t) => req('DELETE', p, null, t);
const connect = (token) => new Promise((resolve, reject) => {
  const s = Client(base, { auth: { token }, transports: ['websocket'] });
  s.on('ready', () => resolve(s));
  s.on('connect_error', (e) => reject(e));
});

// Provision a full family: parent + child + active pairing.
const makeFamily = async (email) => {
  const reg = await post('/api/auth/parent/register', { email, password: 'secret123', name: email });
  const parentToken = reg.json.token; const parentId = reg.json.parent.id;
  const created = await post('/api/children', { name: 'Kid', age: 9 }, parentToken);
  const childId = created.json.child.id;
  const claim = await post('/api/pair/claim', { code: created.json.pairing.code, platform: 'android' });
  return { parentToken, parentId, childId, childToken: claim.json.token, pairingId: claim.json.pairingId };
};

try {
  console.log('\n AlphaGuard V2 — security audit test\n');

  const A = await makeFamily('alice@family.com');
  const B = await makeFamily('bob@family.com');

  /* ── Authentication / token integrity ─────────────────────────────────── */
  ok('rejects request with no token (401)', (await get('/api/me')).status === 401);
  ok('rejects garbage token (401)', (await get('/api/me', 'not-a-jwt')).status === 401);
  const forged = jwt.sign({ sub: A.parentId, role: 'parent', parentId: A.parentId }, 'attacker-secret', { expiresIn: '1h' });
  ok('rejects token signed with wrong secret (401)', (await get('/api/me', forged)).status === 401);
  const noneTok = jwt.sign({ sub: A.parentId, role: 'parent', parentId: A.parentId }, '', { algorithm: 'none' });
  ok('rejects alg:none token (401)', (await get('/api/me', noneTok)).status === 401);

  /* ── Parent ↔ parent family isolation (IDOR) ──────────────────────────── */
  ok("B cannot read A's child location", (await get(`/api/location/${A.childId}`, B.parentToken)).status === 404);
  ok("B cannot read A's child battery", (await get(`/api/battery/${A.childId}`, B.parentToken)).status === 404);
  ok("B cannot read A's chat thread", (await get(`/api/chat/${A.pairingId}/messages`, B.parentToken)).status === 404);
  ok("B cannot post into A's chat thread", (await post(`/api/chat/${A.pairingId}/messages`, { text: 'hi' }, B.parentToken)).status === 404);
  ok("B cannot read A's streaks", (await get(`/api/streaks/${A.childId}`, B.parentToken)).status === 404);
  ok("A can read its OWN child location (control)", (await get(`/api/location/${A.childId}`, A.parentToken)).status === 200);

  // Cross-family object mutation
  const aSos = await post('/api/sos', { location: { lat: 1, lng: 2 } }, A.childToken);
  const sosId = aSos.json.sos.id;
  ok("B cannot resolve A's SOS", (await post(`/api/sos/${sosId}/resolve`, {}, B.parentToken)).status === 404);
  const aReq = await post('/api/requests', { type: 'install', app: 'Game' }, A.childToken);
  ok("B cannot decide A's app request", (await post(`/api/requests/${aReq.json.request.id}/decide`, { decision: 'approved' }, B.parentToken)).status === 404);
  const aZone = await post('/api/zones', { name: 'Home', lat: 1, lng: 2, radius: 100 }, A.parentToken);
  ok("B cannot delete A's zone", (await del(`/api/zones/${aZone.json.zone.id}`, B.parentToken)).status === 404);
  const aNotifs = await get('/api/notifications', A.parentToken);
  const aNotifId = aNotifs.json.notifications[0]?.id;
  ok("B cannot mark A's notification read", aNotifId && (await post(`/api/notifications/${aNotifId}/read`, {}, B.parentToken)).status === 404);

  /* ── Child isolation + role gates ─────────────────────────────────────── */
  ok("child cannot read another family's location", (await get(`/api/location/${A.childId}`, B.childToken)).status === 403);
  ok('child cannot hit parent-only /children (403)', (await get('/api/children', A.childToken)).status === 403);
  ok('child cannot create a zone (403)', (await post('/api/zones', { name: 'x', lat: 1, lng: 1 }, A.childToken)).status === 403);
  ok('child cannot list SOS (parent-only, 403)', (await get('/api/sos', A.childToken)).status === 403);
  ok("child cannot read another family's chat", (await get(`/api/chat/${A.pairingId}/messages`, B.childToken)).status === 404);

  /* ── Admin authorization ──────────────────────────────────────────────── */
  ok('non-admin parent blocked from admin support (403)', (await get('/api/admin/support/tickets', A.parentToken)).status === 403);
  ok('non-admin parent blocked from admin ratings (403)', (await get('/api/admin/ratings', A.parentToken)).status === 403);
  ok('child blocked from admin announcements (403)', (await post('/api/admin/announcements', { title: 'x' }, A.childToken)).status === 403);

  /* ── Support ticket isolation ─────────────────────────────────────────── */
  const aTicket = await post('/api/support/tickets', { title: 'A issue', issueType: 'bug' }, A.parentToken);
  const aTicketId = aTicket.json.ticket.id;
  ok("B cannot read A's support ticket", (await get(`/api/support/tickets/${aTicketId}`, B.parentToken)).status === 404);
  ok("B cannot comment on A's ticket", (await post(`/api/support/tickets/${aTicketId}/comments`, { body: 'x' }, B.parentToken)).status === 404);
  ok('A can read its own ticket (control)', (await get(`/api/support/tickets/${aTicketId}`, A.parentToken)).status === 200);

  /* ── Stored-XSS upload guard ──────────────────────────────────────────── */
  const svgPayload = 'data:image/svg+xml;base64,' + Buffer.from('<svg onload="alert(1)"></svg>').toString('base64');
  const svgTicket = await post('/api/support/tickets', { title: 'svg', issueType: 'bug', attachment: { dataUrl: svgPayload, name: 'x.svg' } }, A.parentToken);
  const svgThread = await get(`/api/support/tickets/${svgTicket.json.ticket.id}`, A.parentToken);
  ok('SVG attachment is rejected (XSS guard)', (svgThread.json.attachments || []).length === 0);
  const pngTicket = await post('/api/support/tickets', { title: 'png', issueType: 'bug', attachment: { dataUrl: 'data:image/png;base64,iVBORw0KGgo=', name: 'x.png' } }, A.parentToken);
  const pngThread = await get(`/api/support/tickets/${pngTicket.json.ticket.id}`, A.parentToken);
  ok('PNG attachment is accepted (control)', (pngThread.json.attachments || []).length === 1);

  /* ── Pairing abuse resistance ─────────────────────────────────────────── */
  ok('invalid pairing code rejected (404)', (await post('/api/pair/claim', { code: '000000' })).status === 404);
  let got429 = false;
  for (let i = 0; i < 14; i++) { const r = await post('/api/pair/claim', { code: '111111' }); if (r.status === 429) got429 = true; }
  ok('pairing claim is rate limited (429 after burst)', got429);

  /* ── Socket.IO authorization ──────────────────────────────────────────── */
  ok('socket rejects connection with no token', await connect(undefined).then(() => false).catch(() => true));
  const sockB = await connect(B.childToken);
  const crossAck = await new Promise((resolve) => sockB.emit('chat:send', { pairingId: A.pairingId, text: 'intrusion' }, resolve));
  ok("socket: B child cannot chat into A's pairing room", crossAck?.ok === false);
  // Confirm the intrusion never persisted into A's thread.
  const aMsgs = await get(`/api/chat/${A.pairingId}/messages`, A.parentToken);
  ok("socket: intrusion message did NOT reach A's thread", !(aMsgs.json.messages || []).some((m) => m.text === 'intrusion'));
  sockB.close();

  /* ── Login rate limiting ──────────────────────────────────────────────── */
  let login429 = false;
  for (let i = 0; i < 14; i++) { const r = await post('/api/auth/parent/login', { email: 'alice@family.com', password: 'wrong' }); if (r.status === 429) login429 = true; }
  ok('login is rate limited after repeated failures (429)', login429);

} catch (e) {
  fail++; console.log('  ✗ threw:', e.message, e.stack);
}

await new Promise((r) => setTimeout(r, 200));
server.close();
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
