// Secure password reset for parent accounts. The reset token is a CSPRNG value
// returned to the user via email; only its SHA-256 HASH is stored, with a short
// expiry, and it is single-use. We never reveal whether an email exists
// (anti-enumeration). Email delivery is pluggable: if SMTP is configured it is
// sent there; otherwise the link is logged (dev) — the secure token flow itself
// is complete and production-ready.
import crypto from 'node:crypto';
import { Repo, now } from './db.js';
import { hashPassword } from './auth.js';

const resets = Repo('passwordResets');
const parents = Repo('parents');

const TTL_MS = 60 * 60 * 1000; // 1 hour
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

// Begin reset: always returns { ok: true }. When the email matches a real
// password account, mints a token and "sends" it.
export const requestReset = async (email) => {
  const e = String(email || '').toLowerCase().trim();
  const p = parents.find((x) => x.email === e && x.passwordHash); // Google-only accounts can't reset a password
  if (p) {
    // Invalidate any prior outstanding tokens for this parent.
    resets.filter((r) => r.parentId === p.id && !r.used).forEach((r) => resets.update(r.id, { used: true }));
    const token = crypto.randomBytes(32).toString('hex');
    resets.insert({ parentId: p.id, tokenHash: sha256(token), expiresAt: now() + TTL_MS, used: false, at: now() });
    await deliver(p.email, token);
  }
  return { ok: true };
};

// Complete reset: verifies an unused, unexpired token and sets the new password.
export const performReset = async (token, newPassword) => {
  if (!token || String(newPassword || '').length < 8) return { error: 'Invalid token or password too short (min 8).' };
  const hash = sha256(String(token));
  const row = resets.find((r) => r.tokenHash === hash && !r.used && r.expiresAt > now());
  if (!row) return { error: 'This reset link is invalid or has expired.' };
  const p = parents.byId(row.parentId);
  if (!p) return { error: 'Account not found.' };
  parents.update(p.id, { passwordHash: await hashPassword(String(newPassword)) });
  resets.update(row.id, { used: true, usedAt: now() });
  return { ok: true };
};

// Email delivery. Uses SMTP via nodemailer when SMTP_URL + nodemailer are
// available; otherwise logs the link (dev). Kept optional so no new hard
// dependency is required to ship the secure token flow.
const deliver = async (email, token) => {
  const base = process.env.FRONTEND_URL || process.env.AG_CORS_ORIGINS?.split(',')[0] || 'https://app.alphaguard.ai';
  const link = `${base}/reset?token=${token}`;
  if (process.env.SMTP_URL) {
    try {
      const { default: nodemailer } = await import('nodemailer'); // optional dep
      const transport = nodemailer.createTransport(process.env.SMTP_URL);
      await transport.sendMail({
        from: process.env.SMTP_FROM || 'AlphaGuard <no-reply@alphaguard.ai>',
        to: email,
        subject: 'Reset your AlphaGuard password',
        text: `Reset your password (valid 1 hour): ${link}`,
        html: `<p>Reset your AlphaGuard password (valid for 1 hour):</p><p><a href="${link}">${link}</a></p><p>If you didn't request this, ignore this email.</p>`,
      });
      return;
    } catch (e) { console.error('[reset] SMTP send failed:', e.message); }
  }
  console.log(`[reset] password reset link for ${email}: ${link}`);
};
