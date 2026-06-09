import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lock, Smartphone, Moon, ShieldAlert, Camera, Star, Trash2, QrCode, ChevronDown, Scan } from 'lucide-react';
import FaceRegistration from '../components/FaceRegistration';
import { useAuth } from '../context/AuthContext';
import jsQR from 'jsqr';
import Webcam from 'react-webcam';
import ConfirmationModal from '../components/layout/ConfirmationModal';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, Tooltip } from 'recharts';
import { Card } from '../components/ui';

/* Premium switch — 52x30 track, 24px knob, comfortable hit area */
const Toggle = ({ active, onChange, color = '#06b6d4' }) => (
  <button
    onClick={() => onChange(!active)}
    role="switch"
    aria-checked={active}
    className="ag-tap relative w-[52px] h-[30px] rounded-full p-[3px] flex-shrink-0 border transition-colors duration-200"
    style={{
      background: active ? color : 'rgba(255,255,255,0.07)',
      borderColor: active ? color : 'rgba(255,255,255,0.1)',
      boxShadow: active ? `0 0 14px ${color}55` : 'none',
    }}
  >
    <span
      className="block w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200"
      style={{ transform: active ? 'translateX(22px)' : 'translateX(0)' }}
    />
  </button>
);

const defaultLineData = [
  { name: 'Mon', DeviceA: 1.8, DeviceB: 2.2 }, { name: 'Tue', DeviceA: 2.5, DeviceB: 3.1 },
  { name: 'Wed', DeviceA: 1.2, DeviceB: 4.5 }, { name: 'Thu', DeviceA: 3.8, DeviceB: 5.2 },
  { name: 'Fri', DeviceA: 2.0, DeviceB: 3.8 }, { name: 'Sat', DeviceA: 4.5, DeviceB: 6.0 },
  { name: 'Sun', DeviceA: 3.0, DeviceB: 4.2 },
];

const ControlRow = ({ icon: Icon, label, sub, active, onChange, color }) => (
  <div className="flex items-center justify-between py-1">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-9 h-9 rounded-xl bg-white/[0.05] border border-white/[0.07] flex items-center justify-center flex-shrink-0">
        <Icon size={16} className="text-cyan-400" />
      </div>
      <div className="min-w-0">
        <div className="text-[13.5px] font-bold text-white truncate">{label}</div>
        {sub && <div className="text-[11.5px] text-slate-500 truncate">{sub}</div>}
      </div>
    </div>
    <Toggle active={active} onChange={onChange} color={color} />
  </div>
);

const Controls = () => {
  const { user, activeChild, setActiveChild, childrenList, fetchChildren, token } = useAuth();

  const [parentInputCode, setParentInputCode] = useState('');
  const [linkError, setLinkError] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [scanMode, setScanMode] = useState(false);

  const [showUnpair, setShowUnpair] = useState(false);
  const [unpairPass, setUnpairPass] = useState('');
  const [unpairError, setUnpairError] = useState('');
  const [isUnpairing, setIsUnpairing] = useState(false);
  const [unpairStep, setUnpairStep] = useState('password');

  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);

  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isFaceRegOpen, setIsFaceRegOpen] = useState(false);

  const webcamRef = useRef(null);

  const refreshActiveChild = useCallback(async () => {
    if (!token || !activeChild?.id) return;
    try {
      const res = await fetch(`/api/children/${activeChild.id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.child) setActiveChild(data.child);
    } catch {}
  }, [token, activeChild?.id, setActiveChild]);

  useEffect(() => {
    refreshActiveChild();
    const iv = setInterval(refreshActiveChild, 5000);
    return () => clearInterval(iv);
  }, [refreshActiveChild]);

  useEffect(() => {
    if (!scanMode) return;
    const interval = setInterval(() => {
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'attemptBoth' });
        if (code) {
          try {
            const parsed = JSON.parse(code.data);
            if (parsed.code) { setParentInputCode(parsed.code); setScanMode(false); }
          } catch (e) {}
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [scanMode]);

  const handleLinkDevice = async () => {
    if (parentInputCode.length !== 6) return setLinkError('Code must be 6 digits');
    setIsLinking(true);
    setLinkError('');
    try {
      const res = await fetch('/api/device/confirm-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ code: parentInputCode }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setParentInputCode('');
        await fetchChildren();
        setIsPairingOpen(false);
      } else setLinkError(data.error || 'Failed to link device.');
    } catch { setLinkError('Network error. Try again.'); }
    finally { setIsLinking(false); }
  };

  const toggleControl = async (childItem, key, forceVal) => {
    const targetChild = childItem || activeChild;
    if (!targetChild) return;

    if (key === 'deviceState') {
      const action = forceVal || 'resume';
      try {
        const res = await fetch(`/api/device/control/${targetChild.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ action, reason: action === 'lock' ? 'Locked by parent overview' : null }),
        });
        const d = await res.json();
        if (d.success) {
          if (activeChild?.id === targetChild.id) setActiveChild({ ...activeChild, deviceState: action === 'lock' ? 'locked' : 'active' });
          fetchChildren();
        }
      } catch {}
      return;
    }

    const newValue = forceVal !== undefined ? forceVal : !targetChild[key];
    try {
      const res = await fetch(`/api/children/${targetChild.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ [key]: newValue }),
      });
      if (res.ok) {
        if (activeChild?.id === targetChild.id) setActiveChild({ ...activeChild, [key]: newValue });
        await fetchChildren();
      }
    } catch {}
  };

  const handleUnpair = async () => {
    if (!activeChild?.id) return;
    setIsUnpairing(true);
    setUnpairError('');
    try {
      const res = await fetch(`/api/device/unpair/${activeChild.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ parentControlPassword: unpairPass }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowUnpair(false);
        setUnpairPass('');
        setUnpairStep('password');
        await fetchChildren();
      } else setUnpairError(data.error || 'Failed to unpair.');
    } catch { setUnpairError('Network connection failed.'); }
    finally { setIsUnpairing(false); }
  };

  const renderingChildren = childrenList.length > 0 ? childrenList : [
    { id: 'mock-child-a', name: 'Device A', age: 10, safetyScore: 98, screenTime: '1h 45m', isOnline: true, battery: '85%', signal: '5G', nightRestriction: true, safeMode: true, facePresenceEnabled: true },
    { id: 'mock-child-b', name: 'Device B', age: 8, safetyScore: 76, screenTime: '3h 30m', isOnline: false, battery: '12%', signal: 'Low', nightRestriction: true, safeMode: false, facePresenceEnabled: false },
  ];

  const Accordion = ({ open, onToggle, icon: Icon, title, children }) => (
    <Card padded={false} className="overflow-hidden">
      <button onClick={onToggle} className="ag-tap w-full flex items-center justify-between px-4 py-4">
        <span className="text-[13px] font-black text-cyan-400 tracking-wide flex items-center gap-2">
          <Icon size={16} /> {title}
        </span>
        <ChevronDown size={18} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="px-4 pb-4 border-t border-white/[0.06] pt-4">{children}</div>}
    </Card>
  );

  return (
    <div className="flex flex-col gap-5 w-full max-w-[640px] mx-auto ag-rise">

      {/* Family protection status */}
      <Card tone="glass" className="p-5 flex flex-col items-center text-center">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] mb-1.5">Family Protection Status</span>
        <h2 className="text-2xl font-black text-emerald-400 tracking-tight">Family Secure</h2>
        <div className="flex gap-6 mt-4 pt-3.5 border-t border-white/[0.06] w-full justify-center text-[12px] text-slate-400 font-bold">
          <span>{renderingChildren.length} member{renderingChildren.length !== 1 ? 's' : ''}</span>
          <span className="text-slate-600">·</span>
          <span>Safety Score 92/100</span>
        </div>
      </Card>

      {/* Child cards */}
      {renderingChildren.map((child, idx) => {
        const isMock = String(child.id).startsWith('mock-');
        const isOnline = child.isOnline !== undefined ? child.isOnline : child.deviceState !== 'locked';
        const score = child.safetyScore || 85;
        const circumference = 2 * Math.PI * 24;
        const dashoffset = circumference - (score / 100) * circumference;
        const scoreStroke = score > 85 ? '#22d3ee' : score > 60 ? '#f59e0b' : '#ef4444';
        const personalBarData = [
          { day: 'S', hrs: idx === 0 ? 1 : 4 }, { day: 'M', hrs: idx === 0 ? 2 : 5 },
          { day: 'T', hrs: idx === 0 ? 1.5 : 8 }, { day: 'W', hrs: idx === 0 ? 3.2 : 6 },
          { day: 'T', hrs: idx === 0 ? 1.8 : 4.5 }, { day: 'F', hrs: idx === 0 ? 2.5 : 9 }, { day: 'S', hrs: idx === 0 ? 3.0 : 7 },
        ];

        return (
          <Card key={child.id} tone="raised" className="p-4 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-base font-black uppercase">
                  {child.name.charAt(0)}
                </div>
                <div>
                  <div className="text-[14px] font-black text-white">{child.name} <span className="text-slate-500 font-bold">· {child.age || 'Child'}</span></div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                    <span className="text-[11px] text-slate-500 font-bold uppercase tracking-wide">{isOnline ? 'Active now' : 'Offline'}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 text-[12px] text-slate-300 font-bold">
                <span>🔋 {child.battery || '85%'}</span>
                <span>📶 {child.signal || '5G'}</span>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-[auto_1fr_1.3fr] gap-4 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg width="64" height="64" viewBox="0 0 56 56" className="-rotate-90">
                    <circle cx="28" cy="28" r="24" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />
                    <circle cx="28" cy="28" r="24" fill="transparent" stroke={scoreStroke} strokeWidth="4" strokeDasharray={circumference} strokeDashoffset={dashoffset} strokeLinecap="round" />
                  </svg>
                  <span className="absolute text-[15px] font-black text-white">{score}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Safety</span>
              </div>
              <div className="flex flex-col gap-2">
                <div>
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide block">Screen time</span>
                  <span className="text-white font-black text-[15px]">{child.screenTime || '1h 45m'}</span>
                </div>
                {idx === 1 && (
                  <div className="flex items-center gap-0.5">
                    {[0, 1, 2].map((s) => <Star key={s} size={12} className="fill-amber-400 text-amber-400" />)}
                  </div>
                )}
              </div>
              <div className="h-16">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1">This week</span>
                <ResponsiveContainer width="100%" height="80%">
                  <BarChart data={personalBarData} margin={{ top: 0, bottom: 0, left: 0, right: 0 }}>
                    <XAxis dataKey="day" stroke="#475569" fontSize={9} tickLine={false} axisLine={false} />
                    <Bar dataKey="hrs" fill={idx === 0 ? '#22d3ee' : '#a855f7'} radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Controls */}
            <div className="border-t border-white/[0.06] pt-3.5 flex flex-col gap-3">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.12em]">Controls</span>
              <ControlRow icon={Lock} label="App Lock" sub={`${idx === 0 ? '5' : '12'} apps restricted`} active={child.safeMode} color="#06b6d4" onChange={(v) => { if (!isMock) toggleControl(child, 'safeMode', v); }} />
              <ControlRow icon={Smartphone} label="Geofences" sub="1 safe zone active" active={child.facePresenceEnabled} color="#8b5cf6" onChange={(v) => { if (!isMock) toggleControl(child, 'facePresenceEnabled', v); }} />
              <ControlRow icon={Moon} label="Bedtime Schedule" sub="9:00 PM – 7:00 AM" active={child.nightRestriction} color="#3b82f6" onChange={(v) => { if (!isMock) toggleControl(child, 'nightRestriction', v); }} />
            </div>
          </Card>
        );
      })}

      {/* Family trend */}
      <Card tone="glass" className="p-5">
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-black text-white">Family Screen Time Trend</span>
          <div className="flex gap-3 text-[11px] text-slate-400 font-bold">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400" /> A</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> B</span>
          </div>
        </div>
        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={defaultLineData} margin={{ top: 5, bottom: 0, left: 6, right: 6 }}>
              <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: 12 }} labelStyle={{ color: '#fff' }} />
              <Line type="monotone" dataKey="DeviceA" stroke="#22d3ee" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="DeviceB" stroke="#a855f7" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Pairing center */}
      <Accordion open={isPairingOpen} onToggle={() => setIsPairingOpen(!isPairingOpen)} icon={QrCode} title="Sync & Device Pairing">
        <div className="flex flex-col gap-4">
          {activeChild && (
            <div className="p-4 bg-white/[0.03] rounded-2xl border border-white/[0.06] text-center">
              <span className="text-[11px] text-slate-500 block mb-1 font-bold uppercase tracking-wide">Pairing Code</span>
              <span className="text-2xl font-black text-cyan-400 tracking-[6px]">{activeChild.pairingCode || 'AG-728'}</span>
              <p className="text-[11.5px] text-slate-500 mt-2 max-w-[280px] mx-auto leading-relaxed">Enter this on the child device to complete sync.</p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wide">Link via code</span>
            <div className="flex gap-2">
              <input
                type="tel" inputMode="numeric" maxLength={6} placeholder="6-digit code"
                value={parentInputCode}
                onChange={(e) => setParentInputCode(e.target.value.replace(/\D/g, ''))}
                className="flex-1 px-4 min-h-[48px] bg-[#0b0c14] border border-white/[0.08] rounded-2xl text-white text-[15px] outline-none focus:border-cyan-500/40"
              />
              <button onClick={handleLinkDevice} disabled={isLinking} className="ag-tap px-6 min-h-[48px] bg-gradient-to-r from-blue-600 to-cyan-500 rounded-2xl text-white font-bold text-[13px]">
                {isLinking ? 'Linking…' : 'Connect'}
              </button>
            </div>
            {linkError && <p className="text-rose-400 text-[12px] font-semibold">{linkError}</p>}
          </div>

          <button onClick={() => setScanMode(!scanMode)} className="ag-tap w-full min-h-[48px] flex items-center justify-center gap-2 bg-white/[0.05] border border-white/[0.07] rounded-2xl text-[13px] text-white font-bold">
            <Scan size={16} className="text-cyan-400" />
            {scanMode ? 'Close Camera' : 'Scan QR Code'}
          </button>
          {scanMode && (
            <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-2xl overflow-hidden border border-white/10">
              <Webcam ref={webcamRef} audio={false} screenshotFormat="image/jpeg" className="w-full h-full object-cover" />
              <div className="absolute inset-5 border-2 border-dashed border-cyan-400 rounded-2xl pointer-events-none" />
            </div>
          )}

          {activeChild && (
            <button
              onClick={() => { setShowUnpair(true); setUnpairStep('password'); setUnpairPass(''); setUnpairError(''); }}
              className="ag-tap w-full min-h-[48px] flex items-center justify-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold text-[13px] rounded-2xl mt-1"
            >
              <Trash2 size={15} /> Unpair {activeChild.name}
            </button>
          )}
        </div>
      </Accordion>

      {/* Face registry */}
      <Accordion open={isFaceRegOpen} onToggle={() => setIsFaceRegOpen(!isFaceRegOpen)} icon={Camera} title="Face Guard Biometric Registry">
        {activeChild ? <FaceRegistration childId={activeChild.id} /> : <p className="text-slate-400 text-[13px] py-2 text-center">Pair a device to register biometrics.</p>}
      </Accordion>

      <ConfirmationModal isOpen={showLockConfirm} onClose={() => setShowLockConfirm(false)} onConfirm={() => { setShowLockConfirm(false); toggleControl(null, 'deviceState', 'locked'); }} title="Lock Child Device?" message="They will be locked out of all apps immediately." confirmText="Lock Device" />
      <ConfirmationModal isOpen={showUnlockConfirm} onClose={() => setShowUnlockConfirm(false)} onConfirm={() => { setShowUnlockConfirm(false); toggleControl(null, 'deviceState', 'active'); }} title="Unlock Child Device?" message={`Resume access for ${activeChild?.name}? This clears active lockout blocks.`} confirmText="Unlock" />

      {showUnpair && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <Card tone="raised" className="w-full max-w-[380px] text-center p-6 border-rose-500/30">
            <ShieldAlert size={40} className="text-rose-500 mx-auto mb-4" />
            <h3 className="text-white font-black text-lg mb-2">Unpair Device?</h3>
            <p className="text-slate-400 text-[13px] leading-relaxed mb-4">
              This detaches {activeChild?.name}’s phone from supervision. Enter your Parent Control Password to verify.
            </p>
            {unpairError && <p className="text-rose-400 text-[12px] bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl mb-3 font-semibold">{unpairError}</p>}
            <input
              type="password" placeholder="Parent Control Password" value={unpairPass}
              onChange={(e) => setUnpairPass(e.target.value)}
              className="w-full px-4 min-h-[48px] bg-black/40 border border-white/10 rounded-2xl text-white text-[15px] text-center mb-4 outline-none focus:border-rose-500/40"
            />
            <div className="flex gap-3">
              <button onClick={() => setShowUnpair(false)} className="ag-tap flex-1 min-h-[48px] border border-white/10 text-slate-300 text-[13px] font-bold rounded-2xl">Cancel</button>
              <button onClick={handleUnpair} disabled={isUnpairing} className="ag-tap flex-[1.4] min-h-[48px] bg-rose-600 text-white text-[13px] font-black rounded-2xl">{isUnpairing ? 'Unpairing…' : 'Unpair'}</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Controls;
