// REST API. Auth + pairing + device registry, plus read endpoints for initial
// hydration and write endpoints that mirror the socket events (so a client can
// work even before the socket connects).
import { Router } from 'express';
import { Repo, id, now } from './db.js';
import { hashPassword, comparePassword, sign, requireAuth, requireParent, requireChild } from './auth.js';
import * as svc from './services.js';

const parents = Repo('parents');
const children = Repo('children');
const pairings = Repo('pairings');
const devices = Repo('devices');
const messages = Repo('messages');
const sos = Repo('sos');
const locations = Repo('locations');
const battery = Repo('battery');
const permissions = Repo('permissions');
const notifications = Repo('notifications');
const requests = Repo('appRequests');
const securityAlerts = Repo('securityAlerts');

const code6 = () => String(Math.floor(100000 + Math.random() * 900000));
const publicParent = (p) => ({ id: p.id, email: p.email, name: p.name });
const publicChild = (c) => ({ id: c.id, name: c.name, age: c.age, grade: c.grade, school: c.school, emoji: c.emoji, color: c.color, parentId: c.parentId });

export default function buildRoutes(io) {
  const r = Router();

  /* ── Auth: parent accounts ───────────────────────────────────────────── */
  r.post('/auth/parent/register', async (req, res) => {
    const { email, password, name } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    if (parents.find((p) => p.email === email.toLowerCase())) return res.status(409).json({ error: 'Email already registered' });
    const p = parents.insert({ email: email.toLowerCase(), passwordHash: await hashPassword(password), name: name || 'Parent' });
    res.json({ token: sign({ sub: p.id, role: 'parent', parentId: p.id }), parent: publicParent(p) });
  });

  r.post('/auth/parent/login', async (req, res) => {
    const { email, password } = req.body || {};
    const p = parents.find((x) => x.email === (email || '').toLowerCase());
    if (!p || !(await comparePassword(password || '', p.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: sign({ sub: p.id, role: 'parent', parentId: p.id }), parent: publicParent(p) });
  });

  r.get('/me', requireAuth, (req, res) => {
    if (req.auth.role === 'parent') return res.json({ role: 'parent', parent: publicParent(parents.byId(req.auth.parentId)) });
    const c = children.byId(req.auth.childId);
    res.json({ role: 'child', child: c ? publicChild(c) : null, pairingId: req.auth.pairingId });
  });

  /* ── Pairing + child accounts + device registry ──────────────────────── */
  // Parent creates a child and a pending pairing (returns a 6-digit code).
  r.post('/children', requireParent, (req, res) => {
    const { name, age, grade, school, emoji, color } = req.body || {};
    const c = children.insert({ name: name || 'Child', age: age || 10, grade: grade || '', school: school || '', emoji: emoji || '🧒', color: color || '#10b981', parentId: req.auth.parentId });
    const pairing = pairings.insert({ code: code6(), parentId: req.auth.parentId, childId: c.id, status: 'pending' });
    res.json({ child: publicChild(c), pairing: { id: pairing.id, code: pairing.code, status: pairing.status } });
  });

  r.get('/children', requireParent, (req, res) => {
    const list = children.filter((c) => c.parentId === req.auth.parentId).map((c) => {
      const pairing = pairings.find((p) => p.childId === c.id);
      const dev = devices.find((d) => d.ownerType === 'child' && d.ownerId === c.id);
      return { ...publicChild(c), pairing: pairing ? { id: pairing.id, status: pairing.status, code: pairing.code } : null, online: dev ? dev.online : false, battery: battery.find((b) => b.childId === c.id) || null };
    });
    res.json({ children: list });
  });

  // Child device claims a pairing code → gets a child token + registers device.
  r.post('/pair/claim', (req, res) => {
    const { code, platform } = req.body || {};
    const pairing = pairings.find((p) => p.code === code && p.status === 'pending');
    if (!pairing) return res.status(404).json({ error: 'Invalid or used code' });
    pairings.update(pairing.id, { status: 'active', pairedAt: now() });
    const c = children.byId(pairing.childId);
    const dev = devices.insert({ ownerType: 'child', ownerId: c.id, platform: platform || 'android', online: false, lastSeen: now() });
    const token = sign({ sub: c.id, role: 'child', childId: c.id, parentId: pairing.parentId, pairingId: pairing.id, deviceId: dev.id });
    // Notify parent that pairing completed.
    io.to(svc.room.parent(pairing.parentId)).emit('pair:active', { pairingId: pairing.id, child: publicChild(c) });
    res.json({ token, child: publicChild(c), pairingId: pairing.id, deviceId: dev.id });
  });

  r.get('/pair/status', requireParent, (req, res) => {
    res.json({ pairings: pairings.filter((p) => p.parentId === req.auth.parentId).map((p) => ({ id: p.id, code: p.code, status: p.status, childId: p.childId })) });
  });

  r.get('/devices', requireParent, (req, res) => {
    const childIds = children.filter((c) => c.parentId === req.auth.parentId).map((c) => c.id);
    res.json({ devices: devices.filter((d) => d.ownerType === 'child' && childIds.includes(d.ownerId)) });
  });

  /* ── Dev/demo: one-call session for the two existing apps ────────────── */
  // Idempotently provisions a demo parent + child + ACTIVE pairing and returns a
  // token for each, both bound to the SAME pairing — so the parent app and child
  // app (separate tabs/devices) converge on one room for WebRTC monitoring.
  r.post('/dev/demo-pairing', async (_req, res) => {
    let p = parents.find((x) => x.email === 'demo@alphaguard.ai');
    if (!p) p = parents.insert({ email: 'demo@alphaguard.ai', passwordHash: await hashPassword('demo'), name: 'Demo Parent' });
    let c = children.find((x) => x.parentId === p.id);
    if (!c) c = children.insert({ name: 'Emma', age: 10, grade: 'Grade 5', school: 'Lincoln Elementary', emoji: '👧', color: '#10b981', parentId: p.id });
    let pairing = pairings.find((x) => x.childId === c.id);
    if (!pairing) pairing = pairings.insert({ code: code6(), parentId: p.id, childId: c.id, status: 'active', pairedAt: now() });
    else if (pairing.status !== 'active') pairings.update(pairing.id, { status: 'active', pairedAt: now() });
    if (!devices.find((d) => d.ownerType === 'child' && d.ownerId === c.id)) devices.insert({ ownerType: 'child', ownerId: c.id, platform: 'android', online: false, lastSeen: now() });
    res.json({
      parentToken: sign({ sub: p.id, role: 'parent', parentId: p.id }),
      childToken: sign({ sub: c.id, role: 'child', childId: c.id, parentId: p.id, pairingId: pairing.id }),
      pairingId: pairing.id, childId: c.id, child: publicChild(c),
    });
  });

  /* ── Chat ────────────────────────────────────────────────────────────── */
  r.get('/chat/:pairingId/messages', requireAuth, (req, res) => {
    res.json({ messages: messages.filter((m) => m.pairingId === req.params.pairingId).sort((a, b) => a.at - b.at) });
  });
  r.post('/chat/:pairingId/messages', requireAuth, (req, res) => {
    const from = req.auth.role === 'parent' ? 'parent' : 'child';
    const msg = svc.sendMessage(io, { pairingId: req.params.pairingId, from, text: (req.body || {}).text });
    if (!msg) return res.status(404).json({ error: 'pairing not found' });
    res.json({ message: msg });
  });

  /* ── SOS ─────────────────────────────────────────────────────────────── */
  r.post('/sos', requireChild, (req, res) => {
    const evt = svc.triggerSOS(io, { childId: req.auth.childId, location: (req.body || {}).location });
    if (!evt) return res.status(404).json({ error: 'no active pairing' });
    res.json({ sos: evt });
  });
  r.get('/sos', requireParent, (req, res) => res.json({ sos: sos.filter((s) => s.parentId === req.auth.parentId).sort((a, b) => b.at - a.at) }));
  r.post('/sos/:id/resolve', requireParent, (req, res) => res.json({ sos: svc.resolveSOS(io, { sosId: req.params.id }) }));

  /* ── Telemetry: location + battery ───────────────────────────────────── */
  r.post('/location', requireChild, (req, res) => res.json({ location: svc.updateLocation(io, { childId: req.auth.childId, ...(req.body || {}) }) }));
  r.get('/location/:childId', requireParent, (req, res) => res.json({ location: locations.find((l) => l.childId === req.params.childId) || null }));
  r.post('/battery', requireChild, (req, res) => res.json({ battery: svc.updateBattery(io, { childId: req.auth.childId, ...(req.body || {}) }) }));
  r.get('/battery/:childId', requireParent, (req, res) => res.json({ battery: battery.find((b) => b.childId === req.params.childId) || null }));

  /* ── Permissions ─────────────────────────────────────────────────────── */
  r.post('/permissions', requireAuth, (req, res) => {
    const { key, status } = req.body || {};
    const ownerType = req.auth.role; const ownerId = req.auth.role === 'parent' ? req.auth.parentId : req.auth.childId;
    const rec = permissions.upsert((p) => p.ownerType === ownerType && p.ownerId === ownerId && p.key === key, { ownerType, ownerId, key, status, at: now() });
    res.json({ permission: rec });
  });
  r.get('/permissions', requireAuth, (req, res) => {
    const ownerId = req.auth.role === 'parent' ? req.auth.parentId : req.auth.childId;
    res.json({ permissions: permissions.filter((p) => p.ownerId === ownerId) });
  });

  /* ── App requests ────────────────────────────────────────────────────── */
  r.post('/requests', requireChild, (req, res) => {
    const reqRec = svc.createRequest(io, { childId: req.auth.childId, ...(req.body || {}) });
    if (!reqRec) return res.status(404).json({ error: 'no active pairing' });
    res.json({ request: reqRec });
  });
  r.get('/requests', requireParent, (req, res) => res.json({ requests: requests.filter((x) => x.parentId === req.auth.parentId).sort((a, b) => b.at - a.at) }));
  r.post('/requests/:id/decide', requireParent, (req, res) => {
    const dec = (req.body || {}).decision;
    if (!['approved', 'rejected'].includes(dec)) return res.status(400).json({ error: 'decision must be approved|rejected' });
    res.json({ request: svc.decideRequest(io, { requestId: req.params.id, decision: dec }) });
  });

  /* ── Android enforcement (REST mirror of the socket reports) ─────────── */
  r.post('/enforce/install', requireChild, (req, res) => res.json({ request: svc.reportInstall(io, { childId: req.auth.childId, ...(req.body || {}) }) }));
  r.post('/enforce/uninstall', requireChild, (req, res) => res.json({ ok: !!svc.reportUninstall(io, { childId: req.auth.childId, ...(req.body || {}) }) }));
  r.post('/enforce/security', requireChild, (req, res) => res.json({ alert: svc.reportSecurity(io, { childId: req.auth.childId, ...(req.body || {}) }) }));
  r.post('/enforce/screentime', requireChild, (req, res) => res.json({ ok: !!svc.reportScreenLock(io, { childId: req.auth.childId, ...(req.body || {}) }) }));
  r.get('/security-alerts', requireParent, (req, res) => res.json({ alerts: securityAlerts.filter((s) => s.parentId === req.auth.parentId).sort((a, b) => b.at - a.at) }));

  /* ── Safe Zones + zone history (Phase 6B) ────────────────────────────── */
  r.post('/zones', requireParent, (req, res) => {
    const b = req.body || {};
    // Bind the zone to the parent's (first active) child pairing.
    const c = children.find((x) => x.parentId === req.auth.parentId && (!b.childId || x.id === b.childId));
    const pairing = c && pairings.find((p) => p.childId === c.id);
    if (!c || !pairing) return res.status(400).json({ error: 'no paired child' });
    res.json({ zone: svc.createZone(io, { parentId: req.auth.parentId, childId: c.id, pairingId: pairing.id, name: b.name, type: b.type, lat: b.lat, lng: b.lng, radius: b.radius, address: b.address, expectedArrival: b.expectedArrival, expectedDeparture: b.expectedDeparture, graceMin: b.graceMin }) });
  });
  r.get('/zones', requireParent, (req, res) => res.json({ zones: svc.listZonesForParent(req.auth.parentId) }));
  r.delete('/zones/:id', requireParent, (req, res) => res.json(svc.deleteZone(io, { id: req.params.id }) || { error: 'not found' }));
  r.get('/zone-events', requireParent, (req, res) => res.json({ events: Repo('zoneEvents').filter((e) => e.parentId === req.auth.parentId).sort((a, b) => b.at - a.at) }));

  /* ── Notifications ───────────────────────────────────────────────────── */
  r.get('/notifications', requireParent, (req, res) => res.json({ notifications: notifications.filter((n) => n.parentId === req.auth.parentId).sort((a, b) => b.at - a.at) }));
  r.post('/notifications/:id/read', requireParent, (req, res) => res.json({ notification: notifications.update(req.params.id, { read: true }) }));

  return r;
}
