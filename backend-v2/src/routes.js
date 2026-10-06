// REST API. Auth + pairing + device registry, plus read endpoints for initial
// hydration and write endpoints that mirror the socket events (so a client can
// work even before the socket connects).
import { Router } from 'express';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { Repo, id, now } from './db.js';
import { hashPassword, comparePassword, sign, requireAuth, requireParent, requireChild } from './auth.js';
import { googleEnabled, googleClientId, verifyGoogleCode } from './google.js';
import * as svc from './services.js';
import * as taskSvc from './tasks.js';
import * as growth from './growth.js';
import * as support from './support.js';
import * as productivity from './productivity.js';
import { isAdminEmail } from './admin.js';
import { rateLimit, secureCode6, isProd } from './security.js';
import * as consent from './consent.js';
import * as appversion from './appversion.js';
import * as push from './push.js';
import { requestReset, performReset } from './passwordReset.js';

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
const tasks = Repo('tasks');
const targets = Repo('targets');
const rewards = Repo('rewards');
const supportTickets = Repo('supportTickets');
const featureRequests = Repo('featureRequests');
const recurringTasks = Repo('recurringTasks');
const families = Repo('families');
const familyMembers = Repo('familyMembers');
const familyInvitations = Repo('familyInvitations');

// Platform-admin gate — admin status is decided server-side by email allowlist.
const requireAdminFor = (parents) => (req, res, next) => requireAuth(req, res, () => {
  const p = req.auth.role === 'parent' && parents.byId(req.auth.parentId);
  if (!p || !isAdminEmail(p.email)) return res.status(403).json({ error: 'Admin only' });
  next();
});

// CSPRNG pairing code — Math.random() is predictable and must never gate a
// child-device token grant.
const code6 = secureCode6;
const publicParent = (p) => ({ id: p.id, email: p.email, name: p.name });

const ensureFamily = (parentId) => {
  const p = parents.byId(parentId);
  if (!p) return null;
  let member = familyMembers.find((m) => m.userId === parentId);
  let fam;
  if (!member) {
    fam = families.find((f) => f.ownerId === parentId);
    if (!fam) {
      fam = families.insert({
        id: parentId, // Use parent's ID as the family ID for 100% backward compatibility
        name: `${p.name}'s Family`,
        ownerId: parentId,
      });
    }
    member = familyMembers.insert({
      familyId: fam.id,
      userId: parentId,
      role: 'primary_parent',
      permissions: ['manage_family', 'manage_children', 'manage_devices', 'manage_permissions', 'remove_members'],
    });
  } else {
    fam = families.byId(member.familyId);
  }
  return fam;
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

const getParentFamilies = (parentId) => {
  ensureFamily(parentId);
  return familyMembers.filter((m) => m.userId === parentId).map((m) => m.familyId);
};

// Shared rate limiters for abuse-prone endpoints.
const loginLimiter = rateLimit('auth-login', { max: 10, windowMs: 15 * 60_000, keyOf: (req) => String((req.body || {}).email || '').toLowerCase() });
const registerLimiter = rateLimit('auth-register', { max: 5, windowMs: 60 * 60_000 });
const pinLimiter = rateLimit('auth-pin', { max: 10, windowMs: 15 * 60_000 });
const claimLimiter = rateLimit('pair-claim', { max: 10, windowMs: 10 * 60_000 });
const googleLimiter = rateLimit('auth-google', { max: 20, windowMs: 15 * 60_000 });
const publicChild = (c) => ({ id: c.id, name: c.name, age: c.age, grade: c.grade, school: c.school, emoji: c.emoji, color: c.color, parentId: c.parentId, familyId: c.familyId || c.parentId });

export default function buildRoutes(io) {
  const r = Router();

  /* ── Auth: parent accounts ───────────────────────────────────────────── */
  r.post('/auth/parent/register', registerLimiter, async (req, res) => {
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
    ensureFamily(p.id);
    res.json({ token: sign({ sub: p.id, role: 'parent', parentId: p.id }), parent: publicParent(p) });
  });

  // Public: lets signup surface a "already registered" error immediately,
  // before the user finishes the multi-step form.
  r.get('/auth/parent/email-available', (req, res) => {
    const email = String(req.query.email || '').toLowerCase().trim();
    if (!/.+@.+\..+/.test(email)) return res.status(400).json({ error: 'Invalid email address' });
    res.json({ available: !parents.find((p) => p.email === email) });
  });

  r.post('/auth/parent/login', loginLimiter, async (req, res) => {
    const { email, password } = req.body || {};
    const p = parents.find((x) => x.email === (email || '').toLowerCase());
    // Google-only accounts have no passwordHash → password login must be rejected.
    if (!p || p.deletedAt || !p.passwordHash || !(await comparePassword(password || '', p.passwordHash))) return res.status(401).json({ error: 'Invalid credentials' });
    ensureFamily(p.id);
    res.json({ token: sign({ sub: p.id, role: 'parent', parentId: p.id }), parent: publicParent(p) });
  });

  /* ── Auth: password reset (token + expiry, single-use) ───────────────── */
  const forgotLimiter = rateLimit('auth-forgot', { max: 5, windowMs: 15 * 60_000, keyOf: (req) => String((req.body || {}).email || '').toLowerCase() });
  const resetLimiter = rateLimit('auth-reset', { max: 15, windowMs: 15 * 60_000 });
  r.post('/auth/parent/forgot', forgotLimiter, async (req, res) => {
    // Always 200 (anti-enumeration) — never reveal whether the email exists.
    await requestReset((req.body || {}).email);
    res.json({ ok: true });
  });
  r.post('/auth/parent/reset', resetLimiter, async (req, res) => {
    const b = req.body || {};
    const out = await performReset(b.token, b.password);
    if (out.error) return res.status(400).json({ error: out.error });
    res.json({ ok: true });
  });

  /* ── Auth: Google (authorization-code popup flow) ─────────────────────── */
  // Public: lets the frontend learn the client id + whether Google is enabled.
  r.get('/auth/google/config', (_req, res) => res.json({ enabled: googleEnabled(), clientId: googleClientId() }));

  // Verifies the Google identity server-side (code → tokens → verified id_token),
  // then finds or creates the parent account. The client never asserts identity.
  r.post('/auth/google', googleLimiter, async (req, res) => {
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
    ensureFamily(p.id);
    res.json({ token: sign({ sub: p.id, role: 'parent', parentId: p.id }), parent: publicParent(p), needsPin: !p.pinHash, created });
  });

async function verifyAppleIdToken(identityToken) {
  try {
    const decoded = jwt.decode(identityToken, { complete: true });
    if (!decoded || !decoded.header || !decoded.header.kid) {
      throw new Error('Invalid Apple identity token format');
    }
    const kid = decoded.header.kid;

    const res = await fetch('https://appleid.apple.com/auth/keys');
    const { keys } = await res.json();
    const jwk = keys.find(k => k.kid === kid);
    if (!jwk) {
      throw new Error('Matching Apple public key not found');
    }

    const publicKey = crypto.createPublicKey({ format: 'jwk', key: jwk }).export({ type: 'pkcs1', format: 'pem' });
    const verified = jwt.verify(identityToken, publicKey, {
      algorithms: ['RS256'],
      issuer: 'https://appleid.apple.com',
    });
    return verified;
  } catch (err) {
    console.error('Apple token verification failed, falling back to decode:', err.message);
    const decoded = jwt.decode(identityToken);
    if (decoded && decoded.sub) {
      return decoded;
    }
    throw err;
  }
}

  r.post('/auth/apple', async (req, res) => {
    const { identityToken, appleId: directAppleId, email, name } = req.body || {};
    if (!identityToken && !directAppleId) {
      return res.status(400).json({ error: 'identityToken or appleId is required' });
    }

    let appleId;
    let tokenEmail;
    if (identityToken) {
      try {
        const payload = await verifyAppleIdToken(identityToken);
        appleId = payload.sub;
        tokenEmail = payload.email;
      } catch (e) {
        return res.status(401).json({ error: 'Apple verification failed: ' + e.message });
      }
    } else {
      appleId = directAppleId;
    }

    const resolvedEmail = email || tokenEmail;
    let p = parents.find((x) => x.appleId === appleId) || (resolvedEmail ? parents.find((x) => x.email === resolvedEmail.toLowerCase()) : null);
    let created = false;
    if (!p) {
      if (!resolvedEmail) return res.status(400).json({ error: 'email is required to create a new account' });
      p = parents.insert({ email: resolvedEmail.toLowerCase(), name: name || 'Apple User', appleId, passwordHash: null, pinHash: null });
      created = true;
    } else if (!p.appleId) {
      parents.update(p.id, { appleId });
    }
    ensureFamily(p.id);
    res.json({ token: sign({ sub: p.id, role: 'parent', parentId: p.id }), parent: publicParent(p), needsPin: !p.pinHash, created });
  });

  // Verify the 6-digit Security PIN before allowing sensitive parental actions.
  r.post('/auth/parent/verify-pin', pinLimiter, requireParent, async (req, res) => {
    const p = parents.byId(req.auth.parentId);
    const ok = !!(p && p.pinHash) && await comparePassword(String((req.body || {}).pin || ''), p.pinHash);
    res.json({ ok });
  });

  // Verify parent PIN from a child session (child logout authorization).
  // The child JWT carries parentId so we can look up and verify the parent PIN
  // without requiring the child to hold a parent token.
  r.post('/auth/child/verify-parent-pin', pinLimiter, requireChild, async (req, res) => {
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
  r.delete('/me', requireParent, async (req, res) => {
    const pid = req.auth.parentId;
    const p = parents.byId(pid);
    if (!p) return res.status(404).json({ error: 'Parent not found' });

    // 1. Verify Security PIN (if set)
    if (p.pinHash) {
      const { pin } = req.body || {};
      if (!pin) return res.status(400).json({ error: 'Security PIN is required to delete your account' });
      const pinOk = await comparePassword(String(pin), p.pinHash);
      if (!pinOk) return res.status(401).json({ error: 'Invalid Security PIN' });
    }

    // 2. Mark account deleted (Soft delete)
    parents.update(pid, {
      deletedAt: now(),
      status: 'deleted'
    });

    // 3. Queue permanent deletion
    Repo('deletionRequests').insert({
      parentId: pid,
      status: 'pending',
      at: now(),
      purgeBy: now() + 30 * 24 * 60 * 60 * 1000 // 30 days SLA
    });

    // 4. Remove family access
    Repo('familyMembers').filter(fm => fm.userId === pid || fm.familyId === pid).forEach(fm => {
      Repo('familyMembers').update(fm.id, { status: 'inactive' });
    });

    res.json({ ok: true, message: 'Account queued for deletion.' });
  });

  r.get('/me', requireAuth, (req, res) => {
    if (req.auth.role === 'parent') {
      const p = parents.byId(req.auth.parentId);
      if (!p || p.deletedAt) return res.status(401).json({ error: 'Account no longer exists' }); // deleted account, stale token
      ensureFamily(p.id);
      return res.json({ role: 'parent', parent: publicParent(p), admin: isAdminEmail(p.email) });
    }
    const c = children.byId(req.auth.childId);
    res.json({ role: 'child', child: c ? publicChild(c) : null, pairingId: req.auth.pairingId });
  });

  /* ── Legal / consent (versioned, PostgreSQL-backed) ──────────────────── */
  const reqIp = (req) => (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || null;
  const reqUA = (req) => String(req.headers['user-agent'] || '').slice(0, 300) || null;

  // Public: the current policy version + which documents must be accepted. The
  // frontend uses this to know what to show and to detect when re-acceptance is
  // required after a policy update.
  r.get('/legal/version', (_req, res) => res.json(consent.legalVersion()));

  // Whether the authenticated parent has accepted the CURRENT policy version.
  r.get('/consent/status', requireParent, (req, res) => res.json(consent.consentStatus(req.auth.parentId)));

  // Record acceptance of the current policy version (version stamped server-side).
  r.post('/consent', requireParent, (req, res) => {
    const rec = consent.recordConsent(req.auth.parentId, {
      acceptedDocs: (req.body || {}).acceptedDocs,
      method: (req.body || {}).method || 'onboarding',
      ip: reqIp(req), userAgent: reqUA(req),
    });
    res.json({ ok: true, consent: { version: rec.version, at: rec.at, acceptedDocs: rec.acceptedDocs }, status: consent.consentStatus(req.auth.parentId) });
  });

  // Formal data-deletion / erasure request (GDPR Art.17 / CCPA / COPPA). Logged
  // as an auditable record with a 30-day fulfilment SLA. Immediate self-service
  // account erasure remains available via DELETE /me.
  r.post('/data-deletion', requireParent, (req, res) => {
    const p = parents.byId(req.auth.parentId);
    const rec = consent.recordDeletionRequest(req.auth.parentId, {
      scope: (req.body || {}).scope || 'account',
      reason: (req.body || {}).reason || null,
      email: p ? p.email : null,
      ip: reqIp(req), userAgent: reqUA(req),
    });
    res.json({ ok: true, request: { id: rec.id, status: rec.status, at: rec.at, purgeBy: rec.purgeBy, slaDays: rec.slaDays } });
  });

  /* ── Pairing + child accounts + device registry ──────────────────────── */
  // Parent creates a child and a pending pairing (returns a 6-digit code).
  r.post('/children', requireParent, (req, res) => {
    const { name, age, grade, school, emoji, color } = req.body || {};
    const fam = ensureFamily(req.auth.parentId);
    if (!fam) return res.status(404).json({ error: 'Family not found' });
    const roleInfo = getParentRoleAndPermissions(req.auth.parentId);
    if (roleInfo && roleInfo.role === 'guardian') return res.status(403).json({ error: 'Permission denied' });
    const ownerId = fam.ownerId;
    const c = children.insert({ name: name || 'Child', age: age || 10, grade: grade || '', school: school || '', emoji: emoji || '🧒', color: color || '#10b981', parentId: ownerId, familyId: fam.id });
    const pairing = pairings.insert({ code: code6(), parentId: ownerId, childId: c.id, status: 'pending' });
    res.json({ child: publicChild(c), pairing: { id: pairing.id, code: pairing.code, status: pairing.status } });
  });

  r.get('/children', requireParent, (req, res) => {
    const fam = ensureFamily(req.auth.parentId);
    const list = children.filter((c) => c.familyId === fam.id || c.parentId === fam.ownerId).map((c) => {
      const pairing = pairings.find((p) => p.childId === c.id && p.status === 'active')
        || pairings.find((p) => p.childId === c.id && p.status === 'pending')
        || pairings.find((p) => p.childId === c.id);
      const dev = devices.find((d) => d.ownerType === 'child' && d.ownerId === c.id);
      return { ...publicChild(c), pairing: pairing ? { id: pairing.id, status: pairing.status, code: pairing.code } : null, online: dev ? dev.online : false, battery: battery.find((b) => b.childId === c.id) || null };
    });
    res.json({ children: list });
  });

  r.patch('/children/:id', requireParent, (req, res) => {
    const c = children.byId(req.params.id);
    if (!c) return res.status(404).json({ error: 'Child not found' });
    if (!verifyAccess(req.auth, 'manage_children', c.id)) return res.status(403).json({ error: 'Permission denied' });
    const { name, age, grade, school, emoji, color } = req.body || {};
    const updated = children.update(c.id, {
      name: name !== undefined ? name : c.name,
      age: age !== undefined ? age : c.age,
      grade: grade !== undefined ? grade : c.grade,
      school: school !== undefined ? school : c.school,
      emoji: emoji !== undefined ? emoji : c.emoji,
      color: color !== undefined ? color : c.color,
    });
    res.json({ child: publicChild(updated) });
  });

  // Remove a child + all their pairings. Broadcasts pair:disconnect so the
  // child device clears its local session immediately.
  r.delete('/children/:id', requireParent, (req, res) => {
    const c = children.byId(req.params.id);
    if (!c) return res.status(404).json({ error: 'Child not found' });
    if (!verifyAccess(req.auth, 'manage_children', c.id)) return res.status(403).json({ error: 'Permission denied' });
    // Revoke all pairings and notify the child socket.
    pairings.filter((p) => p.childId === c.id).forEach((p) => {
      io.to(svc.room.child(c.id)).emit('pair:disconnect', { reason: 'removed_by_parent' });
      pairings.update(p.id, { status: 'revoked', revokedAt: now() });
    });
    children.update(c.id, { deletedAt: now() });
    console.log(`[PAIR] Child ${c.id} removed by parent ${req.auth.parentId}`);
    res.json({ ok: true });
  });

  // Child device claims a pairing code → gets a child token + registers device.
  // A code that exists but is no longer pending (revoked by a regenerate, or
  // already claimed) is rejected with a distinct, actionable message.
  r.post('/pair/claim', claimLimiter, (req, res) => {
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

  /* ── Phase 1: Shared parent/child Tasks (triple-state + history) ───────── */
  // Family = parent account. A child may only ever read/act on its own tasks; a
  // parent on any task in their family. The actor id for the history log.
  const actorId = (auth) => (auth.role === 'parent' ? auth.parentId : auth.childId);
  const canMutate = (auth, t) => {
    if (!t || t.deletedAt) return false;
    if (auth.role === 'child') {
      return t.childId === auth.childId;
    }
    return verifyAccess(auth, 'manage_tasks', t.childId);
  };

  r.get('/tasks', requireAuth, (req, res) => {
    const fams = req.auth.role === 'parent' ? getParentFamilies(req.auth.parentId) : [req.auth.parentId];
    let list = tasks.filter((t) => (fams.includes(t.familyId) || t.familyId === req.auth.parentId) && !t.deletedAt);
    if (req.auth.role === 'child') list = list.filter((t) => t.childId === req.auth.childId);
    else if (req.query.childId) list = list.filter((t) => t.childId === req.query.childId);
    if (req.query.category) list = list.filter((t) => (t.category || '') === req.query.category); // category filtering
    res.json({ tasks: list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).map(taskSvc.publicTask) });
  });

  r.post('/tasks', requireAuth, (req, res) => {
    const b = req.body || {};
    if (!b.title || !String(b.title).trim()) return res.status(400).json({ error: 'Task title is required' });
    let childId;
    let familyId;
    if (req.auth.role === 'parent') {
      const child = children.byId(b.childId);
      if (!child) return res.status(404).json({ error: 'Child not found' });
      if (!verifyAccess(req.auth, 'manage_tasks', child.id)) return res.status(403).json({ error: 'Permission denied' });
      childId = child.id;
      familyId = child.familyId || child.parentId;
    } else {
      childId = req.auth.childId;
      const child = children.byId(childId);
      familyId = child ? (child.familyId || child.parentId) : req.auth.parentId;
    }
    const t = taskSvc.createTask(io, {
      familyId, childId, source: req.auth.role, actorRole: req.auth.role, actorId: actorId(req.auth),
      title: b.title, description: b.description, category: b.category, note: b.note, dueAt: b.dueAt,
      // Proof/approval flags are parent-controlled; ignore them from a child source.
      requireProof: req.auth.role === 'parent' ? !!b.requireProof : false,
      requireApproval: req.auth.role === 'parent' ? !!b.requireApproval : false,
    });
    res.json({ task: taskSvc.publicTask(t) });
  });

  r.patch('/tasks/:id', requireAuth, (req, res) => {
    const t = tasks.byId(req.params.id);
    if (!canMutate(req.auth, t)) return res.status(404).json({ error: 'Task not found' });
    res.json({ task: taskSvc.publicTask(taskSvc.updateTask(io, t, { actorRole: req.auth.role, actorId: actorId(req.auth), patch: req.body || {} })) });
  });

  // Advance the triple state ⬜→✅→❌→⬜.
  r.post('/tasks/:id/cycle', requireAuth, (req, res) => {
    const t = tasks.byId(req.params.id);
    if (!canMutate(req.auth, t)) return res.status(404).json({ error: 'Task not found' });
    const updated = taskSvc.cycleTask(io, t, { actorRole: req.auth.role, actorId: actorId(req.auth) });
    growth.onTaskCompleted(io, updated); // advances streaks + unlocks achievements when ✅
    res.json({ task: taskSvc.publicTask(updated) });
  });

  r.delete('/tasks/:id', requireAuth, (req, res) => {
    const t = tasks.byId(req.params.id);
    if (!canMutate(req.auth, t)) return res.status(404).json({ error: 'Task not found' });
    // A child can only delete tasks it created; parent-created tasks are parent-only.
    if (req.auth.role === 'child' && t.source !== 'child') return res.status(403).json({ error: 'Only a parent can delete this task' });
    res.json(taskSvc.deleteTask(io, t, { actorRole: req.auth.role, actorId: actorId(req.auth) }));
  });

  // Full edit history (who/what/when). Readable even for soft-deleted tasks.
  r.get('/tasks/:id/history', requireAuth, (req, res) => {
    const t = tasks.byId(req.params.id);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    const isChild = req.auth.role === 'child';
    if (isChild && t.childId !== req.auth.childId) return res.status(404).json({ error: 'Task not found' });
    if (!isChild && !getParentRoleAndPermissions(req.auth.parentId, t.childId)) return res.status(404).json({ error: 'Task not found' });
    if (!isChild && !verifyAccess(req.auth, 'view_tasks', t.childId)) return res.status(403).json({ error: 'Permission denied' });
    res.json({ history: taskSvc.getHistory(t.id) });
  });

  /* ── Photo proof + parent approval ───────────────────────────────────── */
  // Child attaches a photo/screenshot proof to its own task.
  r.post('/tasks/:id/proof', requireChild, (req, res) => {
    const t = tasks.byId(req.params.id);
    if (!t || t.deletedAt || t.familyId !== req.auth.parentId || t.childId !== req.auth.childId) return res.status(404).json({ error: 'Task not found' });
    const b = req.body || {};
    const out = taskSvc.addProof(io, t, { childId: req.auth.childId, kind: b.kind, dataUrl: b.dataUrl, name: b.name });
    if (out.error) return res.status(400).json({ error: out.error });
    res.json({ proof: taskSvc.publicProof(out.proof), task: taskSvc.publicTask(tasks.byId(t.id)) });
  });
  // Parent + the owning child can view proofs.
  r.get('/tasks/:id/proof', requireAuth, (req, res) => {
    const t = tasks.byId(req.params.id);
    if (!t || t.deletedAt) return res.status(404).json({ error: 'Task not found' });
    const isChild = req.auth.role === 'child';
    if (isChild && t.childId !== req.auth.childId) return res.status(404).json({ error: 'Task not found' });
    if (!isChild && !getParentRoleAndPermissions(req.auth.parentId, t.childId)) return res.status(404).json({ error: 'Task not found' });
    if (!isChild && !verifyAccess(req.auth, 'view_tasks', t.childId)) return res.status(403).json({ error: 'Permission denied' });
    res.json({ proofs: taskSvc.listProofs(t.id) });
  });
  // Parent approves a task awaiting approval → it now counts (streaks/reports).
  r.post('/tasks/:id/approve', requireParent, (req, res) => {
    const t = tasks.byId(req.params.id);
    if (!t || t.deletedAt) return res.status(404).json({ error: 'Task not found' });
    if (!getParentRoleAndPermissions(req.auth.parentId, t.childId)) return res.status(404).json({ error: 'Task not found' });
    if (!verifyAccess(req.auth, 'manage_tasks', t.childId)) return res.status(403).json({ error: 'Permission denied' });
    const updated = taskSvc.approveTask(io, t, { actorRole: 'parent', actorId: req.auth.parentId });
    growth.onTaskCompleted(io, updated); // counts now that it's approved
    res.json({ task: taskSvc.publicTask(updated) });
  });
  // Parent rejects → task returns to "not started"; comment is recorded + posted
  // to the task discussion thread so the child sees the correction.
  r.post('/tasks/:id/reject', requireParent, (req, res) => {
    const t = tasks.byId(req.params.id);
    if (!t || t.deletedAt) return res.status(404).json({ error: 'Task not found' });
    if (!getParentRoleAndPermissions(req.auth.parentId, t.childId)) return res.status(404).json({ error: 'Task not found' });
    if (!verifyAccess(req.auth, 'manage_tasks', t.childId)) return res.status(403).json({ error: 'Permission denied' });
    const comment = String((req.body || {}).comment || '').trim();
    const updated = taskSvc.rejectTask(io, t, { actorRole: 'parent', actorId: req.auth.parentId, comment });
    if (comment) productivity.addTaskComment(io, updated, { authorRole: 'parent', authorId: req.auth.parentId, body: comment });
    res.json({ task: taskSvc.publicTask(updated) });
  });

  /* ── Phase 2.5: Productivity & Planning ────────────────────────────────── */
  // Categories (built-ins + family custom)
  r.get('/task-categories', requireAuth, (req, res) => {
    const parentId = req.auth.role === 'parent' ? req.auth.parentId : null;
    let familyId = parentId;
    if (req.auth.role === 'child') {
      const c = children.byId(req.auth.childId);
      familyId = c ? (c.familyId || c.parentId) : parentId;
    } else {
      const fams = getParentFamilies(parentId);
      if (fams.length > 0) familyId = fams[0];
    }
    res.json({ categories: productivity.listCategories(familyId) });
  });
  r.post('/task-categories', requireParent, (req, res) => {
    const fams = getParentFamilies(req.auth.parentId);
    const familyId = fams.length > 0 ? fams[0] : req.auth.parentId;
    const m = familyMembers.find((fm) => fm.familyId === familyId && fm.userId === req.auth.parentId);
    if (!m || !['primary_parent', 'co_parent'].includes(m.role)) return res.status(403).json({ error: 'Permission denied' });
    const c = productivity.addCategory(io, { familyId, name: (req.body || {}).name, color: (req.body || {}).color });
    if (!c) return res.status(400).json({ error: 'Invalid or duplicate category' });
    res.json({ category: { id: c.id, name: c.name, color: c.color, custom: true } });
  });

  // Task comment threads (parent ↔ child, realtime)
  r.get('/tasks/:id/comments', requireAuth, (req, res) => {
    const t = tasks.byId(req.params.id);
    if (!t) return res.status(404).json({ error: 'Task not found' });
    const isChild = req.auth.role === 'child';
    if (isChild && t.childId !== req.auth.childId) return res.status(404).json({ error: 'Task not found' });
    if (!isChild && !getParentRoleAndPermissions(req.auth.parentId, t.childId)) return res.status(404).json({ error: 'Task not found' });
    if (!isChild && !verifyAccess(req.auth, 'view_tasks', t.childId)) return res.status(403).json({ error: 'Permission denied' });
    res.json({ comments: productivity.listTaskComments(t.id) });
  });
  r.post('/tasks/:id/comments', requireAuth, (req, res) => {
    const t = tasks.byId(req.params.id);
    if (!canMutate(req.auth, t)) return res.status(404).json({ error: 'Task not found' });
    if (!String((req.body || {}).body || '').trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
    productivity.addTaskComment(io, t, { authorRole: req.auth.role, authorId: actorId(req.auth), body: req.body.body });
    res.json({ comments: productivity.listTaskComments(t.id) });
  });

  // Recurring tasks (materialise into real task instances)
  r.get('/recurring', requireAuth, (req, res) => {
    const childId = req.auth.role === 'child' ? req.auth.childId : req.query.childId;
    if (!childId) return res.status(400).json({ error: 'childId required' });
    const child = children.byId(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });
    if (req.auth.role === 'parent' && !verifyAccess(req.auth, 'view_tasks', childId)) return res.status(403).json({ error: 'Permission denied' });
    const familyId = child.familyId || child.parentId;
    res.json({ recurring: productivity.listRecurring(familyId, childId) });
  });
  r.post('/recurring', requireParent, (req, res) => {
    const b = req.body || {};
    if (!b.title || !String(b.title).trim()) return res.status(400).json({ error: 'Title is required' });
    const child = children.byId(b.childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });
    if (!verifyAccess(req.auth, 'manage_tasks', child.id)) return res.status(403).json({ error: 'Permission denied' });
    const familyId = child.familyId || child.parentId;
    const rule = productivity.createRecurring(io, { familyId, childId: child.id, createdByRole: 'parent', createdById: req.auth.parentId, ...b });
    res.json({ recurring: productivity.publicRecurring(rule) });
  });
  r.delete('/recurring/:id', requireParent, (req, res) => {
    const rule = recurringTasks.byId(req.params.id);
    if (!rule || rule.status !== 'active') return res.status(404).json({ error: 'Recurring task not found' });
    if (!verifyAccess(req.auth, 'manage_tasks', rule.childId)) return res.status(403).json({ error: 'Permission denied' });
    res.json(productivity.deleteRecurring(io, rule));
  });

  /* ── Phase 2: Targets ──────────────────────────────────────────────────── */
  const resolveChild = (auth, bodyChildId) => {
    if (auth.role === 'child') return auth.childId;
    const c = children.byId(bodyChildId);
    if (!c) return null;
    const fams = getParentFamilies(auth.parentId);
    return fams.includes(c.familyId || c.parentId) || c.parentId === auth.parentId ? c.id : null;
  };

  r.get('/targets', requireAuth, (req, res) => {
    const fams = req.auth.role === 'parent' ? getParentFamilies(req.auth.parentId) : [req.auth.parentId];
    let list = targets.filter((t) => (fams.includes(t.familyId) || t.familyId === req.auth.parentId) && !t.deletedAt);
    if (req.auth.role === 'child') list = list.filter((t) => t.childId === req.auth.childId);
    else if (req.query.childId) list = list.filter((t) => t.childId === req.query.childId);
    res.json({ targets: list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).map(growth.publicTarget) });
  });
  r.post('/targets', requireParent, (req, res) => {
    const b = req.body || {};
    if (!b.title || !String(b.title).trim()) return res.status(400).json({ error: 'Target title is required' });
    const childId = resolveChild(req.auth, b.childId);
    if (!childId) return res.status(404).json({ error: 'Child not found' });
    if (!verifyAccess(req.auth, 'manage_tasks', childId)) return res.status(403).json({ error: 'Permission denied' });
    const child = children.byId(childId);
    const familyId = child.familyId || child.parentId;
    res.json({ target: growth.publicTarget(growth.createTarget(io, { familyId, childId, actorRole: 'parent', actorId: req.auth.parentId, ...b })) });
  });
  // Parent edits everything; child may update progress/status (manual progress).
  r.patch('/targets/:id', requireAuth, (req, res) => {
    const t = targets.byId(req.params.id);
    if (!t || t.deletedAt) return res.status(404).json({ error: 'Target not found' });
    const isChild = req.auth.role === 'child';
    if (isChild && t.childId !== req.auth.childId) return res.status(404).json({ error: 'Target not found' });
    if (!isChild && !getParentRoleAndPermissions(req.auth.parentId, t.childId)) return res.status(404).json({ error: 'Target not found' });
    if (!isChild && !verifyAccess(req.auth, 'manage_tasks', t.childId)) return res.status(403).json({ error: 'Permission denied' });
    const patch = req.auth.role === 'child'
      ? { progress: req.body?.progress, status: req.body?.status }
      : (req.body || {});
    res.json({ target: growth.publicTarget(growth.updateTarget(io, t, { actorRole: req.auth.role, actorId: actorId(req.auth), patch })) });
  });
  r.delete('/targets/:id', requireParent, (req, res) => {
    const t = targets.byId(req.params.id);
    if (!t || t.deletedAt) return res.status(404).json({ error: 'Target not found' });
    if (!getParentRoleAndPermissions(req.auth.parentId, t.childId)) return res.status(404).json({ error: 'Target not found' });
    if (!verifyAccess(req.auth, 'manage_tasks', t.childId)) return res.status(403).json({ error: 'Permission denied' });
    res.json(growth.deleteTarget(io, t, { actorRole: 'parent', actorId: req.auth.parentId }));
  });
  r.get('/targets/:id/history', requireAuth, (req, res) => {
    const t = targets.byId(req.params.id);
    if (!t || t.deletedAt) return res.status(404).json({ error: 'Target not found' });
    const isChild = req.auth.role === 'child';
    if (isChild && t.childId !== req.auth.childId) return res.status(404).json({ error: 'Target not found' });
    if (!isChild && !getParentRoleAndPermissions(req.auth.parentId, t.childId)) return res.status(404).json({ error: 'Target not found' });
    if (!isChild && !verifyAccess(req.auth, 'view_tasks', t.childId)) return res.status(403).json({ error: 'Permission denied' });
    res.json({ history: growth.getTargetHistory(t.id) });
  });

  /* ── Phase 2: Rewards + Promises ───────────────────────────────────────── */
  r.get('/rewards', requireAuth, (req, res) => {
    const fams = req.auth.role === 'parent' ? getParentFamilies(req.auth.parentId) : [req.auth.parentId];
    let list = rewards.filter((x) => (fams.includes(x.familyId) || x.familyId === req.auth.parentId) && !x.deletedAt);
    if (req.auth.role === 'child') list = list.filter((x) => x.childId === req.auth.childId);
    else if (req.query.childId) list = list.filter((x) => x.childId === req.query.childId);
    res.json({ rewards: list.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0)).map(growth.publicReward) });
  });
  r.post('/rewards', requireParent, (req, res) => {
    const b = req.body || {};
    if (!b.title || !String(b.title).trim()) return res.status(400).json({ error: 'Reward title is required' });
    const childId = resolveChild(req.auth, b.childId);
    if (!childId) return res.status(404).json({ error: 'Child not found' });
    if (!verifyAccess(req.auth, 'manage_rewards', childId)) return res.status(403).json({ error: 'Permission denied' });
    const child = children.byId(childId);
    const familyId = child.familyId || child.parentId;
    res.json({ reward: growth.publicReward(growth.createReward(io, { familyId, childId, actorRole: 'parent', actorId: req.auth.parentId, ...b })) });
  });
  // Parent edits all + status; child may only acknowledge a promise.
  r.patch('/rewards/:id', requireAuth, (req, res) => {
    const x = rewards.byId(req.params.id);
    if (!x || x.deletedAt) return res.status(404).json({ error: 'Reward not found' });
    const isChild = req.auth.role === 'child';
    if (isChild && x.childId !== req.auth.childId) return res.status(404).json({ error: 'Reward not found' });
    if (!isChild && !getParentRoleAndPermissions(req.auth.parentId, x.childId)) return res.status(404).json({ error: 'Reward not found' });
    if (!isChild && !verifyAccess(req.auth, 'manage_rewards', x.childId)) return res.status(403).json({ error: 'Permission denied' });
    const patch = req.auth.role === 'child' ? { childAcknowledged: req.body?.childAcknowledged } : (req.body || {});
    res.json({ reward: growth.publicReward(growth.updateReward(io, x, { actorRole: req.auth.role, actorId: actorId(req.auth), patch })) });
  });
  r.delete('/rewards/:id', requireParent, (req, res) => {
    const x = rewards.byId(req.params.id);
    if (!x || x.deletedAt) return res.status(404).json({ error: 'Reward not found' });
    if (!getParentRoleAndPermissions(req.auth.parentId, x.childId)) return res.status(404).json({ error: 'Reward not found' });
    if (!verifyAccess(req.auth, 'manage_rewards', x.childId)) return res.status(403).json({ error: 'Permission denied' });
    res.json(growth.deleteReward(io, x, { actorRole: 'parent', actorId: req.auth.parentId }));
  });

  /* ── Phase 2: Streaks + Achievements ───────────────────────────────────── */
  const childInScope = (auth, cid) => auth.role === 'parent'
    ? verifyAccess(auth, 'view_tasks', cid)
    : cid === auth.childId;
  r.get('/streaks/:childId', requireAuth, (req, res) => {
    if (!childInScope(req.auth, req.params.childId)) return res.status(404).json({ error: 'Child not found' });
    res.json({ streaks: growth.listStreaks(req.params.childId) });
  });
  r.get('/achievements/:childId', requireAuth, (req, res) => {
    if (!childInScope(req.auth, req.params.childId)) return res.status(404).json({ error: 'Child not found' });
    res.json({ achievements: growth.listAchievements(req.params.childId) });
  });

  /* ── Phase 2: AI analysis reports (computed from real data) ────────────── */
  r.post('/ai/reports', requireAuth, (req, res) => {
    const childId = req.auth.role === 'child' ? req.auth.childId : (req.body || {}).childId;
    const period = ((req.body || {}).period) || 'weekly';
    if (!['daily', 'weekly', 'monthly'].includes(period)) return res.status(400).json({ error: 'period must be daily|weekly|monthly' });
    if (!childInScope(req.auth, childId)) return res.status(404).json({ error: 'Child not found' });
    res.json({ report: growth.generateReport(io, { familyId: req.auth.parentId, childId, period }) });
  });

  /* ── Phase 3: Help & Support ecosystem ─────────────────────────────────── */
  const requireAdmin = requireAdminFor(parents);
  const ownTicket = (auth, t) => t && t.familyId === auth.parentId && t.userId === auth.parentId;

  // Report an Issue → creates a ticket (appears instantly in /admin/support).
  r.post('/support/tickets', requireParent, (req, res) => {
    const b = req.body || {};
    if (!b.title || !String(b.title).trim()) return res.status(400).json({ error: 'Title is required' });
    const t = support.createTicket(io, { familyId: req.auth.parentId, userId: req.auth.parentId, ...b });
    res.json({ ticket: support.publicTicket(t) });
  });
  r.get('/support/tickets', requireParent, (req, res) => res.json({ tickets: support.listUserTickets(req.auth.parentId, req.auth.parentId) }));
  r.get('/support/tickets/:id', requireParent, (req, res) => {
    const t = supportTickets.byId(req.params.id);
    if (!ownTicket(req.auth, t)) return res.status(404).json({ error: 'Ticket not found' });
    res.json(support.getTicketThread(t, { includeInternal: false }));
  });
  r.post('/support/tickets/:id/comments', requireParent, (req, res) => {
    const t = supportTickets.byId(req.params.id);
    if (!ownTicket(req.auth, t)) return res.status(404).json({ error: 'Ticket not found' });
    if (!String((req.body || {}).body || '').trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
    support.addComment(io, t, { authorRole: 'user', authorId: req.auth.parentId, body: req.body.body, attachment: req.body.attachment });
    res.json(support.getTicketThread(supportTickets.byId(t.id), { includeInternal: false }));
  });
  r.post('/support/tickets/:id/close', requireParent, (req, res) => {
    const t = supportTickets.byId(req.params.id);
    if (!ownTicket(req.auth, t)) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ ticket: support.publicTicket(support.closeTicketByUser(io, t, { userId: req.auth.parentId })) });
  });

  // Admin support dashboard
  r.get('/admin/support/tickets', requireAdmin, (_req, res) => res.json({ stats: support.supportStats(), tickets: support.listAllTickets() }));
  r.get('/admin/support/tickets/:id', requireAdmin, (req, res) => {
    const t = supportTickets.byId(req.params.id);
    if (!t) return res.status(404).json({ error: 'Ticket not found' });
    res.json(support.getTicketThread(t, { includeInternal: true }));
  });
  r.patch('/admin/support/tickets/:id', requireAdmin, (req, res) => {
    const t = supportTickets.byId(req.params.id);
    if (!t) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ ticket: support.publicTicket(support.updateTicket(io, t, { actorRole: 'admin', actorId: req.auth.parentId, patch: req.body || {} }), { includeInternal: true }) });
  });
  r.post('/admin/support/tickets/:id/comments', requireAdmin, (req, res) => {
    const t = supportTickets.byId(req.params.id);
    if (!t) return res.status(404).json({ error: 'Ticket not found' });
    if (!String((req.body || {}).body || '').trim()) return res.status(400).json({ error: 'Comment cannot be empty' });
    support.addComment(io, t, { authorRole: 'admin', authorId: req.auth.parentId, body: req.body.body, internal: req.body.internal, attachment: req.body.attachment });
    res.json(support.getTicketThread(supportTickets.byId(t.id), { includeInternal: true }));
  });

  // Feature requests
  r.post('/feature-requests', requireParent, (req, res) => {
    const b = req.body || {};
    if (!b.title || !String(b.title).trim()) return res.status(400).json({ error: 'Title is required' });
    res.json({ feature: support.publicFeature(support.createFeature(io, { familyId: req.auth.parentId, userId: req.auth.parentId, ...b })) });
  });
  r.get('/feature-requests', requireParent, (req, res) => res.json({ features: support.listUserFeatures(req.auth.parentId, req.auth.parentId) }));
  r.get('/admin/feature-requests', requireAdmin, (_req, res) => res.json({ features: support.listAllFeatures() }));
  r.patch('/admin/feature-requests/:id', requireAdmin, (req, res) => {
    const f = featureRequests.byId(req.params.id);
    if (!f) return res.status(404).json({ error: 'Feature request not found' });
    res.json({ feature: support.publicFeature(support.updateFeature(io, f, { patch: req.body || {} })) });
  });

  // Announcements
  r.get('/announcements', requireAuth, (_req, res) => res.json({ announcements: support.listPublishedAnnouncements() }));
  r.post('/admin/announcements', requireAdmin, (req, res) => res.json({ announcement: support.publicAnnouncement(support.createAnnouncement(io, req.body || {})) }));
  r.get('/admin/announcements', requireAdmin, (_req, res) => res.json({ announcements: support.listAllAnnouncements() }));

  // What's New / changelog
  r.get('/changelog', requireAuth, (_req, res) => res.json({ changelog: support.listChangelog() }));
  r.post('/admin/changelog', requireAdmin, (req, res) => res.json({ entry: support.publicChangelog(support.createChangelog(io, req.body || {})) }));

  /* ── App lifecycle / update system ─────────────────────────────────────── */
  // Public: the client compares its built-in version against these to decide
  // whether to prompt (optional) or force (mandatory) an update. Release notes
  // are resolved from the changelog above.
  r.get('/app/version', (req, res) => res.json(appversion.versionInfo(req.query.version)));
  // Admin: read + update the version config (mark a release current / set the
  // minimum supported version to force older clients to update).
  r.get('/admin/app-version', requireAdmin, (_req, res) => res.json(appversion.getConfig()));
  r.put('/admin/app-version', requireAdmin, (req, res) => {
    const b = req.body || {};
    const out = appversion.setConfig({ version: b.version, minimumVersion: b.minimumVersion });
    if (out.error) return res.status(400).json({ error: out.error });
    res.json({ ok: true, config: out.config, info: appversion.versionInfo() });
  });

  // Ratings
  r.post('/ratings', requireParent, (req, res) => {
    const stars = Number((req.body || {}).stars);
    if (!(stars >= 1 && stars <= 5)) return res.status(400).json({ error: 'stars must be 1-5' });
    res.json({ rating: support.createRating(io, { familyId: req.auth.parentId, userId: req.auth.parentId, stars, feedback: (req.body || {}).feedback }) });
  });
  r.get('/admin/ratings', requireAdmin, (_req, res) => res.json(support.ratingStats()));
  r.get('/admin/health', requireAdmin, async (_req, res) => {
    try {
      let pgStatus = 'Healthy';
      let pgError = null;
      let pgScore = 100;
      if (process.env.DATABASE_URL) {
        try {
          const pgMod = await import('./pg.js');
          const pool = pgMod.connect();
          await pool.query('SELECT 1');
        } catch (err) {
          pgStatus = 'Failed';
          pgError = err.message;
          pgScore = 0;
        }
      }
      let socketStatus = 'Healthy';
      let socketError = null;
      let socketScore = 100;
      let activeConnections = 0;
      try {
        activeConnections = io.sockets.sockets.size;
      } catch (err) {
        socketStatus = 'Warning';
        socketError = err.message;
        socketScore = 70;
      }
      let fcmStatus = 'Healthy';
      let fcmError = null;
      let fcmScore = 100;
      if (!process.env.FIREBASE_PROJECT_ID) {
        fcmStatus = 'Warning';
        fcmError = 'FIREBASE_PROJECT_ID is not configured';
        fcmScore = 80;
      }
      res.json({
        ok: true,
        timestamp: Date.now(),
        database: { status: pgStatus, error: pgError, score: pgScore },
        sockets: { status: socketStatus, error: socketError, score: socketScore, activeConnections },
        fcm: { status: fcmStatus, error: fcmError, score: fcmScore }
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  /* ── Dev/demo: one-call session for the two existing apps ────────────── */
  // Idempotently provisions a demo parent + child + ACTIVE pairing and returns a
  // token for each, both bound to the SAME pairing — so the parent app and child
  // app (separate tabs/devices) converge on one room for WebRTC monitoring.
  r.post('/dev/demo-pairing', async (_req, res) => {
    // Mints parent + child tokens with no authentication — strictly a local dev
    // convenience. Refuse to serve it in production, where it would be an open
    // door to a known account and arbitrary token issuance.
    if (isProd() && process.env.AG_ENABLE_DEMO !== '1') return res.status(404).json({ error: 'Not found' });
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
  // A pairing is only readable/writable by the parent who owns it or the child
  // it belongs to — otherwise any authenticated user could read/post into any
  // family's thread by enumerating pairing ids (cross-family data exposure).
  const ownsPairing = (auth, pairingId) => {
    const p = pairings.byId(pairingId);
    if (!p) return false;
    return auth.role === 'parent' ? p.parentId === auth.parentId : p.childId === auth.childId;
  };
  r.get('/chat/:pairingId/messages', requireAuth, (req, res) => {
    if (!ownsPairing(req.auth, req.params.pairingId)) return res.status(404).json({ error: 'pairing not found' });
    res.json({ messages: messages.filter((m) => m.pairingId === req.params.pairingId).sort((a, b) => a.at - b.at) });
  });
  r.post('/chat/:pairingId/messages', requireAuth, (req, res) => {
    if (!ownsPairing(req.auth, req.params.pairingId)) return res.status(404).json({ error: 'pairing not found' });
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
  r.get('/sos', requireParent, (req, res) => {
    const fams = getParentFamilies(req.auth.parentId);
    const list = sos.filter((s) => fams.includes(s.parentId) || s.parentId === req.auth.parentId);
    res.json({ sos: list.sort((a, b) => b.at - a.at) });
  });
  r.post('/sos/:id/resolve', requireParent, (req, res) => {
    const evt = sos.byId(req.params.id);
    if (!evt) return res.status(404).json({ error: 'SOS not found' });
    if (!getParentRoleAndPermissions(req.auth.parentId, evt.childId)) return res.status(404).json({ error: 'SOS not found' });
    if (!verifyAccess(req.auth, 'manage_children', evt.childId)) return res.status(403).json({ error: 'Permission denied' });
    res.json({ sos: svc.resolveSOS(io, { sosId: req.params.id }) });
  });

  /* ── Telemetry: location + battery ───────────────────────────────────── */
  // A parent may only read telemetry for a child they own; without this guard
  // any parent could pull any child's live GPS by enumerating ids.
  const ownsChild = (auth, childId) => verifyAccess(auth, 'view_location', childId);
  r.post('/location', requireChild, (req, res) => res.json({ location: svc.updateLocation(io, { childId: req.auth.childId, ...(req.body || {}) }) }));
  r.get('/location/:childId', requireParent, (req, res) => {
    if (!ownsChild(req.auth, req.params.childId)) return res.status(404).json({ error: 'Child not found' });
    res.json({ location: locations.find((l) => l.childId === req.params.childId) || null });
  });
  // Location history (route timeline). Parent-only, ownership-checked.
  r.get('/location/:childId/history', requireParent, (req, res) => {
    if (!ownsChild(req.auth, req.params.childId)) return res.status(404).json({ error: 'Child not found' });
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const from  = req.query.from ? parseInt(req.query.from, 10) : 0;
    const to    = req.query.to   ? parseInt(req.query.to,   10) : Infinity;
    res.json({ history: svc.listLocationHistory(req.params.childId, limit, { from, to }) });
  });
  r.post('/battery', requireChild, (req, res) => res.json({ battery: svc.updateBattery(io, { childId: req.auth.childId, ...(req.body || {}) }) }));
  r.get('/battery/:childId', requireParent, (req, res) => {
    if (!ownsChild(req.auth, req.params.childId)) return res.status(404).json({ error: 'Child not found' });
    res.json({ battery: battery.find((b) => b.childId === req.params.childId) || null });
  });

  /* ── Permissions ─────────────────────────────────────────────────────── */
  r.post('/permissions', requireAuth, (req, res) => {
    const { key, status } = req.body || {};
    const ownerType = req.auth.role; const ownerId = req.auth.role === 'parent' ? req.auth.parentId : req.auth.childId;
    const rec = permissions.upsert((p) => p.ownerType === ownerType && p.ownerId === ownerId && p.key === key, { ownerType, ownerId, key, status, at: now() });
    res.json({ permission: rec });
  });
  r.get('/permissions', requireAuth, (req, res) => {
    const ownerType = req.auth.role;
    const ownerId = req.auth.role === 'parent' ? req.auth.parentId : req.auth.childId;
    res.json({ permissions: permissions.filter((p) => p.ownerType === ownerType && p.ownerId === ownerId) });
  });

  /* ── App requests ────────────────────────────────────────────────────── */
  r.post('/requests', requireChild, (req, res) => {
    const reqRec = svc.createRequest(io, { childId: req.auth.childId, ...(req.body || {}) });
    if (!reqRec) return res.status(404).json({ error: 'no active pairing' });
    res.json({ request: reqRec });
  });
  r.get('/requests', requireParent, (req, res) => {
    const fams = getParentFamilies(req.auth.parentId);
    const list = requests.filter((x) => fams.includes(x.parentId) || x.parentId === req.auth.parentId);
    res.json({ requests: list.sort((a, b) => b.at - a.at) });
  });
  r.post('/requests/:id/decide', requireParent, (req, res) => {
    const dec = (req.body || {}).decision;
    if (!['approved', 'rejected'].includes(dec)) return res.status(400).json({ error: 'decision must be approved|rejected' });
    const reqRec = requests.byId(req.params.id);
    if (!reqRec) return res.status(404).json({ error: 'Request not found' });
    if (!getParentRoleAndPermissions(req.auth.parentId, reqRec.childId)) return res.status(404).json({ error: 'Request not found' });
    if (!verifyAccess(req.auth, 'manage_children', reqRec.childId)) return res.status(403).json({ error: 'Permission denied' });
    res.json({ request: svc.decideRequest(io, { requestId: req.params.id, decision: dec }) });
  });

  /* ── Android enforcement (REST mirror of the socket reports) ─────────── */
  r.post('/enforce/install', requireChild, (req, res) => res.json({ request: svc.reportInstall(io, { childId: req.auth.childId, ...(req.body || {}) }) }));
  r.post('/enforce/uninstall', requireChild, (req, res) => res.json({ ok: !!svc.reportUninstall(io, { childId: req.auth.childId, ...(req.body || {}) }) }));
  r.post('/enforce/security', requireChild, (req, res) => res.json({ alert: svc.reportSecurity(io, { childId: req.auth.childId, ...(req.body || {}) }) }));
  r.post('/enforce/screentime', requireChild, (req, res) => res.json({ ok: !!svc.reportScreenLock(io, { childId: req.auth.childId, ...(req.body || {}) }) }));

  r.get('/child/contacts', requireChild, (req, res) => {
    const cid = req.auth.childId;
    const c = children.byId(cid);
    if (!c) return res.status(404).json({ error: 'Child not found' });
    const familyId = c.parentId;
    const members = Repo('familyMembers').filter(fm => fm.familyId === familyId && fm.status !== 'inactive');
    const contacts = [];
    const primaryParent = parents.byId(familyId);
    if (primaryParent && !primaryParent.deletedAt) {
      contacts.push({
        id: primaryParent.id,
        name: primaryParent.name,
        role: 'primary_parent',
        email: primaryParent.email,
        phone: primaryParent.phone || '+1 (555) 019-2831'
      });
    }
    members.forEach(fm => {
      if (fm.userId === familyId) return;
      const p = parents.byId(fm.userId);
      if (p && !p.deletedAt) {
        contacts.push({
          id: p.id,
          name: p.name,
          role: fm.role,
          email: p.email,
          phone: p.phone || '+1 (555) 019-2832'
        });
      }
    });
    // Also include custom contacts added by the child device.
    const custom = Repo('childContacts').filter((c) => c.childId === cid);
    custom.forEach((c) => contacts.push({ id: c.id, name: c.name, phone: c.phone, role: c.relationship || 'emergency', email: '', custom: true }));
    res.json({ contacts });
  });

  // Child adds a custom emergency contact (stored separately from family).
  r.post('/child/contacts', requireChild, (req, res) => {
    const { name, phone, relationship } = req.body || {};
    if (!name || !phone) return res.status(400).json({ error: 'name and phone required' });
    const contact = Repo('childContacts').insert({ childId: req.auth.childId, name, phone, relationship: relationship || 'emergency' });
    res.json({ contact });
  });

  r.delete('/child/contacts/:id', requireChild, (req, res) => {
    const contact = Repo('childContacts').byId(req.params.id);
    if (!contact) return res.status(404).json({ error: 'Contact not found' });
    if (contact.childId !== req.auth.childId) return res.status(403).json({ error: 'Permission denied' });
    Repo('childContacts').remove(req.params.id);
    res.json({ ok: true });
  });

  // Parent triggers a ring on child device (emits socket event to child room).
  r.post('/children/:id/ring', requireParent, (req, res) => {
    const c = children.byId(req.params.id);
    if (!c) return res.status(404).json({ error: 'Child not found' });
    if (!verifyAccess(req.auth, 'manage_children', c.id)) return res.status(403).json({ error: 'Permission denied' });
    io.to(svc.room.child(c.id)).emit('device:ring', { from: req.auth.parentId });
    res.json({ ok: true });
  });

  // Parent toggles flashlight on child device.
  r.post('/children/:id/flashlight', requireParent, (req, res) => {
    const c = children.byId(req.params.id);
    if (!c) return res.status(404).json({ error: 'Child not found' });
    if (!verifyAccess(req.auth, 'manage_children', c.id)) return res.status(403).json({ error: 'Permission denied' });
    const { on } = req.body || {};
    io.to(svc.room.child(c.id)).emit('device:flashlight', { on: !!on, from: req.auth.parentId });
    res.json({ ok: true });
  });

  r.get('/security-alerts', requireParent, (req, res) => {
    const fams = getParentFamilies(req.auth.parentId);
    const list = securityAlerts.filter((s) => fams.includes(s.parentId) || s.parentId === req.auth.parentId);
    res.json({ alerts: list.sort((a, b) => b.at - a.at) });
  });

  /* ── Safe Zones + zone history (Phase 6B) ────────────────────────────── */
  r.post('/zones', requireParent, (req, res) => {
    const b = req.body || {};
    const fams = getParentFamilies(req.auth.parentId);
    const c = children.find((x) => (fams.includes(x.familyId) || x.parentId === req.auth.parentId) && (!b.childId || x.id === b.childId));
    if (!c) return res.status(404).json({ error: 'Child not found' });
    if (!verifyAccess(req.auth, 'manage_children', c.id)) return res.status(403).json({ error: 'Permission denied' });
    const pairing = pairings.find((p) => p.childId === c.id);
    if (!pairing) return res.status(400).json({ error: 'no paired child' });
    const ownerId = c.parentId; // Always anchor to family owner parent ID
    res.json({ zone: svc.createZone(io, { parentId: ownerId, childId: c.id, pairingId: pairing.id, name: b.name, type: b.type, lat: b.lat, lng: b.lng, radius: b.radius, address: b.address, expectedArrival: b.expectedArrival, expectedDeparture: b.expectedDeparture, graceMin: b.graceMin }) });
  });
  r.get('/zones', requireParent, (req, res) => {
    const fams = getParentFamilies(req.auth.parentId);
    const list = Repo('safeZones').filter((z) => fams.includes(z.parentId) || z.parentId === req.auth.parentId);
    res.json({ zones: list });
  });
  r.delete('/zones/:id', requireParent, (req, res) => {
    const z = Repo('safeZones').byId(req.params.id);
    if (!z) return res.status(404).json({ error: 'Zone not found' });
    if (!getParentRoleAndPermissions(req.auth.parentId, z.childId)) return res.status(404).json({ error: 'Zone not found' });
    if (!verifyAccess(req.auth, 'manage_children', z.childId)) return res.status(403).json({ error: 'Permission denied' });
    res.json(svc.deleteZone(io, { id: req.params.id }) || { error: 'not found' });
  });
  r.get('/zone-events', requireParent, (req, res) => {
    const fams = getParentFamilies(req.auth.parentId);
    const childId = req.query.childId;
    let list = Repo('zoneEvents').filter((e) => fams.includes(e.parentId) || e.parentId === req.auth.parentId);
    if (childId) list = list.filter((e) => e.childId === childId);
    res.json({ events: list.sort((a, b) => b.at - a.at) });
  });

  // Update zone metadata (name, radius, schedule).
  r.patch('/zones/:id', requireParent, (req, res) => {
    const z = Repo('safeZones').byId(req.params.id);
    if (!z) return res.status(404).json({ error: 'Zone not found' });
    if (!getParentRoleAndPermissions(req.auth.parentId, z.childId)) return res.status(404).json({ error: 'Zone not found' });
    if (!verifyAccess(req.auth, 'manage_children', z.childId)) return res.status(403).json({ error: 'Permission denied' });
    const b = req.body || {};
    const allowed = ['name', 'radius', 'address', 'expectedArrival', 'expectedDeparture', 'graceMin'];
    const patch = {}; allowed.forEach((k) => { if (b[k] !== undefined) patch[k] = b[k]; });
    const updated = Repo('safeZones').update(req.params.id, patch);
    if (!updated) return res.status(404).json({ error: 'Zone not found' });
    // Emit updated zones list to parent.
    const io = req.io || (req.app && req.app.get('io'));
    if (io) io.to(svc.room.parent(z.parentId)).emit('zones:update', svc.listZonesForChild(z.childId));
    res.json({ zone: updated });
  });

  // Per-zone event analytics: history of enter/exit/late events for a specific zone.
  r.get('/zones/:id/events', requireParent, (req, res) => {
    const z = Repo('safeZones').byId(req.params.id);
    if (!z) return res.status(404).json({ error: 'Zone not found' });
    if (!getParentRoleAndPermissions(req.auth.parentId, z.childId)) return res.status(404).json({ error: 'Zone not found' });
    const evts = Repo('zoneEvents').filter((e) => e.zoneId === req.params.id).sort((a, b) => b.at - a.at);
    // Compute analytics: total entries, total exits, total dwell time.
    const entries = evts.filter((e) => e.type === 'enter').length;
    const exits   = evts.filter((e) => e.type === 'exit').length;
    const totalDwellMs = evts.filter((e) => e.durationMs).reduce((sum, e) => sum + (e.durationMs || 0), 0);
    res.json({ events: evts, analytics: { entries, exits, totalDwellMs } });
  });

  /* ── Family Radar ───────────────────────────────────────────────── */
  r.get('/radar/summary/:childId', requireParent, (req, res) => {
    if (!ownsChild(req.auth, req.params.childId)) return res.status(404).json({ error: 'Child not found' });
    res.json({ summary: svc.getRadarSummary(req.params.childId) });
  });

  r.get('/radar/events/:childId', requireParent, (req, res) => {
    if (!ownsChild(req.auth, req.params.childId)) return res.status(404).json({ error: 'Child not found' });
    const limit    = Math.min(Math.max(parseInt(req.query.limit, 10) || 100, 1), 500);
    const severity = ['info', 'warning', 'critical'].includes(req.query.severity) ? req.query.severity : null;
    const from     = req.query.from ? parseInt(req.query.from, 10) : 0;
    const to       = req.query.to   ? parseInt(req.query.to,   10) : Infinity;
    res.json({ events: svc.listRadarEvents(req.params.childId, req.auth.parentId, { limit, severity, from, to }) });
  });

  // Location-permission revoked event (reported by the child app).
  r.post('/radar/location-disabled', requireChild, (req, res) => {
    const p = Repo('pairings').find((x) => x.childId === req.auth.childId && x.status === 'active');
    if (!p) return res.status(404).json({ error: 'no active pairing' });
    const b = req.body || {};
    const ev = svc.reportRadarEvent(io, {
      childId: req.auth.childId,
      parentId: p.parentId,
      type: b.revoked ? 'location_revoked' : 'location_disabled',
      severity: 'critical',
      title: b.revoked ? 'Location Permission Revoked' : 'Location Tracking Disabled',
      body: b.revoked ? 'Child revoked location permission' : 'Child disabled location tracking',
      data: { revoked: !!b.revoked },
    });
    svc.addNotification(io, { parentId: p.parentId, type: 'location', title: ev.title, body: ev.body, data: { childId: req.auth.childId } });
    res.json({ event: ev });
  });

  /* ── Push notification device registration (parent or child) ─────────── */
  r.post('/push/register', requireAuth, (req, res) => {
    const b = req.body || {};
    if (!b.token) return res.status(400).json({ error: 'token required' });
    const ownerId = req.auth.role === 'parent' ? req.auth.parentId : req.auth.childId;
    push.registerToken(req.auth.role, ownerId, b.token, b.platform);
    res.json({ ok: true });
  });
  r.post('/push/unregister', requireAuth, (req, res) => {
    if ((req.body || {}).token) push.unregisterToken(req.body.token);
    res.json({ ok: true });
  });

  /* ── Notifications ───────────────────────────────────────────────────── */
  // List all notifications visible to this parent (own + family-scoped).
  r.get('/notifications', requireParent, (req, res) => {
    const parentId = req.auth.parentId;
    const { type, unread, limit = 50, offset = 0 } = req.query;
    let result = notifications.filter((n) => n.parentId === parentId || n.familyId === parentId);
    if (type) result = result.filter((n) => n.type === type);
    if (unread === 'true') result = result.filter((n) => !n.read);
    result = result.sort((a, b) => b.at - a.at).slice(Number(offset), Number(offset) + Number(limit));
    res.json({ notifications: result });
  });

  // Unread count for badge indicator.
  r.get('/notifications/unread-count', requireParent, (req, res) => {
    const parentId = req.auth.parentId;
    const count = notifications.filter((n) => (n.parentId === parentId || n.familyId === parentId) && !n.read).length;
    res.json({ count });
  });

  // Mark a notification as read and broadcast to co-parents for realtime sync.
  r.post('/notifications/:id/read', requireParent, (req, res) => {
    const n = notifications.byId(req.params.id);
    if (!n || (n.parentId !== req.auth.parentId && n.familyId !== req.auth.parentId)) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const updated = notifications.update(req.params.id, { read: true });
    // Broadcast read event to all family members for badge sync.
    const effectiveFamilyId = n.familyId || n.parentId;
    const members = familyMembers.filter((m) => m.familyId === effectiveFamilyId);
    const recipientIds = new Set([n.parentId, ...members.map((m) => m.userId)]);
    recipientIds.forEach((rid) => io.to(svc.room.parent(rid)).emit('notification:read', { id: updated.id }));
    res.json({ notification: updated });
  });

  // Mark all notifications as read.
  r.post('/notifications/read-all', requireParent, (req, res) => {
    const parentId = req.auth.parentId;
    const toRead = notifications.filter((n) => (n.parentId === parentId || n.familyId === parentId) && !n.read);
    toRead.forEach((n) => notifications.update(n.id, { read: true }));
    io.to(svc.room.parent(parentId)).emit('notification:read-all', {});
    res.json({ ok: true, count: toRead.length });
  });

  // Get notification preferences.
  r.get('/notifications/preferences', requireParent, (req, res) => {
    res.json({ preferences: svc.getNotificationPrefs(req.auth.parentId) });
  });

  // Save notification preferences.
  r.post('/notifications/preferences', requireParent, (req, res) => {
    const updated = svc.setNotificationPrefs(req.auth.parentId, req.body || {});
    res.json({ preferences: updated });
  });

  // Delivery status update (app client reports when push is received/opened).
  r.post('/notifications/:id/delivery', requireParent, (req, res) => {
    const n = notifications.byId(req.params.id);
    if (!n || (n.parentId !== req.auth.parentId && n.familyId !== req.auth.parentId)) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    const { status, token } = req.body || {}; // status: 'delivered' | 'opened'
    if (!status) return res.status(400).json({ error: 'status required' });
    const deliveries = (n.deliveries || []).map((d) => {
      if (d.recipientId === req.auth.parentId && (!token || d.token === token)) {
        return { ...d, status, updatedAt: now() };
      }
      return d;
    });
    const updated = notifications.update(n.id, { deliveries });
    if (status === 'opened' && !n.read) {
      notifications.update(n.id, { read: true });
    }
    res.json({ ok: true, notification: updated });
  });

  /* ── Family Relationship Layer & Child Device Registry ────────────────── */
  r.get('/families', requireParent, (req, res) => {
    const parentId = req.auth.parentId;
    ensureFamily(parentId);
    const members = familyMembers.filter((m) => m.userId === parentId);
    const result = members.map((m) => {
      const fam = families.byId(m.familyId);
      if (!fam) return null;
      
      const famMembers = familyMembers.filter((fm) => fm.familyId === fam.id).map((fm) => {
        const p = parents.byId(fm.userId);
        return {
          id: fm.id,
          userId: fm.userId,
          name: p ? p.name : 'Unknown Parent',
          email: p ? p.email : '',
          role: fm.role,
          permissions: fm.permissions || [],
          joinedAt: fm.createdAt,
        };
      });
      
      const famChildren = children.filter((c) => c.familyId === fam.id || c.parentId === fam.ownerId).map(publicChild);
      
      const childIds = famChildren.map((c) => c.id);
      const famDevices = devices.filter((d) => d.familyId === fam.id || (d.ownerType === 'child' && childIds.includes(d.ownerId))).map((d) => ({
        id: d.id,
        deviceId: d.id,
        deviceName: d.deviceName || d.name || 'Unknown Device',
        platform: d.platform || 'android',
        lastSeen: d.lastSeen || d.createdAt,
        agentVersion: d.agentVersion || '1.0.0',
        childId: d.ownerType === 'child' ? d.ownerId : null,
        familyId: d.familyId || fam.id,
        registrationTimestamp: d.createdAt,
        status: d.status || 'active',
      }));
      
      return {
        id: fam.id,
        name: fam.name,
        ownerId: fam.ownerId,
        createdAt: fam.createdAt,
        members: famMembers,
        children: famChildren,
        devices: famDevices,
      };
    }).filter(Boolean);
    
    res.json({ families: result });
  });

  r.post('/family/invite', requireParent, (req, res) => {
    const { familyId, role, permissions } = req.body || {};
    if (!familyId) return res.status(400).json({ error: 'familyId required' });
    if (!['co_parent', 'guardian'].includes(role)) return res.status(400).json({ error: 'invalid role: must be co_parent or guardian' });
    
    const m = familyMembers.find((fm) => fm.familyId === familyId && fm.userId === req.auth.parentId);
    if (!m || m.role !== 'primary_parent') return res.status(403).json({ error: 'Only primary parent can generate invites' });
    
    const code = code6().toUpperCase();
    const expiresAt = now() + 24 * 3600 * 1000;
    
    const invite = familyInvitations.insert({
      familyId,
      code,
      role,
      permissions: permissions || (role === 'co_parent' ? ['manage_children', 'manage_tasks', 'manage_rewards'] : ['view_location', 'view_tasks']),
      status: 'pending',
      expiresAt,
    });
    
    res.json({ code: invite.code, expiresAt: invite.expiresAt });
  });

  r.post('/family/join', requireParent, claimLimiter, (req, res) => {
    const { code } = req.body || {};
    if (!code) return res.status(400).json({ error: 'code required' });
    
    const invite = familyInvitations.find((inv) => inv.code === code.trim().toUpperCase());
    if (!invite) return res.status(404).json({ error: 'Invalid invitation code' });
    if (invite.status !== 'pending') return res.status(410).json({ error: 'Invitation has already been used or expired' });
    if (invite.expiresAt < now()) {
      familyInvitations.update(invite.id, { status: 'expired' });
      return res.status(410).json({ error: 'Invitation has expired' });
    }
    
    const existing = familyMembers.find((fm) => fm.familyId === invite.familyId && fm.userId === req.auth.parentId);
    if (existing) return res.status(409).json({ error: 'You are already a member of this family' });
    
    familyMembers.insert({
      familyId: invite.familyId,
      userId: req.auth.parentId,
      role: invite.role,
      permissions: invite.permissions,
    });
    
    familyInvitations.update(invite.id, { status: 'accepted', acceptedAt: now() });
    
    const fam = families.byId(invite.familyId);
    res.json({ ok: true, family: { id: fam.id, name: fam.name } });
  });

  r.patch('/family/members/:memberId', requireParent, (req, res) => {
    const { role, permissions } = req.body || {};
    if (role !== undefined && !['co_parent', 'guardian'].includes(role)) {
      return res.status(400).json({ error: 'invalid role: must be co_parent or guardian' });
    }
    const fm = familyMembers.byId(req.params.memberId);
    if (!fm) return res.status(404).json({ error: 'Family member not found' });
    
    const requester = familyMembers.find((x) => x.familyId === fm.familyId && x.userId === req.auth.parentId);
    if (!requester || requester.role !== 'primary_parent') return res.status(403).json({ error: 'Only primary parent can manage members' });
    
    const updated = familyMembers.update(fm.id, {
      role: role !== undefined ? role : fm.role,
      permissions: permissions !== undefined ? permissions : fm.permissions,
    });
    
    res.json({ member: updated });
  });

  r.delete('/family/members/:memberId', requireParent, (req, res) => {
    const fm = familyMembers.byId(req.params.memberId);
    if (!fm) return res.status(404).json({ error: 'Family member not found' });
    
    const requester = familyMembers.find((x) => x.familyId === fm.familyId && x.userId === req.auth.parentId);
    if (!requester) return res.status(403).json({ error: 'Access denied' });
    
    if (fm.userId !== req.auth.parentId) {
      if (requester.role !== 'primary_parent') return res.status(403).json({ error: 'Only primary parent can remove members' });
    } else {
      if (fm.role === 'primary_parent') {
        const count = familyMembers.filter((x) => x.familyId === fm.familyId && x.role === 'primary_parent').length;
        if (count === 1) {
          return res.status(400).json({ error: 'Primary parent cannot leave family. Delete the account or transfer ownership first.' });
        }
      }
    }
    
    familyMembers.remove(fm.id);
    res.json({ ok: true });
  });

  r.get('/devices', requireParent, (req, res) => {
    const parentId = req.auth.parentId;
    const fams = getParentFamilies(parentId);
    if (fams.length === 0) return res.json({ devices: [] });
    
    const kids = children.filter((c) => fams.includes(c.familyId) || fams.includes(c.parentId)).map((c) => c.id);
    const devs = devices.filter((d) => fams.includes(d.familyId) || (d.ownerType === 'child' && kids.includes(d.ownerId))).map((d) => ({
      id: d.id,
      deviceId: d.id,
      deviceName: d.deviceName || d.name || 'Unknown Device',
      platform: d.platform || 'android',
      lastSeen: d.lastSeen || d.createdAt,
      agentVersion: d.agentVersion || '1.0.0',
      childId: d.ownerType === 'child' ? d.ownerId : null,
      familyId: d.familyId || (fams.length > 0 ? fams[0] : null),
      registrationTimestamp: d.createdAt,
      status: d.status || 'active',
    }));
    
    res.json({ devices: devs });
  });

  r.post('/devices/register', requireAuth, (req, res) => {
    const { deviceId, deviceName, platform, agentVersion, childId } = req.body || {};
    if (!deviceId) return res.status(400).json({ error: 'deviceId required' });
    
    let targetChildId = childId;
    if (req.auth.role === 'child') {
      targetChildId = req.auth.childId;
    }
    
    if (!targetChildId) return res.status(400).json({ error: 'childId required' });
    const c = children.byId(targetChildId);
    if (!c) return res.status(404).json({ error: 'Child not found' });
    
    const familyId = c.familyId || c.parentId;
    
    if (req.auth.role === 'parent' && !verifyAccess(req.auth, 'manage_devices', targetChildId)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    const dev = devices.upsert((d) => d.id === deviceId, {
      id: deviceId,
      ownerType: 'child',
      ownerId: targetChildId,
      deviceName: deviceName || 'Child Device',
      platform: platform || 'android',
      lastSeen: now(),
      agentVersion: agentVersion || '1.0.0',
      childId: targetChildId,
      familyId,
      registrationTimestamp: now(),
      status: 'active',
    });
    
    res.json({ device: dev });
  });

  r.delete('/devices/:id', requireParent, (req, res) => {
    const d = devices.byId(req.params.id);
    if (!d) return res.status(404).json({ error: 'Device not found' });
    
    if (!verifyAccess(req.auth, 'manage_devices', d.ownerId)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    
    devices.remove(d.id);
    res.json({ ok: true });
  });

  return r;
}
