// Real backend session for both apps. Replaces the demo-pairing bootstrap.
//
// Parent: register-or-login a real account, then create (or reuse) a real child
// + pairing. The 6-digit code is written to localStorage so the child app (same
// origin in this build) can claim it — on real separate devices the child enters
// the code via the existing pairing screen instead.
// Child: claims the pairing code → real child token. Tokens persist across reloads.
//
// Everything throws on failure; callers fall back to local/demo behaviour so the
// apps still work with the backend offline.
import { io } from 'socket.io-client';
import { getToken } from './agClient';

const BASE = import.meta.env.VITE_AG_API || 'http://localhost:4000';
const LS_CREDS = 'ag_parent_creds';
const LS_PAIRING = 'ag_pairing';      // { pairingId, childId, code }
const LS_CHILD_TOKEN = 'ag_child_token';
const cache = {};

const jget = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };
const jset = (k, v) => localStorage.setItem(k, JSON.stringify(v));

async function http(path, body, token) {
  const res = await fetch(`${BASE}/api${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `HTTP ${res.status}`);
  return res.json();
}

const ready = (socket) => new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('timeout')), 6000);
  socket.once('ready', () => { clearTimeout(t); resolve(); });
  socket.once('connect_error', (e) => { clearTimeout(t); reject(e); });
});

async function parentToken() {
  // Prefer the real account token persisted by the Login/Signup flow, so the
  // dashboard's realtime data belongs to the signed-in parent — not a throwaway.
  const real = getToken();
  if (real) return real;
  // Fallback (offline / same-origin demo with no login): anonymous demo account.
  let creds = jget(LS_CREDS);
  if (!creds) { creds = { email: `parent.${Math.random().toString(36).slice(2, 9)}@ag.local`, password: `pw_${Math.random().toString(36).slice(2)}` }; jset(LS_CREDS, creds); }
  try { return (await http('/auth/parent/login', creds)).token; }
  catch { return (await http('/auth/parent/register', { ...creds, name: 'Parent' })).token; }
}

async function ensurePairing(ptoken) {
  let pairing = jget(LS_PAIRING);
  if (pairing && pairing.pairingId) return pairing;
  const r = await http('/children', { name: 'Emma', age: 10, grade: 'Grade 5', school: 'Lincoln Elementary', emoji: '👧', color: '#10b981' }, ptoken);
  pairing = { pairingId: r.pairing.id, childId: r.child.id, code: r.pairing.code };
  jset(LS_PAIRING, pairing);
  return pairing;
}

async function connectParent() {
  const token = await parentToken();
  const pairing = await ensurePairing(token);
  const socket = io(BASE, { auth: { token }, transports: ['websocket'], reconnection: true });
  await ready(socket);
  return { role: 'parent', socket, token, ...pairing };
}

async function connectChild() {
  const pairing = jget(LS_PAIRING);
  if (!pairing || !pairing.code) throw new Error('not-paired'); // parent must connect first
  let token = jget(LS_CHILD_TOKEN);
  if (!token) { token = (await http('/pair/claim', { code: pairing.code, platform: 'web' })).token; jset(LS_CHILD_TOKEN, token); }
  const socket = io(BASE, { auth: { token }, transports: ['websocket'], reconnection: true });
  await ready(socket);
  return { role: 'child', socket, token, pairingId: pairing.pairingId, childId: pairing.childId };
}

export async function ensureSession(role) {
  if (cache[role] && cache[role].socket && cache[role].socket.connected) return cache[role];
  cache[role] = role === 'parent' ? await connectParent() : await connectChild();
  return cache[role];
}
export function getSession(role) { return cache[role] || null; }
export function closeSession(role) { if (cache[role]?.socket) { cache[role].socket.close(); delete cache[role]; } }
export const serverBase = () => BASE;
