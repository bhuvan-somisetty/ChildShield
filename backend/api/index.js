require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize, isMongo, connectDB } = require('../src/db');

const authRoutes = require('../src/routes/auth');
const oauthRoutes = require('../src/routes/oauth');
const childRoutes = require('../src/routes/children');
const apiRoutes = require('../src/routes/api');
const deviceRoutes = require('../src/routes/device');
const activityRoutes = require('../src/routes/activity');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

// Routes
app.use('/auth', oauthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/children', childRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api', apiRoutes);

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Sync DB
if (isMongo) {
  connectDB().catch(console.error);
} else {
  sequelize.sync({ alter: true }).catch(console.error);
}

module.exports = app;
