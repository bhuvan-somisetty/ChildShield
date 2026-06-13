// Authentication: parent accounts (email + password) and child accounts
// (device-bound, claimed via pairing code). Both receive a JWT carrying role +
// ids so REST middleware and the Socket.IO handshake can authorize identically.
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const SECRET = process.env.AG_JWT_SECRET || 'alphaguard-dev-secret-change-me';
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
