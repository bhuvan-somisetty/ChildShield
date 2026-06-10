import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, LogOut, Clock, Wifi, WifiOff,
  Lock, Eye, Volume2, Shield, AlertTriangle,
  User, Moon, Pause, Activity, CheckCircle2,
  Camera, Mic, Monitor, MapPin, Phone, Trash2, Loader2, AppWindow, LockKeyhole, Unlock,
  Plus, X
} from 'lucide-react';
import SessionLockOverlay from './SessionLockOverlay';
import { VoiceEvents } from '../../hooks/VoiceAssistant';
import { useWebRTC } from '../../hooks/useWebRTC';
import { Card, Button, TextField, BRAND_NAME } from '../../components/ui';

// ─── Premium palette (design-system aligned) ──────────────────────────────────
const C = {
  ink: '#030307',
  cyan: '#22d3ee',
  blue: '#2563eb',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  violet: '#8b5cf6',
  muted: '#64748b',
};

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

// ─── Section label (consistent typographic hierarchy) ─────────────────────────
const SectionLabel = ({ children, color = '#475569', className = '' }) => (
  <div
    className={`text-[10px] font-extrabold uppercase tracking-[0.14em] mb-3 ${className}`}
    style={{ color }}
  >
    {children}
  </div>
);

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
  <div
    className="rounded-[18px] p-4 flex flex-col gap-2.5 transition-all duration-300"
    style={{
      background: active ? `${color}12` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${active ? `${color}38` : 'rgba(255,255,255,0.06)'}`,
    }}
  >
    <div className="flex justify-between items-start">
      <div
        className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center"
        style={{ background: active ? `${color}1f` : 'rgba(255,255,255,0.04)' }}
      >
        <Icon size={17} color={active ? color : '#475569'} />
      </div>
      <div
        className="w-[9px] h-[9px] rounded-full mt-0.5"
        style={{
          background: active ? color : '#1e293b',
          boxShadow: active ? `0 0 8px ${color}` : 'none',
          animation: active ? 'pulse-dot 2s infinite' : 'none',
        }}
      />
    </div>
    <div>
      <div className="text-[13px] font-bold mb-0.5" style={{ color: active ? '#fff' : '#475569' }}>{label}</div>
      <div className="text-[11px] font-medium" style={{ color: active ? `${color}cc` : '#334155' }}>
        {active ? sublabel.on : sublabel.off}
      </div>
    </div>
  </div>
);

// ─── Full-screen status wall (loading / night) ────────────────────────────────
const StatusWall = ({ children }) => (
  <div className="ag-min-h-screen w-full bg-[#030307] flex flex-col items-center justify-center text-center relative overflow-hidden font-sans"
    style={{ padding: 'calc(32px + var(--ag-safe-top)) 28px calc(32px + var(--ag-safe-bottom))' }}>
    <div className="absolute -top-[12%] left-1/2 -translate-x-1/2 w-[120vw] max-w-[640px] aspect-square rounded-full blur-[120px] opacity-25 pointer-events-none"
      style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 60%)' }} />
    <div className="relative z-10 flex flex-col items-center">{children}</div>
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
    <StatusWall>
      <div className="w-14 h-14 rounded-full mb-6"
        style={{ border: '3px solid rgba(37,99,235,0.14)', borderTopColor: C.cyan, animation: 'spin 1s linear infinite' }} />
      <p className="text-white font-bold mb-1">Connecting to {session?.parentName || 'parent'}…</p>
      <p className="text-[13px]" style={{ color: C.muted }}>Syncing device restrictions</p>
    </StatusWall>
  );

  if (status.deviceState === 'locked') return <SessionLockOverlay reason={status.lockReason} childId={session?.childId} />;

  // Night enforcement wall
  if (isNightBlocked()) return (
    <StatusWall>
      <div className="w-[100px] h-[100px] rounded-full flex items-center justify-center mb-7"
        style={{ background: 'rgba(37,99,235,0.1)', border: '2px solid rgba(37,99,235,0.3)', boxShadow: '0 0 40px rgba(37,99,235,0.2)' }}>
        <Moon size={48} color={C.blue} />
      </div>
      <h2 className="text-[28px] font-extrabold text-white mb-3">Night Restriction Active</h2>
      <p className="text-[15px] leading-[1.7] max-w-[300px]" style={{ color: C.muted }}>
        AlphaGuard is blocking device use between{' '}
        <strong style={{ color: C.blue }}>9:00 PM — 7:00 AM</strong>.{'\n'}
        Your parent has enabled this.
      </p>
      <div className="mt-8 px-6 py-3 rounded-full text-[13px] font-semibold"
        style={{ background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)', color: C.blue }}>
        🌙 See you in the morning!
      </div>
    </StatusWall>
  );

  const isPaused = status.deviceState === 'paused';
  const stateColor = isPaused ? C.amber : C.green;
  const totalSecs = (status.timerDurationMinutes || 0) * 60;
  const timerPct = totalSecs > 0 && countdown !== null ? (countdown / totalSecs) * 100 : 100;
  const ringColor = countdown < 60 ? C.red : countdown < 300 ? C.amber : C.cyan;

  return (
    <div className="ag-min-h-screen bg-[#030307] flex flex-col font-sans text-white relative">

      {/* ── Ambient glow ─────────────────────────────────────────────────────── */}
      <div className="fixed top-[-15%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none z-0"
        style={{
          background: isPaused
            ? 'radial-gradient(ellipse, rgba(245,158,11,0.06) 0%, transparent 65%)'
            : 'radial-gradient(ellipse, rgba(37,99,235,0.07) 0%, transparent 65%)'
        }} />

      {/* ── Top bar ──────────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-20 flex justify-between items-center gap-2 bg-[#05060d]/80 backdrop-blur-2xl border-b border-white/[0.06]"
        style={{ padding: 'calc(14px + var(--ag-safe-top)) 18px 14px' }}
      >
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <ShieldCheck size={18} color={C.cyan} className="flex-shrink-0" />
          <span className="font-extrabold text-white text-[15px] tracking-tight">
            Alpha<span style={{ color: C.cyan }}>Guard</span>
          </span>
          <span className="text-[10px] font-bold tracking-wide px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(37,99,235,0.12)', color: C.cyan }}>CHILD MODE</span>
          {activeStreams.camera && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}><Camera size={10} /> CAM</span>}
          {activeStreams.audio && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(245,158,11,0.12)', color: C.amber }}><Mic size={10} /> MIC</span>}
          {activeStreams.screen && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(139,92,246,0.12)', color: C.violet }}><Monitor size={10} /> SCR</span>}
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{
              background: connected && !syncError ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
              color: connected && !syncError ? C.green : C.red,
              border: `1px solid ${connected && !syncError ? 'rgba(16,185,129,0.28)' : 'rgba(239,68,68,0.28)'}`
            }}>
            <span className="w-1.5 h-1.5 rounded-full bg-current" style={{ boxShadow: '0 0 5px currentColor', animation: connected ? 'pulse-dot 2s infinite' : 'none' }} />
            {connected && !syncError ? 'LIVE' : 'OFFLINE'}
          </div>
          <button onClick={() => setShowLogoutModal(true)} aria-label="Request sign-out"
            className="ag-tap w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08] text-slate-500 hover:text-rose-400">
            <LogOut size={17} />
          </button>
        </div>
      </header>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 bg-black/80 backdrop-blur-lg">
          <Card tone="raised" padded={false} className="w-full max-w-[360px] p-7 text-center" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>

            {/* STEP 1: Password entry */}
            {logoutRequestStatus === 'idle' && (
              <>
                <ShieldCheck size={48} color={C.red} className="mx-auto mb-4" />
                <h3 className="text-white text-xl font-extrabold mb-2">Security Lock</h3>
                <p className="text-[13px] mb-5" style={{ color: '#94a3b8' }}>Enter Parent Control Password to request sign-out.</p>

                {logoutErr && <div className="px-3 py-2.5 rounded-lg text-[13px] mb-4" style={{ background: 'rgba(239,68,68,0.1)', color: C.red }}>{logoutErr}</div>}

                <TextField
                  type="password"
                  value={parentPin}
                  onChange={e => setParentPin(e.target.value)}
                  placeholder="Parent Password"
                  icon={Lock}
                  className="mb-5 text-left"
                  onKeyDown={e => { if (e.key === 'Enter') document.getElementById('btn-unlock')?.click(); }}
                />

                <div className="flex gap-2.5">
                  <Button variant="secondary" size="md" onClick={() => { setShowLogoutModal(false); setParentPin(''); setLogoutErr(''); setLogoutRequestStatus('idle'); }}>Cancel</Button>
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
                  }} className="ag-tap flex-[2] min-h-[48px] rounded-full font-bold text-[13px] text-white"
                    style={{ background: C.red, opacity: logoutLoading ? 0.7 : 1, cursor: logoutLoading ? 'not-allowed' : 'pointer' }}>
                    {logoutLoading ? 'Verifying…' : 'Request Sign-out'}
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: Waiting for parent approval */}
            {logoutRequestStatus === 'pending' && (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.4)', animation: 'pulse-dot 2s infinite' }}>
                  <Clock size={28} color={C.amber} />
                </div>
                <h3 className="text-white text-xl font-extrabold mb-2">Request Sent</h3>
                <p className="text-[13px] mb-5" style={{ color: '#94a3b8' }}>Ok, please wait until verification from <strong style={{ color: C.amber }}>{parentName}</strong>…</p>
                <div className="flex items-center justify-center gap-2 text-[13px] font-semibold" style={{ color: C.amber }}>
                  <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Waiting for parent response…
                </div>
                <button onClick={() => { setShowLogoutModal(false); setLogoutRequestStatus('idle'); setParentPin(''); }}
                  className="ag-tap mt-6 px-6 py-3 rounded-full text-[13px]" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: C.muted }}>Cancel</button>
              </>
            )}

            {/* STEP 3: APPROVED */}
            {logoutRequestStatus === 'approved' && (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)' }}>
                  <CheckCircle2 size={32} color={C.green} />
                </div>
                <h3 className="text-xl font-extrabold mb-2" style={{ color: C.green }}>Approved! ✅</h3>
                <p className="text-[13px] mb-5" style={{ color: '#94a3b8' }}>You got approval from <strong style={{ color: C.green }}>{parentName}</strong>. Device logging out…</p>
              </>
            )}

            {/* STEP 4: DENIED */}
            {logoutRequestStatus === 'denied' && (
              <>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)' }}>
                  <Lock size={32} color={C.red} />
                </div>
                <h3 className="text-xl font-extrabold mb-2" style={{ color: C.red }}>Access Declined</h3>
                <p className="text-[14px] mb-5" style={{ color: '#94a3b8' }}>I'm sorry <strong className="text-white">{childName}</strong>, access declined by father.</p>
                <Button variant="secondary" size="md" onClick={() => { setShowLogoutModal(false); setLogoutRequestStatus('idle'); setParentPin(''); }}>OK</Button>
              </>
            )}

          </Card>
        </div>
      )}

      {/* ── Scrollable body ──────────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto ag-no-scrollbar w-full max-w-[480px] mx-auto relative z-[1]"
        style={{ padding: '24px 18px calc(48px + var(--ag-safe-bottom))' }}>

        {/* ── Greeting ───────────────────────────────────────────────────────── */}
        <div className="mb-6">
          <h1 className="text-[28px] font-black text-white mb-1 leading-tight">
            Hello, {childName} 👋
          </h1>
          <p className="text-[13px]" style={{ color: C.muted }}>Your session is being supervised by {BRAND_NAME}.</p>
        </div>

        {/* ── Parent connection card ─────────────────────────────────────────── */}
        <Card padded={false} className="flex items-center gap-3.5 px-5 py-4"
          style={{ background: 'rgba(37,99,235,0.05)', borderColor: 'rgba(37,99,235,0.18)', marginBottom: status?.locationTrackingEnabled ? 8 : 16 }}>
          <div className="w-[46px] h-[46px] rounded-full flex-shrink-0 flex items-center justify-center"
            style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.25)' }}>
            <User size={20} color={C.blue} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] font-extrabold tracking-[0.1em] mb-0.5" style={{ color: C.blue }}>CONNECTED TO PARENT</div>
            <div className="text-[19px] font-extrabold text-white truncate">{parentName}</div>
          </div>
          <div className="flex-shrink-0">
            {connected ? <Wifi size={16} color={C.green} /> : <WifiOff size={16} color={C.red} />}
          </div>
        </Card>

        {/* ── Location Tracking Indicator ────────────────────────────────────── */}
        {status?.locationTrackingEnabled && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl mb-4 animate-fade-in"
            style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.2)' }}>
            <span className="w-2 h-2 rounded-full" style={{ background: C.cyan, boxShadow: `0 0 10px ${C.cyan}`, animation: 'pulse-dot 2s infinite' }} />
            <div className="text-[13px] text-white font-semibold">Location sharing active</div>
          </div>
        )}

        {/* ── Session state + timer ring ────────────────────────────────────── */}
        <Card padded={false} className="flex flex-col items-center px-6 py-7 mb-4"
          style={{
            background: isPaused ? 'rgba(245,158,11,0.04)' : 'rgba(37,99,235,0.03)',
            borderColor: isPaused ? 'rgba(245,158,11,0.18)' : 'rgba(37,99,235,0.12)',
          }}>
          {/* State pill */}
          <div className="inline-flex items-center gap-2 px-[18px] py-1.5 rounded-full mb-6 text-[12px] font-extrabold tracking-[0.08em]"
            style={{
              background: isPaused ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)',
              border: `1px solid ${isPaused ? 'rgba(245,158,11,0.28)' : 'rgba(16,185,129,0.28)'}`,
              color: stateColor,
            }}>
            <span className="w-[7px] h-[7px] rounded-full bg-current" style={{ boxShadow: '0 0 8px currentColor', animation: 'pulse-dot 2s infinite' }} />
            {isPaused ? '⏸️ PAUSED' : '▶️ ACTIVE'}
          </div>

          {/* Timer ring OR daily limit */}
          {countdown !== null && timerEndMs ? (
            <div className="relative flex items-center justify-center mb-4">
              <ProgressRing pct={timerPct} color={ringColor} size={180} stroke={10} />
              <div className="absolute text-center">
                <div className="text-[11px] uppercase tracking-[0.1em] mb-1" style={{ color: C.muted }}>TIME LEFT</div>
                <div className="text-[36px] font-black font-mono leading-none"
                  style={{ color: countdown < 60 ? C.red : countdown < 300 ? C.amber : C.cyan }}>
                  {formatTime(countdown)}
                </div>
                <div className="text-[11px] mt-1" style={{ color: C.muted }}>{status.timerDurationMinutes}m session</div>
              </div>
            </div>
          ) : (
            <div className="text-center mb-4 py-4">
              <div className="text-[11px] tracking-[0.1em] mb-2" style={{ color: C.muted }}>DAILY TIME LIMIT</div>
              <div className="text-[56px] font-black leading-none text-white">
                {status.dailyLimitHours}
                <span className="text-[22px] font-medium ml-1.5" style={{ color: C.muted }}>hrs</span>
              </div>
              <div className="mt-2.5 flex items-center justify-center gap-1.5 text-[12px]" style={{ color: '#475569' }}>
                <Clock size={12} /> No active timer
              </div>
            </div>
          )}

          {/* Pause reason */}
          {isPaused && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl w-full justify-center"
              style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)' }}>
              <AlertTriangle size={13} color={C.amber} />
              <span className="text-[12px] font-semibold" style={{ color: C.amber }}>{status.lockReason || 'Session paused by parent.'}</span>
            </div>
          )}
        </Card>

        {/* ── Active protections ────────────────────────────────────────────── */}
        <div className="mb-4">
          <SectionLabel>Active Protections</SectionLabel>
          <div className="grid grid-cols-2 gap-2.5">
            <ProtectCard icon={Eye} label="Safe Browsing" color={C.cyan}
              active={!!status.safeMode}
              sublabel={{ on: 'Risky sites blocked', off: 'Not enforced' }} />
            <ProtectCard icon={Shield} label="Face Guard" color={C.blue}
              active={!!status.facePresenceEnabled}
              sublabel={{ on: 'Presence monitored', off: 'Not active' }} />
            <ProtectCard icon={Volume2} label="Voice Alerts" color={C.green}
              active={!!status.voiceEnabled}
              sublabel={{ on: 'Audio reminders on', off: 'Muted' }} />
            <ProtectCard icon={Moon} label="Night Block" color={C.violet}
              active={!!status.nightRestriction}
              sublabel={{ on: '9PM—7AM restricted', off: 'No time block' }} />
          </div>
        </div>

        {/* ── Night block status banner (active but not current night time) ── */}
        {status.nightRestriction && !isNightBlocked() && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-[14px] mb-4"
            style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)' }}>
            <Moon size={15} color={C.violet} className="flex-shrink-0" />
            <div>
              <div className="text-[12px] font-bold" style={{ color: C.violet }}>Night Restriction Scheduled</div>
              <div className="text-[11px] mt-0.5" style={{ color: C.muted }}>Device will be blocked from 9:00 PM to 7:00 AM.</div>
            </div>
          </div>
        )}

        {/* ── Session info table ─────────────────────────────────────────────── */}
        <Card padded={false} className="px-5 py-4 mb-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
          <SectionLabel>Session Details</SectionLabel>
          {[
            { label: 'Child profile', value: childName, color: '#fff' },
            { label: 'Monitored by', value: parentName, color: C.blue },
            { label: 'Session state', value: status.deviceState.toUpperCase(), color: stateColor },
            { label: 'Sync', value: connected ? '● Live' : '○ Offline', color: connected ? C.green : C.red },
            { label: 'Safe browsing', value: status.safeMode ? 'Enabled' : 'Disabled', color: status.safeMode ? C.cyan : '#475569' },
            { label: 'Night block', value: status.nightRestriction ? 'Enabled' : 'Off', color: status.nightRestriction ? C.violet : '#475569' },
          ].map(({ label, value, color }, i, arr) => (
            <div key={label} className="flex justify-between items-center py-2"
              style={{ borderBottom: i < arr.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <span className="text-[13px]" style={{ color: C.muted }}>{label}</span>
              <span className="text-[13px] font-bold" style={{ color }}>{value}</span>
            </div>
          ))}
        </Card>

        {/* ── All-good confirmation ─────────────────────────────────────────── */}
        {!isPaused && connected && (
          <div className="flex items-center gap-2.5 px-4 py-3.5 rounded-[14px]"
            style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
            <CheckCircle2 size={18} color={C.green} className="flex-shrink-0" />
            <div>
              <div className="text-[13px] font-bold" style={{ color: C.green }}>Session is active & protected</div>
              <div className="text-[11px] mt-0.5" style={{ color: '#475569' }}>AlphaGuard is actively supervising this device.</div>
            </div>
          </div>
        )}

        {/* ── Offline warning ───────────────────────────────────────────────── */}
        {syncError && (
          <div className="mt-3.5 flex items-center gap-2.5 px-4 py-3 rounded-xl text-[13px]"
            style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.18)', color: C.red }}>
            <WifiOff size={14} /> Lost connection – retrying…
          </div>
        )}

        {/* ── MY LOCATION ────────────────────────────────────────────────── */}
        <Card padded={false} className="mt-4 px-5 py-4"
          style={{ background: 'rgba(37,99,235,0.04)', borderColor: 'rgba(37,99,235,0.15)' }}>
          <SectionLabel color={C.blue}>📍 My Location</SectionLabel>
          {currentLoc?.address ? (
            <div>
              <div className="text-[15px] font-bold text-white mb-1">{currentLoc.locality || currentLoc.city || 'Your Area'}</div>
              <div className="text-[12px] leading-[1.5]" style={{ color: '#94a3b8' }}>{currentLoc.address}</div>
            </div>
          ) : currentLoc?.lat ? (
            <div className="text-[13px]" style={{ color: '#94a3b8' }}>Fetching address…</div>
          ) : (
            <div className="text-[13px]" style={{ color: C.muted }}>Waiting for GPS…</div>
          )}
        </Card>

        {/* ── SAVED PLACES ───────────────────────────────────────────────── */}
        {safeZones.length > 0 && (
          <div className="mt-4">
            <SectionLabel>Saved Places</SectionLabel>
            <div className="flex flex-col gap-2">
              {safeZones.map(z => {
                const icons = { home: '🏠', school: '🏫', relative: '👨‍👩‍👧', hospital: '🏥', custom: '📍' };
                const dist = currentLoc?.lat ? haversine(currentLoc.lat, currentLoc.lng, z.latitude, z.longitude) : null;
                return (
                  <Card key={z.id} padded={false} interactive onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${z.latitude},${z.longitude}&travelmode=driving`, '_blank')}
                    className="flex items-center gap-3.5 px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <div className="text-2xl flex-shrink-0">{icons[z.type] || '📍'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-white">{z.name}</div>
                      {z.address && <div className="text-[11px] mt-0.5 truncate" style={{ color: C.muted }}>{z.address}</div>}
                    </div>
                    {dist !== null && (
                      <div className="text-[13px] font-bold flex-shrink-0" style={{ color: C.blue }}>{formatDist(dist)}</div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* ── MAIN CONTACTS ──────────────────────────────────────────────── */}
        <div className="mt-4">
          <div className="flex justify-between items-center mb-3">
            <SectionLabel className="!mb-0">Main Contacts</SectionLabel>
            <button onClick={() => { setShowAddContact(true); setNewContact({ name: '', phone: '' }); }}
              className="ag-tap flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-bold"
              style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', color: C.blue }}>
              <Plus size={13} /> Add
            </button>
          </div>
          {contacts.length === 0 ? (
            <Card className="py-8 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <Phone size={28} color="#334155" className="mx-auto mb-2" />
              <div className="text-[13px] font-semibold" style={{ color: C.muted }}>No contacts saved yet</div>
              <div className="text-[11px] mt-1" style={{ color: '#475569' }}>Add important numbers for quick calling</div>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {contacts.map((c, i) => (
                <Card key={i} padded={false} className="flex items-center gap-3.5 px-4 py-3.5" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <User size={18} color={C.green} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-bold text-white truncate">{c.name}</div>
                    <div className="text-[12px] mt-0.5" style={{ color: C.muted }}>{c.phone}</div>
                  </div>
                  <div className="flex gap-2">
                    <a href={`tel:${c.phone}`} className="ag-tap flex items-center justify-center w-[42px] h-[42px] rounded-full no-underline"
                      style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)' }}>
                      <Phone size={18} color={C.green} />
                    </a>
                    <button onClick={() => { if (!window.confirm(`Delete contact "${c.name}"?`)) return; const updated = contacts.filter((_, idx) => idx !== i); setContacts(updated); localStorage.setItem('child_contacts', JSON.stringify(updated)); }}
                      className="ag-tap flex items-center justify-center w-[42px] h-[42px] rounded-full"
                      style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                      <Trash2 size={16} color={C.red} />
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* ── Add Contact Modal ────────────────────────────────────────────── */}
        {showAddContact && (
          <>
            <div onClick={() => setShowAddContact(false)} className="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-sm" />
            <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-[9999] bg-[#0b0c14] border border-white/10 rounded-t-[28px] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
              style={{ padding: '24px 24px calc(24px + var(--ag-safe-bottom))' }}>
              <div className="flex justify-between items-center mb-5">
                <span className="text-lg font-extrabold text-white">Add Contact</span>
                <button onClick={() => setShowAddContact(false)} aria-label="Close"
                  className="ag-tap w-9 h-9 flex items-center justify-center rounded-xl bg-white/[0.05] border border-white/10" style={{ color: C.muted }}>
                  <X size={18} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <TextField placeholder="Contact name (e.g. Mom, Dad, Uncle)" icon={User} value={newContact.name} onChange={e => setNewContact(c => ({ ...c, name: e.target.value }))} />
                <TextField placeholder="10-digit phone number" icon={Phone} type="tel" inputMode="numeric" pattern="[0-9]*" maxLength={10} value={newContact.phone} onChange={e => { const v = e.target.value.replace(/\D/g, '').slice(0, 10); setNewContact(c => ({ ...c, phone: v })); }}
                  hint={newContact.phone && newContact.phone.length < 10 ? `${10 - newContact.phone.length} more digit${10 - newContact.phone.length !== 1 ? 's' : ''} needed` : undefined} />
                <Button onClick={() => {
                  if (!newContact.name || newContact.phone.length !== 10) return;
                  const updated = [...contacts, { name: newContact.name, phone: newContact.phone }];
                  setContacts(updated);
                  localStorage.setItem('child_contacts', JSON.stringify(updated));
                  setShowAddContact(false);
                  setNewContact({ name: '', phone: '' });
                }} disabled={!newContact.name || newContact.phone.length !== 10} className="mt-1">
                  Save Contact
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ── APP LAUNCHER ──────────────────────────────────────────────── */}
        <div className="mt-8">
          <SectionLabel>Installed Apps</SectionLabel>
          <div className="grid grid-cols-4 gap-x-3 gap-y-4">
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
                  className="ag-tap flex flex-col items-center gap-2 cursor-pointer relative"
                >
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px]"
                    style={{ background: `${app.color}18`, border: `1px solid ${app.color}33` }}>
                    {app.icon}
                  </div>
                  <div className="text-[11px] font-semibold text-center truncate w-full" style={{ color: '#cbd5e1' }}>
                    {app.name}
                  </div>
                  {isLocked && (
                    <div className="absolute -top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: C.red, border: '2px solid #030307' }}>
                      <LockKeyhole size={10} color="#fff" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── SOS EMERGENCY BUTTON ──────────────────────────────────────────── */}
        <div className="mt-8">
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
            className="ag-tap w-full rounded-[20px] text-white font-black flex flex-col items-center gap-3 uppercase tracking-[0.05em]"
            style={{
              padding: '24px',
              border: '2px solid rgba(239,68,68,0.5)',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(153,27,27,0.4))',
              fontSize: '18px',
              boxShadow: '0 10px 40px rgba(239,68,68,0.4), inset 0 0 20px rgba(239,68,68,0.2)',
              animation: 'pulse-dot 2s infinite'
            }}
          >
            <div className="p-3 rounded-full" style={{ background: C.red, boxShadow: '0 0 20px rgba(239,68,68,0.6)' }}>
              <AlertTriangle size={32} color="#fff" strokeWidth={3} />
            </div>
            SOS EMERGENCY
          </button>
          <div className="text-center text-[11px] mt-3 font-bold" style={{ color: C.muted }}>
            PRESSING WILL TRIGGER PARENT ALARM & FIND NEAREST HOSPITAL/POLICE
          </div>
        </div>

      </main>

      {/* ── SOS Results Modal ────────────────────────────────────────────── */}
      {sosResult && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-5 backdrop-blur-xl" style={{ background: 'rgba(239,68,68,0.5)' }}>
          <Card tone="raised" padded={false} className="w-full max-w-[400px] p-7" style={{ border: `2px solid ${C.red}`, boxShadow: '0 0 80px rgba(239,68,68,0.6)' }}>
            <div className="text-center mb-5">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3.5"
                style={{ background: 'rgba(239,68,68,0.2)', border: `2px solid ${C.red}`, boxShadow: `0 0 20px ${C.red}` }}>
                <AlertTriangle size={32} color={C.red} />
              </div>
              <h2 className="text-white text-[22px] font-black mb-1.5">SOS SENT!</h2>
              <p className="text-[13px]" style={{ color: '#94a3b8' }}>Your parent has been alerted immediately.</p>
            </div>

            {(sosResult.status === 'no-gps' || sosResult.status === 'no-geo') && (
              <div className="mb-4">
                <div className="rounded-xl px-3.5 py-3.5 mb-2.5 text-[13px] text-center"
                  style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', color: C.amber }}>
                  {sosResult.reason === 'denied' ? '⚠️ Location permission denied. Please allow it in settings.' :
                   sosResult.reason === 'timeout' ? '⚠️ GPS signal timeout. Try moving to an open area.' :
                   '⚠️ Location unavailable. Allow location to find nearby help.'}
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
                }} className="ag-tap w-full px-3.5 py-3.5 rounded-[14px] font-bold text-[14px] flex items-center justify-center gap-2.5"
                  style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)', color: '#60a5fa' }}>
                  <MapPin size={18} /> {sosResult.reason === 'denied' ? 'Open Location Settings' : 'Retry with Location'}
                </button>
                {sosResult.reason === 'denied_instructions' && (
                  <div className="mt-2.5 p-3 rounded-[10px] text-[12px] leading-[1.6]"
                    style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', color: '#94a3b8' }}>
                    📋 <strong className="text-white">To allow location:</strong><br />
                    Tap the 🔒 lock icon in browser → Site settings → Location → Allow → then come back and press SOS again.
                  </div>
                )}
              </div>
            )}

            {sosResult.facilities.length > 0 && (
              <div className="mb-4">
                <div className="text-[11px] uppercase font-bold mb-2.5" style={{ color: '#94a3b8' }}>Nearest Help</div>
                {sosResult.facilities.map((f, i) => (
                  <div key={i} className="rounded-xl p-3 mb-2" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-extrabold uppercase" style={{ color: '#60a5fa' }}>{f.type} • {f.distanceText}</div>
                        <div className="text-[14px] text-white font-bold truncate">{f.name}</div>
                        <div className="text-[11px] mt-0.5 truncate" style={{ color: '#94a3b8' }}>{f.address}</div>
                      </div>
                      <a href={`tel:112`} className="ag-tap flex items-center justify-center px-3 py-1.5 rounded-lg no-underline text-[12px] font-bold ml-2 flex-shrink-0"
                        style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: C.green }}>
                        <Phone size={14} className="mr-1" /> Call
                      </a>
                    </div>
                    <div className="flex gap-1.5 overflow-x-auto pb-1 ag-no-scrollbar">
                      <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${f.lat},${f.lon}&travelmode=driving`, '_blank')}
                        className="ag-tap flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap"
                        style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
                        <MapPin size={12} /> Maps
                      </button>
                      <button onClick={() => window.open(`https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=${f.lat}&dropoff[longitude]=${f.lon}`, '_blank')}
                        className="ag-tap flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap text-white"
                        style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid #334155' }}>
                        Uber
                      </button>
                      <button onClick={() => window.open(`https://book.olacabs.com/?lat=${f.lat}&lng=${f.lon}`, '_blank')}
                        className="ag-tap flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap"
                        style={{ background: 'rgba(163,230,53,0.15)', border: '1px solid rgba(163,230,53,0.3)', color: '#a3e635' }}>
                        Ola
                      </button>
                      <button onClick={() => window.open(`intent://app/launch?lat=${f.lat}&lng=${f.lon}#Intent;scheme=rapido;package=com.rapido.passenger;end;`, '_blank')}
                        className="ag-tap flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap"
                        style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid rgba(250,204,21,0.3)', color: '#facc15' }}>
                        Rapido
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button onClick={() => setSosResult(null)} className="ag-tap w-full px-3.5 py-3.5 rounded-[14px] text-white font-bold text-[15px]"
              style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)' }}>
              Close
            </button>
          </Card>
        </div>
      )}

      {/* ── APP UNLOCK MODAL ────────────────────────────────────────────── */}
      {unlockAppTarget && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-5 bg-black/80 backdrop-blur-lg">
          <Card tone="raised" padded={false} className="w-full max-w-[360px] p-7 text-center" style={{ borderColor: 'rgba(239,68,68,0.4)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-[32px] mx-auto mb-4"
              style={{ background: `${unlockAppTarget.color}18`, border: `2px solid ${unlockAppTarget.color}40` }}>
              {unlockAppTarget.icon}
            </div>
            <h3 className="text-white text-xl font-extrabold mb-2">App Locked</h3>
            <p className="text-[13px] mb-5" style={{ color: '#94a3b8' }}>{unlockAppTarget.name} is locked. Enter Parent Password to unlock.</p>

            {unlockAppErr && <div className="px-3 py-2.5 rounded-lg text-[13px] mb-4" style={{ background: 'rgba(239,68,68,0.1)', color: C.red }}>{unlockAppErr}</div>}

            <TextField
              type="password"
              value={unlockAppPin}
              onChange={e => setUnlockAppPin(e.target.value)}
              placeholder="Parent Password"
              icon={Lock}
              className="mb-5 text-left"
              onKeyDown={e => { if (e.key === 'Enter') document.getElementById('btn-unlock-app')?.click(); }}
            />

            <div className="flex gap-2.5">
              <Button variant="secondary" size="md" onClick={() => { setUnlockAppTarget(null); setUnlockAppPin(''); setUnlockAppErr(''); }}>Cancel</Button>
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
              }} className="ag-tap flex-[2] min-h-[48px] rounded-full font-bold text-[13px] text-white"
                style={{ background: C.red, opacity: unlockAppLoading ? 0.7 : 1, cursor: unlockAppLoading ? 'not-allowed' : 'pointer' }}>
                {unlockAppLoading ? 'Verifying…' : 'Unlock App'}
              </button>
            </div>
          </Card>
        </div>
      )}

    </div>
  );
};

export default ChildDeviceView;
