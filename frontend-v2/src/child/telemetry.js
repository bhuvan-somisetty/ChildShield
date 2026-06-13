// Child-device telemetry. Reads REAL device signals where the browser exposes
// them (Battery Status API, Network Information API, Geolocation) and persists a
// snapshot locally. A backend agent would later push these to the parent.
const K = 'ag_child_telemetry';

const loadSnapshot = () => { try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch { return null; } };
const save = (snap) => { try { localStorage.setItem(K, JSON.stringify(snap)); } catch { /* noop */ } };

const networkLabel = () => {
  try {
    const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!c) return 'Online';
    if (c.type === 'wifi') return 'Wi-Fi';
    if (c.type === 'cellular') return (c.effectiveType || 'Mobile').toUpperCase();
    return (c.effectiveType || 'Online').toUpperCase();
  } catch { return 'Online'; }
};

export const readTelemetry = async () => {
  const prev = loadSnapshot() || { battery: { level: 80, charging: false }, network: 'Wi-Fi' };
  let battery = prev.battery;
  try {
    if (navigator.getBattery) {
      const b = await navigator.getBattery();
      battery = { level: Math.round(b.level * 100), charging: b.charging };
    }
  } catch { /* keep previous */ }
  const snap = {
    battery,
    network: typeof navigator !== 'undefined' && navigator.onLine === false ? 'Offline' : networkLabel(),
    online: typeof navigator === 'undefined' ? true : navigator.onLine !== false,
    updatedAt: Date.now(),
  };
  save(snap);
  return snap;
};

// One-shot geolocation (used by SOS). Resolves { lat, lng } or null.
export const readLocation = () => new Promise((resolve) => {
  if (typeof navigator === 'undefined' || !navigator.geolocation) return resolve(null);
  navigator.geolocation.getCurrentPosition(
    (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
    () => resolve(null),
    { enableHighAccuracy: true, timeout: 8000 },
  );
});
