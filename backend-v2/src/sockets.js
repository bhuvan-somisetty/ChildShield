// Socket.IO realtime layer. Clients authenticate with their JWT in the
// handshake; parent and child of a pairing share a room so events flow both
// ways. Presence (online/offline) is tracked in the device registry.
import { Repo, now } from './db.js';
import { verify } from './auth.js';
import * as svc from './services.js';
import { isAdminEmail, adminRoom } from './admin.js';

const devices = Repo('devices');
const pairings = Repo('pairings');
const parents = Repo('parents');

const setPresence = (io, auth, online) => {
  if (auth.role === 'child') {
    const dev = devices.find((d) => d.ownerType === 'child' && d.ownerId === auth.childId);
    if (dev) devices.update(dev.id, { online, lastSeen: now() });
    if (auth.parentId) io.to(svc.room.parent(auth.parentId)).emit('presence', { childId: auth.childId, online });
  }
};

export default function attachSockets(io) {
  // Handshake authentication.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const claims = verify(token);
    if (!claims) return next(new Error('unauthorized'));
    socket.auth = claims;
    next();
  });

  io.on('connection', (socket) => {
    const a = socket.auth;

    // Join rooms: own pairing(s) + role room.
    if (a.role === 'parent') {
      socket.join(svc.room.parent(a.parentId));
      pairings.filter((p) => p.parentId === a.parentId).forEach((p) => socket.join(svc.room.pairing(p.id)));
      // Platform admins also join the shared admin room for live support updates.
      const p = parents.byId(a.parentId);
      if (p && isAdminEmail(p.email)) socket.join(adminRoom());
    } else {
      socket.join(svc.room.child(a.childId));
      if (a.pairingId) socket.join(svc.room.pairing(a.pairingId));
    }
    setPresence(io, a, true);
    socket.emit('ready', { role: a.role });

    /* ── Chat ──────────────────────────────────────────────────────────── */
    socket.on('chat:send', ({ pairingId, text } = {}, ack) => {
      const msg = svc.sendMessage(io, { pairingId, from: a.role, text });
      if (typeof ack === 'function') ack(msg ? { ok: true, message: msg } : { ok: false });
    });
    socket.on('chat:typing', ({ pairingId, isTyping } = {}) => svc.setTyping(io, { pairingId, from: a.role, isTyping }));
    socket.on('chat:read', ({ pairingId, ids } = {}) => svc.markRead(io, { pairingId, reader: a.role, ids }));

    /* ── SOS (child → parent) ──────────────────────────────────────────── */
    socket.on('sos:trigger', ({ location } = {}, ack) => {
      const evt = a.role === 'child' ? svc.triggerSOS(io, { childId: a.childId, location }) : null;
      if (typeof ack === 'function') ack(evt ? { ok: true, sos: evt } : { ok: false });
    });
    socket.on('sos:resolve', ({ sosId } = {}) => { if (a.role === 'parent') svc.resolveSOS(io, { sosId }); });

    /* ── Telemetry (child → parent) ────────────────────────────────────── */
    socket.on('location:update', ({ lat, lng, accuracy } = {}) => { if (a.role === 'child') svc.updateLocation(io, { childId: a.childId, lat, lng, accuracy }); });
    socket.on('battery:update', ({ level, charging } = {}) => { if (a.role === 'child') svc.updateBattery(io, { childId: a.childId, level, charging }); });

    /* ── App requests ──────────────────────────────────────────────────── */
    socket.on('request:create', ({ type, app, category, reason } = {}, ack) => {
      const req = a.role === 'child' ? svc.createRequest(io, { childId: a.childId, type, app, category, reason }) : null;
      if (typeof ack === 'function') ack(req ? { ok: true, request: req } : { ok: false });
    });
    socket.on('request:decide', ({ requestId, decision } = {}) => { if (a.role === 'parent') svc.decideRequest(io, { requestId, decision }); });

    /* ── WebRTC monitoring (Phase 3) ───────────────────────────────────── */
    // Pure relay within the pairing room: the server never sees media, only the
    // consent handshake + SDP/ICE signalling. `socket.to(room)` excludes sender,
    // so a parent's request reaches the child and the child's offer reaches the
    // parent. Each message carries { pairingId, kind } to keep camera/audio/
    // screen sessions independent.
    const MONITOR_EVENTS = ['monitor:request', 'monitor:accept', 'monitor:decline', 'monitor:stop', 'monitor:control', 'webrtc:signal'];
    MONITOR_EVENTS.forEach((evt) => socket.on(evt, (data = {}) => {
      const pid = data.pairingId;
      if (!pid) return;
      // Only relay into rooms this socket belongs to (authorization).
      if (!socket.rooms.has(svc.room.pairing(pid))) return;
      socket.to(svc.room.pairing(pid)).emit(evt, { ...data, from: a.role });
    }));

    /* ── Android enforcement reports (child native agent → parent) ───────── */
    socket.on('enforce:install', (d = {}) => { if (a.role === 'child') svc.reportInstall(io, { childId: a.childId, app: d.app, category: d.category, pkg: d.pkg }); });
    socket.on('enforce:uninstall', (d = {}) => { if (a.role === 'child') svc.reportUninstall(io, { childId: a.childId, app: d.app }); });
    socket.on('enforce:security', (d = {}) => { if (a.role === 'child') svc.reportSecurity(io, { childId: a.childId, kind: d.kind, detail: d.detail, risk: d.risk, app: d.app }); });
    socket.on('enforce:tamper', (d = {}) => { if (a.role === 'child') svc.reportSecurity(io, { childId: a.childId, kind: `tamper:${d.kind || 'attempt'}`, detail: 'AlphaGuard tamper attempt', risk: 'high' }); });
    socket.on('enforce:screentime', (d = {}) => { if (a.role === 'child') svc.reportScreenLock(io, { childId: a.childId, app: d.app, reason: d.reason }); });

    socket.on('disconnect', () => setPresence(io, a, false));
  });
}
