const { v4: uuidv4 } = require('uuid');

const APP_METADATA = {
  'YouTube': { color: '#ff0000', icon: 'Youtube', category: 'Entertainment' },
  'Roblox': { color: '#00d8ff', icon: 'Gamepad2', category: 'Gaming' },
  'WhatsApp': { color: '#25D366', icon: 'MessageCircle', category: 'Social' },
  'Instagram': { color: '#e1306c', icon: 'Instagram', category: 'Social' },
  'Khan Academy': { color: '#00a651', icon: 'BookOpen', category: 'Education' },
  'TikTok': { color: '#000000', icon: 'Music', category: 'Entertainment' },
  'Chrome': { color: '#4285F4', icon: 'Globe', category: 'Search' }
};

const SEARCH_TERMS = [
  'how to solve calculus', 'best minecraft mods 2024', 'funny cat videos', 
  'mars rover moon landing real', 'can I make a bomb at home', 'why is the sky blue',
  'how to bypass parental controls', 'cool math games'
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
          ]
        },
        watchHistory: [
          { id: uuidv4(), app: 'YouTube', title: 'Minecraft Let\'s Play Ep 45', category: 'Gaming', startTime: '8:45 PM', duration: '25m', risk: 'low' },
          { id: uuidv4(), app: 'YouTube', title: 'Scary Pranks Compilation', category: 'Entertainment', startTime: '9:15 PM', duration: '15m', risk: 'high', alerts: ['Late night', 'Age-restricted'] }
        ],
        insights: { score: 65, level: 'Medium Risk' },
        liveFeed: [],
        notifications: [],
        history30Days: [] 
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
          'WhatsApp': Math.floor(Math.random() * 60)
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

    // ADD TO WATCH HISTORY (Periodic sync)
    if (Math.random() > 0.7) {
      data.watchHistory.unshift({
        id: uuidv4(),
        app: activeApp,
        title: activeApp === 'YouTube' ? 'New Video' : `Using ${activeApp}`,
        category: APP_METADATA[activeApp]?.category || 'Activity',
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: Math.floor(Math.random() * 20 + 5) + 'm',
        risk: 'low'
      });
      if (data.watchHistory.length > 30) data.watchHistory.pop();
    }

    // Simulate search events
    if (isDemoMode && Math.random() > 0.85) {
      const query = SEARCH_TERMS[Math.floor(Math.random() * SEARCH_TERMS.length)];
      const risk = (query.includes('bomb') || query.includes('bypass')) ? 'high' : 'low';
      data.usageStats.searchHistory.unshift({ query, time: new Date().toISOString(), risk });
      
      // Also add search to watchHistory for better timeline visibility
      data.watchHistory.unshift({
        id: uuidv4(),
        app: 'Chrome',
        title: `Searched: ${query}`,
        category: 'Search',
        startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        duration: '1m',
        risk: risk
      });

      if (risk === 'high') {
        this.triggerAlert(childId, `Risky search detected: "${query}"`, 'critical');
      }
      this.addFeedItem(childId, `Searched for: ${query}`, 'Chrome');
    }

    // Live Feed
    if (Math.random() > (isDemoMode ? 0.4 : 0.9)) {
      const actions = ['Browsing content', 'Playing game', 'Messaging friend', 'Watching video'];
      this.addFeedItem(childId, actions[Math.floor(Math.random() * actions.length)], activeApp);
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

    return {
      date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
      todayScreenTime: formatTime(data.usageStats.todayScreenTimeMinutes),
      topApps,
      searchHistory: data.usageStats.searchHistory.slice(0, 10),
      liveFeed: data.liveFeed.slice(0, 8),
      insights: data.insights
    };
  }
}

const simulationInstance = new SimulationService();
module.exports = simulationInstance;
