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
  revokePairing: (childId) => req('POST', '/pair/revoke', { childId }),
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
  // Phase 1 — shared tasks (triple-state + history)
  listTasks: (childId) => req('GET', childId ? `/tasks?childId=${encodeURIComponent(childId)}` : '/tasks'),
  createTask: (data) => req('POST', '/tasks', data),
  updateTask: (id, patch) => req('PATCH', `/tasks/${id}`, patch),
  cycleTask: (id) => req('POST', `/tasks/${id}/cycle`, {}),
  deleteTask: (id) => req('DELETE', `/tasks/${id}`),
  taskHistory: (id) => req('GET', `/tasks/${id}/history`),
  // Phase 2 — targets, rewards/promises, streaks, achievements, AI reports
  listTargets: (childId) => req('GET', childId ? `/targets?childId=${encodeURIComponent(childId)}` : '/targets'),
  createTarget: (data) => req('POST', '/targets', data),
  updateTarget: (id, patch) => req('PATCH', `/targets/${id}`, patch),
  deleteTarget: (id) => req('DELETE', `/targets/${id}`),
  listRewards: (childId) => req('GET', childId ? `/rewards?childId=${encodeURIComponent(childId)}` : '/rewards'),
  createReward: (data) => req('POST', '/rewards', data),
  updateReward: (id, patch) => req('PATCH', `/rewards/${id}`, patch),
  deleteReward: (id) => req('DELETE', `/rewards/${id}`),
  streaks: (childId) => req('GET', `/streaks/${childId}`),
  achievements: (childId) => req('GET', `/achievements/${childId}`),
  generateReport: (childId, period) => req('POST', '/ai/reports', { childId, period }),
  // Phase 3 — Help & Support
  createTicket: (data) => req('POST', '/support/tickets', data),
  listTickets: () => req('GET', '/support/tickets'),
  getTicket: (id) => req('GET', `/support/tickets/${id}`),
  commentTicket: (id, body, attachment) => req('POST', `/support/tickets/${id}/comments`, { body, attachment }),
  closeTicket: (id) => req('POST', `/support/tickets/${id}/close`, {}),
  createFeature: (data) => req('POST', '/feature-requests', data),
  listFeatures: () => req('GET', '/feature-requests'),
  announcements: () => req('GET', '/announcements'),
  changelog: () => req('GET', '/changelog'),
  rateApp: (stars, feedback) => req('POST', '/ratings', { stars, feedback }),
  // admin
  adminTickets: () => req('GET', '/admin/support/tickets'),
  adminTicket: (id) => req('GET', `/admin/support/tickets/${id}`),
  adminUpdateTicket: (id, patch) => req('PATCH', `/admin/support/tickets/${id}`, patch),
  adminReplyTicket: (id, body, internal) => req('POST', `/admin/support/tickets/${id}/comments`, { body, internal }),
  adminFeatures: () => req('GET', '/admin/feature-requests'),
  adminUpdateFeature: (id, patch) => req('PATCH', `/admin/feature-requests/${id}`, patch),
  adminCreateAnnouncement: (data) => req('POST', '/admin/announcements', data),
  adminCreateChangelog: (data) => req('POST', '/admin/changelog', data),
};

// App version + auto-captured device/browser info attached to bug reports.
export const APP_VERSION = '2.1.0';
export const clientInfo = () => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const platform = (typeof navigator !== 'undefined' && navigator.platform) || 'unknown';
  const screenInfo = typeof window !== 'undefined' && window.screen ? `${window.screen.width}x${window.screen.height}` : '';
  let browser = 'Unknown';
  if (/Edg\//.test(ua)) browser = 'Edge'; else if (/Chrome\//.test(ua)) browser = 'Chrome';
  else if (/Firefox\//.test(ua)) browser = 'Firefox'; else if (/Safari\//.test(ua)) browser = 'Safari';
  const m = ua.match(/(Chrome|Firefox|Version|Edg)\/(\d+)/);
  return { device: `${platform} · ${screenInfo}`, browser: `${browser}${m ? ' ' + m[2] : ''}`, appVersion: APP_VERSION };
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
