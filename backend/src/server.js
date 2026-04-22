require('dotenv').config();
const express = require('express');
const http    = require('http');
const cors    = require('cors');
const session = require('express-session');
const passport = require('./passport');
const { Server: SocketServer } = require('socket.io');
const { connectDB, sequelize, isMongo } = require('./db');
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

const server = http.createServer(app);
const io = new SocketServer(server, {
  cors: { origin: FRONTEND_URL, methods: ['GET', 'POST'], credentials: true }
});
initSignaling(io);

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(session({
  secret: process.env.SESSION_SECRET || 'childshield_session_secret_prod',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 10 * 60 * 1000 }
}));
app.use(passport.initialize());
app.use(passport.session());

// Ensure DB is connected before any route is processed
app.use(async (req, res, next) => {
  if (isMongo && mongoose.connection.readyState !== 1) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(500).json({ error: 'Database connection failed', details: err.message });
    }
  }
  next();
});

// OAuth social login routes MUST be mounted BEFORE /api
app.use('/auth', oauthRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api', apiRoutes);

app.get('/', (req, res) => res.send('ChildShield AI Backend is running!'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// ── ONLY START SERVER AFTER DB CONNECTS ──
const startServer = async () => {
  try {
    if (isMongo) {
      await connectDB();
    } else {
      await sequelize.sync({ alter: true });
      console.log('[Database] SQL models synchronized.');
    }

    server.listen(PORT, () => {
      console.log(`[ChildShield] Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1); // Force crash so hosting provider (Render) restarts it
  }
};

startServer();

// Export for Vercel Serverless
module.exports = app;
