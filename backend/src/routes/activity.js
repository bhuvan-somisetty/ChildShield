const express = require('express');
const router = express.Router();
const { Activity, Child } = require('../db');
const auth = require('../middleware/auth');
const { Op } = require('sequelize');

// GET /api/activity/:childId — Get activities grouped by date (last 30 days)
router.get('/:childId', auth, async (req, res) => {
  try {
    const child = await Child.findOne({ where: { id: req.params.childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const activities = await Activity.findAll({
      where: {
        childId: req.params.childId,
        date: { [Op.gte]: dateStr }
      },
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: 500
    });

    // Group by date
    const grouped = {};
    activities.forEach(a => {
      const d = a.date;
      if (!grouped[d]) grouped[d] = [];
      grouped[d].push(a);
    });

    // Convert to sorted array
    const days = Object.entries(grouped)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, items]) => ({
        date,
        count: items.length,
        activities: items
      }));

    res.json({ success: true, days });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/activity/:childId — Log new activity
router.post('/:childId', async (req, res) => {
  try {
    const { app, title, platform, activityType, category, durationMinutes, riskTag, alerts, time } = req.body;
    const now = new Date();
    const activity = await Activity.create({
      childId: req.params.childId,
      date: now.toISOString().split('T')[0],
      time: time || now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      app: app || 'Unknown',
      title: title || 'Activity session',
      platform: platform || 'Mobile',
      activityType: activityType || 'browse',
      category: category || 'General',
      durationMinutes: durationMinutes || 0,
      riskTag: riskTag || 'low',
      alerts: alerts ? JSON.stringify(alerts) : null
    });
    res.json({ success: true, activity });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/activity/:childId — Clear activity history
router.delete('/:childId', auth, async (req, res) => {
  try {
    await Activity.destroy({ where: { childId: req.params.childId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/activity/:childId/summary — Aggregate stats for reports
router.get('/:childId/summary', auth, async (req, res) => {
  try {
    const child = await Child.findOne({ where: { id: req.params.childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const activities = await Activity.findAll({
      where: {
        childId: req.params.childId,
        date: { [Op.gte]: dateStr }
      }
    });

    // Aggregations
    const totalScreenTimeMinutes = activities.reduce((sum, a) => sum + (a.durationMinutes || 0), 0);
    
    // Top apps
    const appUsage = {};
    activities.forEach(a => {
      appUsage[a.app] = (appUsage[a.app] || 0) + (a.durationMinutes || 0);
    });
    const topApps = Object.entries(appUsage)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, minutes]) => ({ name, minutes }));

    // Category distribution
    const catDist = {};
    activities.forEach(a => {
      catDist[a.category || 'Other'] = (catDist[a.category || 'Other'] || 0) + (a.durationMinutes || 0);
    });
    const categories = Object.entries(catDist)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }));

    // Risk counts
    const highRiskCount = activities.filter(a => a.riskTag === 'high').length;
    const alertCount = activities.filter(a => a.alerts).length;

    // Daily totals (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const dailyTotals = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dailyTotals[d.toISOString().split('T')[0]] = 0;
    }
    activities.forEach(a => {
      if (dailyTotals[a.date] !== undefined) {
        dailyTotals[a.date] += (a.durationMinutes || 0);
      }
    });
    const trend7Days = Object.entries(dailyTotals)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, minutes]) => ({ date, minutes }));

    res.json({
      success: true,
      summary: {
        totalScreenTimeMinutes,
        topApps,
        categories,
        highRiskCount,
        alertCount,
        trend7Days,
        totalActivities: activities.length
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
