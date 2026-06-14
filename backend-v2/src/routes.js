// REST API. Auth + pairing + device registry, plus read endpoints for initial
// hydration and write endpoints that mirror the socket events (so a client can
// work even before the socket connects).
import { Router } from 'express';
import { Repo, id, now } from './db.js';
import { hashPassword, comparePassword, sign, requireAuth, requireParent, requireChild } from './auth.js';
import { googleEnabled, googleClientId, verifyGoogleCode } from './google.js';
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
    const { email, password, name, pin } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: 'email & password required' });
    if (!/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'Invalid email address' });
    if (String(password).length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (pin != null && pin !== '' && !/^\d{6}$/.test(String(pin))) return res.status(400).json({ error: 'PIN must be 6 digits' });
    if (parents.find((p) => p.email === email.toLowerCase())) return res.status(409).json({ error: 'Email already registered' });
    const p = parents.insert({
      email: email.toLowerCase(),
      passwordHash: await hashPassword(password),
      pinHash: pin ? await hashPassword(String(pin)) : null,
      name: name || 'Parent',
    });
    res.json({ token: sign({ sub: p.id, role: 'parent', parentId: p.id }), parent: publicParent(p) });
  });

  // Public: lets signup surface a "already registered" error immediately,
  // before the user finishes the multi-step form.
  r.get('/auth/parent/email-available', (req, res) => {
    const email = String(req.query.email || '').toLowerCase().trim();
    if (!/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'Invalid email address' });
    res.json({ available: !parents.find((p) => p.email === email) });
  });

  r.post('/auth/parent/login', async (req, res) => {
    const { email, password } = req.body || {};
    const p = parents.find((x) => x.email === (email || '').toLowerCase());
    // Google-only accounts have no passwordHash → password login must be rejected.
    if (!p || !p.passwordHash || !(await comparePassword(password || '', p.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
    res.json({ token: sign({ sub: p.id, role: 'parent', parentId: p.id }), parent: publicParent(p) });
  });

  /* ── Auth: Google (authorization-code popup flow) ─────────────────────── */
  // Public: lets the frontend learn the client id + whether Google is enabled.
  r.get('/auth/google/config', (_req, res) => res.json({ enabled: googleEnabled(), clientId: googleClientId() }));

  // Verifies the Google identity server-side (code → tokens → verified id_token),
  // then finds or creates the parent account. The client never asserts identity.
  r.post('/auth/google', async (req, res) => {
    if (!googleEnabled()) return res.status(503).json({ error: 'Google sign-in is not configured' });
    let identity;
    try { identity = await verifyGoogleCode((req.body || {}).code); }
    catch (e) { return res.status(401).json({ error: e.message || 'Google verification failed' }); }
    let p = parents.find((x) => x.googleId === identity.sub) || parents.find((x) => x.email === identity.email);
    let created = false;
    if (!p) {
      p = parents.insert({ email: identity.email, name: identity.name, googleId: identity.sub, passwordHash: null, pinHash: null });
      created = true;
    } else if (!p.googleId) {
      parents.update(p.id, { googleId: identity.sub }); // link Google to an existing email account
    }
    res.json({ token: sign({ sub: p.id, role: 'parent', parentId: p.id }), parent: publicParent(p), needsPin: !p.pinHash, created });
  });

  // Verify the 6-digit Security PIN before allowing sensitive parental actions.
  r.post('/auth/parent/verify-pin', requireParent, async (req, res) => {
    const p = parents.byId(req.auth.parentId);
    const ok = !!(p && p.pinHash) && await comparePassword(String((req.body || {}).pin || ''), p.pinHash);
    res.json({ ok });
  });

  // Set/replace the Security PIN for the authenticated parent (used by the Google
  // signup flow, where the account exists before the PIN is chosen).
  r.post('/auth/parent/set-pin', requireParent, async (req, res) => {
    const pin = String((req.body || {}).pin || '');
    if (!/^\d{6}$/.test(pin)) return res.status(400).json({ error: 'PIN must be 6 digits' });
    const p = parents.byId(req.auth.parentId);
    if (!p) return res.status(404).json({ error: 'Parent not found' });
    parents.update(p.id, { pinHash: await hashPassword(pin) });
    res.json({ ok: true });
  });

  // Permanently delete the authenticated parent account and everything it owns
  // (children, pairings, devices, telemetry, chat, zones, settings). Used by the
  // Delete Account flow — server-side erasure to match the client logout wipe.
  r.delete('/me', requireParent, (req, res) => {
    const pid = req.auth.parentId;
    const kids = children.filter((c) => c.parentId === pid).map((c) => c.id);
    const pairIds = pairings.filter((p) => p.parentId === pid).map((p) => p.id);
    const rm = (repo, pred) => repo.filter(pred).forEach((row) => repo.remove(row.id));
    rm(messages, (m) => pairIds.includes(m.pairingId));
    rm(devices, (d) => d.ownerType === 'child' && kids.includes(d.ownerId));
    rm(locations, (l) => kids.includes(l.childId));
    rm(battery, (b) => kids.includes(b.childId));
    rm(permissions, (x) => x.ownerId === pid || kids.includes(x.ownerId));
    rm(sos, (s) => s.parentId === pid);
    rm(notifications, (n) => n.parentId === pid);
    rm(requests, (x) => x.parentId === pid);
    rm(securityAlerts, (s) => s.parentId === pid);
    rm(Repo('safeZones'), (z) => z.parentId === pid);
    rm(Repo('zoneEvents'), (e) => e.parentId === pid);
    rm(Repo('settings'), (s) => s.ownerId === pid || kids.includes(s.ownerId));
    rm(pairings, (p) => p.parentId === pid);
    rm(children, (c) => c.parentId === pid);
    parents.remove(pid);
    res.json({ ok: true });
  });

  r.get('/me', requireAuth, (req, res) => {
    if (req.auth.role === 'parent') {
      const p = parents.byId(req.auth.parentId);
      if (!p) return res.status(401).json({ error: 'Account no longer exists' }); // deleted account, stale token
      return res.json({ role: 'parent', parent: publicParent(p) });
    }
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
  // A code that exists but is no longer pending (revoked by a regenerate, or
  // already claimed) is rejected with a distinct, actionable message.
  r.post('/pair/claim', (req, res) => {
    const { code, platform } = req.body || {};
    const byCode = pairings.find((p) => p.code === code);
    if (!byCode) return res.status(404).json({ error: 'Invalid pairing code.' });
    if (byCode.status !== 'pending') return res.status(409).json({ error: 'Pairing request is no longer valid. Ask your parent to generate a new code.' });
    const pairing = byCode;
    pairings.update(pairing.id, { status: 'active', pairedAt: now() });
    const c = children.byId(pairing.childId);
    const dev = devices.insert({ ownerType: 'child', ownerId: c.id, platform: platform || 'android', online: false, lastSeen: now() });
    const token = sign({ sub: c.id, role: 'child', childId: c.id, parentId: pairing.parentId, pairingId: pairing.id, deviceId: dev.id });
    // Notify parent that pairing completed.
    io.to(svc.room.parent(pairing.parentId)).emit('pair:active', { pairingId: pairing.id, child: publicChild(c) });
    res.json({ token, child: publicChild(c), pairingId: pairing.id, deviceId: dev.id });
  });

  // Regenerate the pairing code/QR for a child. Enforces exactly ONE active
  // (pending) pairing request per child: every existing pending request is
  // revoked first, so the old code + old QR immediately stop working, then a new
  // unique code is minted. The QR payload is derived from the code, so a new code
  // is a new QR.
  r.post('/pair/regenerate', requireParent, (req, res) => {
    const { childId } = req.body || {};
    const c = childId
      ? children.byId(childId)
      : children.find((x) => x.parentId === req.auth.parentId);
    if (!c || c.parentId !== req.auth.parentId) return res.status(404).json({ error: 'Child not found' });
    // Invalidate every still-pending request for this child.
    pairings.filter((p) => p.childId === c.id && p.status === 'pending').forEach((p) => pairings.update(p.id, { status: 'revoked', revokedAt: now() }));
    // Mint a fresh, collision-free code.
    let code; do { code = code6(); } while (pairings.find((p) => p.code === code));
    const pairing = pairings.insert({ code, parentId: req.auth.parentId, childId: c.id, status: 'pending' });
    res.json({ child: publicChild(c), pairing: { id: pairing.id, code: pairing.code, status: pairing.status } });
  });

  // Revoke (without replacing) every pending pairing request for a child — used
  // when the parent stops the pairing process. The old code + old QR immediately
  // become invalid; no new request is created.
  r.post('/pair/revoke', requireParent, (req, res) => {
    const { childId } = req.body || {};
    const c = childId
      ? children.byId(childId)
      : children.find((x) => x.parentId === req.auth.parentId);
    if (!c || c.parentId !== req.auth.parentId) return res.status(404).json({ error: 'Child not found' });
    let revoked = 0;
    pairings.filter((p) => p.childId === c.id && p.status === 'pending').forEach((p) => { pairings.update(p.id, { status: 'revoked', revokedAt: now() }); revoked += 1; });
    res.json({ ok: true, revoked });
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
