// Full server running on the PostgreSQL backend (pg-mem): proves REST + auth +
// pairing + Socket.IO + chat + SOS + safe-zone geofencing all work unchanged,
// and that data is actually persisted in Postgres.
import { newDb } from 'pg-mem';
import { io as Client } from 'socket.io-client';
import * as pg from '../src/pg.js';

process.env.DATABASE_URL = 'postgres://pg-mem'; // force the Postgres path in initDB
const db = newDb();
const { Pool } = db.adapters.createPg();
pg._setPool(new Pool());                        // initDB's connect() will reuse this

const { createServer } = await import('../src/server.js');
const { initDB } = await import('../src/db.js');

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}`); } };

console.log('\n AlphaGuard V2 — full server on PostgreSQL (pg-mem)\n');

const info = await initDB();
ok('server initialised on Postgres backend', info.backend === 'postgres');

const { server } = createServer();
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}`;
const post = async (p, b, t) => (await fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) }, body: JSON.stringify(b || {}) })).json();
const wait = (s, e, ms = 2500) => new Promise((res) => { const t = setTimeout(() => res(null), ms); s.once(e, (d) => { clearTimeout(t); res(d); }); });
const connect = (token) => new Promise((res) => { const s = Client(base, { auth: { token }, transports: ['websocket'] }); s.on('ready', () => res(s)); });

try {
  const reg = await post('/api/auth/parent/register', { email: 'jane@family.com', password: 'secret123', name: 'Jane' });
  ok('AUTH — parent register (persisted to Postgres)', !!reg.token);
  const pToken = reg.token;
  const created = await post('/api/children', { name: 'Emma', age: 10 }, pToken);
  ok('PAIRING — child + code created', !!created.pairing.code);
  const claim = await post('/api/pair/claim', { code: created.pairing.code, platform: 'web' });
  ok('PAIRING — child claims code', !!claim.token);

  const parent = await connect(pToken); const child = await connect(claim.token);
  ok('SOCKET.IO — both connect', parent.connected && child.connected);

  // CHAT
  const msgAtParent = wait(parent, 'chat:message');
  child.emit('chat:send', { pairingId: claim.pairingId, text: 'Hi from PG' });
  ok('CHAT — message delivered over socket', (await msgAtParent)?.text === 'Hi from PG');

  // SOS
  const sosAtParent = wait(parent, 'sos:alert');
  child.emit('sos:trigger', { location: { lat: 30.27, lng: -97.74 } });
  ok('SOS — alert reaches parent', (await sosAtParent)?.status === 'active');

  // SAFE ZONE geofence
  await post('/api/zones', { name: 'School', type: 'school', lat: 30.5, lng: -97.5, radius: 300 }, pToken);
  child.emit('location:update', { lat: 30.0, lng: -97.0 }); await new Promise((r) => setTimeout(r, 300));
  const zoneEv = wait(parent, 'zone:event');
  child.emit('location:update', { lat: 30.5001, lng: -97.5001 });
  ok('SAFE ZONE — geofence enter detected on Postgres backend', (await zoneEv)?.type === 'enter');

  // Persistence check — read straight from Postgres.
  await pg._flush();
  const pool = new Pool();
  const parents = (await pool.query('SELECT email FROM parents')).rows;
  ok('PERSISTENCE — parent row in Postgres', parents.some((r) => r.email === 'jane@family.com'));
  const msgs = (await pool.query('SELECT count(*)::int AS n FROM messages')).rows[0].n;
  ok('PERSISTENCE — chat message in Postgres', msgs >= 1);
  const zones = (await pool.query('SELECT count(*)::int AS n FROM safe_zones')).rows[0].n;
  ok('PERSISTENCE — safe zone in Postgres', zones >= 1);
  const events = (await pool.query("SELECT type FROM zone_events WHERE type = 'enter'")).rows;
  ok('PERSISTENCE — zone enter event in Postgres', events.length >= 1);

  // REST hydration still reads correctly.
  const hist = await (await fetch(`${base}/api/chat/${claim.pairingId}/messages`, { headers: { Authorization: `Bearer ${pToken}` } })).json();
  ok('REST — message history served', hist.messages.length >= 1);

  parent.close(); child.close();
} catch (e) { fail++; console.log('  ✗ threw:', e.message); }

await new Promise((r) => setTimeout(r, 200));
server.close();
console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
