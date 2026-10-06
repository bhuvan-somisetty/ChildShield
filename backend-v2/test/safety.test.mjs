// Phase 4 safety backend: push registration, location history, password reset.
import crypto from 'node:crypto';
import { createServer } from '../src/server.js';
import { resetDB, Repo } from '../src/db.js';

process.env.AG_DB_FILE = 'safety-test.json';
resetDB();

const { server } = createServer();
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const base = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
const req = async (m, p, b, t) => {
  const res = await fetch(base + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b == null ? undefined : JSON.stringify(b) });
  let j = null; try { j = await res.json(); } catch { /* none */ }
  return { status: res.status, json: j };
};
const post = (p, b, t) => req('POST', p, b, t);
const get = (p, t) => req('GET', p, null, t);
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

try {
  console.log('\n AlphaGuard V2 — safety backend test\n');

  const reg = await post('/api/auth/parent/register', { email: 'safe@family.com', password: 'secret123', name: 'S' });
  const P = reg.json.token;
  const parentId = reg.json.parent.id;
  const created = await post('/api/children', { name: 'Kid', age: 9 }, P);
  const childId = created.json.child.id;
  const C = (await post('/api/pair/claim', { code: created.json.pairing.code, platform: 'android' })).json.token;

  /* ── Push registration ────────────────────────────────────────────────── */
  ok('parent registers a device token', (await post('/api/push/register', { token: 'tok-parent-1', platform: 'android' }, P)).json.ok === true);
  ok('child registers a device token', (await post('/api/push/register', { token: 'tok-child-1', platform: 'ios' }, C)).json.ok === true);
  ok('register requires a token (400)', (await post('/api/push/register', {}, P)).status === 400);
  ok('register requires auth (401)', (await post('/api/push/register', { token: 'x' })).status === 401);
  ok('device tokens persisted', Repo('deviceTokens').all().length === 2);
  // Re-registering the same token is idempotent (no duplicate).
  await post('/api/push/register', { token: 'tok-parent-1', platform: 'android' }, P);
  ok('re-register is idempotent', Repo('deviceTokens').all().filter((t) => t.token === 'tok-parent-1').length === 1);
  ok('unregister removes the token', (await post('/api/push/unregister', { token: 'tok-child-1' }, C)).json.ok === true && Repo('deviceTokens').all().length === 1);

  /* ── SOS still works with push hooked in (no FCM config → no-op) ──────── */
  const sos = await post('/api/sos', { location: { lat: 30.1, lng: -97.7 } }, C);
  ok('SOS triggers + creates a parent notification (push no-op without FCM)', sos.json.sos != null && Repo('notifications').filter((n) => n.type === 'sos').length >= 1);

  /* ── Location history (route timeline) ───────────────────────────────── */
  await post('/api/location', { lat: 30.10, lng: -97.70 }, C);
  await post('/api/location', { lat: 30.11, lng: -97.71 }, C);
  await post('/api/location', { lat: 30.12, lng: -97.72 }, C);
  const hist = await get(`/api/location/${childId}/history`, P);
  ok('location history records the time-series', hist.status === 200 && hist.json.history.length === 3);
  ok('history newest-first with coords + at', hist.json.history[0].lat != null && typeof hist.json.history[0].at === 'number');
  ok("another family cannot read location history (404)", (await get(`/api/location/${childId}/history`, (await post('/api/auth/parent/register', { email: 'other@f.com', password: 'secret123', name: 'O' })).json.token)).status === 404);

  /* ── Password reset (token + expiry, single-use) ─────────────────────── */
  ok('forgot returns ok for a real email (anti-enumeration)', (await post('/api/auth/parent/forgot', { email: 'safe@family.com' })).json.ok === true);
  ok('forgot returns ok for an unknown email too (no enumeration)', (await post('/api/auth/parent/forgot', { email: 'nobody@x.com' })).json.ok === true);
  ok('reset with an invalid token is rejected (400)', (await post('/api/auth/parent/reset', { token: 'bogus', password: 'newpass123' })).status === 400);
  // Happy path: insert a known reset row, then reset with the raw token.
  Repo('passwordResets').insert({ parentId, tokenHash: sha256('rawtoken123'), expiresAt: Date.now() + 3600000, used: false, at: Date.now() });
  ok('reset rejects a short password (400)', (await post('/api/auth/parent/reset', { token: 'rawtoken123', password: 'short' })).status === 400);
  ok('valid token + strong password resets', (await post('/api/auth/parent/reset', { token: 'rawtoken123', password: 'brandNew123' })).json.ok === true);
  ok('the same token cannot be reused (single-use)', (await post('/api/auth/parent/reset', { token: 'rawtoken123', password: 'another123' })).status === 400);
  ok('login works with the NEW password', (await post('/api/auth/parent/login', { email: 'safe@family.com', password: 'brandNew123' })).json.token != null);
  ok('login fails with the OLD password', (await post('/api/auth/parent/login', { email: 'safe@family.com', password: 'secret123' })).status === 401);
  // Expired token rejected.
  Repo('passwordResets').insert({ parentId, tokenHash: sha256('expiredtok'), expiresAt: Date.now() - 1000, used: false, at: Date.now() });
  ok('an expired token is rejected (400)', (await post('/api/auth/parent/reset', { token: 'expiredtok', password: 'whatever123' })).status === 400);

} catch (e) {
  fail++; console.log('  ✗ threw:', e.message, e.stack);
}

await new Promise((r) => setTimeout(r, 150));
server.close();
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
