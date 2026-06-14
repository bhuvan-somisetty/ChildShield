// PostgreSQL persistence backend for the Repo cache.
// The in-memory cache stays the synchronous read source (so services/routes/
// sockets are unchanged); this module hydrates it at boot and write-throughs
// every mutation to Postgres via a serialized FIFO queue (order-safe for FKs).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pkg from 'pg';

const { Pool } = pkg;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

// JS table name → Postgres table name.
const PG_TABLE = {
  parents: 'parents', children: 'children', pairings: 'pairings', devices: 'devices',
  messages: 'messages', sos: 'sos', locations: 'locations', battery: 'battery',
  permissions: 'permissions', notifications: 'notifications', appRequests: 'app_requests',
  securityAlerts: 'security_alerts', safeZones: 'safe_zones', zoneEvents: 'zone_events', settings: 'settings',
  tasks: 'tasks', taskHistory: 'task_history',
};
// Typed/indexed key columns per table → which row field fills them.
const KEYCOLS = {
  parents: { email: 'email' },
  children: { parent_id: 'parentId' },
  pairings: { parent_id: 'parentId', child_id: 'childId', code: 'code', status: 'status' },
  devices: { owner_id: 'ownerId' },
  messages: { pairing_id: 'pairingId', at: 'at' },
  sos: { parent_id: 'parentId', child_id: 'childId', pairing_id: 'pairingId', status: 'status', at: 'at' },
  locations: { child_id: 'childId', at: 'at' },
  battery: { child_id: 'childId', at: 'at' },
  permissions: { owner_id: 'ownerId', key: 'key' },
  notifications: { parent_id: 'parentId', type: 'type', read: 'read', at: 'at' },
  appRequests: { parent_id: 'parentId', child_id: 'childId', pairing_id: 'pairingId', type: 'type', status: 'status', at: 'at' },
  securityAlerts: { parent_id: 'parentId', child_id: 'childId', kind: 'kind', at: 'at' },
  safeZones: { parent_id: 'parentId', child_id: 'childId', pairing_id: 'pairingId' },
  zoneEvents: { parent_id: 'parentId', child_id: 'childId', pairing_id: 'pairingId', zone_id: 'zoneId', type: 'type', at: 'at' },
  settings: { owner_id: 'ownerId', key: 'key' },
  tasks: { family_id: 'familyId', child_id: 'childId', completion_state: 'completionState' },
  taskHistory: { family_id: 'familyId', task_id: 'taskId', at: 'at' },
};

let pool = null;
const queue = [];        // serialized write-through ops
let draining = false;

export const connect = () => {
  if (pool) return pool; // already injected (tests) or connected
  pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 10, ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined });
  return pool;
};

// Inject a pool (used by tests with an in-memory Postgres).
export const _setPool = (p) => { pool = p; };
// Drain the write-through queue (tests await durability).
export const _flush = async () => { while (queue.length || draining) await new Promise((r) => setTimeout(r, 5)); };

// Run any migration files not yet applied (tracked in _migrations).
export const migrate = async () => {
  await pool.query('CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now())');
  const applied = new Set((await pool.query('SELECT name FROM _migrations')).rows.map((r) => r.name));
  const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql')).sort();
  for (const f of files) {
    if (applied.has(f)) continue;
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, f), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO _migrations(name) VALUES ($1)', [f]);
      await client.query('COMMIT');
    } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
  }
  return files;
};

// Load every table into a fresh cache object ({ jsTable: rows[] }).
export const hydrate = async (tables) => {
  const cache = {};
  for (const t of tables) {
    const res = await pool.query(`SELECT data FROM ${PG_TABLE[t]}`);
    cache[t] = res.rows.map((r) => r.data);
  }
  return cache;
};

const drain = async () => {
  if (draining) return; draining = true;
  while (queue.length) {
    const op = queue.shift();
    try { await op(); } catch (e) { console.error('[pg] write failed:', e.message); }
  }
  draining = false;
};

export const enqueueUpsert = (table, row) => {
  const pgt = PG_TABLE[table]; const cols = KEYCOLS[table] || {};
  const colNames = ['id', ...Object.keys(cols), 'data'];
  const values = [row.id, ...Object.keys(cols).map((c) => row[cols[c]] ?? null), JSON.stringify(row)];
  const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
  const updates = colNames.slice(1).map((c) => `${c} = EXCLUDED.${c}`).join(', ');
  const sql = `INSERT INTO ${pgt} (${colNames.join(', ')}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updates}`;
  queue.push(() => pool.query(sql, values));
  drain();
};

export const enqueueDelete = (table, id) => {
  queue.push(() => pool.query(`DELETE FROM ${PG_TABLE[table]} WHERE id = $1`, [id]));
  drain();
};

export const close = async () => { if (pool) await pool.end(); };
export const tablesMap = PG_TABLE;
