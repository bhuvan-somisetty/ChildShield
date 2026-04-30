/**
 * AlphaGuard AI — AI Behavior Engine Route
 * Provides smart insights, weekly reports, behavior pattern analysis,
 * emotional check-ins, focus mode sessions, and smart alerts.
 * Uses the existing Sequelize Activity model.
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Activity, sequelize, isMongo } = require('../db');
const { Op } = require('sequelize');

// ── Helpers ──────────────────────────────────────────────────────────────────
const getRiskLevel = (score) => {
  if (score >= 70) return { level: 'Low Risk', color: '#10b981' };
  if (score >= 40) return { level: 'Medium Risk', color: '#f59e0b' };
  return { level: 'High Risk', color: '#ef4444' };
};

const formatMinutes = (mins) => {
  const m = Math.abs(Math.round(mins));
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return h > 0 ? `${h}h ${rem}m` : `${rem}m`;
};

const getDateFilter = (dateStr) =>
  isMongo ? { $gte: dateStr } : { [Op.gte]: dateStr };

const getBetweenFilter = (from, to) =>
  isMongo ? { $gte: from, $lt: to } : { [Op.gte]: from, [Op.lt]: to };

const nDaysAgoStr = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
};

// ── In-memory store for check-ins and focus sessions (lightweight) ────────────
// In production these would be DB tables; this works without schema changes.
const checkInStore = new Map();    // key: `${childId}:${date}` → { mood, note }
const focusStore   = new Map();    // key: sessionId → session obj
let focusIdCounter = 1;

// ── GET /api/ai/behavior-insights ─────────────────────────────────────────────
router.get('/behavior-insights', auth, async (req, res) => {
  try {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId required' });

    const sevenDaysAgo = nDaysAgoStr(7);
    const activities = await Activity.findAll({
      where: { childId, date: getDateFilter(sevenDaysAgo) },
      order: [['date', 'DESC']]
    });

    const totalMins   = activities.reduce((s, a) => s + (a.durationMinutes || 0), 0);
    const avgDaily    = Math.round(totalMins / 7);
    const uniqueApps  = [...new Set(activities.map(a => a.app).filter(Boolean))];

    // Night sessions: createdAt hour >= 22 or < 6
    const nightSessions = activities.filter(a => {
      const h = new Date(a.createdAt || Date.now()).getHours();
      return h >= 22 || h < 6;
    }).length;

    const riskScore = Math.max(10, Math.min(100,
      85 - (nightSessions * 8) - (avgDaily > 300 ? 20 : 0) - (uniqueApps.length > 8 ? 10 : 0)
    ));
    const { level, color } = getRiskLevel(riskScore);

    // Trend detection
    const half = Math.floor(activities.length / 2);
    const older = activities.slice(half).reduce((s, a) => s + (a.durationMinutes || 0), 0);
    const newer = activities.slice(0, half).reduce((s, a) => s + (a.durationMinutes || 0), 0);
    let trend = 'stable';
    if (half > 0) {
      if (newer > older * 1.25) trend = 'increasing';
      else if (newer < older * 0.75) trend = 'decreasing';
    }

    // AI Insights
    const insights = [];
    if (avgDaily > 240) insights.push({ type: 'warning', text: `Screen time averaging ${formatMinutes(avgDaily)}/day — above the recommended 4h limit.`, icon: 'clock' });
    if (nightSessions > 2) insights.push({ type: 'alert', text: `${nightSessions} late-night sessions detected this week. Consider enabling 10 PM smart lock.`, icon: 'moon' });
    if (uniqueApps.length > 8) insights.push({ type: 'info', text: `High app variety detected (${uniqueApps.length} apps). Review for new or risky installations.`, icon: 'grid' });
    if (trend === 'increasing') insights.push({ type: 'warning', text: 'Screen time is trending upward this week. Early intervention recommended.', icon: 'trending-up' });
    if (insights.length === 0) insights.push({ type: 'good', text: 'Behavior patterns look healthy this week. Keep monitoring!', icon: 'check' });

    res.json({
      success: true,
      data: {
        riskScore, riskLevel: level, riskColor: color, trend,
        avgDailyMinutes: avgDaily, avgDailyFormatted: formatMinutes(avgDaily),
        totalWeekMinutes: totalMins, nightSessions,
        uniqueAppsCount: uniqueApps.length,
        insights,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[AI Insights]', err.message);
    res.status(500).json({ error: 'Failed to generate insights', details: err.message });
  }
});

// ── GET /api/ai/weekly-report ──────────────────────────────────────────────────
router.get('/weekly-report', auth, async (req, res) => {
  try {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId required' });

    const sevenDaysAgo  = nDaysAgoStr(7);
    const fourteenDaysAgo = nDaysAgoStr(14);

    const [thisWeek, lastWeek] = await Promise.all([
      Activity.findAll({ where: { childId, date: getDateFilter(sevenDaysAgo) } }),
      Activity.findAll({ where: { childId, date: getBetweenFilter(fourteenDaysAgo, sevenDaysAgo) } })
    ]);

    const thisTotal = thisWeek.reduce((s, a) => s + (a.durationMinutes || 0), 0);
    const lastTotal = lastWeek.reduce((s, a) => s + (a.durationMinutes || 0), 0);
    const pctChange = lastTotal > 0 ? Math.round(((thisTotal - lastTotal) / lastTotal) * 100) : 0;

    const nightSessions = thisWeek.filter(a => {
      const h = new Date(a.createdAt || Date.now()).getHours();
      return h >= 22 || h < 6;
    }).length;

    // Top apps
    const appMap = {};
    thisWeek.forEach(a => { if (a.app) appMap[a.app] = (appMap[a.app] || 0) + (a.durationMinutes || 0); });
    const topApps = Object.entries(appMap)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([name, mins]) => ({ name, time: formatMinutes(mins), minutes: mins }));

    // Natural language summary
    let summary = `This week, total screen time was ${formatMinutes(thisTotal)}.`;
    if (pctChange > 10) summary += ` Usage increased by ${pctChange}% compared to last week.`;
    else if (pctChange < -10) summary += ` Usage decreased by ${Math.abs(pctChange)}% — great improvement!`;
    else summary += ` Usage is consistent with last week.`;
    if (nightSessions > 0) summary += ` ${nightSessions} late-night session${nightSessions > 1 ? 's' : ''} recorded.`;
    if (topApps[0]) summary += ` Most used app: ${topApps[0].name} (${topApps[0].time}).`;

    res.json({
      success: true,
      data: {
        period: `${sevenDaysAgo} to ${new Date().toISOString().split('T')[0]}`,
        summary, thisWeekTotal: formatMinutes(thisTotal), lastWeekTotal: formatMinutes(lastTotal),
        percentageChange: pctChange, nightSessions, topApps,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[Weekly Report]', err.message);
    res.status(500).json({ error: 'Failed to generate weekly report', details: err.message });
  }
});

// ── POST /api/ai/emotional-checkin ────────────────────────────────────────────
router.post('/emotional-checkin', auth, async (req, res) => {
  try {
    const { childId, mood, note } = req.body;
    if (!childId || !mood) return res.status(400).json({ error: 'childId and mood required' });

    const today = new Date().toISOString().split('T')[0];
    const key   = `${childId}:${today}`;

    // Get existing list or create new
    if (!checkInStore.has(childId)) checkInStore.set(childId, []);
    const list = checkInStore.get(childId);
    const existing = list.findIndex(c => c.date === today);
    const entry = { mood, note: note || null, date: today, createdAt: new Date().toISOString() };

    if (existing >= 0) list[existing] = entry;
    else list.unshift(entry);

    res.json({ success: true, message: 'Check-in saved' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save check-in', details: err.message });
  }
});

// ── GET /api/ai/emotional-checkins ────────────────────────────────────────────
router.get('/emotional-checkins', auth, async (req, res) => {
  try {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId required' });

    const checkins = (checkInStore.get(childId) || []).slice(0, 30);
    const moodCounts = {};
    checkins.forEach(c => { moodCounts[c.mood] = (moodCounts[c.mood] || 0) + 1; });
    const dominantMood = Object.entries(moodCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;

    res.json({ success: true, data: { checkins, dominantMood, total: checkins.length } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch check-ins', details: err.message });
  }
});

// ── POST /api/ai/focus-session ────────────────────────────────────────────────
router.post('/focus-session', auth, async (req, res) => {
  try {
    const { childId, action, durationMinutes, sessionId } = req.body;
    if (!childId || !action) return res.status(400).json({ error: 'childId and action required' });

    if (action === 'start') {
      const id = focusIdCounter++;
      const session = {
        id, childId, durationMinutes: durationMinutes || 25,
        status: 'started', pointsEarned: 0,
        date: new Date().toISOString().split('T')[0],
        startedAt: new Date().toISOString()
      };
      focusStore.set(id, session);
      res.json({ success: true, sessionId: id, message: 'Focus session started!' });

    } else if (action === 'complete') {
      const session = focusStore.get(Number(sessionId));
      if (!session || session.childId !== childId) {
        return res.status(404).json({ error: 'Session not found' });
      }
      const points = Math.round((session.durationMinutes || 25) * 2);
      session.status = 'completed';
      session.pointsEarned = points;
      session.completedAt = new Date().toISOString();
      focusStore.set(Number(sessionId), session);
      res.json({ success: true, pointsEarned: points, message: `Great job! You earned ${points} points! 🏆` });

    } else {
      res.status(400).json({ error: 'action must be start or complete' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Failed to manage focus session', details: err.message });
  }
});

// ── GET /api/ai/focus-stats ───────────────────────────────────────────────────
router.get('/focus-stats', auth, async (req, res) => {
  try {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId required' });

    const sessions = [...focusStore.values()].filter(s => s.childId === childId && s.status === 'completed');
    const totalPoints  = sessions.reduce((s, se) => s + (se.pointsEarned || 0), 0);
    const totalSessions = sessions.length;

    // Calculate streak
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      if (sessions.some(s => s.date === dateStr)) streak++;
      else break;
    }

    let badge = 'Beginner';
    if (totalPoints >= 1000) badge = 'Champion 🏆';
    else if (totalPoints >= 500) badge = 'Expert 🥇';
    else if (totalPoints >= 200) badge = 'Achiever 🥈';
    else if (totalPoints >= 50) badge = 'Starter ⭐';

    res.json({
      success: true,
      data: {
        totalPoints, totalSessions, streak, badge,
        recentSessions: sessions.slice(-5).reverse()
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch focus stats', details: err.message });
  }
});

// ── GET /api/ai/smart-alerts ──────────────────────────────────────────────────
router.get('/smart-alerts', auth, async (req, res) => {
  try {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId required' });

    const sevenDaysAgo = nDaysAgoStr(7);
    const today = new Date().toISOString().split('T')[0];

    const activities = await Activity.findAll({
      where: { childId, date: getDateFilter(sevenDaysAgo) },
      order: [['createdAt', 'DESC']]
    });

    const alerts = [];

    // Late-night usage
    const nightCount = activities.filter(a => {
      const h = new Date(a.createdAt || Date.now()).getHours();
      return h >= 22 || h < 6;
    }).length;
    if (nightCount >= 3) {
      alerts.push({
        id: 'night_usage', type: 'warning',
        title: 'Late-Night Usage Detected',
        message: `${nightCount} sessions recorded after 10 PM this week. Consider enabling the time-based smart lock.`,
        severity: 'medium', icon: 'moon', timestamp: new Date().toISOString()
      });
    }

    // Today's usage spike
    const todayMins = activities
      .filter(a => a.date === today)
      .reduce((s, a) => s + (a.durationMinutes || 0), 0);
    if (todayMins > 300) {
      alerts.push({
        id: 'usage_spike', type: 'alert',
        title: 'Usage Spike Today',
        message: `${formatMinutes(todayMins)} of screen time recorded today — above the 5h threshold.`,
        severity: 'high', icon: 'trending-up', timestamp: new Date().toISOString()
      });
    }

    // High app variety
    const appsToday = [...new Set(activities.filter(a => a.date === today).map(a => a.app).filter(Boolean))];
    if (appsToday.length > 6) {
      alerts.push({
        id: 'new_apps', type: 'info',
        title: 'High App Variety',
        message: `${appsToday.length} different apps used today. Review for any new or risky installations.`,
        severity: 'low', icon: 'grid', timestamp: new Date().toISOString()
      });
    }

    // High-risk content
    const highRisk = activities.filter(a => a.riskTag === 'high').length;
    if (highRisk > 0) {
      alerts.push({
        id: 'high_risk', type: 'alert',
        title: 'High-Risk Content Detected',
        message: `${highRisk} activity session${highRisk > 1 ? 's' : ''} flagged as high-risk this week. Review immediately.`,
        severity: 'high', icon: 'warning', timestamp: new Date().toISOString()
      });
    }

    res.json({ success: true, data: { alerts, count: alerts.length } });
  } catch (err) {
    console.error('[Smart Alerts]', err.message);
    res.status(500).json({ error: 'Failed to fetch alerts', details: err.message });
  }
});

// ── GET /api/ai/wellbeing-score ───────────────────────────────────────────────
router.get('/wellbeing-score', auth, async (req, res) => {
  try {
    const { childId } = req.query;
    if (!childId) return res.status(400).json({ error: 'childId required' });

    const sevenDaysAgo = nDaysAgoStr(7);
    
    // Fetch activities
    const activities = await Activity.findAll({
      where: { childId, date: getDateFilter(sevenDaysAgo) }
    });

    // 1) Screen Time
    const totalMins = activities.reduce((s, a) => s + (a.durationMinutes || 0), 0);
    const avgDaily = Math.round(totalMins / 7);

    // 2) Late-night usage
    const nightSessions = activities.filter(a => {
      const h = new Date(a.createdAt || Date.now()).getHours();
      return h >= 22 || h < 6;
    }).length;

    // 3) App switching frequency (unique apps / total sessions)
    const totalSessionsCount = activities.length || 1;
    const uniqueAppsCount = [...new Set(activities.map(a => a.app).filter(Boolean))].length;
    const appSwitchRatio = uniqueAppsCount / totalSessionsCount;

    // 4) Mood Check-ins
    const checkins = checkInStore.get(childId) || [];
    let moodScore = 50; // base
    if (checkins.length > 0) {
      const positiveMoods = checkins.filter(c => ['great', 'good'].includes(c.mood)).length;
      const negativeMoods = checkins.filter(c => ['down', 'angry'].includes(c.mood)).length;
      if (positiveMoods > negativeMoods) moodScore += 20;
      if (negativeMoods > positiveMoods) moodScore -= 20;
    }

    // 5) Focus mode consistency
    const focusSessions = [...focusStore.values()].filter(s => s.childId === childId && s.status === 'completed');
    const focusScore = Math.min(30, focusSessions.length * 5); // up to 30 pts

    // Calculate Final Wellbeing Score (0-100)
    let score = 100;
    
    // Deductions
    if (avgDaily > 240) score -= 20;
    else if (avgDaily > 180) score -= 10;

    if (nightSessions > 3) score -= 25;
    else if (nightSessions > 1) score -= 10;

    if (appSwitchRatio > 0.8) score -= 10;

    // Additions
    score = score - 50 + moodScore; // Adjust by mood
    score += focusScore;

    // Clamp score 0-100
    score = Math.max(0, Math.min(100, score));

    let label = 'Healthy';
    let color = '#10b981'; // Green
    if (score < 50) { label = 'Risk'; color = '#ef4444'; }
    else if (score < 75) { label = 'Watch'; color = '#f59e0b'; }

    // Insights & Parent Guidance
    const insights = [];
    if (nightSessions > 1) {
      insights.push({
        text: `Late-night usage detected (${nightSessions} sessions).`,
        parentGuidance: 'Set soft limits or enable Night Mode after 10 PM.'
      });
    }
    if (avgDaily > 180) {
      insights.push({
        text: `High screen time: averaging ${formatMinutes(avgDaily)}/day.`,
        parentGuidance: 'Reduce screen time gradually by encouraging offline activities.'
      });
    }
    if (appSwitchRatio > 0.7) {
      insights.push({
        text: `High app-switching frequency observed.`,
        parentGuidance: 'Encourage 25-minute Focus Sessions to improve attention span.'
      });
    }
    
    if (insights.length === 0) {
      insights.push({
        text: 'Healthy digital habits maintained.',
        parentGuidance: 'Acknowledge their good habits with positive feedback.'
      });
    }

    res.json({
      success: true,
      data: { score, label, color, insights }
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to calculate wellbeing', details: err.message });
  }
});

// ── POST /api/ai/chat ─────────────────────────────────────────────────────────
router.post('/chat', async (req, res) => {
  try {
    const { message, role } = req.body; // role: 'parent' | 'child'
    if (!message) return res.status(400).json({ error: 'Message required' });

    const msgLower = message.toLowerCase();

    // 1) Safety / Sensitive check first
    const sensitiveWords = ['suicide', 'depressed', 'kill', 'hurt', 'abuse', 'self harm'];
    const isSensitive = sensitiveWords.some(w => msgLower.includes(w));
    
    if (isSensitive) {
      return res.json({
        success: true,
        reply: "It sounds like you might be going through a tough time. Please talk to a trusted adult or professional immediately. You are not alone."
      });
    }

    // 2) AI Logic Mock (Acting like ChatGPT)
    let reply = "";
    
    // Check if it's app/relevant data
    if (role === 'child') {
      if (msgLower.includes('study') || msgLower.includes('focus')) {
        reply = "Try the Pomodoro technique! Work for 25 minutes, then take a 5-minute break. Use the 'Focus Mode' tab in this app to get started. You've got this!";
      } else if (msgLower.includes('stressed') || msgLower.includes('anxious') || msgLower.includes('tired')) {
        reply = "Taking breaks is so important. Try putting down your screen, taking 5 deep breaths, or doing our guided Stress Check under Health Scan.";
      } else if (msgLower.includes('sleep') || msgLower.includes('bed')) {
        reply = "Screens emit blue light that makes it hard to sleep. Try turning off your device 30 minutes before bed and reading a book instead!";
      } else if (msgLower.includes('limit') || msgLower.includes('screen time')) {
        reply = "Your screen time limits are set by your parents to help you build healthy habits. If you need more time for homework, you can request an extension!";
      }
    } else {
      // Parent role
      if (msgLower.includes('screen time') || msgLower.includes('too much')) {
        reply = "If you're concerned about screen time, try setting a realistic Daily Limit in the Controls tab. Gradual reductions work better than sudden lockouts.";
      } else if (msgLower.includes('late') || msgLower.includes('night')) {
        reply = "Late-night usage disrupts sleep patterns. I suggest enabling the 'Night Restriction' toggle to automatically pause non-essential apps after 9 PM.";
      } else if (msgLower.includes('focus') || msgLower.includes('distracted')) {
        reply = "Encourage your child to use the Focus Mode feature. It rewards them with points for staying off distractions during homework time.";
      } else if (msgLower.includes('talk') || msgLower.includes('communicate')) {
        reply = "Start by reviewing the AI Insights together. Use the 'Quick Reactions' dashboard to send them a 'Thumbs up' or 'Love you' to keep it positive!";
      }
    }

    // General Knowledge / ChatGPT-like fallback
    if (!reply) {
      if (msgLower.includes('hello') || msgLower.includes('hi ') || msgLower === 'hi') {
        reply = "Hello! I am AlphaGuard AI. How can I assist you today?";
      } else if (msgLower.includes('parenting') && msgLower.includes('advice')) {
        reply = "Parenting can be challenging! Consistency, open communication, and setting clear boundaries are key. Always ensure your child feels heard and understood, even when enforcing rules.";
      } else if (msgLower.includes('behavior') || msgLower.includes('tantrum')) {
        reply = "Child behavior is often a form of communication. When they act out, they might be tired, hungry, or overwhelmed. Stay calm, validate their feelings, and guide them to a better way to express themselves.";
      } else if (msgLower.match(/what is (.*)/)) {
        const topic = msgLower.match(/what is (.*)/)[1].replace('?', '');
        reply = `That's a great question. ${topic.charAt(0).toUpperCase() + topic.slice(1)} is a broad topic, but generally it refers to the concepts and principles associated with that subject. Is there a specific aspect of it you'd like me to explain?`;
      } else if (msgLower.match(/how to (.*)/)) {
        const task = msgLower.match(/how to (.*)/)[1].replace('?', '');
        reply = `To ${task}, you should start by breaking it down into smaller, manageable steps. First, gather any necessary information or materials. Then, approach it methodically. Do you need a step-by-step guide for this?`;
      } else if (msgLower.match(/why (.*)/)) {
        reply = "There are many reasons for that. Usually, it's a combination of underlying factors and environmental triggers. It's fascinating how these things work together!";
      } else if (msgLower.includes('math') || msgLower.includes('+') || msgLower.includes('-') || msgLower.includes('*') || msgLower.includes('/')) {
        // Basic math evaluator attempt
        try {
          const expression = message.replace(/[^0-9+\-*/().]/g, '');
          if (expression && expression.length > 2) {
            const result = eval(expression);
            reply = `The answer to your math question is ${result}.`;
          } else {
            reply = "I can help with math! Just provide the equation you want me to solve.";
          }
        } catch {
          reply = "I'm a bit confused by that math expression. Could you write it out clearly with numbers and operators (+, -, *, /)?";
        }
      } else if (msgLower.includes('study') || msgLower.includes('homework')) {
        reply = "For effective studying, try the Pomodoro technique: 25 minutes of focused work followed by a 5-minute break. Also, explaining concepts out loud as if teaching someone else is a proven way to retain information.";
      } else if (msgLower.includes('explain')) {
        reply = "I can certainly explain that! To put it simply, it involves understanding the core principles and how they interact. Think of it like building blocks forming a complete structure.";
      } else if (msgLower.includes('joke')) {
        reply = "Why don't scientists trust atoms? Because they make up everything!";
      } else if (msgLower.includes('who are you') || msgLower.includes('what are you')) {
        reply = "I am AlphaGuard AI, an advanced virtual assistant designed to help with digital wellbeing, answer your questions, and provide helpful insights.";
      } else {
        // Ultimate generic ChatGPT-like fallback
        const responses = [
          "That's an interesting thought! Tell me more about what you're looking for.",
          "I can certainly help you with that. Could you provide a little more detail?",
          "That is a great question. There are several ways to approach it depending on your specific needs.",
          "I understand. What specific aspect of that would you like to explore further?",
          "I'm here to help! To give you the best answer, could you clarify your question a bit?",
          "Many people wonder about that. It generally depends on the context and what you're trying to achieve."
        ];
        reply = responses[Math.floor(Math.random() * responses.length)];
      }
    }

    // Add disclaimer only for health/app-related strict questions if needed, but the prompt says avoid generic replies.
    // Removed disclaimer to act more naturally.

    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ error: 'Chat failed', details: err.message });
  }
});

module.exports = router;
