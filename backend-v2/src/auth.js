// Authentication: parent accounts (email + password) and child accounts
// (device-bound, claimed via pairing code). Both receive a JWT carrying role +
// ids so REST middleware and the Socket.IO handshake can authorize identically.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// The signing secret MUST come from the environment in production. A weak or
// shared default would let anyone forge tokens for any family/role — a total
// authentication bypass — so we refuse to boot with the dev fallback when
// NODE_ENV=production. Locally (dev/test) a stable fallback keeps DX simple.
const DEV_FALLBACK = 'alphaguard-dev-secret-change-me';
const SECRET = process.env.AG_JWT_SECRET || DEV_FALLBACK;
if (process.env.NODE_ENV === 'production' && (!process.env.AG_JWT_SECRET || SECRET === DEV_FALLBACK || SECRET.length < 32)) {
  throw new Error('AG_JWT_SECRET must be set to a strong (>=32 char) random value in production');
}
const EXPIRES = '30d';

export const hashPassword = (pw) => bcrypt.hash(pw, 10);
export const comparePassword = (pw, hash) => bcrypt.compare(pw, hash);

// token payload: { sub, role: 'parent'|'child', parentId?, childId?, pairingId? }
export const sign = (payload) => jwt.sign(payload, SECRET, { expiresIn: EXPIRES });
export const verify = (token) => { try { return jwt.verify(token, SECRET); } catch { return null; } };

const bearer = (req) => {
  const h = req.headers.authorization || '';
  return h.startsWith('Bearer ') ? h.slice(7) : (req.query.token || null);
};

// Express middleware — attaches req.auth or 401s.
export const requireAuth = (req, res, next) => {
  const claims = verify(bearer(req));
  if (!claims) return res.status(401).json({ error: 'Unauthorized' });
  req.auth = claims;
  next();
};
export const requireParent = (req, res, next) => requireAuth(req, res, () => (req.auth.role === 'parent' ? next() : res.status(403).json({ error: 'Parent only' })));
export const requireChild = (req, res, next) => requireAuth(req, res, () => (req.auth.role === 'child' ? next() : res.status(403).json({ error: 'Child only' })));
