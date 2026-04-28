const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const sim = require('../services/SimulationService');
const { Child, Activity, FaceEvent } = require('../db');

sim.setModels({ Activity, FaceEvent });
router.use(auth);

const getRealDashboardData = async (childId, isDemoMode) => {
  const child = await Child.findByPk(childId);
  await sim.tick(childId, isDemoMode); // keep simulating if needed
  
  const simMem = sim.getChildState(childId); // fallback for feed/alerts

  const activities = await Activity.findAll({ where: { childId } });
  
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const todayActs = activities.filter(a => a.date === dateStr);
  const todayScreenTimeMinutes = todayActs.reduce((sum, a) => sum + (a.durationMinutes || 0), 0) + simMem.usageStats.todayScreenTimeMinutes;

  const weeklyTrendMap = {};
  for (let i = 6; i >= 0; i--) {
     const d = new Date(now);
     d.setDate(d.getDate() - i);
     weeklyTrendMap[d.toISOString().split('T')[0]] = { day: d.toLocaleDateString('en-US', { weekday: 'short' }), time: 0 };
  }
  activities.forEach(a => {
     if (weeklyTrendMap[a.date]) {
       weeklyTrendMap[a.date].time += (a.durationMinutes || 0);
     }
  });
  if (isDemoMode) {
    simMem.history30Days.forEach(h => {
       if (weeklyTrendMap[h.date]) weeklyTrendMap[h.date].time += h.totalTime;
    });
  }
  const weeklyTrend = Object.values(weeklyTrendMap);

  const appUsage = {};
  activities.forEach(a => { appUsage[a.app || 'Unknown'] = (appUsage[a.app || 'Unknown'] || 0) + (a.durationMinutes || 0); });
  if (isDemoMode) {
     Object.entries(simMem.usageStats.appUsage).forEach(([app, min]) => {
         appUsage[app] = (appUsage[app] || 0) + min;
     });
  }
  const topApps = Object.entries(appUsage).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, minutes]) => {
     return { name, time: `${Math.floor(minutes/60)}h ${Math.floor(minutes%60)}m`, minutes, color: '#00f0ff', icon: 'Smartphone' };
  });

  const catMap = {};
  activities.forEach(a => { 
    const cat = a.category || 'Other';
    catMap[cat] = (catMap[cat] || 0) + (a.durationMinutes || 0); 
  });
  if (isDemoMode) {
     Object.entries(simMem.usageStats.appUsage).forEach(([app, min]) => {
        let cat = 'Other';
        if (app==='YouTube'||app==='TikTok'||app==='Netflix') cat = 'Entertainment';
        if (app==='Roblox'||app==='Minecraft') cat = 'Gaming';
        if (app==='WhatsApp'||app==='Instagram') cat = 'Social';
        if (app==='Khan Academy'||app==='Duolingo') cat = 'Education';
        catMap[cat] = (catMap[cat] || 0) + min;
     });
  }
  const categoryDistribution = Object.entries(catMap).map(([name, value]) => {
    let color = '#64748b';
    if(name==='Gaming') color='#00f0ff';
    else if(name==='Entertainment') color='#b026ff';
    else if(name==='Social') color='#ef4444';
    else if(name==='Education') color='#10b981';
    return { name, value: Math.round(value), color };
  });

  // Removed heatmap to simplify data layer as requested

  return {
    todayScreenTime: `${Math.floor(todayScreenTimeMinutes/60)}h ${Math.floor(todayScreenTimeMinutes%60)}m`,
    todayScreenTimeMinutes: Math.round(todayScreenTimeMinutes),
    topApps, categoryDistribution, weeklyTrend: []
  };
};

router.get('/dashboard', async (req, res) => {
  const childId = req.query.childId;
  if(!childId) return res.status(400).json({ error: 'childId required' });
  const isDemoMode = req.query.demo === 'true';

  try {
    try {
      const count = await Activity.count({ where: { childId } });
      if (count === 0 && isDemoMode) {
        await sim.generateDemoActivities(childId, Activity);
      }
    } catch(err) { console.error('Auto-demo err:', err.message); }

    const child = await Child.findOne({ where: { id: childId, parentId: req.user.id }});
    if (!child) return res.status(404).json({ error: 'Child not found or unauthorized' });

    const dashData = await getRealDashboardData(childId, isDemoMode);
    dashData.childName = child.name;
    dashData.parentName = req.user.fullName || 'Parent';
    dashData.limit = `${child.dailyLimitHours}h 00m`;
    dashData.limitMinutes = child.dailyLimitHours * 60;
    dashData.isPaired = child.isPaired;

    if (child && child.timerEndTime) {
      dashData.timerEndTime = child.timerEndTime;
      dashData.timerDurationMinutes = child.timerDurationMinutes;
    }

    res.json({ success: true, data: dashData });
  } catch (err) {
    console.error('[dashboard]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', async (req, res) => {
  try {
    const childId = req.query.childId;
    const child = await Child.findOne({ where: { id: childId, parentId: req.user.id }});
    if(!child) return res.json({ success: true, data: [] });

    const acts = await Activity.findAll({ where: { childId }, order: [['createdAt', 'DESC']], limit: 50 });

    let data = acts.map(a => ({
      id: a.id, app: a.app, title: a.title, category: a.category,
      startTime: a.time, duration: `${a.durationMinutes}m`, risk: a.riskTag,
      alerts: (() => {
        try { return a.alerts ? JSON.parse(a.alerts) : []; }
        catch { return []; }
      })()
    }));

    if(req.query.category) {
      data = data.filter(item => item.category?.toLowerCase() === req.query.category.toLowerCase());
    }

    res.json({ success: true, data });
  } catch(err) {
    console.error('[history]', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get('/insights', async (req, res) => {
  const childId = req.query.childId;
  if (!childId) return res.json({ success: true, data: [] });
  const child = await Child.findOne({ where: { id: childId, parentId: req.user.id }});
  if (!child) return res.status(404).json({ error: 'Child not found or unauthorized' });

  res.json({ success: true, data: sim.getChildState(childId).insights });
});

router.get('/notifications', async (req, res) => {
  const childId = req.query.childId;
  if (!childId) return res.json({ success: true, data: [] });
  const child = await Child.findOne({ where: { id: childId, parentId: req.user.id }});
  if (!child) return res.status(404).json({ error: 'Child not found or unauthorized' });

  res.json({ success: true, data: sim.getChildState(childId).notifications });
});

router.get('/analytics', async (req, res) => {
  const childId = req.query.childId;
  if (!childId) return res.json({ success: true, data: {} });
  
  const child = await Child.findOne({ where: { id: childId, parentId: req.user.id }});
  if (!child) return res.status(404).json({ error: 'Child not found or unauthorized' });

  const isDemoMode = req.query.demo === 'true';
  const dashData = await getRealDashboardData(childId, isDemoMode);
  
  res.json({
    success: true,
    isDemoData: isDemoMode,
    data: {
      heatmap: dashData.heatmap || [],
      categoryDistribution: dashData.categoryDistribution || [],
      topApps: dashData.topApps || [],
      history30Days: []
    }
  });
});

router.get('/reports/insights', async (req, res) => {
  const child = await Child.findOne({ where: { id: req.query.childId, parentId: req.user.id }});
  if (!child) return res.status(404).json({ error: 'Child not found or unauthorized' });
  res.json({ success: true, data: sim.getReportData(req.query.childId) });
});

router.get('/reports/full', async (req, res) => {
  const child = await Child.findOne({ where: { id: req.query.childId, parentId: req.user.id }});
  if (!child) return res.status(404).json({ error: 'Child not found or unauthorized' });

  const reportData = sim.getReportData(req.query.childId);
  try {
    const faceEventCount = await FaceEvent.count({ where: { childId: req.query.childId } });
    reportData.unauthorizedAccessCount = faceEventCount;
  } catch(err) {}
  res.json({ success: true, data: reportData });
});

let demoEnabled = false;

router.post('/demo/toggle', async (req, res) => {
  demoEnabled = req.body.enabled ?? !demoEnabled;
  if (demoEnabled && req.body.childId) {
    const count = await sim.generateDemoActivities(req.body.childId, Activity);
    return res.json({ success: true, demoEnabled, activitiesGenerated: count });
  }
  res.json({ success: true, demoEnabled });
});

router.get('/demo/status', (req, res) => {
  res.json({ success: true, demoEnabled });
});

module.exports = router;
