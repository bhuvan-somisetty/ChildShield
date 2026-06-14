// Phase 2 — Targets, Rewards/Promises, Streaks, Achievements, AI reports on the
// PostgreSQL backend (pg-mem). Real persistence, REST, role permissions,
// Socket.IO realtime, and deterministic report computation.
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
console.log('\n AlphaGuard V2 — Phase 2 Targets/Rewards/Streaks/AI (pg-mem)\n');

await initDB();
const { server } = createServer();
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const api = async (m, p, b, t) => { const r = await fetch(base + p, { method: m, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined }); return { status: r.status, body: await r.json().catch(() => ({})) }; };
const wait = (s, e, ms = 2500) => new Promise((res) => { const t = setTimeout(() => res(null), ms); s.once(e, (d) => { clearTimeout(t); res(d); }); });
const connect = (token) => new Promise((res) => { const s = Client(base, { auth: { token }, transports: ['websocket'] }); s.on('ready', () => res(s)); });

try {
  const pTok = (await api('POST', '/api/auth/parent/register', { email: 'p@fam.com', password: 'secret123', name: 'P' })).body.token;
  const created = (await api('POST', '/api/children', { name: 'Emma', age: 10 }, pTok)).body;
  const childId = created.child.id;
  const cTok = (await api('POST', '/api/pair/claim', { code: created.pairing.code })).body.token;
  const parent = await connect(pTok); const child = await connect(cTok);
  ok('setup — tokens + sockets', !!pTok && !!cTok && parent.connected && child.connected);

  // ── TARGETS ──────────────────────────────────────────────────────────────
  const tEv = wait(child, 'target:upserted');
  const target = (await api('POST', '/api/targets', { childId, title: 'Score 90% in Mathematics', category: 'study', priority: 'high' }, pTok)).body.target;
  ok('TARGET — parent creates target', target.title === 'Score 90% in Mathematics' && target.status === 'not_started');
  ok('SYNC — child receives target:upserted', (await tEv)?.id === target.id);

  const prog = (await api('PATCH', `/api/targets/${target.id}`, { progress: 60 }, pTok)).body.target;
  ok('TARGET — progress 60 → in_progress', prog.progress === 60 && prog.status === 'in_progress');

  // ── REWARD / PROMISE linked to the target ─────────────────────────────────
  const rEv = wait(child, 'reward:upserted');
  const reward = (await api('POST', '/api/rewards', { childId, title: 'New Bicycle', type: 'gift', targetId: target.id, promiseText: 'If you score above 90%, I will buy you a bicycle.' }, pTok)).body.reward;
  ok('REWARD — created (pending) + promise text', reward.status === 'pending' && reward.promiseText.includes('bicycle'));
  ok('SYNC — child sees reward/promise', (await rEv)?.id === reward.id);

  const ack = (await api('PATCH', `/api/rewards/${reward.id}`, { childAcknowledged: true }, cTok)).body.reward;
  ok('PROMISE — child can acknowledge', ack.childAcknowledged === true);
  const childEditTitle = await api('PATCH', `/api/rewards/${reward.id}`, { title: 'Hacked' }, cTok);
  ok('PERMISSION — child cannot edit reward title', childEditTitle.body.reward.title === 'New Bicycle');

  // Completing the target auto-unlocks the reward.
  const unlockEv = wait(parent, 'reward:upserted');
  await api('PATCH', `/api/targets/${target.id}`, { progress: 100 }, pTok);
  const unlocked = await unlockEv;
  ok('REWARD — auto-unlocks when target completed', unlocked?.status === 'unlocked');

  // ── STREAKS + ACHIEVEMENTS (driven by real task completion) ───────────────
  // Create a task and complete it → task_completion + study streak advance.
  const task = (await api('POST', '/api/tasks', { childId, title: 'Math homework', category: 'study' }, pTok)).body.task;
  const stEv = wait(parent, 'streak:updated');
  await api('POST', `/api/tasks/${task.id}/cycle`, {}, cTok); // → completed
  const st = await stEv;
  ok('STREAK — task completion advances a streak', st && st.current >= 1);
  const streaks = (await api('GET', `/api/streaks/${childId}`, null, pTok)).body.streaks;
  ok('STREAK — study + task_completion tracked', streaks.some((s) => s.kind === 'study') && streaks.some((s) => s.kind === 'task_completion'));

  // ── AI REPORT (deterministic) ─────────────────────────────────────────────
  const report = (await api('POST', '/api/ai/reports', { childId, period: 'weekly' }, pTok)).body.report;
  ok('AI — report computes completion %', typeof report.metrics.taskCompletionPct === 'number');
  ok('AI — report includes target progress', report.metrics.avgTargetProgress >= 0 && Array.isArray(report.metrics.targets));
  ok('AI — report includes streak + risk + recommendation', typeof report.metrics.currentTaskStreak === 'number' && !!report.metrics.riskLevel && !!report.metrics.recommendation);
  ok('AI — child can request own report', (await api('POST', '/api/ai/reports', { period: 'daily' }, cTok)).body.report?.childId === childId);

  // ── Permissions / isolation ───────────────────────────────────────────────
  const p2 = (await api('POST', '/api/auth/parent/register', { email: 'o@fam.com', password: 'secret123' }, null)).body.token;
  ok('ISOLATION — other family sees no targets', (await api('GET', '/api/targets', null, p2)).body.targets.length === 0);
  ok('PERMISSION — child cannot create a target (parent only)', (await api('POST', '/api/targets', { title: 'x' }, cTok)).status === 403);

  // ── Persistence ───────────────────────────────────────────────────────────
  await pg._flush();
  const pool = new Pool();
  ok('PERSISTENCE — targets in Postgres', (await pool.query('SELECT count(*)::int n FROM targets')).rows[0].n >= 1);
  ok('PERSISTENCE — rewards in Postgres', (await pool.query('SELECT count(*)::int n FROM rewards')).rows[0].n >= 1);
  ok('PERSISTENCE — streaks in Postgres', (await pool.query('SELECT count(*)::int n FROM streaks')).rows[0].n >= 1);
  ok('PERSISTENCE — ai_reports in Postgres', (await pool.query('SELECT count(*)::int n FROM ai_reports')).rows[0].n >= 1);

  parent.close(); child.close();
} catch (e) { fail++; console.log('  ✗ threw:', e.message, e.stack); }

await new Promise((r) => setTimeout(r, 200));
server.close();
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
