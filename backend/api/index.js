require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('../src/db');

const authRoutes = require('../src/routes/auth');
const childRoutes = require('../src/routes/children');
const apiRoutes = require('../src/routes/api');
const deviceRoutes = require('../src/routes/device');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Routes — strip /api prefix since Vercel routes /api/* here
app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Sync DB then export
let isReady = false;
sequelize.sync().then(() => {
  isReady = true;
  console.log('[DB] Synced');
}).catch(err => {
  console.error('[DB] Sync failed:', err.message);
  isReady = true; // still export app even if sync fails
});

module.exports = app;
