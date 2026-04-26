require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const session  = require('express-session');
const mongoose = require('mongoose');
const passport = require('./passport');
const { Server: SocketServer } = require('socket.io');
const { connectDB, getDBStatus, sequelize, isMongo } = require('./db');
const initSignaling = require('./signaling');

const authRoutes     = require('./routes/auth');
const oauthRoutes    = require('./routes/oauth');
const childRoutes    = require('./routes/children');
const apiRoutes      = require('./routes/api');
const deviceRoutes   = require('./routes/device');
const activityRoutes = require('./routes/activity');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://child-shield.vercel.app';

// ── Unhandled rejection / exception safety ─────────────────────────────────────
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err.message);
  // Don't crash — log and continue (Render will restart on OOM/fatal anyway)
});

// ── HTTP + Socket.IO ───────────────────────────────────────────────────────────
const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: {
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    methods: ['GET', 'POST'],
    credentials: true,
  },
  // Prevent stale connections
  pingTimeout: 20000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
});
initSignaling(io);

// ── CORS & body parsing ────────────────────────────────────────────────────────
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));

// ── Global Input Sanitizer (Prevents MongoDB 'null' validation crashes) ───────
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitizeNulls = (obj) => {
      if (!obj) return;
      Object.keys(obj).forEach(key => {
        if (obj[key] === null) obj[key] = undefined;
        else if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) sanitizeNulls(obj[key]);
      });
    };
    sanitizeNulls(req.body);
  }
  next();
});
app.use(session({
  secret: process.env.SESSION_SECRET || 'childshield_session_secret_prod',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 10 * 60 * 1000 },
}));
app.use(passport.initialize());
app.use(passport.session());

// ── DB Guard Middleware ────────────────────────────────────────────────────────
// Ensures MongoDB is connected before any /api or /auth route is processed.
// Uses a timed wait (max 5s) to avoid hanging indefinitely.
app.use(async (req, res, next) => {
  if (!isMongo) return next(); // SQL mode — always ready after sync

  const rs = mongoose.connection.readyState;
  if (rs === 1) return next(); // Already connected

  if (rs === 0) {
    // Disconnected — trigger reconnect
    try {
      await connectDB();
    } catch (err) {
      return res.status(503).json({
        error: 'Database unavailable. Please try again shortly.',
        details: err.message,
      });
    }
  } else if (rs === 2) {
    // Connecting — wait up to 5 seconds
    const deadline = Date.now() + 5000;
    while (mongoose.connection.readyState === 2 && Date.now() < deadline) {
      await new Promise(r => setTimeout(r, 100));
    }
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({ error: 'Database still connecting. Please retry.' });
    }
  }

  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────
// OAuth social login routes MUST be mounted BEFORE /api
app.use('/auth', oauthRoutes);

app.use('/api/auth',     authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/device',   deviceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api',          apiRoutes);

// ── Health Check (always responds, even if DB is down) ────────────────────────
app.get('/', (req, res) => res.send('ChildShield AI Backend is running!'));

app.get('/health', (req, res) => {
  const db = getDBStatus();
  const healthy = db.isConnected !== false;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    server: 'running',
    db,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  const db = getDBStatus();
  const healthy = db.isConnected !== false;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    server: 'running',
    db,
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[Server Error]', err.message);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// ── Start Server ──────────────────────────────────────────────────────────────
const startServer = async () => {
  try {
    if (isMongo) {
      await connectDB();
    } else {
      await sequelize.sync({ alter: true });
      console.log('[Database] SQL models synchronized.');
    }

    server.listen(PORT, () => {
      console.log(`[ChildShield] ✅ Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1); // Let hosting provider (Render) restart
  }
};

startServer();

// Export for Vercel Serverless (no-op there since we startServer() above)
module.exports = app;
