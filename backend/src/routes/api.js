const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Child } = require('../db');
const sim = require('../services/SimulationService');

// Require authentication for all dashboard API routes
router.use(auth);

// GET /api/dashboard
router.get('/dashboard', async (req, res) => {
  const childId = req.query.childId;
  if(!childId) return res.status(400).json({ error: 'childId required' });
  const isDemoMode = req.query.demo === 'true';
  
  sim.tick(childId, isDemoMode);
  
  const child = await Child.findOne({ where: { id: childId, parentId: req.user.id }});
  
  const simData = sim.getDashboardData(childId);
  simData.limit = child ? `${child.dailyLimitHours}h 00m` : '5h 00m';
  
  res.json({ success: true, data: simData });
});

// GET /api/history
router.get('/history', (req, res) => {
  const childId = req.query.childId;
  if(!childId) return res.json({ success: true, data: [] });
  
  // Only tick deeply if demo is on here, to avoid overpowering increments across multiple parallel requests
  const isDemoMode = req.query.demo === 'true';
  if(isDemoMode) sim.tick(childId, isDemoMode); 

  let data = sim.getChildState(childId).watchHistory;
  
  if(req.query.category) {
    data = data.filter(item => item.category.toLowerCase() === req.query.category.toLowerCase());
  }
  
  res.json({ success: true, data });
});

// GET /api/insights
router.get('/insights', (req, res) => {
  const childId = req.query.childId;
  if(!childId) return res.json({ success: true, data: {} });
  res.json({ success: true, data: sim.getChildState(childId).insights });
});

// GET /api/notifications
router.get('/notifications', (req, res) => {
  const childId = req.query.childId;
  if(!childId) return res.json({ success: true, data: [] });
  res.json({ success: true, data: sim.getChildState(childId).notifications });
});

// GET /api/analytics (heatmap + categories + topApps for charts)
router.get('/analytics', (req, res) => {
  const childId = req.query.childId;
  if (!childId) return res.json({ success: true, data: {} });
  
  const state = sim.getChildState(childId);
  const dashData = sim.getDashboardData(childId);
  
  res.json({
    success: true,
    data: {
      heatmap: dashData.heatmap || [],
      categoryDistribution: dashData.categoryDistribution || [],
      topApps: dashData.topApps || [],
      history30Days: state.history30Days || []
    }
  });
});

// GET /api/reports/insights (risk score + recommendations + flags)
router.get('/reports/insights', (req, res) => {
  const childId = req.query.childId;
  if (!childId) return res.json({ success: true, data: {} });
  
  const state = sim.getChildState(childId);
  const score = state.insights.score;
  const level = state.insights.level;
  
  const recommendations = [];
  if (score < 80) recommendations.push('Reduce total daily screen time by 30 minutes.');
  if (state.usageStats.heatmap[2]?.Entertainment > 40) recommendations.push('Night-time entertainment usage is elevated. Enable night restriction.');
  recommendations.push('Monitor short-form video consumption trends.');
  if (score < 50) recommendations.push('Consider enabling face presence verification for accountability.');
  
  const flags = [];
  state.notifications.filter(n => n.severity === 'critical' || n.severity === 'warning').slice(0, 5).forEach(n => {
    flags.push(n.message);
  });
  
  res.json({
    success: true,
    data: { score, level, recommendations, flags }
  });
});

// POST /api/demo/toggle — enable or disable demo mode
let demoEnabled = false;
router.post('/demo/toggle', (req, res) => {
  demoEnabled = req.body.enabled ?? !demoEnabled;
  res.json({ success: true, demoEnabled });
});

router.get('/demo/status', (req, res) => {
  res.json({ success: true, demoEnabled });
});

module.exports = router;
