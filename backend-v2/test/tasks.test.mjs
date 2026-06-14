// Phase 1 — Shared parent/child Task system on the PostgreSQL backend (pg-mem).
// Proves: real PG persistence, REST CRUD, role permissions, the triple-state
// cycle, full edit history, and Socket.IO parent↔child realtime synchronization.
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

console.log('\n AlphaGuard V2 — Phase 1 Tasks on PostgreSQL (pg-mem)\n');

const info = await initDB();
ok('server on Postgres backend', info.backend === 'postgres');

const { server } = createServer();
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const api = async (method, p, b, t) => {
  const res = await fetch(base + p, { method, headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: b ? JSON.stringify(b) : undefined });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};
const wait = (s, e, ms = 2500) => new Promise((res) => { const t = setTimeout(() => res(null), ms); s.once(e, (d) => { clearTimeout(t); res(d); }); });
const connect = (token) => new Promise((res) => { const s = Client(base, { auth: { token }, transports: ['websocket'] }); s.on('ready', () => res(s)); });

try {
  const pToken = (await api('POST', '/api/auth/parent/register', { email: 'jane@family.com', password: 'secret123', name: 'Jane' })).body.token;
  const created = (await api('POST', '/api/children', { name: 'Emma', age: 10 }, pToken)).body;
  const childId = created.child.id;
  const claim = (await api('POST', '/api/pair/claim', { code: created.pairing.code, platform: 'web' })).body;
  const cToken = claim.token;
  ok('AUTH + PAIRING — parent + child tokens', !!pToken && !!cToken);

  const parent = await connect(pToken);
  const child = await connect(cToken);
  ok('SOCKET.IO — both connected', parent.connected && child.connected);

  // ── Parent creates a task → child receives it in real time ──────────────
  const atChild = wait(child, 'task:upserted');
  const createRes = await api('POST', '/api/tasks', { childId, title: 'Read 20 minutes', description: 'Any book', note: 'before dinner' }, pToken);
  const task = createRes.body.task;
  ok('CREATE — parent creates task (REST)', createRes.status === 200 && task.title === 'Read 20 minutes');
  ok('SYNC — child receives task:upserted', (await atChild)?.id === task.id);
  ok('STATE — new task starts not_started', task.completionState === 'not_started');
  ok('SOURCE — parent-created task', task.source === 'parent');

  // ── Triple-state cycle ⬜→✅→❌→⬜ (child taps), parent observes ──────────
  let ev = wait(parent, 'task:upserted');
  let r1 = await api('POST', `/api/tasks/${task.id}/cycle`, {}, cToken);
  ok('CYCLE 1 — not_started → completed', r1.body.task.completionState === 'completed');
  ok('SYNC — parent sees completed', (await ev)?.completionState === 'completed');

  ev = wait(parent, 'task:upserted');
  let r2 = await api('POST', `/api/tasks/${task.id}/cycle`, {}, cToken);
  ok('CYCLE 2 — completed → failed', r2.body.task.completionState === 'failed');
  ok('SYNC — parent sees failed', (await ev)?.completionState === 'failed');

  let r3 = await api('POST', `/api/tasks/${task.id}/cycle`, {}, cToken);
  ok('CYCLE 3 — failed → not_started (wraps)', r3.body.task.completionState === 'not_started');

  // ── Edit + notes ────────────────────────────────────────────────────────
  const edit = await api('PATCH', `/api/tasks/${task.id}`, { title: 'Read 30 minutes', note: 'after homework' }, pToken);
  ok('EDIT — title + note updated', edit.body.task.title === 'Read 30 minutes' && edit.body.task.note === 'after homework');

  // ── History (who / what / when) ─────────────────────────────────────────
  const hist = (await api('GET', `/api/tasks/${task.id}/history`, null, pToken)).body.history;
  const types = hist.map((h) => h.changeType);
  ok('HISTORY — create logged', types.includes('create'));
  ok('HISTORY — 3 state_changes logged', types.filter((t) => t === 'state_change').length === 3);
  ok('HISTORY — edits logged (field_edit + note)', types.includes('field_edit') && types.includes('note'));
  ok('HISTORY — records actor + timestamp', hist.every((h) => h.actorRole && h.at));

  // ── Child creates own task → parent sees it ─────────────────────────────
  const atParent = wait(parent, 'task:upserted');
  const childTask = (await api('POST', '/api/tasks', { title: 'Tidy my room' }, cToken)).body.task;
  ok('CREATE — child creates own task', childTask.source === 'child' && childTask.childId === childId);
  ok('SYNC — parent receives child task', (await atParent)?.id === childTask.id);

  // ── Permissions ─────────────────────────────────────────────────────────
  const childDeletesParentTask = await api('DELETE', `/api/tasks/${task.id}`, null, cToken);
  ok('PERMISSION — child cannot delete parent task (403)', childDeletesParentTask.status === 403);

  const delEv = wait(parent, 'task:deleted');
  const childDeletesOwn = await api('DELETE', `/api/tasks/${childTask.id}`, null, cToken);
  ok('DELETE — child deletes own task (200)', childDeletesOwn.status === 200);
  ok('SYNC — parent receives task:deleted', (await delEv)?.id === childTask.id);

  // Deleted task no longer listed, but its history survives.
  const list = (await api('GET', '/api/tasks', null, pToken)).body.tasks;
  ok('LIST — deleted task excluded', !list.some((t) => t.id === childTask.id));

  // A second family cannot see this family's tasks (tenant isolation).
  const p2 = (await api('POST', '/api/auth/parent/register', { email: 'other@fam.com', password: 'secret123' }, null)).body.token;
  const otherList = (await api('GET', '/api/tasks', null, p2)).body.tasks;
  ok('ISOLATION — other family sees no tasks', otherList.length === 0);

  // ── Persistence — read straight from Postgres ───────────────────────────
  await pg._flush();
  const pool = new Pool();
  const tcount = (await pool.query('SELECT count(*)::int AS n FROM tasks')).rows[0].n;
  ok('PERSISTENCE — tasks rows in Postgres', tcount >= 2);
  const hcount = (await pool.query('SELECT count(*)::int AS n FROM task_history')).rows[0].n;
  ok('PERSISTENCE — task_history rows in Postgres', hcount >= 6);
  const stateCol = (await pool.query("SELECT count(*)::int AS n FROM tasks WHERE completion_state IS NOT NULL")).rows[0].n;
  ok('PERSISTENCE — indexed completion_state populated', stateCol >= 2);

  parent.close(); child.close();
} catch (e) { fail++; console.log('  ✗ threw:', e.message, e.stack); }

await new Promise((r) => setTimeout(r, 200));
server.close();
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
