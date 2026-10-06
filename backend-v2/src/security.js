// Dependency-free security primitives shared by the REST + Socket.IO layers:
//   • isProd            — environment guard
//   • secureCode6       — CSPRNG 6-digit pairing code (replaces Math.random)
//   • rateLimit         — in-memory fixed-window limiter (per key) as Express mw
//   • corsOrigins       — parse the allowlist from AG_CORS_ORIGINS / FRONTEND_URL
//   • securityHeaders   — minimal hardening headers (no helmet dependency)
import crypto from 'node:crypto';

export const isProd = () => process.env.NODE_ENV === 'production';

// Cryptographically-secure 6-digit code (100000–999999), uniform.
export const secureCode6 = () => String(100000 + crypto.randomInt(0, 900000));

// ── Fixed-window in-memory rate limiter ──────────────────────────────────────
// Keyed by (route bucket + client ip). Good enough for a single-instance Render
// service; swap for a shared store (Redis) when scaling horizontally.
const buckets = new Map(); // key -> { count, resetAt }

const clientIp = (req) =>
  (req.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
  req.socket?.remoteAddress || 'unknown';

export const hit = (key, max, windowMs) => {
  const nowMs = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= nowMs) { buckets.set(key, { count: 1, resetAt: nowMs + windowMs }); return { ok: true, remaining: max - 1 }; }
  if (b.count >= max) return { ok: false, retryAfter: Math.ceil((b.resetAt - nowMs) / 1000) };
  b.count += 1;
  return { ok: true, remaining: max - b.count };
};

// Periodically evict stale buckets so the map can't grow unbounded.
setInterval(() => { const t = Date.now(); for (const [k, b] of buckets) if (b.resetAt <= t) buckets.delete(k); }, 60_000).unref?.();

// Express middleware factory. `bucket` namespaces the limiter so unrelated
// routes don't share a counter. Optional `keyOf` adds a per-identity dimension
// (e.g. target email) on top of the IP, to blunt credential-stuffing.
export const rateLimit = (bucket, { max, windowMs, keyOf } = {}) => (req, res, next) => {
  const extra = typeof keyOf === 'function' ? `:${keyOf(req)}` : '';
  const r = hit(`${bucket}:${clientIp(req)}${extra}`, max, windowMs);
  if (r.ok) return next();
  res.set('Retry-After', String(r.retryAfter || 60));
  return res.status(429).json({ error: 'Too many requests. Please slow down and try again.' });
};

// Raw limiter for non-Express call sites (e.g. the Socket.IO handshake).
export const limitKey = (key, max, windowMs) => hit(key, max, windowMs).ok;

// ── CORS allowlist ───────────────────────────────────────────────────────────
// Comma-separated AG_CORS_ORIGINS (preferred) or single FRONTEND_URL. When unset
// in development we reflect any origin; in production an empty list is a
// misconfiguration we refuse to paper over with '*'.
export const corsOrigins = () => {
  const raw = process.env.AG_CORS_ORIGINS || process.env.FRONTEND_URL || '';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
};

export const corsOptions = () => {
  const list = corsOrigins();
  if (list.length === 0) {
    // Dev convenience only — never reflect arbitrary origins in production.
    return { origin: isProd() ? false : true };
  }
  return {
    origin: (origin, cb) => {
      // Allow same-origin / non-browser clients (curl, native app) with no Origin.
      if (!origin || list.includes(origin)) return cb(null, true);
      return cb(new Error('Origin not allowed by CORS'));
    },
  };
};

// Minimal security headers applied to every response.
export const securityHeaders = (_req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'no-referrer');
  res.set('X-XSS-Protection', '0'); // modern browsers: rely on CSP, disable legacy auditor
  res.set('Cross-Origin-Resource-Policy', 'same-site');
  if (isProd()) res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  next();
};
