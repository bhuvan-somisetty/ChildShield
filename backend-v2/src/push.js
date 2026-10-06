// Push notification delivery (FCM HTTP v1). Reuses google-auth-library (already
// a dependency) to mint an access token from the FCM service account, so no new
// dependency is needed. Apple devices are delivered via FCM→APNs (Firebase).
//
// CONFIG (production): set FCM_PROJECT_ID and FCM_SERVICE_ACCOUNT (the service
// account JSON, as a string). Without them, sendToUser is a safe no-op — the
// in-app/realtime notification still works, so the app is never broken by a
// missing push config.
import { GoogleAuth } from 'google-auth-library';
import { Repo, now } from './db.js';

const deviceTokens = Repo('deviceTokens');

const PROJECT_ID = process.env.FCM_PROJECT_ID || '';
let _auth = null;
const fcmConfigured = () => !!(PROJECT_ID && process.env.FCM_SERVICE_ACCOUNT);

const authClient = () => {
  if (_auth) return _auth;
  const credentials = JSON.parse(process.env.FCM_SERVICE_ACCOUNT);
  _auth = new GoogleAuth({ credentials, scopes: ['https://www.googleapis.com/auth/firebase.messaging'] });
  return _auth;
};

// Register (idempotent) a device token for a user. Re-registering a token moves
// it to the current owner (handles a device re-paired to a different child).
export const registerToken = (ownerType, ownerId, token, platform) => {
  if (!token || !ownerId) return null;
  return deviceTokens.upsert((t) => t.token === token, { ownerType, ownerId, token, platform: platform || 'unknown', at: now() });
};

export const unregisterToken = (token) => {
  const row = deviceTokens.find((t) => t.token === token);
  if (row) deviceTokens.remove(row.id);
};

export const tokensFor = (ownerId) => deviceTokens.filter((t) => t.ownerId === ownerId).map((t) => t.token);

// Send a push to a single device token. Returns { sent: true } on success,
// or { sent: false, error: '...' } on failure. Prunes stale tokens automatically.
export const sendPushNotification = async (token, title, body, data) => {
  if (!fcmConfigured()) return { sent: false, error: 'fcm-not-configured' };
  let accessToken;
  try {
    const client = await authClient().getClient();
    accessToken = (await client.getAccessToken()).token;
  } catch (e) {
    console.error('[push] auth failed:', e.message);
    return { sent: false, error: 'auth' };
  }
  const url = `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`;
  const dataStr = {};
  Object.entries(data || {}).forEach(([k, v]) => { dataStr[k] = typeof v === 'string' ? v : JSON.stringify(v); });
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: { token, notification: { title, body }, data: dataStr, android: { priority: 'high' }, apns: { headers: { 'apns-priority': '10' } } } }),
    });
    if (res.ok) return { sent: true };
    if (res.status === 404 || res.status === 400) { unregisterToken(token); }
    return { sent: false, error: `fcm-${res.status}` };
  } catch (e) {
    console.error('[push] send failed:', e.message);
    return { sent: false, error: e.message };
  }
};

// Fire-and-forget push to every device of a user. No-op (logged) without config.
export const sendToUser = async (ownerId, { title, body, data }) => {
  const tokens = tokensFor(ownerId);
  if (tokens.length === 0) return { sent: 0 };
  if (!fcmConfigured()) return { sent: 0, skipped: 'fcm-not-configured' };
  const results = await Promise.all(tokens.map((t) => sendPushNotification(t, title, body, data)));
  const sent = results.filter((r) => r.sent).length;
  return { sent };
};

export const isConfigured = fcmConfigured;
