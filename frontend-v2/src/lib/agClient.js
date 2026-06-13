// AlphaGuard backend-v2 client SDK — REST + Socket.IO. Additive: screens can
// adopt this incrementally to replace their localStorage stores with realtime
// server data. Token is persisted so the socket reconnects across reloads.
import { io } from 'socket.io-client';

const BASE = import.meta.env.VITE_AG_API || 'http://localhost:4000';
const TKEY = 'ag_api_token';

export const getToken = () => localStorage.getItem(TKEY) || '';
export const setToken = (t) => (t ? localStorage.setItem(TKEY, t) : localStorage.removeItem(TKEY));

// ── REST ──────────────────────────────────────────────────────────────────
const req = async (method, path, body) => {
  const res = await fetch(BASE + '/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
};

export const api = {
  // auth + pairing
  registerParent: (email, password, name, pin) => req('POST', '/auth/parent/register', { email, password, name, pin }),
  loginParent: (email, password) => req('POST', '/auth/parent/login', { email, password }),
  emailAvailable: (email) => req('GET', `/auth/parent/email-available?email=${encodeURIComponent(email)}`),
  verifyPin: (pin) => req('POST', '/auth/parent/verify-pin', { pin }),
  setPin: (pin) => req('POST', '/auth/parent/set-pin', { pin }),
  googleConfig: () => req('GET', '/auth/google/config'),
  googleAuth: (code) => req('POST', '/auth/google', { code }),
  me: () => req('GET', '/me'),
  deleteAccount: () => req('DELETE', '/me'),
  createChild: (data) => req('POST', '/children', data),
  listChildren: () => req('GET', '/children'),
  claimPairing: (code, platform) => req('POST', '/pair/claim', { code, platform }),
  regeneratePairing: (childId) => req('POST', '/pair/regenerate', { childId }),
  pairStatus: () => req('GET', '/pair/status'),
  // data
  messages: (pairingId) => req('GET', `/chat/${pairingId}/messages`),
  sendMessage: (pairingId, text) => req('POST', `/chat/${pairingId}/messages`, { text }),
  sosList: () => req('GET', '/sos'),
  triggerSOS: (location) => req('POST', '/sos', { location }),
  location: (childId) => req('GET', `/location/${childId}`),
  battery: (childId) => req('GET', `/battery/${childId}`),
  requests: () => req('GET', '/requests'),
  decideRequest: (id, decision) => req('POST', `/requests/${id}/decide`, { decision }),
  notifications: () => req('GET', '/notifications'),
};

// ── Socket.IO ───────────────────────────────────────────────────────────────
let socket = null;
export const connectRealtime = () => {
  if (socket) return socket;
  socket = io(BASE, { auth: { token: getToken() }, transports: ['websocket'] });
  return socket;
};
export const getSocket = () => socket;
export const disconnectRealtime = () => { if (socket) { socket.close(); socket = null; } };

// Convenience emitters (parent + child share most of these).
export const rt = {
  on: (evt, fn) => connectRealtime().on(evt, fn),
  off: (evt, fn) => socket && socket.off(evt, fn),
  chatSend: (pairingId, text) => connectRealtime().emit('chat:send', { pairingId, text }),
  chatTyping: (pairingId, isTyping) => connectRealtime().emit('chat:typing', { pairingId, isTyping }),
  chatRead: (pairingId, ids) => connectRealtime().emit('chat:read', { pairingId, ids }),
  sos: (location) => connectRealtime().emit('sos:trigger', { location }),
  location: (lat, lng, accuracy) => connectRealtime().emit('location:update', { lat, lng, accuracy }),
  battery: (level, charging) => connectRealtime().emit('battery:update', { level, charging }),
  requestCreate: (r) => connectRealtime().emit('request:create', r),
  requestDecide: (requestId, decision) => connectRealtime().emit('request:decide', { requestId, decision }),
};
