// Photo proof + parent approval + enhanced AI insights test.
import { createServer } from '../src/server.js';
import { resetDB } from '../src/db.js';

process.env.AG_DB_FILE = 'verification-test.json';
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

const PNG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC';
const SVG = 'data:image/svg+xml;base64,' + Buffer.from('<svg onload="alert(1)"/>').toString('base64');

try {
  console.log('\n AlphaGuard V2 — proof + approval + insights test\n');

  // Apple Sign In test
  const appleRes1 = await post('/api/auth/apple', { appleId: 'apple_123', email: 'apple@family.com', name: 'Apple Test User' });
  ok('Apple Sign-In: registers a new account', appleRes1.status === 200 && appleRes1.json.created === true && appleRes1.json.parent.email === 'apple@family.com');
  const appleRes2 = await post('/api/auth/apple', { appleId: 'apple_123' });
  ok('Apple Sign-In: logs in existing account idempotently', appleRes2.status === 200 && appleRes2.json.created === false && appleRes2.json.token !== null);

  // Family setup
  const P = (await post('/api/auth/parent/register', { email: 'v@family.com', password: 'secret123', name: 'P' })).json.token;
  const child = await post('/api/children', { name: 'Kid', age: 9 }, P);
  const childId = child.json.child.id;
  const C = (await post('/api/pair/claim', { code: child.json.pairing.code, platform: 'web' })).json.token;

  const contactsRes = await get('/api/child/contacts', C);
  ok('child can fetch parent emergency contacts', contactsRes.status === 200 && contactsRes.json.contacts.length >= 1);

  /* ── Photo proof ──────────────────────────────────────────────────────── */
  const pt = (await post('/api/tasks', { title: 'Clean room', childId, requireProof: true, requireApproval: true }, P)).json.task;
  ok('parent creates task with requireProof + requireApproval', pt.requireProof === true && pt.requireApproval === true && pt.approvalStatus === 'none');
  ok('child cannot set approval flags (ignored)', (await post('/api/tasks', { title: 'mine', requireApproval: true }, C)).json.task.requireApproval === false);

  const badProof = await post(`/api/tasks/${pt.id}/proof`, { kind: 'photo', dataUrl: SVG }, C);
  ok('SVG proof rejected (stored-XSS guard)', badProof.status === 400);
  const proofRes = await post(`/api/tasks/${pt.id}/proof`, { kind: 'photo', dataUrl: PNG, name: 'room.png' }, C);
  ok('child uploads PNG proof', proofRes.status === 200 && proofRes.json.proof.kind === 'photo' && proofRes.json.task.proofCount === 1);
  ok('parent can view proof', (await get(`/api/tasks/${pt.id}/proof`, P)).json.proofs[0].dataUrl === PNG);

  // Other family cannot read this proof
  const P2 = (await post('/api/auth/parent/register', { email: 'v2@family.com', password: 'secret123', name: 'P2' })).json.token;
  ok("other family cannot read proof (404)", (await get(`/api/tasks/${pt.id}/proof`, P2)).status === 404);

  /* ── Approval flow ────────────────────────────────────────────────────── */
  const cycled = (await post(`/api/tasks/${pt.id}/cycle`, {}, C)).json.task;
  ok('child completing approval-task → pending', cycled.completionState === 'completed' && cycled.approvalStatus === 'pending');
  // streak should NOT have advanced yet (pending)
  const streaksBefore = (await get(`/api/streaks/${childId}`, P)).json.streaks.find((s) => s.kind === 'task_completion');
  ok('pending task does NOT advance streak yet', !streaksBefore || streaksBefore.current === 0);

  const rej = await post(`/api/tasks/${pt.id}/reject`, { comment: 'Please clean under the bed too.' }, P);
  ok('parent rejects → task back to not_started + comment recorded', rej.json.task.approvalStatus === 'rejected' && rej.json.task.completionState === 'not_started' && rej.json.task.approvalComment.includes('under the bed'));
  const thread = (await get(`/api/tasks/${pt.id}/comments`, P)).json.comments;
  ok('rejection comment posted to the task discussion thread', thread.some((c) => c.authorRole === 'parent' && c.body.includes('under the bed')));

  // Child redoes → complete again → parent approves
  await post(`/api/tasks/${pt.id}/cycle`, {}, C); // not_started → completed (pending again)
  const appr = await post(`/api/tasks/${pt.id}/approve`, {}, P);
  ok('parent approves → approved + completed', appr.json.task.approvalStatus === 'approved' && appr.json.task.completionState === 'completed');
  const streaksAfter = (await get(`/api/streaks/${childId}`, P)).json.streaks.find((s) => s.kind === 'task_completion');
  ok('approved task NOW advances the streak', !!streaksAfter && streaksAfter.current === 1);

  ok('child cannot approve a task (403)', (await post(`/api/tasks/${pt.id}/approve`, {}, C)).status === 403);

  /* ── Task history records approval events ─────────────────────────────── */
  const hist = (await get(`/api/tasks/${pt.id}/history`, P)).json.history;
  ok('approval history tracked (pending→rejected→approved + proof)', hist.some((h) => h.newValue === 'rejected') && hist.some((h) => h.newValue === 'approved') && hist.some((h) => h.changeType === 'proof'));

  /* ── Enhanced AI insights ─────────────────────────────────────────────── */
  // Add discussion + a second category for richer insight signal.
  await post(`/api/tasks/${pt.id}/comments`, { body: 'Looks much better now!' }, P);
  const report = (await post('/api/ai/reports', { childId, period: 'weekly' }, P)).json.report;
  ok('report includes approval analytics', report.metrics.approval && typeof report.metrics.approval.approvalRate === 'number' && report.metrics.approval.decisions >= 2);
  ok('report includes discussion analytics', report.metrics.discussions && report.metrics.discussions.totalMessages >= 1 && Array.isArray(report.metrics.discussions.mostDiscussed));
  ok('report includes parent engagement', report.metrics.parentEngagement && ['low', 'moderate', 'high'].includes(report.metrics.parentEngagement.level));
  ok('report includes child consistency', report.metrics.consistency && typeof report.metrics.consistency.consistencyPct === 'number');
  ok('report includes human-readable insights[]', Array.isArray(report.metrics.insights));
  ok('summary mentions approval', report.summary.includes('approval'));

  /* ── Family relationship stabilization verification ────────────────────── */
  console.log('\n  AlphaGuard V2 — Family Stabilization & Scoping Tests\n');
  
  // Register co-parent and guardian parent accounts
  const coparentToken = (await post('/api/auth/parent/register', { email: 'co@family.com', password: 'secret123', name: 'CoParent' })).json.token;
  const guardianToken = (await post('/api/auth/parent/register', { email: 'guard@family.com', password: 'secret123', name: 'Guardian' })).json.token;

  // Primary parent P invites co-parent
  const inviteCo = await post('/api/family/invite', { familyId: child.json.child.parentId, role: 'co_parent' }, P);
  ok('primary parent invites co_parent', inviteCo.status === 200 && !!inviteCo.json.code);

  // Primary parent P invites guardian
  const inviteGuard = await post('/api/family/invite', { familyId: child.json.child.parentId, role: 'guardian' }, P);
  ok('primary parent invites guardian', inviteGuard.status === 200 && !!inviteGuard.json.code);

  // Co-parent joins family
  const joinCo = await post('/api/family/join', { code: inviteCo.json.code }, coparentToken);
  ok('co_parent joins family group', joinCo.status === 200 && joinCo.json.ok === true);

  // Guardian joins family
  const joinGuard = await post('/api/family/join', { code: inviteGuard.json.code }, guardianToken);
  ok('guardian joins family group', joinGuard.status === 200 && joinGuard.json.ok === true);

  // Co-parent reads child telemetry
  const coLoc = await get(`/api/location/${childId}`, coparentToken);
  ok('co_parent can view child location', coLoc.status === 200);

  const coBatt = await get(`/api/battery/${childId}`, coparentToken);
  ok('co_parent can view child battery', coBatt.status === 200);

  // Guardian reads child telemetry
  const guardLoc = await get(`/api/location/${childId}`, guardianToken);
  ok('guardian can view child location', guardLoc.status === 200);

  const guardBatt = await get(`/api/battery/${childId}`, guardianToken);
  ok('guardian can view child battery', guardBatt.status === 200);

  // Guardian tries to manage zones (should fail with 403)
  const guardCreateZone = await post('/api/zones', { name: 'School', lat: 1, lng: 1, radius: 100, childId }, guardianToken);
  ok('guardian blocked from creating safe zone (403)', guardCreateZone.status === 403);

  // Parent P creates a safe zone
  const pZone = await post('/api/zones', { name: 'School', lat: 1, lng: 1, radius: 100, childId }, P);
  const zoneId = pZone.json.zone.id;

  const guardDeleteZone = await req('DELETE', `/api/zones/${zoneId}`, null, guardianToken);
  ok('guardian blocked from deleting safe zone (403)', guardDeleteZone.status === 403);

  // Guardian tries to approve/reject task (should fail with 403)
  const taskToApprove = (await post('/api/tasks', { title: 'homework', childId, requireApproval: true }, P)).json.task;
  const guardApprove = await post(`/api/tasks/${taskToApprove.id}/approve`, {}, guardianToken);
  ok('guardian blocked from approving task (403)', guardApprove.status === 403);

  const guardReject = await post(`/api/tasks/${taskToApprove.id}/reject`, { comment: 'redo' }, guardianToken);
  ok('guardian blocked from rejecting task (403)', guardReject.status === 403);

  // Co-parent manages zones and tasks (should succeed 200)
  const coDeleteZone = await req('DELETE', `/api/zones/${zoneId}`, null, coparentToken);
  ok('co_parent can delete safe zone', coDeleteZone.status === 200);

  const coApprove = await post(`/api/tasks/${taskToApprove.id}/approve`, {}, coparentToken);
  ok('co_parent can approve task', coApprove.status === 200);

  // Verify rate limiting on join
  // Since we already used the limiter, we trigger multiple joins to exceed limit
  let joinRateLimitTriggered = false;
  for (let i = 0; i < 15; i++) {
    const r = await post('/api/family/join', { code: 'INVALID' }, coparentToken);
    if (r.status === 429) {
      joinRateLimitTriggered = true;
      break;
    }
  }
  ok('POST /family/join is rate-limited (429)', joinRateLimitTriggered);

} catch (e) {
  fail++; console.log('  ✗ threw:', e.message, e.stack);
}

await new Promise((r) => setTimeout(r, 150));
server.close();
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
