// Production-shaped demo data. Multi-child; every page reads the active child.

export const PARENT = { name: 'Jane', email: 'jane@family.com' };

export const fmtMins = (m) => {
  const h = Math.floor(m / 60), r = m % 60;
  return h > 0 ? `${h}h ${r}m` : `${r}m`;
};

export const CHILDREN = [
  {
    id: 'emma', name: 'Emma', age: 10, emoji: '👧', color: '#06b6d4', phone: '+15125550142',
    device: 'iPhone 13', online: true, battery: 78, network: 'Wi-Fi · Home', lastSync: 'Just now',
    safetyScore: 82, risk: 'Low', trend: -12,
    screenTime: { today: 192, limit: 240 },
    location: { area: 'Lincoln Elementary School', city: 'Austin, TX', updated: '2 min ago', safe: true },
    safeZone: { name: 'School', inside: true },
    emergency: { status: 'All clear', ok: true },
    topApps: [{ name: 'YouTube', mins: 64, color: '#ef4444' }, { name: 'Roblox', mins: 48, color: '#10b981' }, { name: 'Messages', mins: 22, color: '#3b82f6' }],
    alerts: [
      { title: 'Arrived at School', sub: 'Safe Zone · 2:42 PM', accent: '#10b981' },
      { title: 'Daily limit 80% reached', sub: '40 min ago', accent: '#f59e0b' },
    ],
    recommendations: [
      { text: 'Screen time is down 12% this week — great balance.', accent: '#10b981' },
      { text: 'Consider Night Mode after 9 PM to protect sleep.', accent: '#f59e0b' },
    ],
    activity: [
      { id: 1, time: '2:42 PM', day: 'Today', title: 'Arrived at School', sub: 'Lincoln Elementary · Safe Zone', accent: '#10b981' },
      { id: 2, time: '1:15 PM', day: 'Today', title: 'Opened YouTube', sub: '24 min session', accent: '#ef4444' },
      { id: 3, time: '8:02 AM', day: 'Today', title: 'Left Home', sub: 'Departed Safe Zone', accent: '#f59e0b' },
    ],
  },
  {
    id: 'liam', name: 'Liam', age: 13, emoji: '👦', color: '#3b82f6', phone: '+15125550173',
    device: 'Pixel 7', online: true, battery: 45, network: '5G · Mobile', lastSync: '1 min ago',
    safetyScore: 68, risk: 'Medium', trend: 8,
    screenTime: { today: 286, limit: 300 },
    location: { area: 'Riverside Skate Park', city: 'Austin, TX', updated: '5 min ago', safe: false },
    safeZone: { name: 'Home', inside: false },
    emergency: { status: 'All clear', ok: true },
    topApps: [{ name: 'TikTok', mins: 96, color: '#a855f7' }, { name: 'Discord', mins: 54, color: '#6366f1' }, { name: 'YouTube', mins: 40, color: '#ef4444' }],
    alerts: [
      { title: 'Left a Safe Zone', sub: 'Departed Home · 4:10 PM', accent: '#f59e0b' },
      { title: 'Usage spike today', sub: '4h 46m — above average', accent: '#ef4444' },
    ],
    recommendations: [
      { text: 'Screen time trending up 8% — a check-in may help.', accent: '#ef4444' },
      { text: 'TikTok is the top app at 1h 36m today.', accent: '#a855f7' },
    ],
    activity: [
      { id: 1, time: '4:10 PM', day: 'Today', title: 'Left Home', sub: 'Departed Safe Zone', accent: '#f59e0b' },
      { id: 2, time: '3:30 PM', day: 'Today', title: 'Opened TikTok', sub: '42 min session', accent: '#a855f7' },
      { id: 3, time: '12:05 PM', day: 'Today', title: 'Arrived at School', sub: 'Safe Zone', accent: '#10b981' },
    ],
  },
  {
    id: 'mia', name: 'Mia', age: 8, emoji: '🧒', color: '#a855f7', phone: '',
    device: 'iPad (9th gen)', online: false, battery: 12, network: 'Offline', lastSync: '38 min ago',
    safetyScore: 91, risk: 'Low', trend: -4,
    screenTime: { today: 96, limit: 150 },
    location: { area: 'Home', city: 'Austin, TX', updated: '38 min ago', safe: true },
    safeZone: { name: 'Home', inside: true },
    emergency: { status: 'All clear', ok: true },
    topApps: [{ name: 'YouTube Kids', mins: 52, color: '#ef4444' }, { name: 'Khan Academy', mins: 28, color: '#10b981' }, { name: 'Duolingo', mins: 16, color: '#22c55e' }],
    alerts: [{ title: 'Low battery', sub: '12% · 38 min ago', accent: '#f59e0b' }],
    recommendations: [{ text: 'Healthy habits — 91 wellbeing, well under limit.', accent: '#10b981' }],
    activity: [
      { id: 1, time: '3:10 PM', day: 'Today', title: 'Khan Academy', sub: '28 min learning', accent: '#10b981' },
      { id: 2, time: '1:40 PM', day: 'Today', title: 'YouTube Kids', sub: '20 min session', accent: '#ef4444' },
    ],
  },
  {
    id: 'noah', name: 'Noah', age: 15, emoji: '🧑', color: '#10b981', phone: '+15125550198',
    device: 'Galaxy S22', online: true, battery: 63, network: 'Wi-Fi · School', lastSync: 'Just now',
    safetyScore: 74, risk: 'Low', trend: -6,
    screenTime: { today: 254, limit: 360 },
    location: { area: 'Westlake High School', city: 'Austin, TX', updated: '3 min ago', safe: true },
    safeZone: { name: 'School', inside: true },
    emergency: { status: 'All clear', ok: true },
    topApps: [{ name: 'Spotify', mins: 88, color: '#22c55e' }, { name: 'Instagram', mins: 62, color: '#ec4899' }, { name: 'Chrome', mins: 44, color: '#3b82f6' }],
    alerts: [{ title: 'Arrived at School', sub: 'Safe Zone · 8:05 AM', accent: '#10b981' }],
    recommendations: [{ text: 'Balanced usage. Spotify leads at 1h 28m.', accent: '#22c55e' }],
    activity: [
      { id: 1, time: '8:05 AM', day: 'Today', title: 'Arrived at School', sub: 'Westlake High · Safe Zone', accent: '#10b981' },
      { id: 2, time: '7:20 AM', day: 'Today', title: 'Spotify', sub: 'Morning playlist', accent: '#22c55e' },
    ],
  },
];

// Back-compat for the child-side device screens (they represent one device = the first child).
export const CHILD = CHILDREN[0];

// ── Parent + shared emergency services ──────────────────────────────────────
export const PARENT_LOC = { area: 'Downtown Office', city: 'Austin, TX' };

export const NEARBY = {
  police: [
    { name: 'Austin PD — Central', dist: '1.2 km', phone: '512-974-5000' },
    { name: 'Travis County Sheriff', dist: '3.4 km', phone: '512-854-9770' },
  ],
  hospitals: [
    { name: "Dell Children's Medical", dist: '2.1 km', phone: '512-324-0000' },
    { name: 'St. David’s Medical Center', dist: '4.0 km', phone: '512-476-7111' },
  ],
};

// ── Family Radar (per child, relative to parent) ────────────────────────────
export const RADAR = {
  emma: { distanceKm: 4.3, etaMin: 11, movement: 'Not moving', inZone: true, coord: [30.2729, -97.7390] },
  liam: { distanceKm: 7.8, etaMin: 19, movement: 'Cycling', inZone: false, coord: [30.2360, -97.7220] },
  mia: { distanceKm: 0.0, etaMin: 0, movement: 'Not moving', inZone: true, coord: [30.3010, -97.7510] },
  noah: { distanceKm: 6.1, etaMin: 15, movement: 'Driving', inZone: true, coord: [30.2780, -97.8050] },
};

// ── Emergency state + timeline (per child) ──────────────────────────────────
export const EMERGENCY = {
  emma: { level: 'All clear', threat: 'Low', timeline: [{ t: '2:42 PM', e: 'Arrived at School · Safe Zone', a: '#10b981' }, { t: '8:02 AM', e: 'Left Home', a: '#f59e0b' }], history: [] },
  liam: { level: 'Elevated', threat: 'Medium', timeline: [{ t: '4:10 PM', e: 'Left a Safe Zone (Home)', a: '#f59e0b' }, { t: '3:30 PM', e: 'Usage spike detected', a: '#ef4444' }], history: [{ d: 'May 28', e: 'SOS resolved · false alarm' }] },
  mia: { level: 'All clear', threat: 'Low', timeline: [{ t: '3:10 PM', e: 'Learning session', a: '#10b981' }], history: [] },
  noah: { level: 'All clear', threat: 'Low', timeline: [{ t: '8:05 AM', e: 'Arrived at School', a: '#10b981' }], history: [] },
};

// ── AI Copilot intelligence (per child) ─────────────────────────────────────
export const COPILOT = {
  emma: {
    summary: [{ t: 'Screen time decreased', d: '-12%', good: true }, { t: 'Sleep improved', d: '+18%', good: true }, { t: 'Emergency events', d: '0', good: true }, { t: 'School attendance', d: 'Normal', good: true }],
    risk: [40, 38, 42, 30, 28, 22, 18], riskLevel: 'Low',
    sleep: { bedtime: '9:40 PM', avg: '8h 20m', consistency: 86, nightActivity: 'Minimal' },
    school: { arrival: 96, departure: 92, attendance: 98 },
    behavior: [{ t: 'Healthy balance maintained', a: '#10b981' }],
    recs: ['Acknowledge Emma’s great habits this week.', 'Keep the 9 PM Night Mode enabled.'],
  },
  liam: {
    summary: [{ t: 'Screen time increased', d: '+22%', good: false }, { t: 'Night activity', d: 'Detected', good: false }, { t: 'Emergency events', d: '0', good: true }, { t: 'Safe-zone deviations', d: '3', good: false }],
    risk: [45, 50, 55, 58, 60, 64, 68], riskLevel: 'Medium',
    sleep: { bedtime: '11:20 PM', avg: '6h 10m', consistency: 54, nightActivity: 'Frequent' },
    school: { arrival: 88, departure: 84, attendance: 91 },
    behavior: [{ t: 'Late-night activity after bedtime', a: '#ef4444' }, { t: 'Excessive social media (TikTok)', a: '#f59e0b' }],
    recs: ['Reduce gaming by 30 minutes.', 'Enable Night Mode at 9 PM.', 'Review recent TikTok activity.'],
  },
  mia: {
    summary: [{ t: 'Screen time', d: '-4%', good: true }, { t: 'Learning apps', d: '+20%', good: true }, { t: 'Emergency events', d: '0', good: true }, { t: 'Attendance', d: 'Normal', good: true }],
    risk: [20, 18, 22, 16, 14, 12, 9], riskLevel: 'Low',
    sleep: { bedtime: '8:30 PM', avg: '9h 30m', consistency: 94, nightActivity: 'None' },
    school: { arrival: 99, departure: 97, attendance: 100 },
    behavior: [{ t: 'Excellent digital wellbeing', a: '#10b981' }],
    recs: ['No action needed — fantastic habits.'],
  },
  noah: {
    summary: [{ t: 'Screen time', d: '-6%', good: true }, { t: 'Sleep', d: '+5%', good: true }, { t: 'Emergency events', d: '0', good: true }, { t: 'Attendance', d: 'Normal', good: true }],
    risk: [38, 36, 34, 30, 28, 26, 24], riskLevel: 'Low',
    sleep: { bedtime: '10:50 PM', avg: '7h 05m', consistency: 72, nightActivity: 'Low' },
    school: { arrival: 93, departure: 90, attendance: 95 },
    behavior: [{ t: 'Balanced usage across the week', a: '#22c55e' }],
    recs: ['Encourage a slightly earlier bedtime.'],
  },
};

// ── Activity timeline (per child, multi-day, unlimited-history ready) ───────
const EVENTS = [
  { type: 'app', title: 'Opened YouTube', sub: '24 min session', sev: 'low' },
  { type: 'app', title: 'Opened Instagram', sev: 'low' },
  { type: 'location', title: 'Arrived at School', sub: 'Lincoln Elementary', sev: 'low' },
  { type: 'location', title: 'Left Home', sub: 'Departed Safe Zone', sev: 'low' },
  { type: 'screen', title: 'Screen Time Limit Reached', sub: 'Daily limit hit', sev: 'high' },
  { type: 'zone', title: 'Safe Zone Entered', sub: 'School', sev: 'low' },
  { type: 'zone', title: 'Safe Zone Exited', sub: 'Home', sev: 'medium' },
  { type: 'emergency', title: 'Emergency Triggered', sub: 'SOS resolved', sev: 'critical' },
  { type: 'system', title: 'Device Locked', sub: 'By parent', sev: 'medium' },
  { type: 'install', title: 'App Installed', sub: 'Roblox', sev: 'low' },
  { type: 'uninstall', title: 'App Uninstalled', sub: 'TikTok', sev: 'medium' },
];
const TIMES = ['8:02 AM', '9:15 AM', '10:40 AM', '12:30 PM', '1:15 PM', '2:42 PM', '3:30 PM', '4:10 PM', '6:05 PM', '8:20 PM', '9:40 PM'];
const DAYS = [
  ['Today', 'Friday, June 12, 2026'],
  ['Yesterday', 'Thursday, June 11, 2026'],
  ['Wednesday', 'Wednesday, June 10, 2026'],
  ['Tuesday', 'Tuesday, June 9, 2026'],
  ['Monday', 'Monday, June 8, 2026'],
  ['Sunday', 'Sunday, June 7, 2026'],
];

export const activityDays = (child) => {
  const seed = (child.id.charCodeAt(0) + child.id.charCodeAt(1)) % 7;
  return DAYS.map((d, di) => {
    let evs;
    if (di === 0) evs = EVENTS; // Today shows the full timeline
    else {
      const n = 5 + ((seed + di) % 4); // 5–8 events per past day, varies by child
      evs = Array.from({ length: n }, (_, i) => EVENTS[(i + seed + di) % EVENTS.length]);
    }
    return {
      label: d[0], date: d[1],
      events: evs.map((e, i) => ({ ...e, id: `${di}-${i}`, time: TIMES[i % TIMES.length] })),
    };
  });
};

// ── Production notifications (per child) ────────────────────────────────────
// Every template carries a `cat` so the Notification Center can open real,
// filterable category feeds (Emergency, Location, Safe Zones, Screen Time, …).
export const NOTIF_CATEGORIES = ['Emergency', 'Location', 'Safe Zones', 'Screen Time', 'App Usage', 'AI Insights', 'Security Alerts', 'System Alerts'];
const NOTIF_TEMPLATES = [
  { type: 'Emergency Triggered', sub: 'SOS resolved', sev: 'critical', accent: '#ef4444', cat: 'Emergency' },
  { type: 'SOS Test Completed', sub: 'Monthly safety drill', sev: 'low', accent: '#10b981', cat: 'Emergency' },
  { type: 'School Arrived', sub: 'On time', sev: 'low', accent: '#10b981', cat: 'Location' },
  { type: 'School Left', sub: 'Departed campus', sev: 'low', accent: '#06b6d4', cat: 'Location' },
  { type: 'Arrived Home', sub: 'Reached Home safely', sev: 'low', accent: '#10b981', cat: 'Location' },
  { type: 'Left Home', sub: 'Departed Home', sev: 'medium', accent: '#f59e0b', cat: 'Location' },
  { type: 'Safe Zone Entered', sub: 'School', sev: 'low', accent: '#10b981', cat: 'Safe Zones' },
  { type: 'Safe Zone Exited', sub: 'Home', sev: 'medium', accent: '#f59e0b', cat: 'Safe Zones' },
  { type: 'Daily Limit Reached', sub: 'Screen-time limit hit', sev: 'high', accent: '#ef4444', cat: 'Screen Time' },
  { type: 'Night Restriction Activated', sub: 'Started 10:00 PM', sev: 'low', accent: '#6366f1', cat: 'Screen Time' },
  { type: 'Screen Time Extended', sub: '+30 min granted', sev: 'low', accent: '#06b6d4', cat: 'Screen Time' },
  { type: 'App Blocked', sub: 'TikTok was blocked', sev: 'medium', accent: '#a855f7', cat: 'App Usage' },
  { type: 'App Limit Reached', sub: 'YouTube hit 60m', sev: 'medium', accent: '#ef4444', cat: 'App Usage' },
  { type: 'New App Installed', sub: 'Roblox', sev: 'low', accent: '#3b82f6', cat: 'App Usage' },
  { type: 'AI Recommendation', sub: 'Reduce gaming by 30m', sev: 'low', accent: '#a855f7', cat: 'AI Insights' },
  { type: 'Weekly Insight Ready', sub: 'Your family report', sev: 'low', accent: '#a855f7', cat: 'AI Insights' },
  { type: 'New Device Connected', sub: 'iPad linked', sev: 'low', accent: '#3b82f6', cat: 'Security Alerts' },
  { type: 'New Login Detected', sub: 'Chrome · Mac', sev: 'medium', accent: '#f59e0b', cat: 'Security Alerts' },
  { type: 'Security Settings Changed', sub: 'PIN updated', sev: 'medium', accent: '#22c55e', cat: 'Security Alerts' },
  { type: 'Device Offline', sub: 'Lost connection', sev: 'medium', accent: '#f59e0b', cat: 'System Alerts' },
  { type: 'Low Battery', sub: '15% remaining', sev: 'medium', accent: '#f59e0b', cat: 'System Alerts' },
  { type: 'Sync Completed', sub: 'All data up to date', sev: 'low', accent: '#10b981', cat: 'System Alerts' },
];
const NTIMES = ['Just now', '2m', '18m', '40m', '1h', '2h', '3h', 'Yesterday'];
const NDATES = ['Jun 12, 2026', 'Jun 11, 2026'];
export const notificationsFor = (child) => {
  const seed = child.id.charCodeAt(0) % NTIMES.length;
  return NOTIF_TEMPLATES.map((t, i) => ({
    id: i,
    ...t,
    time: NTIMES[(i + seed) % NTIMES.length],
    date: NDATES[i % 2],
    childName: child.name,
    unread: (i + seed) % 3 === 0,
  }));
};

export const WEEK = [
  { d: 'M', mins: 210 }, { d: 'T', mins: 165 }, { d: 'W', mins: 240 },
  { d: 'T', mins: 132 }, { d: 'F', mins: 268 }, { d: 'S', mins: 312 }, { d: 'S', mins: 192 },
];

export const SAFE_ZONES = [
  { id: 1, name: 'Home', sub: '221B Maple Ave', icon: 'Home', accent: '#3b82f6' },
  { id: 2, name: 'School', sub: 'Lincoln Elementary', icon: 'GraduationCap', accent: '#10b981' },
  { id: 3, name: "Grandma's", sub: '14 Oak Street', icon: 'Heart', accent: '#a855f7' },
];
