// Consent + data-deletion test. Proves: the public legal-version endpoint, that
// a fresh parent is NOT consented, that acceptance is recorded with the
// server-stamped version + timestamp, that publishing a new version forces
// re-acceptance (the gate), that consent is isolated per-parent, and that a
// data-deletion request is logged.
import { createServer } from '../src/server.js';
import { resetDB, Repo } from '../src/db.js';
import { _setPolicyVersion, currentVersion } from '../src/consent.js';

process.env.AG_DB_FILE = 'consent-test.json';
resetDB();

const { server } = createServer();
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const base = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
const req = async (method, path, body, token) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body == null ? undefined : JSON.stringify(body) });
  let json = null; try { json = await res.json(); } catch { /* none */ }
  return { status: res.status, json };
};
const post = (p, b, t) => req('POST', p, b, t);
const get = (p, t) => req('GET', p, null, t);

try {
  console.log('\n AlphaGuard V2 — consent & data-deletion test\n');

  const A = (await post('/api/auth/parent/register', { email: 'consent-a@family.com', password: 'secret123', name: 'A' })).json.token;
  const B = (await post('/api/auth/parent/register', { email: 'consent-b@family.com', password: 'secret123', name: 'B' })).json.token;

  /* ── Public legal version ─────────────────────────────────────────────── */
  const ver = await get('/api/legal/version');
  ok('GET /legal/version is public + returns version', ver.status === 200 && !!ver.json.version);
  ok('legal version lists required documents', Array.isArray(ver.json.documents) && ver.json.documents.some((d) => d.slug === 'terms') && ver.json.documents.some((d) => d.slug === 'privacy') && ver.json.documents.some((d) => d.slug === 'child-safety'));

  /* ── Fresh parent is not consented ────────────────────────────────────── */
  const s0 = await get('/api/consent/status', A);
  ok('fresh parent is NOT consented (current=false)', s0.status === 200 && s0.json.current === false && s0.json.acceptedVersion === null);
  ok('consent status requires auth (401 without token)', (await get('/api/consent/status')).status === 401);

  /* ── Accept → recorded with server version + timestamp ────────────────── */
  const acc = await post('/api/consent', { acceptedDocs: ['terms', 'privacy', 'child-safety'] }, A);
  ok('POST /consent records acceptance', acc.status === 200 && acc.json.ok === true);
  ok('acceptance is stamped with the server policy version', acc.json.consent.version === currentVersion());
  ok('acceptance carries a timestamp', typeof acc.json.consent.at === 'number' && acc.json.consent.at > 0);
  const s1 = await get('/api/consent/status', A);
  ok('parent is now consented (current=true)', s1.json.current === true && s1.json.acceptedVersion === currentVersion());

  // Persisted in the consents store with audit metadata.
  const row = Repo('consents').filter((c) => c.version === currentVersion())[0];
  ok('consent row persisted with version + acceptedDocs + at', !!row && row.acceptedDocs.length === 3 && !!row.at);

  /* ── Isolation: B is unaffected by A's acceptance ─────────────────────── */
  ok("parent B still NOT consented (per-parent isolation)", (await get('/api/consent/status', B)).json.current === false);

  /* ── Re-acceptance: publishing a new version invalidates old consent ──── */
  _setPolicyVersion('2099-01-01');
  const s2 = await get('/api/consent/status', A);
  ok('new policy version forces re-acceptance (current=false again)', s2.json.current === false && s2.json.requiredVersion === '2099-01-01' && s2.json.acceptedVersion !== '2099-01-01');
  const acc2 = await post('/api/consent', {}, A);
  ok('parent can re-accept the new version', acc2.json.consent.version === '2099-01-01');
  ok('re-acceptance satisfies the gate', (await get('/api/consent/status', A)).json.current === true);
  ok('old acceptance row is preserved (audit trail)', Repo('consents').filter((c) => c.parentId && c.version === '2026-06-13').length >= 1);

  /* ── Data-deletion request ────────────────────────────────────────────── */
  const del = await post('/api/data-deletion', { scope: 'account', reason: 'test' }, A);
  ok('POST /data-deletion logs a request with 30-day SLA', del.status === 200 && del.json.ok === true && del.json.request.status === 'received' && del.json.request.slaDays === 30 && del.json.request.purgeBy > del.json.request.at);
  ok('data-deletion requires auth (401 without token)', (await post('/api/data-deletion', {})).status === 401);
  ok('deletion request persisted', Repo('deletionRequests').filter((d) => d.status === 'received').length >= 1);

} catch (e) {
  fail++; console.log('  ✗ threw:', e.message, e.stack);
}

await new Promise((r) => setTimeout(r, 150));
server.close();
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
