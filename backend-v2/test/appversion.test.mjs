// App lifecycle / update system test. Proves: public version endpoint + seed,
// client-version comparison (up-to-date / optional / mandatory), admin-only
// config updates, release-notes resolution from the changelog, and validation.
import { createServer } from '../src/server.js';
import { resetDB } from '../src/db.js';
import { compareVersions } from '../src/appversion.js';

process.env.AG_DB_FILE = 'appversion-test.json';
process.env.AG_ADMIN_EMAILS = 'admin@alphaguard.ai';
resetDB();

const { server } = createServer();
await new Promise((r) => server.listen(0, r));
const PORT = server.address().port;
const base = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; console.log(`  ✓ ${name}`); } else { fail++; console.log(`  ✗ ${name}`); } };
const reqJSON = async (method, path, body, token) => {
  const res = await fetch(base + path, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: body == null ? undefined : JSON.stringify(body) });
  let json = null; try { json = await res.json(); } catch { /* none */ }
  return { status: res.status, json };
};
const get = (p, t) => reqJSON('GET', p, null, t);
const post = (p, b, t) => reqJSON('POST', p, b, t);
const put = (p, b, t) => reqJSON('PUT', p, b, t);

try {
  console.log('\n AlphaGuard V2 — app lifecycle / update test\n');

  /* ── compareVersions unit ─────────────────────────────────────────────── */
  ok('compareVersions: 2.2.0 > 2.1.0', compareVersions('2.2.0', '2.1.0') === 1);
  ok('compareVersions: 2.1.0 < 2.1.1', compareVersions('2.1.0', '2.1.1') === -1);
  ok('compareVersions: equal', compareVersions('2.1.0', '2.1.0') === 0);
  ok('compareVersions: 2.10.0 > 2.9.0 (numeric, not lexical)', compareVersions('2.10.0', '2.9.0') === 1);

  /* ── Public version endpoint + seed ───────────────────────────────────── */
  const v0 = await get('/api/app/version');
  ok('GET /app/version is public + seeds a default', v0.status === 200 && !!v0.json.currentVersion && v0.json.minimumVersion === '0.0.0');

  /* ── Client comparison via ?version= ──────────────────────────────────── */
  const cur = v0.json.currentVersion;
  const upToDate = await get(`/api/app/version?version=${cur}`);
  ok('client on current version → no update', upToDate.json.updateAvailable === false && upToDate.json.mandatory === false);
  const old = await get('/api/app/version?version=1.0.0');
  ok('older client → updateAvailable, not mandatory (min=0.0.0)', old.json.updateAvailable === true && old.json.mandatory === false);

  /* ── Admin auth gate ──────────────────────────────────────────────────── */
  const userTok = (await post('/api/auth/parent/register', { email: 'u@family.com', password: 'secret123', name: 'U' })).json.token;
  const adminTok = (await post('/api/auth/parent/register', { email: 'admin@alphaguard.ai', password: 'secret123', name: 'A' })).json.token;
  ok('non-admin blocked from GET /admin/app-version (403)', (await get('/api/admin/app-version', userTok)).status === 403);
  ok('non-admin blocked from PUT /admin/app-version (403)', (await put('/api/admin/app-version', { version: '9.9.9' }, userTok)).status === 403);
  ok('admin can read config', (await get('/api/admin/app-version', adminTok)).status === 200);

  /* ── Admin bumps version → optional update appears ────────────────────── */
  const setRes = await put('/api/admin/app-version', { version: '2.5.0' }, adminTok);
  ok('admin sets current version', setRes.status === 200 && setRes.json.config.version === '2.5.0');
  const afterBump = await get('/api/app/version?version=2.1.0');
  ok('client 2.1.0 now sees optional update to 2.5.0', afterBump.json.updateAvailable === true && afterBump.json.mandatory === false);

  /* ── Force update via minimumVersion ──────────────────────────────────── */
  await put('/api/admin/app-version', { minimumVersion: '2.4.0' }, adminTok);
  const forced = await get('/api/app/version?version=2.1.0');
  ok('client below minimumVersion → mandatory update', forced.json.mandatory === true && forced.json.updateAvailable === true);
  const okClient = await get('/api/app/version?version=2.5.0');
  ok('client at/above current → not mandatory, not update', okClient.json.mandatory === false && okClient.json.updateAvailable === false);

  /* ── Validation ───────────────────────────────────────────────────────── */
  ok('invalid version rejected (400)', (await put('/api/admin/app-version', { version: 'banana' }, adminTok)).status === 400);

  /* ── Release notes resolved from changelog (integration) ──────────────── */
  await post('/api/admin/changelog', { version: '2.5.0', added: ['Live monitoring'], improved: ['Faster sync'], fixed: ['Login bug'] }, adminTok);
  const withNotes = await get('/api/app/version');
  ok('release notes resolved from changelog for current version', !!withNotes.json.releaseNotes && withNotes.json.releaseNotes.added.includes('Live monitoring') && withNotes.json.releaseNotes.fixed.includes('Login bug'));

} catch (e) {
  fail++; console.log('  ✗ threw:', e.message, e.stack);
}

await new Promise((r) => setTimeout(r, 150));
server.close();
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
