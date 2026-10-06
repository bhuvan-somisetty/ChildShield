// Socket.IO realtime layer. Clients authenticate with their JWT in the
// handshake; parent and child of a pairing share a room so events flow both
// ways. Presence (online/offline) is tracked in the device registry.
import { Repo, now } from './db.js';
import { verify } from './auth.js';
import * as svc from './services.js';
import { isAdminEmail, adminRoom } from './admin.js';
import { limitKey } from './security.js';

const devices = Repo('devices');
const pairings = Repo('pairings');
const parents = Repo('parents');
const sos = Repo('sos');
const appRequests = Repo('appRequests');
const familyMembers = Repo('familyMembers');
const children = Repo('children');

const setPresence = (io, auth, online) => {
  if (auth.role === 'child') {
    const dev = devices.find((d) => d.ownerType === 'child' && d.ownerId === auth.childId);
    if (dev) devices.update(dev.id, { online, lastSeen: now() });
    const c = children.byId(auth.childId);
    const fid = c ? (c.familyId || c.parentId) : auth.parentId;
    if (fid) io.to(svc.room.parent(fid)).emit('presence', { childId: auth.childId, online });
    // Persist device online/offline as a radar event for the timeline.
    const pairing = pairings.find((p) => p.childId === auth.childId && p.status === 'active');
    if (pairing) svc.reportPresenceEvent(io, { childId: auth.childId, parentId: pairing.parentId, online });
  }
};

const getParentRoleAndPermissions = (parentId, childId) => {
  let childFamilyId;
  if (childId) {
    const c = children.byId(childId);
    if (c) childFamilyId = c.familyId || c.parentId;
    else return null;
  }
  
  const members = familyMembers.filter((m) => m.userId === parentId);
  if (childFamilyId) {
    const m = members.find((x) => x.familyId === childFamilyId);
    if (m) return { role: m.role, permissions: m.permissions || [] };
    if (parentId === childFamilyId) {
      return { role: 'primary_parent', permissions: ['manage_family', 'manage_children', 'manage_devices', 'manage_permissions', 'remove_members'] };
    }
    return null; // no access
  }
  
  if (members.length > 0) {
    return { role: members[0].role, permissions: members[0].permissions || [], familyId: members[0].familyId };
  }
  return null;
};

const verifyAccess = (auth, action, childId) => {
  if (auth.role === 'child') {
    if (childId && auth.childId !== childId) return false;
    return true; // child has child permission
  }
  
  const roleInfo = getParentRoleAndPermissions(auth.parentId, childId);
  if (!roleInfo) return false;
  
  if (roleInfo.role === 'primary_parent') return true;
  
  if (roleInfo.role === 'co_parent') {
    if (['manage_family', 'remove_members', 'manage_permissions'].includes(action)) return false;
    return true;
  }
  
  if (roleInfo.role === 'guardian') {
    if (action.startsWith('manage_') || action.startsWith('create_') || action.startsWith('delete_') || action.startsWith('update_') || action === 'cycle_task') {
      return false;
    }
    return true;
  }
  
  return false;
};

export default function attachSockets(io) {
  // Handshake authentication.
  io.use((socket, next) => {
    // Throttle handshake attempts per IP to blunt connection floods / token
    // guessing before we even parse the token.
    const ip = (socket.handshake.headers['x-forwarded-for'] || '').split(',')[0].trim() || socket.handshake.address || 'unknown';
    if (!limitKey(`ws-handshake:${ip}`, 60, 60_000)) return next(new Error('rate_limited'));
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    const claims = verify(token);
    if (!claims) return next(new Error('unauthorized'));
    socket.auth = claims;
    next();
  });

  io.on('connection', (socket) => {
    const a = socket.auth;
    // A socket may only act on a pairing it actually joined (own family). The
    // membership set is the authorization boundary for every pairing-scoped
    // event — mirrors the REST ownership checks so neither transport can be used
    // to reach another family's data.
    const inPairing = (pairingId) => !!pairingId && socket.rooms.has(svc.room.pairing(pairingId));

    // Join rooms: own pairing(s) + role room.
    if (a.role === 'parent') {
      socket.join(svc.room.parent(a.parentId));
      
      // Query all family memberships of the parent
      const fams = familyMembers.filter((m) => m.userId === a.parentId).map((m) => m.familyId);
      
      // Fallback to their own parentId family to maintain backward compatibility
      if (!fams.includes(a.parentId)) {
        fams.push(a.parentId);
      }
      
      fams.forEach((fid) => {
        // Join the family owner's room so presence/SOS events reach this parent
        socket.join(svc.room.parent(fid));
        
        // Find pairings for children belonging to this family
        const kids = children.filter((c) => c.familyId === fid || c.parentId === fid).map((c) => c.id);
        pairings.filter((p) => kids.includes(p.childId)).forEach((p) => socket.join(svc.room.pairing(p.id)));
      });
      
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
      if (!inPairing(pairingId)) { if (typeof ack === 'function') ack({ ok: false }); return; }
      const msg = svc.sendMessage(io, { pairingId, from: a.role, text });
      if (typeof ack === 'function') ack(msg ? { ok: true, message: msg } : { ok: false });
    });
    socket.on('chat:typing', ({ pairingId, isTyping } = {}) => { if (inPairing(pairingId)) svc.setTyping(io, { pairingId, from: a.role, isTyping }); });
    socket.on('chat:read', ({ pairingId, ids } = {}) => { if (inPairing(pairingId)) svc.markRead(io, { pairingId, reader: a.role, ids }); });

    /* ── SOS (child → parent) ──────────────────────────────────────────── */
    socket.on('sos:trigger', ({ location } = {}, ack) => {
      const evt = a.role === 'child' ? svc.triggerSOS(io, { childId: a.childId, location }) : null;
      if (typeof ack === 'function') ack(evt ? { ok: true, sos: evt } : { ok: false });
    });
    socket.on('sos:resolve', ({ sosId } = {}) => {
      if (a.role !== 'parent') return;
      const evt = sos.byId(sosId);
      if (evt && verifyAccess(a, 'manage_children', evt.childId)) svc.resolveSOS(io, { sosId });
    });

    /* ── Telemetry (child → parent) ────────────────────────────────────── */
    socket.on('location:update', ({ lat, lng, accuracy, speed } = {}) => { if (a.role === 'child') svc.updateLocation(io, { childId: a.childId, lat, lng, accuracy, speed }); });
    socket.on('battery:update', ({ level, charging } = {}) => { if (a.role === 'child') svc.updateBattery(io, { childId: a.childId, level, charging }); });

    /* ── App requests ──────────────────────────────────────────────────── */
    socket.on('request:create', ({ type, app, category, reason } = {}, ack) => {
      const req = a.role === 'child' ? svc.createRequest(io, { childId: a.childId, type, app, category, reason }) : null;
      if (typeof ack === 'function') ack(req ? { ok: true, request: req } : { ok: false });
    });
    socket.on('request:decide', ({ requestId, decision } = {}) => {
      if (a.role !== 'parent') return;
      const reqRec = appRequests.byId(requestId);
      if (reqRec && verifyAccess(a, 'manage_children', reqRec.childId)) svc.decideRequest(io, { requestId, decision });
    });

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
