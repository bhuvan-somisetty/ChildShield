require('dotenv').config();
const express = require('express');
const http    = require('http');
const cors    = require('cors');
const session = require('express-session');
const passport = require('./passport');
const { Server: SocketServer } = require('socket.io');
const { sequelize, isMongo } = require('./db');
const initSignaling = require('./signaling');

const authRoutes     = require('./routes/auth');
const oauthRoutes    = require('./routes/oauth');
const childRoutes    = require('./routes/children');
const apiRoutes      = require('./routes/api');
const deviceRoutes   = require('./routes/device');
const activityRoutes = require('./routes/activity');

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Create HTTP server (needed for Socket.IO)
const server = http.createServer(app);

// Attach Socket.IO
const io = new SocketServer(server, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'], credentials: true }
});
initSignaling(io);

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'childshield_session_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 10 * 60 * 1000 } // 10 min — only for OAuth handshake
}));
app.use(passport.initialize());
app.use(passport.session());

// OAuth social login routes MUST be mounted BEFORE /api so they bypass api.js's global auth middleware
app.use('/auth', oauthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => res.send('ChildShield AI Backend is running!'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Sync DB and start server (use `server.listen` not `app.listen` for Socket.IO)
if (isMongo) {
  server.listen(PORT, () => console.log(`[ChildShield] Server running on http://localhost:${PORT} (MongoDB)`));
} else {
  sequelize.sync({ alter: true }).then(() => {
    console.log('[Database] SQL models synchronized.');
    server.listen(PORT, () => console.log(`[ChildShield] Server running on http://localhost:${PORT} (SQL)`));
  }).catch(err => {
    console.error('[Database] Sync error:', err.message);
    sequelize.sync().then(() => {
      server.listen(PORT, () => console.log(`[ChildShield] Server running on http://localhost:${PORT} (SQL)`));
    });
  });
}

// Export for Vercel Serverless
module.exports = app;
