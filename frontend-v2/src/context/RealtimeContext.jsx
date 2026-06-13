import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { CHILDREN, notificationsFor } from '../data/childDemo';
import { ensureSession, serverBase } from '../lib/session';

// The single real child the backend pairs is shown in the demo UI as Emma.
const LIVE_CHILD = 'emma';

const zoneLabel = (ev = {}) => {
  const verb = { enter: 'Entered', exit: 'Exited', late: 'Late arrival at', missed: 'Missed arrival at', stayed: 'Stayed longer at' }[ev.type] || 'Safe Zone';
  return `${verb} ${ev.zoneName || ''}`.trim();
};

// Security-alert presentation helpers.
const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : 'Medium');
const secLabel = (kind = '') => {
  if (kind.startsWith('tamper')) return 'Uninstall / Tamper Attempt';
  return { vpn: 'VPN Detected', proxy: 'Proxy Detected', dns: 'DNS Manipulation', mock_location: 'Mock Location', location_jump: 'Location Spoofing', app_access_request: 'App Access Request', app_uninstall: 'App Uninstalled' }[kind] || 'Security Alert';
};
const secApp = (kind = '', detail) => detail || secLabel(kind);

/**
 * RealtimeContext — single, event-driven source of truth for live child
 * telemetry, notifications, and approval requests. Backend/WebSocket-ready:
 * everything flows through `ingest(event)`, so a future socket can replace the
 * demo ticker without touching any screen. State is persisted locally so read /
 * archived / approved states survive refreshes.
 */
const RealtimeContext = createContext(null);
export const useRealtime = () => useContext(RealtimeContext);

const K_NOTIFS = 'ag_notifs_v2';
const K_REQS = 'ag_requests_v1';
const K_CAPS = 'ag_captures_v1';
const K_CHAT = 'ag_chat_v1';

const loadJSON = (k, fallback) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };

// Notifications — seed per child from the demo feed, carrying a lifecycle state.
const seedNotifs = () => {
  const saved = loadJSON(K_NOTIFS, {});
  const out = {};
  CHILDREN.forEach((c) => {
    out[c.id] = saved[c.id] || notificationsFor(c).map((n) => ({ ...n, state: n.unread ? 'unread' : 'read' }));
  });
  return out;
};

// Approval requests (install / delete) — child-device events awaiting a parent decision.
const seedRequests = () => loadJSON(K_REQS, [
  { id: 'rq1', type: 'install', app: 'Roblox', cat: 'Gaming', color: '#16a34a', childId: 'liam', childName: 'Liam', reason: 'My friends are playing it', time: '2m', date: 'Jun 12, 2026', status: 'pending' },
  { id: 'rq2', type: 'install', app: 'Discord', cat: 'Social', color: '#6366f1', childId: 'noah', childName: 'Noah', reason: 'Group chat for school project', time: '1h', date: 'Jun 12, 2026', status: 'pending' },
  { id: 'rq3', type: 'delete', app: 'Khan Academy', cat: 'Education', color: '#10b981', childId: 'emma', childName: 'Emma', reason: 'I finished the course', time: '24m', date: 'Jun 12, 2026', status: 'pending' },
]);

// Telemetry — real-device-ready shape. The demo ticker advances timestamps and
// drifts battery so the UI proves the live-update path; a socket would call ingest().
const seedTelemetry = () => {
  const out = {};
  CHILDREN.forEach((c) => {
    out[c.id] = {
      battery: { level: c.battery, charging: c.id === 'emma' || c.id === 'noah', health: c.battery > 80 ? 'Excellent' : c.battery > 30 ? 'Good' : 'Fair', updatedAt: Date.now() },
      online: c.online, network: c.network, lastSyncAt: Date.now(),
    };
  });
  return out;
};

// Parent ↔ child conversation, seeded per child. WebSocket-ready: a socket would
// call receiveChat() on inbound and sendChat() emits outbound.
const seedChats = () => loadJSON(K_CHAT, {
  emma: [
    { id: 'c1', from: 'child', text: 'Hi mom! 👋', at: Date.now() - 7200000, status: 'read' },
    { id: 'c2', from: 'parent', text: 'Hey Emma, how was school today?', at: Date.now() - 7000000, status: 'read' },
    { id: 'c3', from: 'child', text: 'Really good! We had art class 🎨', at: Date.now() - 6800000, status: 'read' },
    { id: 'c4', from: 'parent', text: 'Love that! Home by 4? 🏠', at: Date.now() - 600000, status: 'read' },
  ],
  liam: [
    { id: 'l1', from: 'parent', text: 'Hey Liam, where are you?', at: Date.now() - 3600000, status: 'read' },
    { id: 'l2', from: 'child', text: 'At the skate park with friends', at: Date.now() - 3500000, status: 'read' },
  ],
  noah: [{ id: 'n1', from: 'child', text: 'Staying late for the project 📚', at: Date.now() - 1800000, status: 'read' }],
  mia: [{ id: 'm1', from: 'parent', text: 'Good morning sweetie ☀️', at: Date.now() - 9000000, status: 'delivered' }],
});

let _seq = 1000;
const nextId = () => ++_seq;

export const RealtimeProvider = ({ children }) => {
  const [notifs, setNotifs] = useState(seedNotifs);
  const [requests, setRequests] = useState(seedRequests);
  const [telemetry, setTelemetry] = useState(seedTelemetry);
  const [captures, setCaptures] = useState(() => loadJSON(K_CAPS, []));
  const [chats, setChats] = useState(seedChats);
  const [live, setLive] = useState(false);          // true when the backend socket is connected
  const [detections, setDetections] = useState([]); // live VPN/mock/tamper/uninstall detections from the device
  const [activity, setActivity] = useState({});      // live activity-timeline events per child
  const [zones, setZones] = useState([]);            // backend safe zones (geofenced)
  const [zoneEvents, setZoneEvents] = useState([]);  // live safe-zone enter/exit/late/missed history
  const socketRef = useRef(null);
  const pairingRef = useRef(null);
  const liveRef = useRef(false); liveRef.current = live;

  useEffect(() => { localStorage.setItem(K_NOTIFS, JSON.stringify(notifs)); }, [notifs]);
  useEffect(() => { localStorage.setItem(K_REQS, JSON.stringify(requests)); }, [requests]);
  useEffect(() => { localStorage.setItem(K_CAPS, JSON.stringify(captures)); }, [captures]);
  useEffect(() => { localStorage.setItem(K_CHAT, JSON.stringify(chats)); }, [chats]);

  /* ── Notifications ─────────────────────────────────────────────────────── */
  const addNotif = useCallback((childId, n) => setNotifs((p) => ({ ...p, [childId]: [{ id: nextId(), state: 'unread', time: 'Just now', date: 'Jun 12, 2026', childName: n.childName || '', ...n }, ...(p[childId] || [])] })), []);
  const patchNotif = (childId, id, patch) => setNotifs((p) => ({ ...p, [childId]: (p[childId] || []).map((n) => (n.id === id ? { ...n, ...patch } : n)) }));
  const markRead = useCallback((childId, id) => patchNotif(childId, id, { state: 'read' }), []);
  const markUnread = useCallback((childId, id) => patchNotif(childId, id, { state: 'unread' }), []);
  const archiveNotif = useCallback((childId, id) => patchNotif(childId, id, { state: 'archived' }), []);
  const unarchiveNotif = useCallback((childId, id) => patchNotif(childId, id, { state: 'read' }), []);
  const removeNotif = useCallback((childId, id) => setNotifs((p) => ({ ...p, [childId]: (p[childId] || []).filter((n) => n.id !== id) })), []);
  const markAllRead = useCallback((childId, cat) => setNotifs((p) => ({ ...p, [childId]: (p[childId] || []).map((n) => ((n.state === 'unread' && (!cat || n.cat === cat)) ? { ...n, state: 'read' } : n)) })), []);
  // Opening a category marks its items read (WhatsApp/Instagram behaviour).
  const markCategoryRead = markAllRead;

  const listNotifs = useCallback((childId, { cat, includeArchived = false } = {}) =>
    (notifs[childId] || []).filter((n) => (includeArchived ? true : n.state !== 'archived') && (!cat || n.cat === cat)), [notifs]);
  const archivedNotifs = useCallback((childId) => (notifs[childId] || []).filter((n) => n.state === 'archived'), [notifs]);
  const unreadCount = useCallback((childId, cat) => (notifs[childId] || []).filter((n) => n.state === 'unread' && (!cat || n.cat === cat)).length, [notifs]);

  /* ── Approval requests ─────────────────────────────────────────────────── */
  const pendingRequests = useCallback((childId) => requests.filter((r) => r.status === 'pending' && (!childId || r.childId === childId)), [requests]);
  const requestHistory = useCallback((childId) => requests.filter((r) => r.status !== 'pending' && (!childId || r.childId === childId)), [requests]);
  const pendingCount = useCallback((childId) => pendingRequests(childId).length, [pendingRequests]);

  const decideRequest = useCallback((id, decision) => setRequests((prev) => {
    const r = prev.find((x) => x.id === id);
    if (r) {
      const verb = r.type === 'install' ? (decision === 'approved' ? 'Installation Approved' : 'Installation Rejected') : (decision === 'approved' ? 'Deletion Approved' : 'Deletion Rejected');
      addNotif(r.childId, { type: verb, sub: `${r.app}`, sev: 'low', accent: decision === 'approved' ? '#10b981' : '#ef4444', cat: 'App Usage', childName: r.childName });
    }
    // Sync the decision to the real child device when connected.
    if (liveRef.current && socketRef.current) socketRef.current.emit('request:decide', { requestId: id, decision });
    return prev.map((x) => (x.id === id ? { ...x, status: decision, decidedAt: 'Just now' } : x));
  }), [addNotif]);
  const approveRequest = useCallback((id) => decideRequest(id, 'approved'), [decideRequest]);
  const rejectRequest = useCallback((id) => decideRequest(id, 'rejected'), [decideRequest]);

  /* ── Parent ↔ child chat ───────────────────────────────────────────────── */
  const listChat = useCallback((childId) => chats[childId] || [], [chats]);
  const sendChat = useCallback((childId, text) => {
    const id = `p${nextId()}`;
    setChats((p) => ({ ...p, [childId]: [...(p[childId] || []), { id, from: 'parent', text, at: Date.now(), status: 'sent' }] }));
    // Live: send over the socket to the real child; status comes back via chat:status.
    if (liveRef.current && socketRef.current && childId === LIVE_CHILD && pairingRef.current) {
      socketRef.current.emit('chat:send', { pairingId: pairingRef.current, text });
    } else {
      setTimeout(() => setChats((p) => ({ ...p, [childId]: (p[childId] || []).map((m) => (m.id === id ? { ...m, status: 'delivered' } : m)) })), 700);
      setTimeout(() => setChats((p) => ({ ...p, [childId]: (p[childId] || []).map((m) => (m.id === id ? { ...m, status: 'read' } : m)) })), 1800);
    }
    return id;
  }, []);
  const receiveChat = useCallback((childId, text) => setChats((p) => ({ ...p, [childId]: [...(p[childId] || []), { id: `r${nextId()}`, from: 'child', text, at: Date.now(), status: 'read' }] })), []);

  /* ── Live activity timeline ────────────────────────────────────────────── */
  const addActivity = useCallback((childId, e) => setActivity((p) => ({ ...p, [childId]: [{ id: `a${nextId()}`, time: 'Just now', ...e }, ...(p[childId] || [])].slice(0, 50) })), []);
  const liveActivity = useCallback((childId) => activity[childId] || [], [activity]);

  /* ── Monitoring captures (screen/camera snapshots) ─────────────────────── */
  const addCapture = useCallback((cap) => setCaptures((prev) => [{ id: nextId(), time: 'Just now', date: 'Jun 12, 2026', ...cap }, ...prev].slice(0, 60)), []);
  const listCaptures = useCallback((childId) => captures.filter((c) => !childId || c.childId === childId), [captures]);

  /* ── Telemetry ─────────────────────────────────────────────────────────── */
  const getTelemetry = useCallback((childId) => telemetry[childId], [telemetry]);

  // Single event-driven entry point — a real WebSocket dispatches here.
  const ingest = useCallback((event) => {
    if (!event || !event.type) return;
    if (event.type === 'battery') setTelemetry((p) => ({ ...p, [event.childId]: { ...p[event.childId], battery: { ...p[event.childId].battery, ...event.battery, updatedAt: Date.now() } } }));
    else if (event.type === 'status') setTelemetry((p) => ({ ...p, [event.childId]: { ...p[event.childId], online: event.online, network: event.network ?? p[event.childId].network, lastSyncAt: Date.now() } }));
    else if (event.type === 'notification') addNotif(event.childId, event.notif);
    else if (event.type === 'request') setRequests((prev) => [{ id: `rq${nextId()}`, status: 'pending', time: 'Just now', date: 'Jun 12, 2026', ...event.request }, ...prev]);
  }, [addNotif]);

  // Demo live-telemetry ticker — drifts the demo children. The live child (Emma)
  // is skipped once a real socket is feeding its telemetry.
  useEffect(() => {
    const t = setInterval(() => {
      setTelemetry((p) => {
        const out = { ...p };
        CHILDREN.forEach((c) => {
          if (liveRef.current && c.id === LIVE_CHILD) return; // real data owns Emma
          const d = out[c.id]; if (!d || !d.online) return;
          const charging = d.battery.charging;
          let level = d.battery.level + (charging ? 1 : -1);
          level = Math.max(5, Math.min(100, level));
          out[c.id] = { ...d, battery: { ...d.battery, level, charging: level >= 100 ? false : charging, updatedAt: Date.now() }, lastSyncAt: Date.now() };
        });
        return out;
      });
    }, 15000);
    return () => clearInterval(t);
  }, []);

  // ── Realtime bridge: connect the backend socket and feed live child data into
  // the existing stores. Graceful — if the backend is offline, the app keeps
  // running on the demo ticker/local stores. The single real child shows as Emma.
  useEffect(() => {
    let cancelled = false;
    ensureSession('parent').then((sess) => {
      if (cancelled) return;
      const s = sess.socket; socketRef.current = s; pairingRef.current = sess.pairingId; setLive(true);
      const M = LIVE_CHILD;
      s.on('battery:update', (b) => setTelemetry((p) => ({ ...p, [M]: { ...p[M], battery: { ...p[M].battery, level: b.level, charging: b.charging, updatedAt: Date.now() }, lastSyncAt: Date.now() } })));
      s.on('presence', (pr) => setTelemetry((p) => ({ ...p, [M]: { ...p[M], online: pr.online, lastSyncAt: Date.now() } })));
      s.on('location:update', (loc) => setTelemetry((p) => ({ ...p, [M]: { ...p[M], coords: { lat: loc.lat, lng: loc.lng }, locUpdatedAt: Date.now() } })));
      s.on('sos:alert', (evt) => {
        addNotif(M, { type: 'Emergency SOS', sub: 'Child triggered SOS', sev: 'critical', accent: '#ef4444', cat: 'Emergency', childName: 'Emma' });
        // SOS carries the child's real location → surface it on the radar/emergency immediately.
        if (evt && evt.location) setTelemetry((p) => ({ ...p, [M]: { ...p[M], coords: { lat: evt.location.lat, lng: evt.location.lng }, locUpdatedAt: Date.now() } }));
      });
      s.on('request:new', (r) => setRequests((prev) => (prev.some((x) => x.id === r.id) ? prev : [{ id: r.id, type: r.type, app: r.app, cat: r.category, color: '#16a34a', childId: M, childName: 'Emma', reason: r.reason, time: 'Just now', date: 'Jun 13, 2026', status: 'pending' }, ...prev])));
      s.on('request:update', (r) => setRequests((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: r.status, decidedAt: 'Just now' } : x))));
      s.on('chat:message', (m) => { if (m.from === 'child') setChats((p) => ({ ...p, [M]: [...(p[M] || []), { id: m.id, from: 'child', text: m.text, at: m.at, status: 'read' }] })); });
      s.on('chat:status', (st) => setChats((p) => ({ ...p, [M]: (p[M] || []).map((mm) => (mm.from === 'parent' && mm.status !== 'read' ? { ...mm, status: st.status } : mm)) })));
      // ── Android enforcement events (uninstall/tamper arrive via security:alert) ──
      s.on('screentime:locked', (d) => addNotif(M, { type: d.reason === 'screen_time' ? 'Daily Limit Reached' : 'Restricted App Blocked', sub: d.app || '', sev: 'medium', accent: '#f59e0b', cat: 'Screen Time', childName: 'Emma' }));
      s.on('security:alert', (d) => {
        // (5) Notification Center
        addNotif(M, { type: secLabel(d.kind), sub: d.detail || d.kind, sev: d.risk === 'high' ? 'high' : 'medium', accent: '#ef4444', cat: 'Security Alerts', childName: 'Emma' });
        // (7) Security Center (Detection Center live list)
        setDetections((prev) => [{ id: d.id || `d${nextId()}`, kind: d.kind, app: secApp(d.kind, d.detail), type: secLabel(d.kind), risk: cap(d.risk || 'medium'), time: 'Just now', device: 'Pixel 7' }, ...prev].slice(0, 30));
        // (6) Activity Timeline
        addActivity(M, { type: (d.kind || '').startsWith('tamper') ? 'system' : 'uninstall', title: secLabel(d.kind), sub: d.detail || d.kind, sev: d.risk === 'high' ? 'critical' : 'medium' });
      });
      // ── Safe Zones (geofence events from the backend) ──
      s.on('zones:update', (list) => setZones(Array.isArray(list) ? list : []));
      s.on('zone:event', (evt) => {
        const high = evt.type === 'missed' || evt.type === 'stayed' || evt.type === 'late';
        setZoneEvents((prev) => [evt, ...prev].slice(0, 100));
        addNotif(M, { type: zoneLabel(evt), sub: 'Safe zone alert', sev: high ? 'high' : 'low', accent: '#10b981', cat: 'Safe Zones', childName: 'Emma' });
        addActivity(M, { type: 'zone', title: zoneLabel(evt), sub: evt.zoneType || 'Safe zone', sev: high ? 'high' : 'low' });
      });
      // Hydrate existing zones + history for the radar/manager display.
      fetch(`${serverBase()}/api/zones`, { headers: { Authorization: `Bearer ${sess.token}` } }).then((res) => res.json()).then((d) => { if (d && d.zones) setZones(d.zones); }).catch(() => {});
      fetch(`${serverBase()}/api/zone-events`, { headers: { Authorization: `Bearer ${sess.token}` } }).then((res) => res.json()).then((d) => { if (d && d.events) setZoneEvents(d.events); }).catch(() => {});
      s.on('disconnect', () => setLive(false));
    }).catch(() => { /* backend offline → demo mode */ });
    return () => { cancelled = true; };
  }, []); // eslint-disable-line

  const value = {
    // notifications
    addNotif, markRead, markUnread, archiveNotif, unarchiveNotif, removeNotif, markAllRead, markCategoryRead,
    listNotifs, archivedNotifs, unreadCount,
    // requests
    pendingRequests, requestHistory, pendingCount, approveRequest, rejectRequest,
    // captures
    addCapture, listCaptures,
    // chat
    listChat, sendChat, receiveChat,
    // telemetry
    getTelemetry, ingest,
    // realtime backend status
    live, liveChildId: LIVE_CHILD, liveDetections: detections, liveActivity,
    // safe zones
    liveZones: zones, liveZoneEvents: zoneEvents,
  };
  return <RealtimeContext.Provider value={value}>{children}</RealtimeContext.Provider>;
};
