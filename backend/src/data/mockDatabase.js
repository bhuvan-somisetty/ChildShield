const usageStats = {
  todayScreenTime: '4h 12m',
  limit: '5h 00m',
  topApps: [
    { name: 'YouTube', time: '1h 30m', category: 'Entertainment', color: '#ff0000', icon: 'Youtube' },
    { name: 'Roblox', time: '1h 10m', category: 'Gaming', color: '#00d8ff', icon: 'Gamepad2' },
    { name: 'Instagram', time: '45m', category: 'Social', color: '#e1306c', icon: 'Instagram' },
    { name: 'Khan Academy', time: '35m', category: 'Education', color: '#00a651', icon: 'BookOpen' },
    { name: 'TikTok', time: '12m', category: 'Entertainment', color: '#00f2fe', icon: 'Video' }
  ],
  weeklyTrend: [
    { day: 'Mon', time: 3.5 },
    { day: 'Tue', time: 3.2 },
    { day: 'Wed', time: 4.1 },
    { day: 'Thu', time: 3.8 },
    { day: 'Fri', time: 4.5 },
    { day: 'Sat', time: 6.2 }, // Weekend spike
    { day: 'Sun', time: 5.5 }
  ],
  categoryDistribution: [
    { name: 'Entertainment', value: 45, color: '#b026ff' },
    { name: 'Gaming', value: 30, color: '#00f0ff' },
    { name: 'Education', value: 15, color: '#00ffaa' },
    { name: 'Social', value: 10, color: '#ff3b3b' }
  ],
  heatmap: [
    { time: 'Morning', Entertainment: 10, Gaming: 5, Education: 30, Social: 5 },
    { time: 'Afternoon', Entertainment: 20, Gaming: 15, Education: 10, Social: 15 },
    { time: 'Night', Entertainment: 60, Gaming: 50, Education: 0, Social: 30 } // Highlight risky behavior
  ]
};

const watchHistory = [
  { id: 1, app: 'YouTube', title: 'Minecraft Let\'s Play Ep 45', category: 'Gaming', startTime: '8:45 PM', duration: '25m', risk: 'low' },
  { id: 2, app: 'YouTube', title: 'Scary Pranks Compilation', category: 'Entertainment', startTime: '9:15 PM', duration: '15m', risk: 'high', alerts: ['Late night', 'Age-restricted content'] },
  { id: 3, app: 'TikTok', title: 'Short loops', category: 'Entertainment', startTime: '9:30 PM', duration: '45m', risk: 'medium', alerts: ['Repeated scrolling'] },
  { id: 4, app: 'Khan Academy', title: 'Algebra Equations', category: 'Education', startTime: '4:00 PM', duration: '35m', risk: 'safe' },
  { id: 5, app: 'Roblox', title: 'Adopt Me', category: 'Gaming', startTime: '5:00 PM', duration: '1h 10m', risk: 'low' },
];

const insights = {
  score: 65,
  level: 'Medium Risk',
  alerts: [
    "Peak usage at 10 PM. Consider enabling Night Restriction.",
    "Entertainment forms 45% of total screen time.",
    "Detected 'Scary Pranks' — review Watch History."
  ],
  suggestions: [
    "Set app limit for YouTube to 1h.",
    "Encourage Khan Academy usage before 5 PM."
  ]
};

module.exports = {
  usageStats,
  watchHistory,
  insights
};
