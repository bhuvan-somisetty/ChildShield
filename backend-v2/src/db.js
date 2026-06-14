// Storage layer. The synchronous Repo + in-memory cache is the read source used
// by services/routes/sockets (UNCHANGED). Persistence is pluggable:
//   • DATABASE_URL set  → PostgreSQL (hydrate cache at boot, write-through per row)
//   • otherwise         → JSON file (debounced full-cache flush) — the dev/test path
// Either way the Repo API is identical, so nothing above this file changes.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, process.env.AG_DB_FILE || 'alphaguard.json');

const TABLES = ['parents', 'children', 'pairings', 'devices', 'messages', 'sos', 'locations', 'battery', 'permissions', 'notifications', 'appRequests', 'securityAlerts', 'safeZones', 'zoneEvents', 'settings', 'tasks', 'taskHistory'];
const empty = () => TABLES.reduce((o, t) => ((o[t] = []), o), {});

let cache = null;
let writeTimer = null;
let pg = null;        // the pg.js module when Postgres is active

// ── JSON fallback persistence ───────────────────────────────────────────────
const ensureJson = () => {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    cache = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    for (const t of TABLES) if (!cache[t]) cache[t] = [];
  } catch { cache = empty(); flushJson(); }
};
const flushJson = () => { try { fs.mkdirSync(DATA_DIR, { recursive: true }); fs.writeFileSync(DB_FILE, JSON.stringify(cache, null, 2)); } catch { /* noop */ } };
const persistJson = () => { clearTimeout(writeTimer); writeTimer = setTimeout(flushJson, 40); };

// Read source — lazily loads JSON if the cache hasn't been hydrated yet.
const getCache = () => { if (!cache) ensureJson(); return cache; };

// Route a mutation to the active persistence backend.
const persistRow = (table, op, payload) => {
  if (pg) { if (op === 'del') pg.enqueueDelete(table, payload); else pg.enqueueUpsert(table, payload); }
  else persistJson();
};

export const id = () => crypto.randomUUID();
export const now = () => Date.now();

export const Repo = (table) => {
  const rows = () => getCache()[table];
  return {
    all: () => rows().slice(),
    find: (pred) => rows().find(pred),
    filter: (pred) => rows().filter(pred),
    byId: (rid) => rows().find((r) => r.id === rid),
    insert: (row) => { const rec = { id: row.id || id(), createdAt: now(), ...row }; rows().push(rec); persistRow(table, 'up', rec); return rec; },
    update: (rid, patch) => { const r = rows().find((x) => x.id === rid); if (!r) return null; Object.assign(r, patch); persistRow(table, 'up', r); return r; },
    upsert: (pred, row) => { const r = rows().find(pred); if (r) { Object.assign(r, row); persistRow(table, 'up', r); return r; } return Repo(table).insert(row); },
    remove: (rid) => { const i = rows().findIndex((x) => x.id === rid); if (i >= 0) { const [r] = rows().splice(i, 1); persistRow(table, 'del', r.id); return true; } return false; },
  };
};

// Initialise persistence. Call before serving traffic. No-op (lazy JSON) when no
// DATABASE_URL, so dev/test runs need no database.
export const initDB = async () => {
  if (!process.env.DATABASE_URL) { ensureJson(); return { backend: 'json', file: DB_FILE }; }
  pg = await import('./pg.js');
  pg.connect();
  await pg.migrate();
  cache = await pg.hydrate(TABLES);
  for (const t of TABLES) if (!cache[t]) cache[t] = [];
  return { backend: 'postgres' };
};

export const closeDB = async () => { if (pg) await pg.close(); };
export const resetDB = () => { cache = empty(); if (!pg) flushJson(); };
export const tables = TABLES;
