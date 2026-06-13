// Domain services — the single place that mutates the DB and fans changes out
// over Socket.IO. Both REST routes and socket handlers call these, so behaviour
// is identical regardless of transport.
import { Repo, id, now } from './db.js';

const messages = Repo('messages');
const sos = Repo('sos');
const locations = Repo('locations');
const battery = Repo('battery');
const requests = Repo('appRequests');
const notifications = Repo('notifications');
const pairings = Repo('pairings');
const securityAlerts = Repo('securityAlerts');
const safeZones = Repo('safeZones');
const zoneEvents = Repo('zoneEvents');

export const room = {
  pairing: (pid) => `pairing:${pid}`,
  parent: (pid) => `parent:${pid}`,
  child: (cid) => `child:${cid}`,
};

const pairingFor = (pairingId) => pairings.byId(pairingId);

// Create an in-app/dashboard notification and push it to the parent in realtime.
// (Web-Push / FCM would be a second delivery channel off this same record.)
export const addNotification = (io, { parentId, type, title, body, data }) => {
  const n = notifications.insert({ parentId, type, title, body, data: data || {}, read: false, at: now() });
  io.to(room.parent(parentId)).emit('notification:new', n);
  return n;
};

/* ── Chat ──────────────────────────────────────────────────────────────── */
export const sendMessage = (io, { pairingId, from, text }) => {
  const p = pairingFor(pairingId); if (!p) return null;
  const msg = messages.insert({ pairingId, from, text, at: now(), status: 'sent' });
  io.to(room.pairing(pairingId)).emit('chat:message', msg);
  // If the other party has someone in the room, mark delivered.
  const r = io.sockets.adapter.rooms.get(room.pairing(pairingId));
  if (r && r.size > 1) { messages.update(msg.id, { status: 'delivered' }); io.to(room.pairing(pairingId)).emit('chat:status', { id: msg.id, status: 'delivered' }); }
  // Mirror as a notification for the recipient parent.
  if (from === 'child') addNotification(io, { parentId: p.parentId, type: 'chat', title: 'New message', body: text, data: { pairingId } });
  return msg;
};
export const setTyping = (io, { pairingId, from, isTyping }) => {
  io.to(room.pairing(pairingId)).emit('chat:typing', { pairingId, from, isTyping });
};
export const markRead = (io, { pairingId, reader, ids }) => {
  const set = new Set(ids || []);
  messages.filter((m) => m.pairingId === pairingId && m.from !== reader && (set.size === 0 || set.has(m.id)))
    .forEach((m) => messages.update(m.id, { status: 'read' }));
  io.to(room.pairing(pairingId)).emit('chat:read', { pairingId, reader, ids: [...set] });
};

/* ── SOS ───────────────────────────────────────────────────────────────── */
export const triggerSOS = (io, { childId, location }) => {
  const p = pairings.find((x) => x.childId === childId && x.status === 'active');
  if (!p) return null;
  const evt = sos.insert({ childId, parentId: p.parentId, pairingId: p.id, at: now(), location: location || null, status: 'active' });
  // Emit only to the parent room. The parent socket is also in the pairing room,
  // so emitting to both would double-deliver. The child gets the socket ack.
  io.to(room.parent(p.parentId)).emit('sos:alert', evt);
  addNotification(io, { parentId: p.parentId, type: 'sos', title: 'Emergency SOS', body: 'Your child triggered SOS', data: { sosId: evt.id, location: evt.location } });
  return evt;
};
export const resolveSOS = (io, { sosId }) => {
  const evt = sos.update(sosId, { status: 'resolved', resolvedAt: now() });
  if (evt) io.to(room.parent(evt.parentId)).emit('sos:resolved', evt);
  return evt;
};

/* ── Location & Battery telemetry ──────────────────────────────────────── */
export const updateLocation = (io, { childId, lat, lng, accuracy }) => {
  const p = pairings.find((x) => x.childId === childId && x.status === 'active');
  const rec = locations.upsert((l) => l.childId === childId, { childId, lat, lng, accuracy: accuracy || null, at: now() });
  if (p) io.to(room.parent(p.parentId)).emit('location:update', rec);
  evaluateGeofence(io, { childId, lat, lng }); // real geofencing off the live GPS stream
  return rec;
};

/* ── Safe Zones + geofencing (Phase 6B) ────────────────────────────────────
 * Geofencing runs on the backend against the existing location:update stream —
 * the child GPS code is untouched. enter/exit are detected from real position
 * transitions; late/missed/stayed come from the optional per-zone schedule. */
const toRad = (d) => (d * Math.PI) / 180;
const distMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000, dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};
const geoState = {}; // zoneId -> { inside, enterAt, arrivedDay, stayedDay, missedDay }
const dayKey = () => new Date().toISOString().slice(0, 10);

export const listZonesForChild = (childId) => safeZones.filter((z) => z.childId === childId);
export const listZonesForParent = (parentId) => safeZones.filter((z) => z.parentId === parentId);

export const createZone = (io, { parentId, childId, pairingId, name, type, lat, lng, radius, address, expectedArrival, expectedDeparture, graceMin }) => {
  const z = safeZones.insert({ parentId, childId, pairingId, name: name || 'Safe Zone', type: type || 'custom', lat, lng, radius: radius || 100, address: address || null, expectedArrival: expectedArrival || null, expectedDeparture: expectedDeparture || null, graceMin: graceMin || 15 });
  const list = listZonesForChild(childId);
  if (pairingId) io.to(room.pairing(pairingId)).emit('zones:update', list);
  io.to(room.parent(parentId)).emit('zones:update', list);
  return z;
};
export const deleteZone = (io, { id }) => {
  const z = safeZones.byId(id); if (!z) return null;
  safeZones.remove(id); delete geoState[id];
  io.to(room.parent(z.parentId)).emit('zones:update', listZonesForChild(z.childId));
  return { ok: true };
};

export const reportZoneEvent = (io, zone, type, extra = {}) => {
  const ev = zoneEvents.insert({ childId: zone.childId, parentId: zone.parentId, pairingId: zone.pairingId, zoneId: zone.id, zoneName: zone.name, zoneType: zone.type, type, at: now(), ...extra });
  io.to(room.parent(zone.parentId)).emit('zone:event', ev);
  const verb = { enter: 'entered', exit: 'exited', late: 'arrived late at', missed: 'missed arrival at', stayed: 'stayed longer than expected at' }[type] || type;
  addNotification(io, { parentId: zone.parentId, type: 'zone', title: 'Safe Zone', body: `${verb} ${zone.name}`, data: { zoneId: zone.id, type } });
  return ev;
};

export const evaluateGeofence = (io, { childId, lat, lng }) => {
  listZonesForChild(childId).forEach((z) => {
    const inside = distMeters(lat, lng, z.lat, z.lng) <= (z.radius || 100);
    const st = geoState[z.id];
    if (!st) { geoState[z.id] = { inside, enterAt: inside ? now() : null, arrivedDay: inside ? dayKey() : null }; return; }
    if (inside && !st.inside) {
      const late = isLate(z); // entered after the expected arrival window
      geoState[z.id] = { ...st, inside: true, enterAt: now(), arrivedDay: dayKey() };
      reportZoneEvent(io, z, 'enter');
      if (late) reportZoneEvent(io, z, 'late');
    } else if (!inside && st.inside) {
      const durationMs = st.enterAt ? now() - st.enterAt : 0;
      geoState[z.id] = { ...st, inside: false, enterAt: null };
      reportZoneEvent(io, z, 'exit', { durationMs });
    } else {
      geoState[z.id] = { ...st, inside };
    }
  });
};

const hhmmNow = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const hhmmTo = (s) => { if (!s) return null; const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const isLate = (z) => { const exp = hhmmTo(z.expectedArrival); return exp != null && hhmmNow() > exp + (z.graceMin || 15); };

// Schedule evaluator — missed arrival (not in zone past expected time) +
// stayed-longer (still in zone past expected departure). Once per day per zone.
export const evaluateSchedules = (io) => {
  const today = dayKey();
  safeZones.all().forEach((z) => {
    const st = geoState[z.id] || {};
    const arr = hhmmTo(z.expectedArrival), dep = hhmmTo(z.expectedDeparture), nowM = hhmmNow();
    if (arr != null && nowM > arr + (z.graceMin || 15) && st.arrivedDay !== today && st.missedDay !== today) {
      geoState[z.id] = { ...st, missedDay: today };
      reportZoneEvent(io, z, 'missed');
    }
    if (dep != null && st.inside && nowM > dep + (z.graceMin || 15) && st.stayedDay !== today) {
      geoState[z.id] = { ...st, stayedDay: today };
      reportZoneEvent(io, z, 'stayed');
    }
  });
};
export const startZoneScheduler = (io) => setInterval(() => evaluateSchedules(io), 60000);
export const updateBattery = (io, { childId, level, charging }) => {
  const p = pairings.find((x) => x.childId === childId && x.status === 'active');
  const rec = battery.upsert((b) => b.childId === childId, { childId, level, charging: !!charging, at: now() });
  if (p) io.to(room.parent(p.parentId)).emit('battery:update', rec);
  return rec;
};

/* ── App requests (install / delete approval) ──────────────────────────── */
export const createRequest = (io, { childId, type, app, category, reason, pkg }) => {
  const p = pairings.find((x) => x.childId === childId && x.status === 'active');
  if (!p) return null;
  const req = requests.insert({ childId, parentId: p.parentId, pairingId: p.id, type, app, pkg: pkg || null, category: category || 'App', reason: reason || '', status: 'pending', at: now() });
  io.to(room.parent(p.parentId)).emit('request:new', req);
  addNotification(io, { parentId: p.parentId, type: 'request', title: `${type === 'install' ? 'Install' : 'Delete'} request`, body: app, data: { requestId: req.id } });
  return req;
};
export const decideRequest = (io, { requestId, decision }) => {
  const req = requests.update(requestId, { status: decision, decidedAt: now() });
  if (!req) return null;
  io.to(room.pairing(req.pairingId)).emit('request:update', req);
  io.to(room.parent(req.parentId)).emit('request:update', req);
  return req;
};

/* ── Android enforcement events (Phase 5) ──────────────────────────────────
 * The native agent detects these on-device and reports them through the web
 * app's socket. Install detection raises an approval request; uninstall, VPN/
 * mock-location/tamper, and screen-time locks raise alerts to the parent. */
const activePairing = (childId) => pairings.find((x) => x.childId === childId && x.status === 'active');

// (3) App install detected → parent approval request. De-duplicated: a repeated
// install signal for the same app within 5 min reuses the existing pending one
// (the native agent + WebView bridge can both fire for one install).
export const reportInstall = (io, { childId, app, category, pkg }) => {
  const dupe = requests.find((r) => r.childId === childId && r.type === 'install' && r.status === 'pending' && (r.pkg === pkg && pkg ? true : r.app === app) && (now() - r.at) < 5 * 60 * 1000);
  if (dupe) return dupe;
  return createRequest(io, { childId, type: 'install', app, category: category || 'App', reason: 'Installed on device — approval required', pkg });
};

// (4) App uninstall detected → routed through the security pipeline so it lands
// in the parent's Notification Center, Activity Timeline and Security Center.
// The AlphaGuard self-uninstall ATTEMPT arrives separately via enforce:tamper
// (DeviceAdmin.onDisableRequested) and is raised as a high-risk tamper alert.
export const reportUninstall = (io, { childId, app, pkg }) =>
  reportSecurity(io, { childId, kind: 'app_uninstall', detail: `${app || 'An app'} was uninstalled`, risk: 'medium', app });

// (7)(8)(10) Security alert (vpn / proxy / dns / mock_location / location_jump / tamper).
export const reportSecurity = (io, { childId, kind, detail, risk, app }) => {
  const p = activePairing(childId); if (!p) return null;
  const rec = securityAlerts.insert({ childId, parentId: p.parentId, kind, detail: detail || kind, risk: risk || 'medium', app: app || null, at: now() });
  io.to(room.parent(p.parentId)).emit('security:alert', rec);
  addNotification(io, { parentId: p.parentId, type: 'security', title: 'Security alert', body: detail || kind, data: { kind, risk } });
  return rec;
};

// (5)(6) Screen-time lock / restricted-app block engaged on the device.
export const reportScreenLock = (io, { childId, app, reason }) => {
  const p = activePairing(childId); if (!p) return null;
  io.to(room.parent(p.parentId)).emit('screentime:locked', { childId, app, reason, at: now() });
  addNotification(io, { parentId: p.parentId, type: 'screentime', title: reason === 'screen_time' ? 'Daily limit reached' : 'Restricted app blocked', body: app, data: { app, reason } });
  return { ok: true };
};
