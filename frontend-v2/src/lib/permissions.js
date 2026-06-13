// Permission + onboarding state, persisted locally (backend-ready shape).
// Statuses: 'granted' | 'denied' | 'prompt' (not yet requested).
const LS = 'ag_perms';
const LS_CONTACTS = 'ag_contacts';
const LS_SETUP = 'ag_setup_done';

const DEFAULTS = {
  location: 'prompt',
  notifications: 'prompt',
  biometric: 'prompt',
  background: 'prompt',     // background location
  battery: 'prompt',        // battery-optimisation exemption
  accuracy: 'prompt',       // high-accuracy location
  coords: null,             // last known parent coords
  pinSet: false,
};

export const getPerms = () => {
  try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(LS) || '{}') }; } catch { return { ...DEFAULTS }; }
};
export const setPerms = (patch) => {
  const next = { ...getPerms(), ...patch };
  localStorage.setItem(LS, JSON.stringify(next));
  return next;
};

// Request real geolocation. Resolves the resulting status.
export const requestLocation = () => new Promise((resolve) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) {
    resolve(setPerms({ location: 'denied' }).location); return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => resolve(setPerms({ location: 'granted', accuracy: 'granted', background: 'granted', coords: { lat: pos.coords.latitude, lng: pos.coords.longitude } }).location),
    () => resolve(setPerms({ location: 'denied' }).location),
    { enableHighAccuracy: true, timeout: 8000 },
  );
});

// Request real Web Notification permission.
export const requestNotifications = async () => {
  if (typeof Notification === 'undefined') return setPerms({ notifications: 'denied' }).notifications;
  try {
    const res = await Notification.requestPermission();
    return setPerms({ notifications: res === 'granted' ? 'granted' : 'denied' }).notifications;
  } catch {
    return setPerms({ notifications: 'denied' }).notifications;
  }
};

// Emergency contacts
export const getContacts = () => { try { return JSON.parse(localStorage.getItem(LS_CONTACTS) || '[]'); } catch { return []; } };
export const setContacts = (list) => { localStorage.setItem(LS_CONTACTS, JSON.stringify(list)); return list; };

// Setup-wizard completion gate
export const isSetupDone = () => localStorage.getItem(LS_SETUP) === '1';
export const markSetupDone = () => localStorage.setItem(LS_SETUP, '1');

// Health score across the six tracked permissions.
export const PERM_KEYS = ['location', 'notifications', 'biometric', 'background', 'battery', 'accuracy'];
export const healthScore = (p = getPerms()) => PERM_KEYS.filter((k) => p[k] === 'granted').length;
