require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const mongoose = require('mongoose');
const { sequelize, isMongo, connectDB, getDBStatus } = require('../src/db');

const authRoutes     = require('../src/routes/auth');
const oauthRoutes    = require('../src/routes/oauth');
const childRoutes    = require('../src/routes/children');
const apiRoutes      = require('../src/routes/api');
const deviceRoutes   = require('../src/routes/device');
const activityRoutes = require('../src/routes/activity');

const app = express();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://child-shield.vercel.app';

app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000', '*'],
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

// ── DB Guard (same as server.js) ──────────────────────────────────────────────
app.use(async (req, res, next) => {
  if (!isMongo) return next();

  const rs = mongoose.connection.readyState;
  if (rs === 1) return next();

  if (rs === 0) {
    try {
      await connectDB();
    } catch (err) {
      return res.status(503).json({
        error: 'Database unavailable. Please try again shortly.',
        details: err.message,
      });
    }
  } else if (rs === 2) {
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
app.use('/auth', oauthRoutes);
app.use('/api/auth',     authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/device',   deviceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api',          apiRoutes);

// ── Health check ──────────────────────────────────────────────────────────────
const healthHandler = (req, res) => {
  const db = getDBStatus();
  const healthy = db.isConnected !== false;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    server: 'running',
    db,
    timestamp: new Date().toISOString(),
  });
};

app.get('/health',     healthHandler);
app.get('/api/health', healthHandler);

// ── Init DB (for serverless cold-start) ──────────────────────────────────────
if (isMongo) {
  connectDB().catch(console.error);
} else {
  sequelize.sync({ alter: true }).catch(console.error);
}

module.exports = app;
