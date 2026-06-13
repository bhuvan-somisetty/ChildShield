// Local child-app data. Stored on the child device only (no backend yet).
export const DEFAULT_CHILD = {
  id: 'emma',
  name: 'Emma',
  emoji: '👧',
  color: '#10b981',
  age: 10,
  grade: 'Grade 5',
  school: 'Lincoln Elementary',
  parentName: 'Mom',
  parentPhone: '+15125550100',
  childPhone: '+15125550142',
};

// Emergency contacts (editable in settings).
export const DEFAULT_CONTACTS = [
  { id: 1, name: 'Mom', relation: 'Parent', phone: '+15125550100', primary: true },
  { id: 2, name: 'Dad', relation: 'Parent', phone: '+15125550101', primary: false },
  { id: 3, name: 'Grandma', relation: 'Guardian', phone: '+15125550102', primary: false },
  { id: 4, name: 'Emergency Services', relation: 'Emergency', phone: '911', primary: false },
];

// Nearby-services architecture (a real device geolocates + queries these).
export const NEARBY_HOSPITALS = [
  { name: "Dell Children's Medical", dist: '2.1 km', phone: '5123240000' },
  { name: 'St. David’s Medical Center', dist: '4.0 km', phone: '5124767111' },
];
export const NEARBY_POLICE = [
  { name: 'Austin PD — Central', dist: '1.2 km', phone: '5129745000' },
  { name: 'Travis County Sheriff', dist: '3.4 km', phone: '5128549770' },
];

export const DEFAULT_GOALS = [
  { id: 1, title: 'Finish math homework', subject: 'Mathematics', done: false, target: 'Today' },
  { id: 2, title: 'Read 20 pages', subject: 'English', done: true, target: 'Today' },
  { id: 3, title: 'Science project draft', subject: 'Science', done: false, target: 'This week' },
];

export const fmtMins = (m) => { const h = Math.floor(m / 60), r = m % 60; return h > 0 ? `${h}h ${r}m` : `${r}m`; };
