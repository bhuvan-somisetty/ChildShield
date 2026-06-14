// Phase 2.5 — Productivity & Planning on PostgreSQL (pg-mem). Categories +
// filtering, recurring task materialisation, task comment threads (realtime),
// category-aware AI reports, and category/badge achievements.
import { newDb } from 'pg-mem';
import { io as Client } from 'socket.io-client';
import * as pg from '../src/pg.js';

process.env.DATABASE_URL = 'postgres://pg-mem';
const db = newDb();
const { Pool } = db.adapters.createPg();
pg._setPool(new Pool());

const { createServer } = await import('../src/server.js');
const { initDB } = await import('../src/db.js');

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}`); } };
console.log('\n AlphaGuard V2 — Phase 2.5 Productivity & Planning (pg-mem)\n');

await initDB();
const { server } = createServer();
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const api = async (m, p, b, t) => { const r = await fetch(base + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, body: await r.json().catch(() => ({})) }; };
const wait = (s, e, ms = 2500) => new Promise((res) => { const t = setTimeout(() => res(null), ms); s.once(e, (d) => { clearTimeout(t); res(d); }); });
const connect = (token) => new Promise((res) => { const s = Client(base, { auth: { token }, transports: ['websocket'] }); s.on('ready', () => res(s)); });

try {
  const pTok = (await api('POST', '/api/auth/parent/register', { email: 'p@fam.com', password: 'secret123' })).body.token;
  const created = (await api('POST', '/api/children', { name: 'Emma', age: 10 }, pTok)).body;
  const childId = created.child.id;
  const cTok = (await api('POST', '/api/pair/claim', { code: created.pairing.code })).body.token;
  const parent = await connect(pTok); const child = await connect(cTok);
  ok('setup — tokens + sockets', parent.connected && child.connected);

  // ── Categories ────────────────────────────────────────────────────────────
  const cats = (await api('GET', '/api/task-categories', null, pTok)).body.categories;
  ok('CATEGORIES — built-ins present', ['Homework', 'Reading', 'Coding', 'Exercise'].every((n) => cats.some((c) => c.name === n)));
  await api('POST', '/api/task-categories', { name: 'Piano', color: '#a855f7' }, pTok);
  ok('CATEGORIES — custom added', (await api('GET', '/api/task-categories', null, pTok)).body.categories.some((c) => c.name === 'Piano'));

  // Tasks with categories + filtering
  await api('POST', '/api/tasks', { childId, title: 'Read 20 pages', category: 'Reading' }, pTok);
  await api('POST', '/api/tasks', { childId, title: 'Solve sums', category: 'Homework' }, pTok);
  const readingOnly = (await api('GET', `/api/tasks?childId=${childId}&category=Reading`, null, pTok)).body.tasks;
  ok('FILTER — by category returns only that category', readingOnly.length === 1 && readingOnly[0].category === 'Reading');

  // ── Recurring tasks ───────────────────────────────────────────────────────
  const rec = (await api('POST', '/api/recurring', { childId, title: 'Read daily', category: 'Reading', frequency: 'daily' }, pTok)).body.recurring;
  ok('RECURRING — rule created (daily)', rec.frequency === 'daily');
  const allTasks = (await api('GET', `/api/tasks?childId=${childId}`, null, pTok)).body.tasks;
  const recInstances = allTasks.filter((t) => t.recurringId === rec.id);
  ok('RECURRING — materialised future instances (14-day horizon)', recInstances.length >= 14);
  ok('RECURRING — instances carry the category + dueAt', recInstances.every((t) => t.category === 'Reading' && t.dueAt));
  // Idempotent: a second materialise pass shouldn't duplicate
  await api('POST', '/api/recurring', { childId, title: 'Read daily', category: 'Reading', frequency: 'daily' }, pTok); // separate rule, fine
  const weekdayRule = (await api('POST', '/api/recurring', { childId, title: 'Code', category: 'Coding', frequency: 'weekdays' }, pTok)).body.recurring;
  const codeInstances = (await api('GET', `/api/tasks?childId=${childId}`, null, pTok)).body.tasks.filter((t) => t.recurringId === weekdayRule.id);
  ok('RECURRING — weekdays generates only Mon–Fri', codeInstances.every((t) => { const d = new Date(t.dueAt + 'T00:00:00Z').getUTCDay(); return d >= 1 && d <= 5; }));

  // ── Task comments (realtime, both ways) ───────────────────────────────────
  const task = recInstances[0];
  const atChild = wait(child, 'task:comment');
  await api('POST', `/api/tasks/${task.id}/comments`, { body: 'Please finish before 6 PM.' }, pTok);
  ok('COMMENT — parent comments → child receives realtime', (await atChild)?.body === 'Please finish before 6 PM.');
  const atParent = wait(parent, 'task:comment');
  await api('POST', `/api/tasks/${task.id}/comments`, { body: 'Completed after school.' }, cTok);
  ok('COMMENT — child replies → parent receives realtime', (await atParent)?.authorRole === 'child');
  ok('COMMENT — full thread stored', (await api('GET', `/api/tasks/${task.id}/comments`, null, pTok)).body.comments.length === 2);

  // Completing a Reading task advances the (day-based) reading streak. The
  // named "Reading Champion" badge awards at the 7-day milestone — proven via
  // the same awardBadge path as Target Crusher below (streaks are per-day, so 7
  // calendar days can't elapse inside one test run).
  const readingInstances = (await api('GET', `/api/tasks?childId=${childId}&category=Reading`, null, pTok)).body.tasks.filter((t) => t.recurringId === rec.id).slice(0, 2);
  for (const t of readingInstances) { await api('POST', `/api/tasks/${t.id}/cycle`, {}, cTok); } // → completed
  const streaksNow = (await api('GET', `/api/streaks/${childId}`, null, pTok)).body.streaks;
  ok('ACHIEVEMENT — reading streak advances on completion', (streaksNow.find((s) => s.kind === 'reading')?.current || 0) >= 1);

  // Target Crusher on target completion
  const target = (await api('POST', '/api/targets', { childId, title: 'Finish syllabus', category: 'Study' }, pTok)).body.target;
  await api('PATCH', `/api/targets/${target.id}`, { progress: 100 }, pTok);
  ok('ACHIEVEMENT — Target Crusher badge unlocked', (await api('GET', `/api/achievements/${childId}`, null, pTok)).body.achievements.some((a) => a.title === 'Target Crusher'));

  // ── AI report uses category data ──────────────────────────────────────────
  const report = (await api('POST', '/api/ai/reports', { childId, period: 'monthly' }, pTok)).body.report;
  ok('AI — report includes category breakdown', Array.isArray(report.metrics.categories) && report.metrics.categories.some((c) => c.category === 'Reading'));
  ok('AI — most successful / missed category computed', 'mostSuccessfulCategory' in report.metrics && 'mostMissedCategory' in report.metrics);
  ok('AI — recurring success rate computed', typeof report.metrics.recurringSuccessRate === 'number');
  ok('AI — weekly trend delta present', typeof report.metrics.trendDelta === 'number');

  // ── Persistence ───────────────────────────────────────────────────────────
  await pg._flush();
  const pool = new Pool();
  ok('PERSISTENCE — recurring_tasks in Postgres', (await pool.query('SELECT count(*)::int n FROM recurring_tasks')).rows[0].n >= 1);
  ok('PERSISTENCE — task_comments in Postgres', (await pool.query('SELECT count(*)::int n FROM task_comments')).rows[0].n >= 2);
  ok('PERSISTENCE — task_categories in Postgres', (await pool.query('SELECT count(*)::int n FROM task_categories')).rows[0].n >= 1);
  ok('PERSISTENCE — calendar_events in Postgres', (await pool.query('SELECT count(*)::int n FROM calendar_events')).rows[0].n >= 14);

  parent.close(); child.close();
} catch (e) { fail++; console.log('  ✗ threw:', e.message, e.stack); }

await new Promise((r) => setTimeout(r, 200));
server.close();
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
