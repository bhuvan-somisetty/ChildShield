/**
 * passport.js — Social OAuth Strategies
 *
 * Supports: Google, Facebook, Twitter/X
 *
 * SETUP (one-time):
 *   Add these to your backend/.env file:
 *
 *   GOOGLE_CLIENT_ID=your_google_client_id
 *   GOOGLE_CLIENT_SECRET=your_google_client_secret
 *
 *   FACEBOOK_APP_ID=your_facebook_app_id
 *   FACEBOOK_APP_SECRET=your_facebook_app_secret
 *
 *   TWITTER_CONSUMER_KEY=your_twitter_api_key
 *   TWITTER_CONSUMER_SECRET=your_twitter_api_secret
 *
 *   SESSION_SECRET=any_random_string_here
 *   FRONTEND_URL=http://localhost:5173
 *
 * HOW TO GET CREDENTIALS:
 *
 *  Google  → https://console.cloud.google.com/
 *            APIs & Services → Credentials → OAuth 2.0 Client IDs
 *            Authorized redirect URI: http://localhost:5000/api/auth/google/callback
 *
 *  Facebook→ https://developers.facebook.com/apps/
 *            Facebook Login → Settings
 *            Valid OAuth Redirect URI: http://localhost:5000/api/auth/facebook/callback
 *
 *  Twitter → https://developer.twitter.com/
 *            Authentication settings → OAuth 1.0a
 *            Callback URL: http://localhost:5000/api/auth/twitter/callback
 */

const passport       = require('passport');
const GoogleStrategy  = require('passport-google-oauth20').Strategy;
const FacebookStrategy= require('passport-facebook').Strategy;
const bcrypt         = require('bcryptjs');
const crypto         = require('crypto');
const { Parent }     = require('./db');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// ── Shared: find-or-create parent from social profile ─────────────────────────
const findOrCreateSocial = async (provider, profile, email, name) => {
  let parent = await Parent.findOne({ where: { email } });
  if (!parent) {
    const salt       = await bcrypt.genSalt(10);
    const randomPass = crypto.randomBytes(24).toString('hex');
    const randomPin  = crypto.randomBytes(4).toString('hex');
    parent = await Parent.create({
      fullName:  name  || email.split('@')[0],
      email,
      passwordHash: await bcrypt.hash(randomPass, salt),
      parentControlPasswordHash: await bcrypt.hash(randomPin, salt),
      needsPasswordSetup: true
    });
  }
  return parent;
};

// ── Google ─────────────────────────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  '/auth/google/callback',
    proxy:        true,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('No email from Google'), null);
      const parent = await findOrCreateSocial('google', profile, email, profile.displayName);
      done(null, parent);
    } catch (err) { done(err, null); }
  }));
}

// ── Facebook ───────────────────────────────────────────────────────────────────
if (process.env.FACEBOOK_APP_ID) {
  passport.use(new FacebookStrategy({
    clientID:     process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL:  '/auth/facebook/callback',
    profileFields: ['id', 'displayName', 'emails'],
    proxy:        true,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value || `fb_${profile.id}@childshield.local`;
      const parent = await findOrCreateSocial('facebook', profile, email, profile.displayName);
      done(null, parent);
    } catch (err) { done(err, null); }
  }));
}

// ── Twitter/X removed — not used ──────────────────────────────────────────────

// ── Session serialization (minimal — JWT issued at callback, no session needed) ─
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try { const parent = await Parent.findByPk(id); done(null, parent); }
  catch (err) { done(err); }
});

module.exports = passport;
