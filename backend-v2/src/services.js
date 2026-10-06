// Domain services — the single place that mutates the DB and fans changes out
// over Socket.IO. Both REST routes and socket handlers call these, so behaviour
// is identical regardless of transport.
import { Repo, id, now } from './db.js';
import { sendToUser, sendPushNotification, tokensFor } from './push.js';

const messages = Repo('messages');
const sos = Repo('sos');
const locations = Repo('locations');
const locationHistory = Repo('locationHistory');
const battery = Repo('battery');
const requests = Repo('appRequests');
const notifications = Repo('notifications');
const notificationSettings = Repo('notificationSettings');
const pairings = Repo('pairings');
const securityAlerts = Repo('securityAlerts');
const safeZones = Repo('safeZones');
const zoneEvents = Repo('zoneEvents');
const familyMembers = Repo('familyMembers');
const children = Repo('children');
const radarEventsRepo = Repo('radarEvents');

export const room = {
  pairing: (pid) => `pairing:${pid}`,
  parent: (pid) => `parent:${pid}`,
  child: (cid) => `child:${cid}`,
};

const pairingFor = (pairingId) => pairings.byId(pairingId);

// Notification preferences — maps userId → category → boolean (true = enabled).
// Defaults are all enabled; stored only when user explicitly changes a value.
const DEFAULT_PREFS = { sos: true, location: true, device: true, battery: true, tasks: true, rewards: true, achievements: true, chat: true, security: true, screentime: true, system: true };
export const getNotificationPrefs = (parentId) => {
  const row = notificationSettings.find((s) => s.parentId === parentId);
  return row ? { ...DEFAULT_PREFS, ...row.prefs } : { ...DEFAULT_PREFS };
};
export const setNotificationPrefs = (parentId, prefs) => {
  return notificationSettings.upsert((s) => s.parentId === parentId, { parentId, prefs: { ...getNotificationPrefs(parentId), ...prefs } });
};

// Resolve all parent IDs who should receive a notification for a given familyId.
const recipientsForFamily = (familyId) => {
  if (!familyId) return [];
  return familyMembers
    .filter((m) => m.familyId === familyId && (m.role === 'primary_parent' || m.role === 'co_parent' || m.role === 'guardian'))
    .map((m) => m.userId);
};

// Create an in-app notification and push it to all authorized family members,
// respecting each recipient's per-category preferences and tracking delivery.
export const addNotification = (io, { parentId, familyId, type, title, body, data }) => {
  // Insert the base notification record for the originating parent scope.
  const n = notifications.insert({
    parentId,
    familyId: familyId || parentId,
    type,
    title,
    body,
    data: data || {},
    read: false,
    at: now(),
    deliveries: [], // [{recipientId, token, status, at}]
  });

  // Determine all recipients: primary + co-parents + guardians of the family.
  const effectiveFamilyId = familyId || parentId;
  const allRecipients = recipientsForFamily(effectiveFamilyId);
  // Always include the originating parentId even if family lookup is empty.
  const recipientSet = new Set([parentId, ...allRecipients]);

  const deliveries = [];
  recipientSet.forEach((recipientId) => {
    // Check per-category preference.
    const prefs = getNotificationPrefs(recipientId);
    const categoryKey = type === 'zone' ? 'location' : type;
    if (prefs[categoryKey] === false) return; // suppressed by preference

    // Emit realtime in-app notification.
    io.to(room.parent(recipientId)).emit('notification:new', n);

    // Push to each registered device token and record delivery status.
    const tokens = tokensFor(recipientId);
    tokens.forEach((token) => {
      deliveries.push({ recipientId, token, status: 'sent', at: now() });
      sendPushNotification(token, title || 'AlphaGuard', body || '', { ...(data || {}), type, notificationId: n.id })
        .then((result) => {
          const idx = deliveries.findIndex((d) => d.token === token && d.recipientId === recipientId);
          if (idx >= 0) deliveries[idx].status = result.sent ? 'sent' : 'failed';
          notifications.update(n.id, { deliveries: [...deliveries] });
        })
        .catch(() => {});
    });
    if (tokens.length === 0) {
      // No device registered — still record the intent.
      deliveries.push({ recipientId, token: null, status: 'no-device', at: now() });
    }
  });

  // Persist initial delivery snapshot.
  notifications.update(n.id, { deliveries });
  return n;
};

/* ── Radar Event Timeline ───────────────────────────────────────────────────
 * Severity scale:
 *   info     — routine events (zone enter, device online, location updated)
 *   warning  — notable but non-emergency (zone exit, device offline, low battery)
 *   critical — emergency or requires immediate action (SOS, critical battery, location disabled)
 *
 * The data JSONB field is structured for future AI Reports / Family Analytics:
 *   { childId, zoneId?, zoneName?, lat?, lng?, batteryLevel?, duration? }
 */
export const reportRadarEvent = (io, { childId, parentId, type, severity, title, body, data }) => {
  const ev = radarEventsRepo.insert({
    childId,
    parentId,
    type,
    severity: severity || 'info',
    title: title || type,
    body: body || '',
    data: data || {},
    at: now(),
  });
  // Emit realtime to parent room so the timeline refreshes live.
  io.to(room.parent(parentId)).emit('radar:event', ev);
  return ev;
};

// Merged timeline: zone events + SOS + radar events for one child, sorted desc.
// limit defaults to 100; severity filter is optional ('info'|'warning'|'critical'|null).
export const listRadarEvents = (childId, parentId, { limit = 100, severity = null, from = 0, to = Infinity } = {}) => {
  // Dedicated radar events (device online/offline, battery, location alerts).
  const re = radarEventsRepo
    .filter((e) => e.childId === childId && e.at >= from && e.at <= to)
    .map((e) => ({ ...e, source: 'radar' }));

  // Zone enter/exit/late/missed events cast into the same shape.
  const ze = zoneEvents
    .filter((e) => e.childId === childId && e.at >= from && e.at <= to)
    .map((e) => ({
      id: e.id,
      childId: e.childId,
      parentId: e.parentId,
      type: `zone_${e.type}`,
      severity: e.type === 'enter' ? 'info'
        : e.type === 'exit' || e.type === 'late' ? 'warning'
        : 'warning',  // missed / stayed
      title: `Zone ${e.type.charAt(0).toUpperCase() + e.type.slice(1)}`,
      body: e.zoneName || 'Safe Zone',
      data: { zoneId: e.zoneId, zoneName: e.zoneName, zoneType: e.zoneType, durationMs: e.durationMs },
      at: e.at,
      source: 'zone',
    }));

  // SOS events cast into the same shape.
  const se = sos
    .filter((e) => e.childId === childId && e.at >= from && e.at <= to)
    .map((e) => ({
      id: e.id,
      childId: e.childId,
      parentId: e.parentId,
      type: 'sos',
      severity: 'critical',
      title: e.status === 'active' ? '🚨 SOS Alert' : 'SOS Resolved',
      body: e.status === 'active' ? 'Emergency SOS triggered' : 'SOS has been resolved',
      data: { sosId: e.id, status: e.status, location: e.location },
      at: e.at,
      source: 'sos',
    }));

  let all = [...re, ...ze, ...se].sort((a, b) => b.at - a.at);
  if (severity) all = all.filter((e) => e.severity === severity);
  return all.slice(0, limit);
};

// Aggregated radar dashboard for one child.
export const getRadarSummary = (childId) => {
  const latest = locations.find((l) => l.childId === childId) || null;
  const bat = battery.find((b) => b.childId === childId) || null;
  const childRec = children.byId(childId);
  const activeZones = safeZones.filter((z) => z.childId === childId);
  const recentEvents = radarEventsRepo
    .filter((e) => e.childId === childId)
    .sort((a, b) => b.at - a.at)
    .slice(0, 5);
  return {
    childId,
    childName: childRec?.name || null,
    location: latest ? { lat: latest.lat, lng: latest.lng, accuracy: latest.accuracy, speed: latest.speed, at: latest.at } : null,
    battery: bat ? { level: bat.level, charging: bat.charging, at: bat.at } : null,
    zoneCount: activeZones.length,
    recentEvents,
    updatedAt: now(),
  };
};

// Called by sockets.js on presence change to persist device online/offline events.
export const reportPresenceEvent = (io, { childId, parentId, online }) => {
  if (!childId || !parentId) return;
  return reportRadarEvent(io, {
    childId,
    parentId,
    type: online ? 'device_online' : 'device_offline',
    severity: online ? 'info' : 'warning',
    title: online ? 'Device Online' : 'Device Offline',
    body: online ? 'Child device connected' : 'Child device disconnected',
    data: { online, at: now() },
  });
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
const LOCATION_HISTORY_CAP = 500; // per child, rolling
export const updateLocation = (io, { childId, lat, lng, accuracy, speed }) => {
  const p = pairings.find((x) => x.childId === childId && x.status === 'active');
  const rec = locations.upsert((l) => l.childId === childId, { childId, lat, lng, accuracy: accuracy || null, speed: speed || null, at: now() });
  // Append to the rolling history time-series (the route timeline reads this).
  locationHistory.insert({ childId, lat, lng, accuracy: accuracy || null, speed: speed || null, at: now() });
  const hist = locationHistory.filter((h) => h.childId === childId).sort((a, b) => b.at - a.at);
  if (hist.length > LOCATION_HISTORY_CAP) hist.slice(LOCATION_HISTORY_CAP).forEach((h) => locationHistory.remove(h.id));
  if (p) io.to(room.parent(p.parentId)).emit('location:update', rec);
  evaluateGeofence(io, { childId, lat, lng }); // real geofencing off the live GPS stream
  return rec;
};
export const listLocationHistory = (childId, limit = 100, { from = 0, to = Infinity } = {}) =>
  locationHistory
    .filter((h) => h.childId === childId && h.at >= from && h.at <= to)
    .sort((a, b) => b.at - a.at)
    .slice(0, limit)
    .map((h) => ({ lat: h.lat, lng: h.lng, accuracy: h.accuracy, speed: h.speed || null, at: h.at }));

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

  // Battery radar events + notifications (once per threshold crossing per charge cycle).
  if (p) {
    const prev = battery.find((b) => b.childId === childId);
    const wasAboveLow = !prev || prev.level > 20;
    const wasAboveCritical = !prev || prev.level > 10;
    if (level <= 10 && wasAboveCritical && !charging) {
      reportRadarEvent(io, { childId, parentId: p.parentId, type: 'battery_critical', severity: 'critical', title: 'Critical Battery', body: `Battery at ${level}% — device may lose connection soon`, data: { level, charging } });
      addNotification(io, { parentId: p.parentId, type: 'battery', title: 'Critical Battery', body: `${level}% remaining`, data: { childId, level } });
    } else if (level <= 20 && wasAboveLow && !charging) {
      reportRadarEvent(io, { childId, parentId: p.parentId, type: 'battery_low', severity: 'warning', title: 'Low Battery', body: `Battery at ${level}%`, data: { level, charging } });
      addNotification(io, { parentId: p.parentId, type: 'battery', title: 'Low Battery', body: `${level}% remaining`, data: { childId, level } });
    }
  }

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
export const reportScreenLock = (io, { childId, app, reason, durationMs }) => {
  const p = activePairing(childId); if (!p) return null;
  if (reason === 'screen_time' || durationMs) {
    securityAlerts.insert({
      childId,
      parentId: p.parentId,
      kind: 'screentime_sync',
      detail: `Screen time report: ${Math.round((durationMs || 0) / 60000)} minutes`,
      risk: 'info',
      app: app || 'Device',
      data: { durationMs: durationMs || 0 },
      at: now()
    });
  }
  io.to(room.parent(p.parentId)).emit('screentime:locked', { childId, app, reason, durationMs, at: now() });
  addNotification(io, { parentId: p.parentId, type: 'screentime', title: reason === 'screen_time' ? 'Daily limit reached' : 'Restricted app blocked', body: app, data: { app, reason, durationMs } });
  return { ok: true };
};
