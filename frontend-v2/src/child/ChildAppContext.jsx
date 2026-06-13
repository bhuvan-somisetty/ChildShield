import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { DEFAULT_CHILD, DEFAULT_CONTACTS, DEFAULT_GOALS } from './childData';
import { readTelemetry } from './telemetry';
import { ensureSession, serverBase } from '../lib/session';
import { attachEnforcement, provisionNative, hasNative } from './enforcement';

/**
 * ChildAppContext — single local source of truth for the child device: profile,
 * live telemetry, emergency contacts, study goals. Everything persists to
 * localStorage (no backend yet); the parent dashboard reads the same chat store.
 */
const ChildAppContext = createContext(null);
export const useChildApp = () => useContext(ChildAppContext);

const load = (k, fallback) => { try { const v = localStorage.getItem(k); return v ? { ...fallback, ...JSON.parse(v) } : fallback; } catch { return fallback; } };
const loadArr = (k, fallback) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : fallback; } catch { return fallback; } };

export const ChildAppProvider = ({ children }) => {
  const [profile, setProfile] = useState(() => load('ag_child_profile', DEFAULT_CHILD));
  const [contacts, setContacts] = useState(() => loadArr('ag_child_contacts', DEFAULT_CONTACTS));
  const [goals, setGoals] = useState(() => loadArr('ag_child_goals', DEFAULT_GOALS));
  const [tel, setTel] = useState({ battery: { level: 80, charging: false }, network: 'Wi-Fi', online: true, updatedAt: Date.now() });
  const [liveChild, setLiveChild] = useState(false);
  const sockRef = useRef(null);
  const pairingRef = useRef(null);
  const telRef = useRef(tel); telRef.current = tel;

  // Poll real device telemetry.
  useEffect(() => {
    let alive = true;
    const tick = async () => { const t = await readTelemetry(); if (alive) setTel(t); };
    tick();
    const id = setInterval(tick, 30000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  // ── Realtime bridge: connect this device to the backend and publish telemetry.
  // Graceful — if the parent hasn't paired or the server is offline, the child
  // app keeps working locally.
  useEffect(() => {
    let cancelled = false;
    ensureSession('child').then((sess) => {
      if (cancelled) return;
      sockRef.current = sess.socket; pairingRef.current = sess.pairingId; setLiveChild(true);
      // Wire the native Android enforcement agent (if hosted in the agent WebView)
      // so its on-device detections flow to the parent over this socket.
      attachEnforcement(sess.socket);
      // Provision native so its package-install receiver can post directly.
      provisionNative(serverBase(), sess.token);
      // Push an immediate battery + location reading.
      const b = telRef.current.battery;
      sess.socket.emit('battery:update', { level: b.level, charging: b.charging });
      const pushLoc = () => navigator.geolocation && navigator.geolocation.getCurrentPosition(
        (p) => sess.socket.emit('location:update', { lat: p.coords.latitude, lng: p.coords.longitude }), () => {}, { enableHighAccuracy: true, timeout: 8000 });
      pushLoc();
      sess.socket._locTimer = setInterval(pushLoc, 25000);
    }).catch(() => { /* offline → local only */ });
    return () => { cancelled = true; const s = sockRef.current; if (s && s._locTimer) clearInterval(s._locTimer); };
  }, []);

  // Publish battery whenever the real device telemetry changes.
  useEffect(() => { if (sockRef.current && liveChild) sockRef.current.emit('battery:update', { level: tel.battery.level, charging: tel.battery.charging }); }, [tel, liveChild]);

  const emitSOS = useCallback((location) => { if (sockRef.current) sockRef.current.emit('sos:trigger', { location }); }, []);
  const emitChat = useCallback((text) => { if (sockRef.current && pairingRef.current) sockRef.current.emit('chat:send', { pairingId: pairingRef.current, text }); }, []);
  const emitRequest = useCallback((r) => { if (sockRef.current) sockRef.current.emit('request:create', r); }, []);
  const onParentMessage = useCallback((cb) => { const s = sockRef.current; if (!s) return () => {}; const h = (m) => { if (m.from === 'parent') cb(m); }; s.on('chat:message', h); return () => s.off('chat:message', h); }, []);

  useEffect(() => { localStorage.setItem('ag_child_contacts', JSON.stringify(contacts)); }, [contacts]);
  useEffect(() => { localStorage.setItem('ag_child_goals', JSON.stringify(goals)); }, [goals]);

  const updateProfile = useCallback((patch) => setProfile((p) => { const n = { ...p, ...patch }; localStorage.setItem('ag_child_profile', JSON.stringify(n)); return n; }), []);
  const addContact = useCallback((c) => setContacts((p) => [...p, { ...c, id: Date.now() }]), []);
  const removeContact = useCallback((id) => setContacts((p) => p.filter((c) => c.id !== id)), []);
  const toggleGoal = useCallback((id) => setGoals((p) => p.map((g) => (g.id === id ? { ...g, done: !g.done } : g))), []);
  const addGoal = useCallback((g) => setGoals((p) => [...p, { ...g, id: Date.now(), done: false }]), []);
  const removeGoal = useCallback((id) => setGoals((p) => p.filter((g) => g.id !== id)), []);

  const value = { profile, tel, contacts, goals, updateProfile, addContact, removeContact, toggleGoal, addGoal, removeGoal, liveChild, emitSOS, emitChat, emitRequest, onParentMessage, nativeEnforcement: hasNative() };
  return <ChildAppContext.Provider value={value}>{children}</ChildAppContext.Provider>;
};
