// Verifies the PostgreSQL backend (schema migration, hydrate, write-through)
// against an in-memory Postgres (pg-mem) — no real database required.
import { newDb } from 'pg-mem';
import * as pg from '../src/pg.js';

let pass = 0, fail = 0;
const ok = (n, c) => { if (c) { pass++; console.log(`  ✓ ${n}`); } else { fail++; console.log(`  ✗ ${n}`); } };

console.log('\n AlphaGuard V2 — PostgreSQL backend test (pg-mem)\n');

const db = newDb();
const { Pool } = db.adapters.createPg();
pg._setPool(new Pool());

// 1) Migrations create the schema.
const files = await pg.migrate();
ok('migrations run (001_init.sql applied)', files.includes('001_init.sql'));
const applied = (await new Pool().query('SELECT name FROM _migrations')).rows;
ok('migration tracked in _migrations', applied.some((r) => r.name === '001_init.sql'));
const tableExists = (t) => db.public.getTable(t) != null;
ok('parents/children/pairings tables exist', tableExists('parents') && tableExists('children') && tableExists('pairings'));
ok('safe_zones / zone_events / notifications tables exist', tableExists('safe_zones') && tableExists('zone_events') && tableExists('notifications'));

// 2) Write-through persists rows (id + indexed cols + JSONB data).
pg.enqueueUpsert('parents', { id: 'p1', email: 'jane@family.com', name: 'Jane' });
pg.enqueueUpsert('children', { id: 'c1', parentId: 'p1', name: 'Emma', age: 10 });
pg.enqueueUpsert('pairings', { id: 'pr1', parentId: 'p1', childId: 'c1', code: '123456', status: 'active' });
pg.enqueueUpsert('safeZones', { id: 'z1', parentId: 'p1', childId: 'c1', name: 'School', lat: 30.5, lng: -97.5, radius: 200 });
pg.enqueueUpsert('zoneEvents', { id: 'e1', parentId: 'p1', childId: 'c1', zoneId: 'z1', zoneName: 'School', type: 'enter', at: Date.now() });
await pg._flush();

// 3) Update + delete write-through.
pg.enqueueUpsert('children', { id: 'c1', parentId: 'p1', name: 'Emma', age: 11 }); // update
pg.enqueueUpsert('parents', { id: 'p2', email: 'temp@x.com', name: 'Temp' });
pg.enqueueDelete('parents', 'p2');
await pg._flush();

// 4) Hydrate reconstructs the full row objects from JSONB.
const cache = await pg.hydrate(['parents', 'children', 'pairings', 'safeZones', 'zoneEvents']);
ok('hydrate returns parents', cache.parents.length === 1 && cache.parents[0].email === 'jane@family.com');
ok('hydrate returns child with updated age', cache.children[0]?.age === 11);
ok('hydrate returns pairing (status active)', cache.pairings[0]?.status === 'active');
ok('hydrate returns safe zone (radius 200)', cache.safeZones[0]?.radius === 200);
ok('hydrate returns zone event (enter)', cache.zoneEvents[0]?.type === 'enter');
ok('delete write-through removed the row', cache.parents.length === 1);

// 5) Indexed key columns are populated (queryable, not just JSONB).
const byParent = (await new Pool().query("SELECT id FROM children WHERE parent_id = 'p1'")).rows;
ok('indexed column query works (children by parent_id)', byParent.length === 1 && byParent[0].id === 'c1');
const byCode = (await new Pool().query("SELECT id FROM pairings WHERE code = '123456'")).rows;
ok('indexed column query works (pairing by code)', byCode.length === 1);
const zoneJson = (await new Pool().query("SELECT data->>'name' AS n FROM safe_zones WHERE child_id = 'c1'")).rows;
ok('JSONB payload queryable (zone name)', zoneJson[0]?.n === 'School');

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
