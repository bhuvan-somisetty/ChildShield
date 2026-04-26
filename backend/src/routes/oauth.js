/**
 * oauth.js — Social Login Routes (Google, Facebook, Twitter/X)
 *
 * Flow:
 *   1. Frontend button → GET /api/auth/google        (redirects to Google)
 *   2. Google          → GET /api/auth/google/callback (passport handles)
 *   3. Backend issues JWT → redirects to frontend: /auth/callback?token=JWT
 *   4. Frontend reads token from URL → logs in
 */

const express  = require('express');
const router   = express.Router();
const jwt      = require('jsonwebtoken');
const passport = require('../passport');

const JWT_SECRET   = process.env.JWT_SECRET   || 'fallback_secret_for_demo';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Helper: issue JWT and redirect to frontend ─────────────────────────────────
const issueJWT = (req, res) => {
  if (!req.user) {
    return res.redirect(`${FRONTEND_URL}/login?error=oauth_failed`);
  }
  const token = jwt.sign({ id: req.user.id }, JWT_SECRET, { expiresIn: '7d' });
  const user  = encodeURIComponent(JSON.stringify({
    id: req.user.id, fullName: req.user.fullName, email: req.user.email, needsPasswordSetup: req.user.needsPasswordSetup
  }));
  // Redirect to a dedicated callback page in the frontend
  res.redirect(`${FRONTEND_URL}/oauth-callback?token=${token}&user=${user}`);
};

// ── safe wrapper: catches crashes from missing credentials ─────────────────────
const safeAuth = (strategy, options) => (req, res, next) => {
  try {
    passport.authenticate(strategy, options, (err, user) => {
      if (err) {
        console.error(`[OAuth/${strategy}] Error:`, err.message);
        return res.redirect(`${FRONTEND_URL}/login?error=${strategy}_failed&msg=${encodeURIComponent(err.message)}`);
      }
      req.user = user;
      issueJWT(req, res);
    })(req, res, next);
  } catch (e) {
    console.error(`[OAuth/${strategy}] Crash:`, e.message);
    res.redirect(`${FRONTEND_URL}/login?error=${strategy}_failed`);
  }
};

// ── GOOGLE ─────────────────────────────────────────────────────────────────────
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.includes('YOUR_')) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_not_configured`);
  }
  try {
    passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' })(req, res, next);
  } catch(e) { res.redirect(`${FRONTEND_URL}/login?error=google_failed`); }
});
router.get('/google/callback', safeAuth('google', { session: false }));

// ── FACEBOOK ───────────────────────────────────────────────────────────────────
router.get('/facebook', (req, res, next) => {
  if (!process.env.FACEBOOK_APP_ID || process.env.FACEBOOK_APP_ID.includes('YOUR_')) {
    return res.redirect(`${FRONTEND_URL}/login?error=facebook_not_configured`);
  }
  try {
    passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
  } catch(e) { res.redirect(`${FRONTEND_URL}/login?error=facebook_failed`); }
});
router.get('/facebook/callback', safeAuth('facebook', { session: false }));

// ── TWITTER/X — removed (requires paid API tier) ──────────────────────────────

module.exports = router;
