import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, LogOut, Clock, Wifi, WifiOff,
  Lock, Eye, Volume2, Shield, AlertTriangle,
  User, Moon, Pause, Activity, CheckCircle2,
  Camera, Mic, Monitor, MapPin, Phone, Trash2, Loader2, AppWindow, LockKeyhole, Unlock
} from 'lucide-react';
import SessionLockOverlay from './SessionLockOverlay';
import { VoiceEvents } from '../../hooks/VoiceAssistant';
import { useWebRTC } from '../../hooks/useWebRTC';

const INSTALLED_APPS = [
  { name: 'YouTube', icon: '📺', category: 'Entertainment', color: '#ef4444' },
  { name: 'Instagram', icon: '📸', category: 'Social', color: '#e91e8c' },
  { name: 'WhatsApp', icon: '💬', category: 'Messaging', color: '#10b981' },
  { name: 'TikTok', icon: '🎵', category: 'Entertainment', color: '#000' },
  { name: 'Snapchat', icon: '👻', category: 'Social', color: '#f59e0b' },
  { name: 'Chrome', icon: '🌐', category: 'Browser', color: '#3b82f6' },
  { name: 'Roblox', icon: '🎮', category: 'Gaming', color: '#8b5cf6' },
  { name: 'Spotify', icon: '🎧', category: 'Music', color: '#10b981' },
  { name: 'Telegram', icon: '✈️', category: 'Messaging', color: '#0891b2' },
  { name: 'Gallery', icon: '🖼️', category: 'System', color: '#6366f1' },
];

const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
const formatDist = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;

// ─── Countdown formatter ───────────────────────────────────────────────────────
const formatTime = (secs) => {
  if (!secs || secs <= 0) return '00:00';
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = Math.floor(secs % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ─── SVG Circular progress ring ────────────────────────────────────────────────
const ProgressRing = ({ pct, color, size = 180, stroke = 10 }) => {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(1, pct / 100)));
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }} />
    </svg>
  );
};

// ─── Protection card ───────────────────────────────────────────────────────────
const ProtectCard = ({ icon: Icon, label, sublabel, active, color }) => (
  <div style={{
    background: active ? `${color}10` : 'rgba(255,255,255,0.02)',
    border: `1px solid ${active ? `${color}35` : 'rgba(255,255,255,0.06)'}`,
    borderRadius: '16px', padding: '16px 14px',
    display: 'flex', flexDirection: 'column', gap: '10px',
    transition: 'all 0.4s'
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
        background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={17} color={active ? color : '#475569'} />
      </div>
      <div style={{
        width: '9px', height: '9px', borderRadius: '50%', marginTop: '2px',
        background: active ? color : '#1e293b',
        boxShadow: active ? `0 0 8px ${color}` : 'none',
        animation: active ? 'pulse-dot 2s infinite' : 'none'
      }} />
    </div>
    <div>
      <div style={{ fontSize: '13px', fontWeight: '700', color: active ? '#fff' : '#475569', marginBottom: '2px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: active ? `${color}cc` : '#334155', fontWeight: '500' }}>
        {active ? sublabel.on : sublabel.off}
      </div>
    </div>
  </div>
);

// ─── Main Component ────────────────────────────────────────────────────────────
const ChildDeviceView = () => {
  const [session] = useState(() => {
    try { return JSON.parse(localStorage.getItem('child_session')); } catch { return null; }
  });
  const [status, setStatus] = useState(null);
  const [connected, setConnected] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [countdown, setCountdown] = useState(null);
  const [timerEndMs, setTimerEndMs] = useState(null);

  // Logout security state
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [parentPin, setParentPin] = useState('');
  const [logoutErr, setLogoutErr] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [logoutRequestStatus, setLogoutRequestStatus] = useState('idle'); // idle, pending, approved, denied

  // SOS Emergency modal state
  const [sosResult, setSosResult] = useState(null); // { facilities: [], lat, lon, status: 'success'|'no-gps'|'no-geo' }

  // App Locker state
  const [lockedApps, setLockedApps] = useState([]);
  const [unlockAppTarget, setUnlockAppTarget] = useState(null);
  const [unlockAppPin, setUnlockAppPin] = useState('');
  const [unlockAppErr, setUnlockAppErr] = useState('');
  const [unlockAppLoading, setUnlockAppLoading] = useState(false);

  // Child's Safe Zones & Location
  const [safeZones, setSafeZones] = useState([]);
  const [currentLoc, setCurrentLoc] = useState(null);

  // Main Contacts
  const [contacts, setContacts] = useState(() => {
    try { return JSON.parse(localStorage.getItem('child_contacts') || '[]'); } catch { return []; }
  });
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContact, setNewContact] = useState({ name: '', phone: '' });

  const navigate = useNavigate();
  const parentName = session?.parentName || status?.parentName || 'Parent';
  const childName = session?.childName || status?.name || 'Child';
  const childId = session?.childId;
  // ─── Poll for logout request status when pending ──────────────────────────────
  useEffect(() => {
    if (logoutRequestStatus !== 'pending' || !session?.childId) return;
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`/api/device/logout-request/${session.childId}`);
        const d = await r.json();
        if (d.success && d.request) {
          if (d.request.status === 'approved') {
            setLogoutRequestStatus('approved');
            clearInterval(iv);
            // Auto-logout after showing message
            setTimeout(() => {
              localStorage.removeItem('child_session');
              navigate('/child-setup');
            }, 2500);
          } else if (d.request.status === 'denied') {
            setLogoutRequestStatus('denied');
            clearInterval(iv);
          }
        }
      } catch {}
    }, 2000);
    return () => clearInterval(iv);
  }, [logoutRequestStatus, session?.childId, navigate]);

  // ─── beforeunload protection ──────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = 'AlphaGuard is protecting this device. Are you sure you want to leave?';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const voiceRefs = useRef({ locked: false, paused: false, tenMin: false, fiveMin: false, oneMin: false, linked: false });

  const checkVoice = useCallback((s, endMs) => {
    if (!s?.voiceEnabled) return;
    const r = voiceRefs.current;
    if (!r.linked) { r.linked = true; VoiceEvents.DEVICE_LINKED(); return; }
    if (s.deviceState === 'locked' && !r.locked) { r.locked = true; r.paused = false; VoiceEvents.SESSION_LOCKED(); }
    if (s.deviceState === 'paused' && !r.paused) { r.paused = true; r.locked = false; VoiceEvents.SESSION_PAUSED(); }
    if (s.deviceState === 'active' && (r.locked || r.paused)) { VoiceEvents.SESSION_RESUMED(); r.locked = false; r.paused = false; }
    if (endMs && s.deviceState === 'active') {
      const m = (endMs - Date.now()) / 60000;
      if (m <= 10 && m > 9 && !r.tenMin) { r.tenMin = true; VoiceEvents.TIME_WARNING_10(); }
      if (m <= 5 && m > 4 && !r.fiveMin) { r.fiveMin = true; VoiceEvents.TIME_WARNING_5(); }
      if (m <= 1 && m > 0 && !r.oneMin) { r.oneMin = true; VoiceEvents.TIME_WARNING_1(); }
      if (m > 10) { r.tenMin = false; r.fiveMin = false; r.oneMin = false; }
    }
  }, []);

  // ─── Polling ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.childId) { navigate('/child-setup'); return; }
    let mounted = true;

    const poll = async () => {
      try {
        const [res, appRes] = await Promise.all([
          fetch(`/api/device/status/${session.childId}`),
          fetch(`/api/device/check-app-lock/${session.childId}`)
        ]);
        const data = await res.json();
        const appData = await appRes.json();
        
        if (!mounted) return;
        
        if (appData.success) {
          setLockedApps(appData.lockedApps || []);
        }
        if (data.success) {
          setStatus(data.status);
          setConnected(data.connected === true);
          setSyncError(false);
          if (!data.connected) { localStorage.removeItem('child_session'); navigate('/child-setup', { replace: true }); return; }
          // Update session cache with latest parentName
          if (data.parentName && session.parentName !== data.parentName) {
            localStorage.setItem('child_session', JSON.stringify({ ...session, parentName: data.parentName }));
          }
          const endMs = data.status?.timerEndTime ? new Date(data.status.timerEndTime).getTime() : null;
          setTimerEndMs(endMs);
          if (!endMs) setCountdown(null);
          checkVoice(data.status, endMs);
        }
      } catch { setSyncError(true); }
    };

    poll();
    const iv = setInterval(poll, 3000);
    return () => { mounted = false; clearInterval(iv); };
  }, [session, navigate, checkVoice]);

  // ─── Live countdown tick ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!timerEndMs) return;
    const iv = setInterval(() => setCountdown(Math.max(0, Math.floor((timerEndMs - Date.now()) / 1000))), 1000);
    return () => clearInterval(iv);
  }, [timerEndMs]);

  // ─── GPS Location Tracker ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!session?.childId) return;

    let watchId;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setCurrentLoc(prev => ({ ...prev, lat, lng }));

          let battery = null;
          if ('getBattery' in navigator) {
            try {
              const batt = await navigator.getBattery();
              battery = Math.round(batt.level * 100);
            } catch (e) {}
          }

          if (status?.locationTrackingEnabled) {
            fetch('/api/device/location', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                childId: session.childId,
                latitude: lat,
                longitude: lng,
                accuracy: position.coords.accuracy,
                speed: position.coords.speed,
                battery
              })
            }).catch(() => { });
          }
        },
        (error) => {
          console.warn('GPS tracking error', error);
        },
        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
      );
    }

    return () => {
      if (watchId !== undefined && navigator.geolocation) navigator.geolocation.clearWatch(watchId);
    };
  }, [status?.locationTrackingEnabled, session?.childId]);

  // ─── Reverse geocode child's current location ─────────────────────────────────
  const lastGeoKeyRef = useRef('');
  useEffect(() => {
    if (!currentLoc?.lat) return;
    const key = `${currentLoc.lat.toFixed(3)},${currentLoc.lng.toFixed(3)}`;
    if (lastGeoKeyRef.current === key) return;
    lastGeoKeyRef.current = key;
    fetch(`/api/device/reverse-geocode?lat=${currentLoc.lat}&lon=${currentLoc.lng}`)
      .then(r => r.json())
      .then(g => {
        if (g.success) setCurrentLoc(prev => ({ ...prev, address: g.displayName, city: g.city, locality: g.locality }));
      }).catch(() => {});
  }, [currentLoc?.lat, currentLoc?.lng]);

  // ─── Fetch safe zones for child ───────────────────────────────────────────────
  useEffect(() => {
    if (!session?.childId) return;
    // Try fetching safe zones without auth (child doesn't have parent token)
    fetch(`/api/device/child-safe-zones/${session.childId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setSafeZones(d.zones || []); })
      .catch(() => {});
  }, [session?.childId]);

  // ─── WebRTC Responder (Camera / Audio / Screen) ───────────────────────────────
  const { connectSocket, handleOffer: rtcHandleOffer, socket: socketRef, pcRef } = useWebRTC(session?.childId, 'child');
  const [activeStreams, setActiveStreams] = useState({ camera: false, audio: false, screen: false });
  const activeStreamRefs = useRef({});

  useEffect(() => {
    if (!session?.childId) return;
    const sock = connectSocket();

    const onOffer = async ({ offer, mediaType }) => {
      try {
        let stream;
        if (mediaType === 'camera') {
          try {
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
            // Mute audio by default to preserve privacy until parent explicitly enables it
            stream.getAudioTracks().forEach(t => t.enabled = false);
          } catch (e) {
            console.warn("Audio access failed, falling back to video only.");
            stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
          }
          setActiveStreams(s => ({ ...s, camera: true }));
        } else if (mediaType === 'audio') {
          stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          setActiveStreams(s => ({ ...s, audio: true }));
        } else if (mediaType === 'screen') {
          stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
          setActiveStreams(s => ({ ...s, screen: true }));
          stream.getVideoTracks()[0].onended = () => setActiveStreams(s => ({ ...s, screen: false }));
        }
        if (stream) {
          activeStreamRefs.current[mediaType] = stream;
          await rtcHandleOffer(offer, stream);
        }
      } catch (err) {
        console.warn('WebRTC stream error:', err);
      }
    };

    const onCommand = async ({ command, payload }) => {
      if (command === 'switch-camera') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: payload?.facingMode || 'user' }, audio: false });
          const newVideoTrack = stream.getVideoTracks()[0];

          if (pcRef.current) {
            const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
            if (sender) await sender.replaceTrack(newVideoTrack);
          }

          if (activeStreamRefs.current.camera) {
            const oldTrack = activeStreamRefs.current.camera.getVideoTracks()[0];
            if (oldTrack) oldTrack.stop();
            activeStreamRefs.current.camera.removeTrack(oldTrack);
            activeStreamRefs.current.camera.addTrack(newVideoTrack);
          }
        } catch (e) {
          console.warn('Switch camera error:', e);
        }
      } else if (command === 'toggle-audio') {
        const stream = activeStreamRefs.current.camera;
        if (stream) {
          stream.getAudioTracks().forEach(t => t.enabled = !!payload?.enabled);
        }
      } else if (command === 'toggle-flash') {
        // Attempt flash toggle via ImageCapture
        try {
          const track = activeStreamRefs.current.camera?.getVideoTracks()[0];
          if (track) {
            const caps = track.getCapabilities();
            if (caps && caps.torch) {
              const settings = track.getSettings();
              await track.applyConstraints({ advanced: [{ torch: typeof payload?.enabled === 'boolean' ? payload.enabled : !settings.torch }] });
            }
          }
        } catch (e) { }
      } else if (command === 'request-screen') {
        // Screen request handled via offer with mediaType='screen'
      }
    };

    const onPeerLeft = () => {
      // Stop all active streams
      Object.values(activeStreamRefs.current).forEach(s => s?.getTracks().forEach(t => t.stop()));
      activeStreamRefs.current = {};
      setActiveStreams({ camera: false, audio: false, screen: false });
    };

    sock.on('offer', onOffer);
    sock.on('command', onCommand);
    sock.on('peer-left', onPeerLeft);

    return () => {
      sock.off('offer', onOffer);
      sock.off('command', onCommand);
      sock.off('peer-left', onPeerLeft);
      onPeerLeft();
    };
  }, [session?.childId, connectSocket, rtcHandleOffer]);

  // ─── Night block enforcement ──────────────────────────────────────────────────
  const isNightBlocked = useCallback(() => {
    if (!status?.nightRestriction) return false;
    const h = new Date().getHours();
    return h >= 21 || h < 7;
  }, [status?.nightRestriction]);

  // ─── Guards ───────────────────────────────────────────────────────────────────
  if (!status) return (
    <div style={{ height: '100dvh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
      <div style={{ width: '56px', height: '56px', border: '3px solid rgba(37,99,235,0.12)', borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <div style={{ textAlign: 'center' }}>
        <p style={{ color: '#fff', fontWeight: '600', marginBottom: '4px' }}>Connecting to {session?.parentName || 'parent'}...</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Syncing device restrictions</p>
      </div>
    </div>
  );

  if (status.deviceState === 'locked') return <SessionLockOverlay reason={status.lockReason} childId={session?.childId} />;

  // Night enforcement wall
  if (isNightBlocked()) return (
    <div style={{ height: '100dvh', background: '#07070f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px', textAlign: 'center' }}>
      <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(37,99,235,0.1)', border: '2px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '28px', boxShadow: '0 0 40px rgba(37,99,235,0.2)' }}>
        <Moon size={48} color="#2563eb" />
      </div>
      <h2 style={{ fontSize: '28px', fontWeight: '800', color: '#fff', marginBottom: '12px' }}>Night Restriction Active</h2>
      <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.7, maxWidth: '300px' }}>
        AlphaGuard is blocking device use between{' '}
        <strong style={{ color: '#2563eb' }}>9:00 PM — 7:00 AM</strong>.{'\n'}
        Your parent has enabled this.
      </p>
      <div style={{ marginTop: '32px', padding: '12px 24px', borderRadius: '30px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: '#2563eb', fontSize: '13px', fontWeight: '600' }}>
        🌙 See you in the morning!
      </div>
    </div>
  );

  const isPaused = status.deviceState === 'paused';
  const stateColor = isPaused ? '#f59e0b' : 'var(--accent-green)';
  const totalSecs = (status.timerDurationMinutes || 0) * 60;
  const timerPct = totalSecs > 0 && countdown !== null ? (countdown / totalSecs) * 100 : 100;
  const ringColor = countdown < 60 ? 'var(--accent-red)' : countdown < 300 ? '#f59e0b' : 'var(--accent-cyan)';

  return (
    <div style={{ minHeight: '100dvh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>

      {/* ── Ambient glow ─────────────────────────────────────────────────────── */}
      <div style={{
        position: 'fixed', top: '-15%', left: '50%', transform: 'translateX(-50%)', width: '700px', height: '700px', borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
        background: isPaused
          ? 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 65%)'
          : 'radial-gradient(ellipse, rgba(37,99,235,0.06) 0%, transparent 65%)'
      }} />

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <div style={{ position: 'relative', zIndex: 10, padding: 'calc(14px + var(--ag-safe-top)) 20px 14px', background: 'rgba(255,255,255,0.015)', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldCheck size={18} color="var(--accent-cyan)" />
          <span style={{ fontWeight: '800', color: '#fff', fontSize: '15px', letterSpacing: '-0.3px' }}>
            Alpha<span style={{ color: 'var(--accent-cyan)' }}>Guard</span>
          </span>
          <span style={{ fontSize: '10px', background: 'rgba(37,99,235,0.1)', color: 'var(--accent-cyan)', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', letterSpacing: '0.05em' }}>CHILD MODE</span>
          {activeStreams.camera && <span style={{ fontSize: '10px', background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}><Camera size={10} /> CAM</span>}
          {activeStreams.audio && <span style={{ fontSize: '10px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}><Mic size={10} /> MIC</span>}
          {activeStreams.screen && <span style={{ fontSize: '10px', background: 'rgba(139,92,246,0.1)', color: '#8b5cf6', padding: '2px 8px', borderRadius: '20px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '3px' }}><Monitor size={10} /> SCR</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '5px',
            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700',
            background: connected && !syncError ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            color: connected && !syncError ? 'var(--accent-green)' : 'var(--accent-red)',
            border: `1px solid ${connected && !syncError ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 5px currentColor', animation: connected ? 'pulse-dot 2s infinite' : 'none' }} />
            {connected && !syncError ? 'LIVE' : 'OFFLINE'}
          </div>
          <button onClick={() => setShowLogoutModal(true)}
            style={{ background: 'transparent', border: 'none', color: '#334155', cursor: 'pointer', padding: '4px', transition: 'color 0.2s' }}
            onMouseOver={e => e.currentTarget.style.color = '#ef4444'}
            onMouseOut={e => e.currentTarget.style.color = '#334155'}
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>

      {showLogoutModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 10px 40px rgba(239, 68, 68, 0.2)' }}>

            {/* STEP 1: Password entry */}
            {logoutRequestStatus === 'idle' && (
              <>
                <ShieldCheck size={48} color="#ef4444" style={{ marginBottom: '16px' }} />
                <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Security Lock</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>Enter Parent Control Password to request sign-out.</p>

                {logoutErr && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' }}>{logoutErr}</div>}

                <input type="password" value={parentPin} onChange={e => setParentPin(e.target.value)} placeholder="Parent Password"
                  style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '16px', marginBottom: '20px', textAlign: 'center', outline: 'none' }}
                  onKeyDown={e => { if (e.key === 'Enter') document.getElementById('btn-unlock')?.click(); }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={() => { setShowLogoutModal(false); setParentPin(''); setLogoutErr(''); setLogoutRequestStatus('idle'); }}
                    style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', color: '#cbd5e1', cursor: 'pointer' }}>Cancel</button>
                  <button id="btn-unlock" disabled={logoutLoading} onClick={async () => {
                    if (!parentPin) return setLogoutErr('Password required');
                    if (!childId) return setLogoutErr('Session error');
                    setLogoutLoading(true); setLogoutErr('');
                    try {
                      const r = await fetch('/api/device/logout-request', {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ childId, parentControlPassword: parentPin })
                      });
                      const d = await r.json();
                      if (r.ok && d.success) {
                        setLogoutRequestStatus('pending');
                      } else {
                        setLogoutErr(d.error || 'Incorrect password.');
                        // Alert parent of failed pin attempt
                        fetch('/api/device/disconnect-attempt', {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ childId })
                        }).catch(() => { });
                      }
                    } catch (e) { setLogoutErr(`Connection failed: ${e.message}`); }
                    setLogoutLoading(false);
                  }} style={{ flex: 2, background: '#ef4444', border: 'none', padding: '12px', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: logoutLoading ? 'not-allowed' : 'pointer', opacity: logoutLoading ? 0.7 : 1 }}>
                    {logoutLoading ? 'Verifying...' : 'Request Sign-out'}
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: Waiting for parent approval */}
            {logoutRequestStatus === 'pending' && (
              <>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', animation: 'pulse-dot 2s infinite' }}>
                  <Clock size={28} color="#f59e0b" />
                </div>
                <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Request Sent</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>Ok, please wait until verification from <strong style={{ color: '#f59e0b' }}>{parentName}</strong>...</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: '600' }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Waiting for parent response...
                </div>
                <button onClick={() => { setShowLogoutModal(false); setLogoutRequestStatus('idle'); setParentPin(''); }}
                  style={{ marginTop: '24px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 24px', borderRadius: '10px', color: '#64748b', cursor: 'pointer', fontSize: '13px' }}>Cancel</button>
              </>
            )}

            {/* STEP 3: APPROVED */}
            {logoutRequestStatus === 'approved' && (
              <>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle2 size={32} color="#10b981" />
                </div>
                <h3 style={{ color: '#10b981', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Approved! ✅</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>You got approval from <strong style={{ color: '#10b981' }}>{parentName}</strong>. Device logging out...</p>
              </>
            )}

            {/* STEP 4: DENIED */}
            {logoutRequestStatus === 'denied' && (
              <>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <Lock size={32} color="#ef4444" />
                </div>
                <h3 style={{ color: '#ef4444', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Access Declined</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '20px' }}>I'm sorry <strong style={{ color: '#fff' }}>{childName}</strong>, access declined by father.</p>
                <button onClick={() => { setShowLogoutModal(false); setLogoutRequestStatus('idle'); setParentPin(''); }}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 32px', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>OK</button>
              </>
            )}

          </div>
        </div>
      )}

      {/* ── Scrollable body ──────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px calc(48px + var(--ag-safe-bottom))', maxWidth: '480px', margin: '0 auto', width: '100%', position: 'relative', zIndex: 1 }}>

        {/* ── Greeting ───────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '22px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '900', color: '#fff', marginBottom: '4px' }}>
            Hello, {childName} 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Your session is being supervised by AlphaGuard AI.</p>
        </div>

        {/* ── Parent connection card ─────────────────────────────────────────── */}
        <div style={{
          background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.18)',
          borderRadius: '20px', padding: '16px 20px', marginBottom: status?.locationTrackingEnabled ? '8px' : '16px',
          display: 'flex', alignItems: 'center', gap: '14px'
        }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '50%', flexShrink: 0, background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={20} color="#2563eb" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: '800', letterSpacing: '0.1em', marginBottom: '3px' }}>CONNECTED TO PARENT</div>
            <div style={{ fontSize: '19px', fontWeight: '800', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{parentName}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', fontWeight: '700', color: 'var(--accent-green)' }}>
            {connected ? <Wifi size={13} /> : <WifiOff size={13} color="var(--accent-red)" />}
          </div>
        </div>

        {/* ── Location Tracking Indicator ────────────────────────────────────── */}
        {status?.locationTrackingEnabled && (
          <div style={{
            background: 'rgba(37,99,235, 0.05)', border: '1px solid rgba(37,99,235, 0.2)',
            borderRadius: '12px', padding: '10px 16px', marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '10px', animation: 'fade-in 0.3s'
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-cyan)', boxShadow: '0 0 10px var(--accent-cyan)', animation: 'pulse-dot 2s infinite' }}></div>
            <div style={{ fontSize: '13px', color: '#fff', fontWeight: '600' }}>Location sharing active</div>
          </div>
        )}

        {/* ── Session state + timer ring ────────────────────────────────────── */}
        <div style={{
          background: isPaused ? 'rgba(245,158,11,0.04)' : 'rgba(37,99,235,0.03)',
          border: `1px solid ${isPaused ? 'rgba(245,158,11,0.18)' : 'rgba(37,99,235,0.12)'}`,
          borderRadius: '20px', padding: '28px 24px', marginBottom: '16px',
          display: 'flex', flexDirection: 'column', alignItems: 'center'
        }}>
          {/* State pill */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '7px',
            padding: '7px 18px', borderRadius: '30px', marginBottom: '24px',
            background: isPaused ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
            border: `1px solid ${isPaused ? 'rgba(245,158,11,0.28)' : 'rgba(16,185,129,0.28)'}`,
            color: stateColor, fontWeight: '800', fontSize: '12px', letterSpacing: '0.08em'
          }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'currentColor', boxShadow: '0 0 8px currentColor', animation: 'pulse-dot 2s infinite' }} />
            {isPaused ? '⏸️ PAUSED' : '▶️ ACTIVE'}
          </div>

          {/* Timer ring OR daily limit */}
          {countdown !== null && timerEndMs ? (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
              <ProgressRing pct={timerPct} color={ringColor} size={180} stroke={10} />
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>TIME LEFT</div>
                <div style={{ fontSize: '36px', fontWeight: '900', color: countdown < 60 ? 'var(--accent-red)' : countdown < 300 ? '#f59e0b' : 'var(--accent-cyan)', fontFamily: 'monospace', lineHeight: 1 }}>
                  {formatTime(countdown)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{status.timerDurationMinutes}m session</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', marginBottom: '16px', padding: '16px 0' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '8px' }}>DAILY TIME LIMIT</div>
              <div style={{ fontSize: '56px', fontWeight: '900', lineHeight: 1, color: '#fff' }}>
                {status.dailyLimitHours}
                <span style={{ fontSize: '22px', color: 'var(--text-muted)', fontWeight: '500', marginLeft: '6px' }}>hrs</span>
              </div>
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', fontSize: '12px', color: '#475569' }}>
                <Clock size={12} /> No active timer
              </div>
            </div>
          )}

          {/* Pause reason */}
          {isPaused && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '12px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', width: '100%', justifyContent: 'center' }}>
              <AlertTriangle size={13} color="#f59e0b" />
              <span style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '600' }}>{status.lockReason || 'Session paused by parent.'}</span>
            </div>
          )}
        </div>

        {/* ── Active protections ────────────────────────────────────────────── */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: '#475569', fontWeight: '800', letterSpacing: '0.12em', marginBottom: '12px' }}>ACTIVE PROTECTIONS</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <ProtectCard icon={Eye} label="Safe Browsing" color="var(--accent-cyan)"
              active={!!status.safeMode}
              sublabel={{ on: 'Risky sites blocked', off: 'Not enforced' }} />
            <ProtectCard icon={Shield} label="Face Guard" color="#2563eb"
              active={!!status.facePresenceEnabled}
              sublabel={{ on: 'Presence monitored', off: 'Not active' }} />
            <ProtectCard icon={Volume2} label="Voice Alerts" color="var(--accent-green)"
              active={!!status.voiceEnabled}
              sublabel={{ on: 'Audio reminders on', off: 'Muted' }} />
            <ProtectCard icon={Moon} label="Night Block" color="#8b5cf6"
              active={!!status.nightRestriction}
              sublabel={{ on: '9PM—7AM restricted', off: 'No time block' }} />
          </div>
        </div>

        {/* ── Night block status banner (active but not current night time) ── */}
        {status.nightRestriction && !isNightBlocked() && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '10px',
            padding: '12px 16px', borderRadius: '14px', marginBottom: '16px',
            background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)'
          }}>
            <Moon size={15} color="#8b5cf6" />
            <div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: '#8b5cf6' }}>Night Restriction Scheduled</div>
              <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Device will be blocked from 9:00 PM to 7:00 AM.</div>
            </div>
          </div>
        )}

        {/* ── Session info table ─────────────────────────────────────────────── */}
        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px', padding: '16px 20px', marginBottom: '16px' }}>
          <div style={{ fontSize: '10px', color: '#475569', fontWeight: '800', letterSpacing: '0.12em', marginBottom: '14px' }}>SESSION DETAILS</div>
          {[
            { label: 'Child profile', value: childName, color: '#fff' },
            { label: 'Monitored by', value: parentName, color: '#2563eb' },
            { label: 'Session state', value: status.deviceState.toUpperCase(), color: stateColor },
            { label: 'Sync', value: connected ? '● Live' : '○ Offline', color: connected ? 'var(--accent-green)' : 'var(--accent-red)' },
            { label: 'Safe browsing', value: status.safeMode ? 'Enabled' : 'Disabled', color: status.safeMode ? 'var(--accent-cyan)' : '#475569' },
            { label: 'Night block', value: status.nightRestriction ? 'Enabled' : 'Off', color: status.nightRestriction ? '#8b5cf6' : '#475569' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>{label}</span>
              <span style={{ fontSize: '13px', fontWeight: '700', color }}>{value}</span>
            </div>
          ))}
        </div>

        {/* ── All-good confirmation ─────────────────────────────────────────── */}
        {!isPaused && connected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 18px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: '14px' }}>
            <CheckCircle2 size={18} color="var(--accent-green)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--accent-green)' }}>Session is active & protected</div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px' }}>AlphaGuard is actively supervising this device.</div>
            </div>
          </div>
        )}

        {/* ── Offline warning ───────────────────────────────────────────────── */}
        {syncError && (
          <div style={{ marginTop: '14px', display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', borderRadius: '12px', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', fontSize: '13px', color: 'var(--accent-red)' }}>
            <WifiOff size={14} /> Lost connection – retrying...
          </div>
        )}

        {/* ── MY LOCATION ────────────────────────────────────────────────── */}
        <div style={{ marginTop: '16px', background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: '16px', padding: '16px 20px' }}>
          <div style={{ fontSize: '10px', color: '#2563eb', fontWeight: '800', letterSpacing: '0.12em', marginBottom: '12px' }}>📍 MY LOCATION</div>
          {currentLoc?.address ? (
            <div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', marginBottom: '4px' }}>{currentLoc.locality || currentLoc.city || 'Your Area'}</div>
              <div style={{ fontSize: '12px', color: '#94a3b8', lineHeight: '1.5' }}>{currentLoc.address}</div>
            </div>
          ) : currentLoc?.lat ? (
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>Fetching address...</div>
          ) : (
            <div style={{ fontSize: '13px', color: '#64748b' }}>Waiting for GPS...</div>
          )}
        </div>

        {/* ── SAVED PLACES ───────────────────────────────────────────────── */}
        {safeZones.length > 0 && (
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: '800', letterSpacing: '0.12em', marginBottom: '12px' }}>SAVED PLACES</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {safeZones.map(z => {
                const icons = { home: '🏠', school: '🏫', relative: '👨‍👩‍👧', hospital: '🏥', custom: '📍' };
                const dist = currentLoc?.lat ? haversine(currentLoc.lat, currentLoc.lng, z.latitude, z.longitude) : null;
                return (
                  <div key={z.id} onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${z.latitude},${z.longitude}&travelmode=driving`, '_blank')} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px', cursor: 'pointer', transition: 'all 0.2s' }}>
                    <div style={{ fontSize: '24px', flexShrink: 0 }}>{icons[z.type] || '📍'}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{z.name}</div>
                      {z.address && <div style={{ fontSize: '11px', color: '#64748b', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{z.address}</div>}
                    </div>
                    {dist !== null && (
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#2563eb', flexShrink: 0 }}>{formatDist(dist)}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MAIN CONTACTS ──────────────────────────────────────────────── */}
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '10px', color: '#475569', fontWeight: '800', letterSpacing: '0.12em' }}>MAIN CONTACTS</div>
            <button onClick={() => { setShowAddContact(true); setNewContact({ name: '', phone: '' }); }} style={{ padding: '6px 14px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', borderRadius: '8px', color: '#2563eb', fontSize: '11px', fontWeight: '700', cursor: 'pointer' }}>+ Add</button>
          </div>
          {contacts.length === 0 ? (
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '32px 16px', textAlign: 'center' }}>
              <Phone size={28} color="#334155" style={{ marginBottom: '8px' }} />
              <div style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>No contacts saved yet</div>
              <div style={{ fontSize: '11px', color: '#475569', marginTop: '4px' }}>Add important numbers for quick calling</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {contacts.map((c, i) => (
                <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <User size={18} color="#10b981" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{c.phone}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={`tel:${c.phone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', textDecoration: 'none' }}>
                      <Phone size={18} color="#10b981" />
                    </a>
                    <button onClick={() => { if (!window.confirm(`Delete contact "${c.name}"?`)) return; const updated = contacts.filter((_, idx) => idx !== i); setContacts(updated); localStorage.setItem('child_contacts', JSON.stringify(updated)); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '42px', height: '42px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer' }}>
                      <Trash2 size={16} color="#ef4444" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── Add Contact Modal ────────────────────────────────────────────── */}
        {showAddContact && (
          <>
            <div onClick={() => setShowAddContact(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 9998 }} />
            <div style={{ position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: '480px', background: '#0f172a', borderRadius: '24px 24px 0 0', padding: '24px', zIndex: 9999, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 -10px 40px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <span style={{ fontSize: '18px', fontWeight: '700', color: '#fff' }}>Add Contact</span>
                <button onClick={() => setShowAddContact(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '22px' }}>×</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input placeholder="Contact name (e.g. Mom, Dad, Uncle)" value={newContact.name} onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))} style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none' }} />
                <input placeholder="10-digit phone number" type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={newContact.phone} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setNewContact(c => ({ ...c, phone: v })); }} style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none', letterSpacing: '1px' }} />
                {newContact.phone && newContact.phone.length < 10 && <div style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px', paddingLeft: '4px' }}>{10 - newContact.phone.length} more digit{10 - newContact.phone.length !== 1 ? 's' : ''} needed</div>}
                <button onClick={() => {
                  if (!newContact.name || newContact.phone.length !== 10) return;
                  const updated = [...contacts, { name: newContact.name, phone: newContact.phone }];
                  setContacts(updated);
                  localStorage.setItem('child_contacts', JSON.stringify(updated));
                  setShowAddContact(false);
                  setNewContact({ name: '', phone: '' });
                }} disabled={!newContact.name || newContact.phone.length !== 10} style={{ padding: '16px', background: !newContact.name || newContact.phone.length !== 10 ? '#334155' : '#10b981', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: '700', fontSize: '15px', cursor: !newContact.name || newContact.phone.length !== 10 ? 'not-allowed' : 'pointer' }}>
                  Save Contact
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── APP LAUNCHER ──────────────────────────────────────────────── */}
        <div style={{ marginTop: '32px' }}>
          <div style={{ fontSize: '10px', color: '#475569', fontWeight: '800', letterSpacing: '0.12em', marginBottom: '16px' }}>INSTALLED APPS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px 12px' }}>
            {INSTALLED_APPS.map(app => {
              const isLocked = lockedApps.some(a => a.appName === app.name);
              return (
                <div key={app.name} 
                  onClick={() => {
                    if (isLocked) {
                      setUnlockAppTarget(app);
                      setUnlockAppPin('');
                      setUnlockAppErr('');
                    } else {
                      alert(`Launching ${app.name}...`);
                    }
                  }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer', position: 'relative' }}
                >
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `${app.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', border: `1px solid ${app.color}30` }}>
                    {app.icon}
                  </div>
                  <div style={{ fontSize: '11px', color: '#cbd5e1', fontWeight: '600', textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
                    {app.name}
                  </div>
                  {isLocked && (
                    <div style={{ position: 'absolute', top: '-4px', right: '4px', background: '#ef4444', width: '20px', height: '20px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg-primary)' }}>
                      <LockKeyhole size={10} color="#fff" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SOS EMERGENCY BUTTON ──────────────────────────────────────────── */}
        <div style={{ marginTop: '32px' }}>
          <button
            onClick={async () => {
               let lat = null, lon = null;
               let failReason = null;

               // STEP 1: Use already-cached location from watchPosition (no permission prompt needed)
               if (currentLoc?.lat && currentLoc?.lng) {
                 lat = currentLoc.lat;
                 lon = currentLoc.lng;
               } else if (!navigator.geolocation) {
                 failReason = 'unavailable';
               } else {
                 // STEP 2: Check permission state first – do NOT call getCurrentPosition if denied
                 let permState = 'prompt';
                 try {
                   if (navigator.permissions) {
                     const ps = await navigator.permissions.query({ name: 'geolocation' });
                     permState = ps.state; // 'granted', 'denied', or 'prompt'
                   }
                 } catch (_) { /* permissions API not supported */ }

                 if (permState === 'denied') {
                   failReason = 'denied';
                 } else {
                   // STEP 3: Try to get fresh location (only if not denied)
                   try {
                     const pos = await new Promise((resolve, reject) => {
                       navigator.geolocation.getCurrentPosition(resolve, reject, {
                         timeout: 8000,
                         enableHighAccuracy: true,
                         maximumAge: 30000 // Accept up to 30s cached position
                       });
                     });
                     lat = pos.coords.latitude;
                     lon = pos.coords.longitude;
                   } catch (e) {
                     if (e.code === 1) failReason = 'denied';
                     else if (e.code === 3) failReason = 'timeout';
                     else failReason = 'unavailable';
                   }
                 }
               }

               // STEP 4: ALWAYS send SOS to parent, even without location
               // The alert is what matters – parent must know immediately
               const sock = socketRef?.current;
               if (sock && session?.childId) {
                 sock.emit('command', {
                   childId: session.childId,
                   command: 'emergency',
                   payload: {
                     lat,
                     lon,
                     reason: failReason,
                     childName: session.childName || 'Child',
                     time: new Date().toISOString()
                   }
                 });
               }

               // STEP 5: Find nearby facilities if we have location
               if (lat && lon) {
                 try {
                   const [policeRes, hospitalRes] = await Promise.all([
                     fetch(`/api/device/nearby-facilities?lat=${lat}&lon=${lon}&type=police`),
                     fetch(`/api/device/nearby-facilities?lat=${lat}&lon=${lon}&type=hospital`)
                   ]);
                   const [policeData, hospitalData] = await Promise.all([policeRes.json(), hospitalRes.json()]);
                   const facilities = [];
                   if (policeData.success) facilities.push(...(policeData.facilities || []).slice(0, 2));
                   if (hospitalData.success) facilities.push(...(hospitalData.facilities || []).slice(0, 2));
                   facilities.sort((a, b) => a.distance - b.distance);
                   setSosResult({ facilities, lat, lon, status: 'success' });
                 } catch {
                   setSosResult({ facilities: [], lat, lon, status: 'success' });
                 }
               } else {
                 setSosResult({ facilities: [], lat: null, lon: null, status: 'no-gps', reason: failReason });
               }
            }}
            style={{
              width: '100%',
              padding: '24px',
              borderRadius: '20px',
              border: '2px solid rgba(239,68,68,0.5)',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(153,27,27,0.4))',
              color: '#fff',
              fontSize: '18px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 10px 40px rgba(239,68,68,0.4), inset 0 0 20px rgba(239,68,68,0.2)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              transition: 'all 0.2s',
              animation: 'pulse-dot 2s infinite'
            }}
          >
            <div style={{ padding: '12px', background: '#ef4444', borderRadius: '50%', boxShadow: '0 0 20px rgba(239,68,68,0.6)' }}>
              <AlertTriangle size={32} color="#fff" strokeWidth={3} />
            </div>
            SOS EMERGENCY
          </button>
          <div style={{ textAlign: 'center', color: '#64748b', fontSize: '11px', marginTop: '12px', fontWeight: 'bold' }}>
            PRESSING WILL TRIGGER PARENT ALARM & FIND NEAREST HOSPITAL/POLICE
          </div>
        </div>

      </div>

      {/* ── SOS Results Modal ────────────────────────────────────────────── */}
      {sosResult && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(239,68,68,0.5)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '2px solid #ef4444', borderRadius: '24px', padding: '28px', width: '100%', maxWidth: '400px', boxShadow: '0 0 80px rgba(239,68,68,0.6)' }}>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 0 20px #ef4444' }}>
                <AlertTriangle size={32} color="#ef4444" />
              </div>
              <h2 style={{ color: '#fff', fontSize: '22px', fontWeight: '900', marginBottom: '6px' }}>SOS SENT!</h2>
              <p style={{ color: '#94a3b8', fontSize: '13px' }}>Your parent has been alerted immediately.</p>
            </div>

            {(sosResult.status === 'no-gps' || sosResult.status === 'no-geo') && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: '12px', padding: '14px', marginBottom: '10px', fontSize: '13px', color: '#f59e0b', textAlign: 'center' }}>
                  {sosResult.reason === 'denied' ? '⚠️ Location permission denied. Please allow it in settings.' :
                   sosResult.reason === 'timeout' ? '⚠️ GPS signal timeout. Try moving to an open area.' :
                   '⚠️ Location unavailable. Allow location to find nearby help.'}
                </div>
                <button onClick={async () => {
                  if (sosResult.reason === 'denied') {
                    // For denied: can't force permission "” guide user to browser settings
                    setSosResult(prev => ({ ...prev, reason: 'denied_instructions' }));
                    return;
                  }
                  // For timeout/unavailable: retry with relaxed settings + cached position
                  try {
                    const pos = await new Promise((resolve, reject) => {
                      navigator.geolocation.getCurrentPosition(resolve, reject, {
                        enableHighAccuracy: false, // Less strict = faster
                        timeout: 12000,
                        maximumAge: 60000 // Accept up to 1min old cached position
                      });
                    });
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    setCurrentLoc(prev => ({ ...prev, lat, lng: lon }));

                    const sock = socketRef?.current;
                    if (sock && session?.childId) {
                      sock.emit('command', { childId: session.childId, command: 'emergency', payload: { lat, lon, childName: session.childName || 'Child', time: new Date().toISOString() } });
                    }

                    try {
                      const [policeRes, hospitalRes] = await Promise.all([
                        fetch(`/api/device/nearby-facilities?lat=${lat}&lon=${lon}&type=police`),
                        fetch(`/api/device/nearby-facilities?lat=${lat}&lon=${lon}&type=hospital`)
                      ]);
                      const [policeData, hospitalData] = await Promise.all([policeRes.json(), hospitalRes.json()]);
                      const facilities = [];
                      if (policeData.success) facilities.push(...(policeData.facilities || []).slice(0, 2));
                      if (hospitalData.success) facilities.push(...(hospitalData.facilities || []).slice(0, 2));
                      facilities.sort((a, b) => a.distance - b.distance);
                      setSosResult({ facilities, lat, lon, status: 'success' });
                    } catch {
                      setSosResult({ facilities: [], lat, lon, status: 'success' });
                    }
                  } catch {
                    setSosResult(prev => ({ ...prev, reason: 'denied_instructions' }));
                  }
                }} style={{ width: '100%', padding: '14px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', borderRadius: '14px', color: '#60a5fa', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                  <MapPin size={18} /> {sosResult.reason === 'denied' ? 'Open Location Settings' : 'Retry with Location'}
                </button>
                {sosResult.reason === 'denied_instructions' && (
                  <div style={{ marginTop: '10px', padding: '12px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '10px', fontSize: '12px', color: '#94a3b8', lineHeight: 1.6 }}>
                    📋 <strong style={{ color: '#fff' }}>To allow location:</strong><br />
                    Tap the 🔒 lock icon in browser → Site settings → Location → Allow → then come back and press SOS again.
                  </div>
                )}
              </div>
            )}

            {sosResult.facilities.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700', marginBottom: '10px' }}>Nearest Help</div>
                {sosResult.facilities.map((f, i) => (
                  <div key={i} style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: '12px', padding: '12px', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '10px', color: '#60a5fa', fontWeight: '800', textTransform: 'uppercase' }}>{f.type} • {f.distanceText}</div>
                        <div style={{ fontSize: '14px', color: '#fff', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.address}</div>
                      </div>
                      <a href={`tel:112`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', padding: '6px 12px', borderRadius: '8px', color: '#10b981', textDecoration: 'none', fontSize: '12px', fontWeight: '700', marginLeft: '8px', flexShrink: 0 }}>
                        <Phone size={14} style={{ marginRight: '4px' }} /> Call
                      </a>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                      <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}&travelmode=driving`, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', color: '#60a5fa', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        <MapPin size={12} /> Maps
                      </button>
                      <button onClick={() => window.open(`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${f.lat}&dropoff[longitude]=${f.lon}`, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(0,0,0,0.4)', border: '1px solid #334155', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', color: '#fff', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        Uber
                      </button>
                      <button onClick={() => window.open(`https://book.olacabs.com/?lat=${f.lat}&lng=${f.lon}`, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(163,230,53,0.15)', border: '1px solid rgba(163,230,53,0.3)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', color: '#a3e635', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        Ola
                      </button>
                      <button onClick={() => window.open(`intent://app/launch?lat=${f.lat}&lng=${f.lon}#Intent;scheme=rapido;package=com.rapido.passenger;end;`, '_blank')} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.3)', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', color: '#facc15', fontSize: '11px', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        Rapido
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setSosResult(null)} style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '14px', color: '#fff', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── APP UNLOCK MODAL ────────────────────────────────────────────── */}
      {unlockAppTarget && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '30px', borderRadius: '20px', width: '90%', maxWidth: '360px', textAlign: 'center', boxShadow: '0 10px 40px rgba(239, 68, 68, 0.2)' }}>
            <div style={{ width: '64px', height: '64px', borderRadius: '16px', background: `${unlockAppTarget.color}15`, border: `2px solid ${unlockAppTarget.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', margin: '0 auto 16px' }}>
              {unlockAppTarget.icon}
            </div>
            <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>App Locked</h3>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px' }}>{unlockAppTarget.name} is locked. Enter Parent Password to unlock.</p>

            {unlockAppErr && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px' }}>{unlockAppErr}</div>}

            <input type="password" value={unlockAppPin} onChange={e => setUnlockAppPin(e.target.value)} placeholder="Parent Password"
              style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '16px', marginBottom: '20px', textAlign: 'center', outline: 'none' }}
              onKeyDown={async e => { 
                if (e.key === 'Enter') {
                  document.getElementById('btn-unlock-app')?.click();
                } 
              }}
            />

            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => { setUnlockAppTarget(null); setUnlockAppPin(''); setUnlockAppErr(''); }}
                style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', color: '#cbd5e1', cursor: 'pointer' }}>Cancel</button>
              <button id="btn-unlock-app" disabled={unlockAppLoading} onClick={async () => {
                if (!unlockAppPin) return setUnlockAppErr('Password required');
                setUnlockAppLoading(true); setUnlockAppErr('');
                try {
                  const r = await fetch('/api/device/unlock-app-child', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ childId: session.childId, appName: unlockAppTarget.name, parentPassword: unlockAppPin })
                  });
                  const d = await r.json();
                  if (r.ok && d.success) {
                    setLockedApps(d.lockedApps || []);
                    setUnlockAppTarget(null);
                  } else {
                    setUnlockAppErr(d.error || 'Incorrect password.');
                  }
                } catch (e) { setUnlockAppErr('Connection failed.'); }
                setUnlockAppLoading(false);
              }} style={{ flex: 2, background: '#ef4444', border: 'none', padding: '12px', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: unlockAppLoading ? 'not-allowed' : 'pointer', opacity: unlockAppLoading ? 0.7 : 1 }}>
                {unlockAppLoading ? 'Verifying...' : 'Unlock App'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%,100%{opacity:1;} 50%{opacity:0.35;} }
      `}</style>
    </div>
  );
};

export default ChildDeviceView;
