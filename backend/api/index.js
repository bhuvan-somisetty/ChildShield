require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('../src/db');

const authRoutes = require('../src/routes/auth');
const childRoutes = require('../src/routes/children');
const apiRoutes = require('../src/routes/api');
const deviceRoutes = require('../src/routes/device');
const activityRoutes = require('../src/routes/activity');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Sync DB then export
let isReady = false;
sequelize.sync({ alter: true }).then(() => {
  isReady = true;
  console.log('[DB] Synced');
}).catch(err => {
  console.error('[DB] Sync failed:', err.message);
  // Try basic sync without alter
  sequelize.sync().then(() => {
    isReady = true;
    console.log('[DB] Basic sync done');
  }).catch(e => {
    console.error('[DB] Total sync failure:', e.message);
    isReady = true;
  });
});

module.exports = app;
