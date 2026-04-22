const passport       = require('passport');
const GoogleStrategy  = require('passport-google-oauth20').Strategy;
const FacebookStrategy= require('passport-facebook').Strategy;
const bcrypt         = require('bcryptjs');
const crypto         = require('crypto');
const { Parent }     = require('./db');

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://child-shield.vercel.app';
const RENDER_URL   = process.env.RENDER_EXTERNAL_URL || 'https://childshield-1sd6.onrender.com';

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

// Ensure absolute URLs are used to prevent redirect_uri_mismatch errors
const getGoogleCallback = () => {
  if (process.env.GOOGLE_CALLBACK_URL) return process.env.GOOGLE_CALLBACK_URL;
  return `${RENDER_URL}/auth/google/callback`;
};

const getFacebookCallback = () => {
  if (process.env.FACEBOOK_CALLBACK_URL) return process.env.FACEBOOK_CALLBACK_URL;
  return `${RENDER_URL}/auth/facebook/callback`;
};

if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy({
    clientID:     process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:  getGoogleCallback(),
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

if (process.env.FACEBOOK_APP_ID) {
  passport.use(new FacebookStrategy({
    clientID:     process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL:  getFacebookCallback(),
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

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try { const parent = await Parent.findByPk(id); done(null, parent); }
  catch (err) { done(err); }
});

module.exports = passport;
