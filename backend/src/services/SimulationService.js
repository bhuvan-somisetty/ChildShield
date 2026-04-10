const { v4: uuidv4 } = require('uuid');

const APP_METADATA = {
  'YouTube': { color: '#ff0000', icon: 'Youtube', category: 'Entertainment', type: 'watch' },
  'Roblox': { color: '#00d8ff', icon: 'Gamepad2', category: 'Gaming', type: 'play' },
  'WhatsApp': { color: '#25D366', icon: 'MessageCircle', category: 'Social', type: 'chat' },
  'Instagram': { color: '#e1306c', icon: 'Instagram', category: 'Social', type: 'browse' },
  'Khan Academy': { color: '#00a651', icon: 'BookOpen', category: 'Education', type: 'watch' },
  'TikTok': { color: '#000000', icon: 'Music', category: 'Entertainment', type: 'watch' },
  'Chrome': { color: '#4285F4', icon: 'Globe', category: 'Search', type: 'search' },
  'Netflix': { color: '#E50914', icon: 'Film', category: 'Entertainment', type: 'watch' },
  'Duolingo': { color: '#58CC02', icon: 'Languages', category: 'Education', type: 'play' },
  'Minecraft': { color: '#62B47A', icon: 'Gamepad2', category: 'Gaming', type: 'play' }
};

const VIDEO_TITLES = {
  'YouTube': ['Minecraft Let\'s Play Ep 45', 'How to Build a Robot', 'Scary Pranks Compilation', 'Science Experiments at Home', 'Funny Cat Videos', 'Fortnite Best Moments', 'Math Tutorial - Algebra', 'Drawing Tutorial for Kids'],
  'TikTok': ['Dance Challenge #viral', 'Life Hacks You Need', 'Comedy Skit', 'Pet Videos Compilation'],
  'Netflix': ['Stranger Things S4', 'One Piece Ep 12', 'Avatar: The Last Airbender'],
  'Roblox': ['Adopt Me Trading', 'Tower Defense Simulator', 'Blox Fruits', 'Brookhaven RP'],
  'Minecraft': ['Survival Mode Day 1', 'Building a Castle', 'Redstone Tutorial'],
  'Khan Academy': ['Algebra Basics', 'World History: Ancient Egypt', 'Biology: Cell Structure'],
  'Duolingo': ['Spanish Lesson 15', 'French Basics', 'Japanese Hiragana'],
  'Instagram': ['Browsing Feed', 'Watching Reels', 'Messaging'],
  'WhatsApp': ['Group Chat: School Friends', 'Video Call', 'Messaging'],
  'Chrome': ['Homework Research', 'Google Search', 'Wikipedia Reading']
};

const SEARCH_TERMS = [
  'how to solve calculus', 'best minecraft mods 2024', 'funny cat videos',
  'mars rover moon landing real', 'can I make a bomb at home', 'why is the sky blue',
  'how to bypass parental controls', 'cool math games', 'science project ideas',
  'how to draw anime', 'python coding tutorial', 'scary stories for kids'
];

function formatTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

class SimulationService {
  constructor() {
    this.state = {}; // childId -> data
    this.ActivityModel = null;
    this.FaceEventModel = null;
  }

  setModels(models) {
    this.ActivityModel = models.Activity;
    this.FaceEventModel = models.FaceEvent;
  }


  getChildState(childId) {
    if (!this.state[childId]) {
      this.state[childId] = {
        today: new Date().toISOString().split('T')[0],
        usageStats: {
          todayScreenTimeMinutes: 252,
          appUsage: {
            'YouTube': 90,
            'Roblox': 72,
            'WhatsApp': 45,
            'Khan Academy': 35,
            'Instagram': 10
          },
          searchHistory: [
            { query: 'funny cat videos', time: new Date().toISOString(), risk: 'low' },
            { query: 'best minecraft mods 2024', time: new Date(Date.now() - 3600000).toISOString(), risk: 'low' }
          ],
          heatmap: [
            { time: 'Morning', Education: 45, Entertainment: 20, Gaming: 10, Social: 5 },
            { time: 'Afternoon', Education: 15, Entertainment: 50, Gaming: 35, Social: 20 },
            { time: 'Evening', Education: 5, Entertainment: 60, Gaming: 45, Social: 30 },
            { time: 'Night', Education: 0, Entertainment: 25, Gaming: 15, Social: 10 }
          ]
        },

        watchHistory: [
          { id: uuidv4(), app: 'YouTube', title: 'Minecraft Let\'s Play Ep 45', category: 'Gaming', startTime: '8:45 PM', duration: '25m', risk: 'low' },
          { id: uuidv4(), app: 'YouTube', title: 'Scary Pranks Compilation', category: 'Entertainment', startTime: '9:15 PM', duration: '15m', risk: 'high', alerts: ['Late night', 'Age-restricted'] },
          { id: uuidv4(), app: 'Roblox', title: 'Blox Fruits', category: 'Gaming', startTime: '7:30 PM', duration: '40m', risk: 'low' },
          { id: uuidv4(), app: 'Khan Academy', title: 'Algebra Basics', category: 'Education', startTime: '4:00 PM', duration: '20m', risk: 'low' },
          { id: uuidv4(), app: 'WhatsApp', title: 'Group Chat: School Friends', category: 'Social', startTime: '3:30 PM', duration: '15m', risk: 'low' },
          { id: uuidv4(), app: 'Chrome', title: 'Searched: science project ideas', category: 'Search', startTime: '2:00 PM', duration: '10m', risk: 'low' }
        ],
        insights: { score: 65, level: 'Medium Risk' },
        liveFeed: [],
        notifications: [],
        history30Days: [],
        unauthorizedAccessCount: 0
      };
      this.generateMockHistory(childId);
    }
    return this.state[childId];
  }

  generateMockHistory(childId) {
    const data = this.state[childId];
    const now = new Date();
    for (let i = 1; i <= 30; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      data.history30Days.push({
        date: dateStr,
        totalTime: Math.floor(Math.random() * 300 + 60),
        apps: {
          'YouTube': Math.floor(Math.random() * 100),
          'WhatsApp': Math.floor(Math.random() * 60),
          'Roblox': Math.floor(Math.random() * 80),
          'Khan Academy': Math.floor(Math.random() * 40),
          'Instagram': Math.floor(Math.random() * 30)
        }
      });
    }
  }

  triggerAlert(childId, message, severity) {
    const data = this.getChildState(childId);
    data.notifications.unshift({
      id: uuidv4(),
      message,
      severity,
      time: new Date().toISOString(),
      read: false
    });
    if (data.notifications.length > 20) data.notifications.pop();
  }

  addFeedItem(childId, message, appKey) {
    const data = this.getChildState(childId);
    data.liveFeed.unshift({
      id: uuidv4(),
      message,
      app: appKey,
      time: new Date().toISOString()
    });
    if (data.liveFeed.length > 15) data.liveFeed.pop();
  }

  tick(childId, isDemoMode) {
    const data = this.getChildState(childId);
    const today = new Date().toISOString().split('T')[0];

    // Reset for new day
    if (data.today !== today) {
      data.history30Days.unshift({
        date: data.today,
        totalTime: data.usageStats.todayScreenTimeMinutes,
        apps: { ...data.usageStats.appUsage }
      });
      if (data.history30Days.length > 30) data.history30Days.pop();

      data.today = today;
      data.usageStats.todayScreenTimeMinutes = 0;
      data.usageStats.appUsage = {};
      data.usageStats.searchHistory = [];
      data.liveFeed = [];
    }

    const timeDelta = isDemoMode ? Math.random() * 5 + 1 : 0.1;
    data.usageStats.todayScreenTimeMinutes += timeDelta;

    // Simulate app usage
    const appKeys = Object.keys(APP_METADATA);
    const activeApp = appKeys[Math.floor(Math.random() * appKeys.length)];
    data.usageStats.appUsage[activeApp] = (data.usageStats.appUsage[activeApp] || 0) + timeDelta;

    // Update heatmap
    const hour = new Date().getHours();
    const period = hour < 12 ? 0 : hour < 17 ? 1 : hour < 21 ? 2 : 3;
    const cat = APP_METADATA[activeApp]?.category || 'Other';
    if (data.usageStats.heatmap[period]) {
      data.usageStats.heatmap[period][cat] = (data.usageStats.heatmap[period][cat] || 0) + timeDelta;
    }

    // ADD TO WATCH HISTORY (Periodic sync)
    if (Math.random() > 0.7) {
      const titles = VIDEO_TITLES[activeApp] || [`Using ${activeApp}`];
      const title = titles[Math.floor(Math.random() * titles.length)];
      const isHighRisk = activeApp === 'YouTube' && (title.includes('Scary') || title.includes('Prank'));
      const dur = Math.floor(Math.random() * 30 + 5);
      
      const activityData = {
        id: uuidv4(),
        app: activeApp,
        title,
        category: APP_METADATA[activeApp]?.category || 'Activity',
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: `${dur}m`,
        risk: isHighRisk ? 'high' : 'low',
        activityType: APP_METADATA[activeApp]?.type || 'browse',
        durationMinutes: dur
      };

      data.watchHistory.unshift(activityData);
      if (data.watchHistory.length > 50) data.watchHistory.pop();

      // Persist to DB if models are ready
      if (this.ActivityModel) {
        this.ActivityModel.create({
          childId,
          date: today,
          time: activityData.startTime,
          app: activityData.app,
          title: activityData.title,
          category: activityData.category,
          activityType: activityData.activityType,
          durationMinutes: activityData.durationMinutes,
          riskTag: activityData.risk
        }).catch(err => console.error('Sim log error:', err.message));
      }
    }


    // Simulate search events
    if (isDemoMode && Math.random() > 0.85) {
      const query = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
      const risk = (query.includes('bomb') || query.includes('bypass')) ? 'high' : 'low';
      data.usageStats.searchHistory.unshift({ query, time: new Date().toISOString(), risk });

      data.watchHistory.unshift({
        id: uuidv4(),
        app: 'Chrome',
        title: `Searched: ${query}`,
        category: 'Search',
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: '1m',
        risk: risk,
        activityType: 'search',
        durationMinutes: 1
      });

      if (risk === 'high') {
        this.triggerAlert(childId, `Risky search detected: "${query}"`, 'critical');
      }
      this.addFeedItem(childId, `Searched for: ${query}`, 'Chrome');
    }

    // Periodic alerts in demo mode
    if (isDemoMode && Math.random() > 0.92) {
      const alertMsgs = [
        { msg: 'Extended gaming session detected (>1hr)', sev: 'warning' },
        { msg: 'Child attempted to access restricted content', sev: 'critical' },
        { msg: 'Screen time approaching daily limit', sev: 'warning' },
        { msg: 'New app installed: Unknown Game', sev: 'info' },
        { msg: 'Late night usage detected after 10PM', sev: 'warning' }
      ];
      const alert = alertMsgs[Math.floor(Math.random() * alertMsgs.length)];
      this.triggerAlert(childId, alert.msg, alert.sev);
    }

    // Update risk score based on activity patterns
    const highSearches = data.usageStats.searchHistory.filter(s => s.risk === 'high').length;
    const totalTime = data.usageStats.todayScreenTimeMinutes;
    let score = 85;
    if (highSearches > 0) score -= highSearches * 10;
    if (totalTime > 300) score -= 15;
    if (totalTime > 180) score -= 5;
    score = Math.max(15, Math.min(95, score));
    data.insights.score = score;
    data.insights.level = score > 70 ? 'Low Risk' : score > 40 ? 'Medium Risk' : 'High Risk';

    // Live Feed
    if (Math.random() > (isDemoMode ? 0.4 : 0.9)) {
      const actions = ['Browsing content', 'Playing game', 'Messaging friend', 'Watching video', 'Doing homework', 'Listening to music'];
      this.addFeedItem(childId, actions[Math.floor(Math.random() * actions.length)], activeApp);
    }
  }

  // Generate Activity DB records in demo mode
  async generateDemoActivities(childId, ActivityModel) {
    const appKeys = Object.keys(APP_METADATA);
    const now = new Date();
    const activities = [];

    // Generate activities for last 30 days
    for (let day = 0; day < 30; day++) {
      const date = new Date();
      date.setDate(now.getDate() - day);
      const dateStr = date.toISOString().split('T')[0];
      
      // 5-15 activities per day
      const count = Math.floor(Math.random() * 11) + 5;
      for (let i = 0; i < count; i++) {
        const app = appKeys[Math.floor(Math.random() * appKeys.length)];
        const meta = APP_METADATA[app];
        const titles = VIDEO_TITLES[app] || [`Using ${app}`];
        const title = titles[Math.floor(Math.random() * titles.length)];
        const dur = Math.floor(Math.random() * 45) + 5;
        const hour = Math.floor(Math.random() * 14) + 8; // 8am-10pm
        const min = Math.floor(Math.random() * 60);
        const isHighRisk = app === 'Chrome' && Math.random() > 0.85;

        activities.push({
          childId,
          date: dateStr,
          time: `${hour > 12 ? hour - 12 : hour}:${min.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`,
          app,
          title,
          platform: 'Mobile',
          activityType: meta?.type || 'browse',
          category: meta?.category || 'General',
          durationMinutes: dur,
          riskTag: isHighRisk ? 'high' : Math.random() > 0.8 ? 'medium' : 'low',
          alerts: isHighRisk ? JSON.stringify(['Potential risk content']) : null
        });
      }
    }

    // Bulk create with cleanup (Step 11/12)
    try {
      await ActivityModel.destroy({ where: { childId } });
      await ActivityModel.bulkCreate(activities);
      
      // Also reset in-memory trend history for consistency
      if (this.state[childId]) {
        this.state[childId].history30Days = [];
      }
      
      return activities.length;
    } catch (err) {

      console.error('Demo activity generation error:', err.message);
      return 0;
    }
  }

  getDashboardData(childId) {
    const data = this.getChildState(childId);

    const topApps = Object.entries(data.usageStats.appUsage)
      .map(([name, minutes]) => ({
        name,
        time: formatTime(minutes),
        minutes: minutes,
        color: APP_METADATA[name]?.color || '#64748b',
        icon: APP_METADATA[name]?.icon || 'Activity'
      }))
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5);

    // Build category distribution from app usage
    const catMap = {};
    Object.entries(data.usageStats.appUsage).forEach(([app, minutes]) => {
      const cat = APP_METADATA[app]?.category || 'Other';
      catMap[cat] = (catMap[cat] || 0) + minutes;
    });
    const categoryDistribution = Object.entries(catMap)
      .map(([name, value]) => ({ 
        name, 
        value: Math.round(value),
        color: Object.values(APP_METADATA).find(m => m.category === name)?.color || '#64748b'
      }))
      .sort((a, b) => b.value - a.value);

    // Build weekly trend
    const weeklyTrend = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const hist = data.history30Days.find(h => h.date === dateStr);
      weeklyTrend.push({
        day: d.toLocaleDateString('en-US', { weekday: 'short' }),
        time: hist ? hist.totalTime : i === 0 ? Math.round(data.usageStats.todayScreenTimeMinutes) : 0
      });
    }

    return {
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      todayScreenTime: formatTime(data.usageStats.todayScreenTimeMinutes),
      todayScreenTimeMinutes: Math.round(data.usageStats.todayScreenTimeMinutes),
      topApps,
      categoryDistribution,
      weeklyTrend,
      heatmap: data.usageStats.heatmap,

      searchHistory: data.usageStats.searchHistory.slice(0, 10),
      liveFeed: data.liveFeed.slice(0, 8),
      insights: data.insights,
      notifications: data.notifications.slice(0, 5),
      unauthorizedAccessCount: data.unauthorizedAccessCount || 0
    };
  }

  getReportData(childId) {
    const data = this.getChildState(childId);
    const dashData = this.getDashboardData(childId);
    
    const totalScreenTimeMinutes = data.usageStats.todayScreenTimeMinutes;
    const topApps = dashData.topApps;
    const categories = dashData.categoryDistribution;
    const mostWatchedCategory = categories.length > 0 ? categories[0].name : 'None';
    
    // Alert & unauthorized counts
    const criticalAlerts = data.notifications.filter(n => n.severity === 'critical' || n.severity === 'warning').length;
    const unauthorizedCount = data.unauthorizedAccessCount || 0;
    
    // 7-day trend (Today + last 6 days)
    const trend7Days = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const history = data.history30Days.find(h => h.date === dateStr);
      trend7Days.push({
        date: dateStr,
        minutes: history ? history.totalTime : i === 0 ? Math.round(totalScreenTimeMinutes) : 0
      });
    }

    // 30-day summary calculations
    const last30 = data.history30Days;
    const totalLast30 = last30.reduce((s, h) => s + h.totalTime, 0) + Math.round(totalScreenTimeMinutes);
    const avgDaily = last30.length > 0 ? Math.round(totalLast30 / (last30.length + 1)) : Math.round(totalScreenTimeMinutes);

    return {
      totalScreenTime: formatTime(totalScreenTimeMinutes),
      totalScreenTimeMinutes: Math.round(totalScreenTimeMinutes),
      riskScore: data.insights.score,
      riskLevel: data.insights.level,
      topApps,
      mostWatchedCategory,
      alertCount: criticalAlerts,
      unauthorizedAccessCount: unauthorizedCount,
      trend7Days,
      last30DaysSummary: {
        totalMinutes: totalLast30,
        totalFormatted: formatTime(totalLast30),
        averageDailyMinutes: avgDaily,
        averageDailyFormatted: formatTime(avgDaily),
        totalDays: last30.length + 1
      },
      categories,
      recommendations: this.getRecommendations(data),
      flags: data.notifications
        .filter(n => n.severity === 'critical' || n.severity === 'warning')
        .slice(0, 5)
        .map(n => n.message)
    };
  }


  getRecommendations(data) {
    const recs = [];
    const score = data.insights.score;
    const totalTime = data.usageStats.todayScreenTimeMinutes;

    if (totalTime > 300) recs.push('Daily screen time exceeds 5 hours. Consider reducing by 30 minutes.');
    if (totalTime > 180) recs.push('Screen time is elevated. Schedule screen-free activities.');
    
    const gaming = (data.usageStats.appUsage['Roblox'] || 0) + (data.usageStats.appUsage['Minecraft'] || 0);
    if (gaming > 60) recs.push('Gaming time exceeds 1 hour today. Enable gaming time limits.');
    
    const education = (data.usageStats.appUsage['Khan Academy'] || 0) + (data.usageStats.appUsage['Duolingo'] || 0);
    if (education < 15) recs.push('Educational app usage is low. Encourage learning activities.');
    
    if (score < 50) recs.push('Risk score is critically low. Review activity logs immediately.');
    if (score < 80) recs.push('Enable Face Guard for enhanced monitoring.');
    
    const highRiskSearches = data.usageStats.searchHistory.filter(s => s.risk === 'high').length;
    if (highRiskSearches > 0) recs.push('Risky search terms detected. Review and discuss with your child.');
    
    recs.push('Keep the lines of communication open about online safety.');
    
    return recs.slice(0, 5);
  }
}

const simulationInstance = new SimulationService();
module.exports = simulationInstance;
