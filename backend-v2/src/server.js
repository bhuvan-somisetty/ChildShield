// AlphaGuard V2 realtime backend — Express REST + Socket.IO.
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import buildRoutes from './routes.js';
import attachSockets from './sockets.js';
import { startZoneScheduler } from './services.js';
import { initDB } from './db.js';

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });

  app.get('/health', (_req, res) => res.json({ ok: true, service: 'alphaguard-backend-v2', time: Date.now() }));
  app.use('/api', buildRoutes(io));
  attachSockets(io);
  startZoneScheduler(io); // late/missed/stayed checks

  return { app, server, io };
}

// Start when run directly.
if (process.argv[1] && process.argv[1].endsWith('server.js')) {
  const PORT = process.env.PORT || 4000;
  const { server } = createServer();
  // Hydrate the store (Postgres if DATABASE_URL, else JSON) before serving.
  initDB()
    .then((info) => server.listen(PORT, () => console.log(`AlphaGuard backend-v2 listening on :${PORT}  (Socket.IO ready · storage: ${info.backend})`)))
    .catch((e) => { console.error('DB init failed:', e.message); process.exit(1); });
}
