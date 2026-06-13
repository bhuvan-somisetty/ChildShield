// Run pending SQL migrations against DATABASE_URL.
//   DATABASE_URL=postgres://user:pass@host:5432/alphaguard node migrate.js
import { connect, migrate, close } from './src/pg.js';

if (!process.env.DATABASE_URL) { console.error('DATABASE_URL is required to run migrations.'); process.exit(1); }

connect();
try {
  const files = await migrate();
  console.log('Migrations applied. Files present:', files.join(', '));
} catch (e) {
  console.error('Migration failed:', e.message); process.exitCode = 1;
} finally {
  await close();
}
