import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lock, Smartphone, Moon, ShieldAlert, Eye, EyeOff, Clock, Camera, Wifi, CheckCircle, LockKeyhole, Unlock, AppWindow, ShieldCheck, Star, Settings, Trash2, Plus, QrCode } from 'lucide-react';
import FaceRegistration from '../components/FaceRegistration';
import { useAuth } from '../context/AuthContext';
import jsQR from 'jsqr';
import Webcam from 'react-webcam';
import ConfirmationModal from '../components/layout/ConfirmationModal';
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

const Toggle = ({ active, onChange }) => {
  return (
    <div 
      onClick={() => onChange(!active)}
      className={`w-12 h-6 rounded-full p-0.5 cursor-pointer transition-colors duration-200 border border-white/10 ${active ? 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.4)]' : 'bg-white/5'}`}
    >
      <div 
        className={`w-4.5 h-4.5 rounded-full bg-white transition-transform duration-200 shadow-md ${active ? 'transform translate-x-6' : ''}`}
      />
    </div>
  );
};

const defaultLineData = [
  { name: 'Mon', DeviceA: 1.8, DeviceB: 2.2 },
  { name: 'Tue', DeviceA: 2.5, DeviceB: 3.1 },
  { name: 'Wed', DeviceA: 1.2, DeviceB: 4.5 },
  { name: 'Thu', DeviceA: 3.8, DeviceB: 5.2 },
  { name: 'Fri', DeviceA: 2.0, DeviceB: 3.8 },
  { name: 'Sat', DeviceA: 4.5, DeviceB: 6.0 },
  { name: 'Sun', DeviceA: 3.0, DeviceB: 4.2 },
];

const Controls = () => {
  const { user, activeChild, setActiveChild, childrenList, fetchChildren, token } = useAuth();
  
  const [deviceLock, setDeviceLock] = useState(false);
  const [parentInputCode, setParentInputCode] = useState('');
  const [linkError, setLinkError] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  
  const [showUnpair, setShowUnpair] = useState(false);
  const [unpairPass, setUnpairPass] = useState('');
  const [showUnpairPass, setShowUnpairPass] = useState(false);
  const [unpairError, setUnpairError] = useState('');
  const [isUnpairing, setIsUnpairing] = useState(false);
  const [unpairStep, setUnpairStep] = useState('password');
  
  const [enforcingState, setEnforcingState] = useState(null);
  const [enforceMsg, setEnforceMsg] = useState('');
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);

  const [isPairingOpen, setIsPairingOpen] = useState(false);
  const [isFaceRegOpen, setIsFaceRegOpen] = useState(false);
  
  const webcamRef = useRef(null);

  const refreshActiveChild = useCallback(async () => {
    if (!token || !activeChild?.id) return;
    try {
      const res = await fetch(`/api/children/${activeChild.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.child) setActiveChild(data.child);
    } catch {}
  }, [token, activeChild?.id, setActiveChild]);

  useEffect(() => {
    refreshActiveChild();
    const iv = setInterval(refreshActiveChild, 5000);
    return () => clearInterval(iv);
  }, [refreshActiveChild]);

  // Webcam QR decoding
  useEffect(() => {
    if (!scanMode) return;
    const interval = setInterval(() => {
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
        if (code) {
          try {
            const parsed = JSON.parse(code.data);
            if (parsed.code) {
               setParentInputCode(parsed.code);
               setScanMode(false);
            }
          } catch(e) { }
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: parentInputCode })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setParentInputCode('');
        await fetchChildren();
        setIsPairingOpen(false);
      } else {
        setLinkError(data.error || 'Failed to link device.');
      }
    } catch {
      setLinkError('Network error. Try again.');
    } finally {
      setIsLinking(false);
    }
  };

  const toggleControl = async (childItem, key, forceVal) => {
    const targetChild = childItem || activeChild;
    if (!targetChild) return;

    if (key === 'deviceState') {
      const action = forceVal || 'resume';
      try {
        const res = await fetch(`/api/device/control/${targetChild.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action, reason: action === 'lock' ? 'Locked by parent overview' : null })
        });
        const d = await res.json();
        if (d.success) {
          if (activeChild?.id === targetChild.id) {
            setActiveChild({ ...activeChild, deviceState: action === 'lock' ? 'locked' : 'active' });
          }
          fetchChildren();
        }
      } catch {}
      return;
    }

    const newValue = forceVal !== undefined ? forceVal : !targetChild[key];
    try {
      const res = await fetch(`/api/children/${targetChild.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [key]: newValue })
      });
      if (res.ok) {
        if (activeChild?.id === targetChild.id) {
          setActiveChild({ ...activeChild, [key]: newValue });
        }
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ parentControlPassword: unpairPass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowUnpair(false);
        setUnpairPass('');
        setUnpairStep('password');
        await fetchChildren();
      } else {
        setUnpairError(data.error || 'Failed to unpair.');
      }
    } catch {
      setUnpairError('Network connection failed.');
    } finally {
      setIsUnpairing(false);
    }
  };

  // Compile real child listings matching Screen 5 cards
  const renderingChildren = childrenList.length > 0 ? childrenList : [
    { id: 'mock-child-a', name: 'Device A', age: 10, safetyScore: 98, screenTime: '1h 45m', isOnline: true, battery: '85%', signal: '5G', nightRestriction: true, safeMode: true, facePresenceEnabled: true },
    { id: 'mock-child-b', name: 'Device B', age: 8, safetyScore: 76, screenTime: '3h 30m', isOnline: false, battery: '12%', signal: 'Low', nightRestriction: true, safeMode: false, facePresenceEnabled: false }
  ];

  return (
    <div className="flex flex-col gap-4 px-3 pb-24 pt-4 w-full max-w-[960px] mx-auto animate-fade-in">
      
      {/* 1. FAMILY PROTECTION STATUS HEADER (Image 5 top badge) */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-md shadow-lg flex flex-col items-center text-center">
        <div className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
          Family Protection Status
        </div>
        <h2 className="text-xl font-black text-emerald-400 animate-pulse tracking-wide uppercase">
          Family Secure
        </h2>
        <div className="flex gap-4 mt-3 text-[10px] text-slate-400 font-bold border-t border-white/5 pt-2.5 w-full justify-around">
          <span>Active Members: {renderingChildren.length}</span>
          <span>Family Safety Score: 92/100</span>
        </div>
      </div>

      {/* 2. KIDS PROFILE CARDS */}
      <div className="flex flex-col gap-4">
        {renderingChildren.map((child, idx) => {
          const isMock = String(child.id).startsWith('mock-');
          const isOnline = child.isOnline !== undefined ? child.isOnline : child.deviceState !== 'locked';
          const score = child.safetyScore || 85;
          const scoreColor = score > 85 ? 'text-cyan-400' : score > 60 ? 'text-amber-500' : 'text-red-500';
          const circumference = 2 * Math.PI * 22;
          const dashoffset = circumference - (score / 100) * circumference;

          // Individual child activity data for Recharts
          const personalBarData = [
            { day: 'S', hrs: idx === 0 ? 1 : 4 },
            { day: 'M', hrs: idx === 0 ? 2 : 5 },
            { day: 'T', hrs: idx === 0 ? 1.5 : 8 },
            { day: 'W', hrs: idx === 0 ? 3.2 : 6 },
            { day: 'T', hrs: idx === 0 ? 1.8 : 4.5 },
            { day: 'F', hrs: idx === 0 ? 2.5 : 9 },
            { day: 'S', hrs: idx === 0 ? 3.0 : 7 },
          ];

          return (
            <div key={child.id} className="glass-card p-4 border border-white/5 backdrop-blur-md shadow-lg flex flex-col gap-3.5">
              
              {/* Header profile details */}
              <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 text-xs font-black uppercase">
                    {child.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      {child.name} ({child.age || 'Child'})
                    </div>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-500'}`} />
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{isOnline ? 'ActiveNow' : 'Offline'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                  <span>🔋 {child.battery || '85%'}</span>
                  <span>📶 {child.signal || '5G'}</span>
                </div>
              </div>

              {/* Score / Stats / Recharts Bar Chart Row */}
              <div className="grid grid-cols-[1fr_1.1fr_1.3fr] gap-3 items-center">
                {/* Score gauge */}
                <div className="flex flex-col items-center text-center gap-1 border-r border-white/5 pr-1">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <svg width="56" height="56" viewBox="0 0 50 50" className="transform -rotate-90">
                      <circle cx="25" cy="25" r="22" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
                      <circle 
                        cx="25" cy="25" r="22" fill="transparent" 
                        stroke={score > 85 ? '#22d3ee' : score > 60 ? '#f59e0b' : '#ef4444'} 
                        strokeWidth="3" 
                        strokeDasharray={circumference}
                        strokeDashoffset={dashoffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xs font-black text-white">{score}</span>
                      <span className="text-[7px] text-slate-500 leading-none">/100</span>
                    </div>
                  </div>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Safety Score</span>
                </div>

                {/* Today's Stats */}
                <div className="flex flex-col gap-2 pl-1 border-r border-white/5 pr-1">
                  <div>
                    <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block leading-none">Today Screen Time</span>
                    <span className="text-white font-extrabold text-[12px] mt-1 block">{child.screenTime || '1h 45m'}</span>
                  </div>
                  {idx === 1 && (
                    <div>
                      <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider block leading-none">Achievements</span>
                      <div className="flex items-center gap-0.5 mt-0.5">
                        <Star size={8} className="fill-amber-400 text-amber-400" />
                        <Star size={8} className="fill-amber-400 text-amber-400" />
                        <Star size={8} className="fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Recharts Bar chart weekly overview */}
                <div className="h-16">
                  <div className="text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Weekly Activity</div>
                  <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={personalBarData} margin={{ top: 0, bottom: 0, left: -25, right: 0 }}>
                      <XAxis dataKey="day" stroke="#64748b" fontSize={7} tickLine={false} axisLine={false} />
                      <Bar 
                        dataKey="hrs" 
                        fill={idx === 0 ? '#22d3ee' : '#a855f7'} 
                        radius={[2, 2, 0, 0]} 
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* DETAILED CONTROLS TOGGLES (App Lock, Geofences, Bedtime) */}
              <div className="border-t border-white/5 pt-3 flex flex-col gap-3">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Detailed Controls</span>
                
                {/* 1. App Lock */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Lock size={12} className="text-cyan-400" />
                    <span className="text-slate-300">App Lock ({idx === 0 ? '5' : '12'})</span>
                  </div>
                  <Toggle 
                    active={child.safeMode} 
                    onChange={(v) => {
                      if (!isMock) toggleControl(child, 'safeMode', v);
                    }} 
                  />
                </div>

                {/* 2. Geofences */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Smartphone size={12} className="text-cyan-400" />
                    <span className="text-slate-300">Geofences (1)</span>
                  </div>
                  <Toggle 
                    active={child.facePresenceEnabled} 
                    onChange={(v) => {
                      if (!isMock) toggleControl(child, 'facePresenceEnabled', v);
                    }} 
                  />
                </div>

                {/* 3. Bedtime Schedule */}
                <div className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <Moon size={12} className="text-cyan-400" />
                    <span className="text-slate-300">Bedtime Schedule (9:00 PM)</span>
                  </div>
                  <Toggle 
                    active={child.nightRestriction} 
                    onChange={(v) => {
                      if (!isMock) toggleControl(child, 'nightRestriction', v);
                    }} 
                  />
                </div>
              </div>

            </div>
          );
        })}
      </div>

      {/* 3. FAMILY WEEKLY SCREEN TIME TREND CHART (Image 5 bottom chart) */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-md shadow-lg flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-white">Family Weekly Screen Time Trend</span>
          <div className="flex gap-2 text-[8px] text-slate-400 font-bold bg-white/5 px-2 py-0.5 rounded-full">
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Device A</span>
            <span className="flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Device B</span>
          </div>
        </div>

        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={defaultLineData} margin={{ top: 5, bottom: 5, left: -25, right: 5 }}>
              <XAxis dataKey="name" stroke="#64748b" fontSize={8} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ background: '#12121e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                labelStyle={{ fontSize: '9px', color: '#fff' }}
                itemStyle={{ fontSize: '9px' }}
              />
              <Line type="monotone" dataKey="DeviceA" stroke="#22d3ee" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="DeviceB" stroke="#a855f7" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. EXPANDABLE SYNC & PAIRING CONTROL DRAWER */}
      <div className="glass-card border border-white/5 rounded-2xl overflow-hidden mt-2">
        <div 
          onClick={() => setIsPairingOpen(!isPairingOpen)}
          className="flex items-center justify-between px-4 py-3.5 cursor-pointer bg-white/2 hover:bg-white/5 transition-all select-none"
        >
          <span className="text-xs font-extrabold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
            <QrCode size={14} />
            Sync & Device Pairing Center
          </span>
          <span className="text-slate-500 text-[10px] font-bold">
            {isPairingOpen ? 'Collapse' : 'Expand'}
          </span>
        </div>

        {isPairingOpen && (
          <div className="p-4 border-t border-white/5 flex flex-col gap-4">
            
            {/* Sync Code display */}
            {activeChild ? (
              <div className="p-3 bg-white/2 rounded-xl border border-white/5 text-center">
                <span className="text-[10px] text-slate-400 block mb-1 font-bold">Pairing Sync Code</span>
                <span className="text-xl font-black text-cyan-400 tracking-widest">{activeChild.pairingCode || 'AG-728'}</span>
                <p className="text-[9.5px] text-slate-500 mt-2 max-w-[280px] mx-auto leading-normal">
                  Enter this code on the child device app to complete synchronization.
                </p>
              </div>
            ) : null}

            {/* Input code connector */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase">Or Link child device via Code</span>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  maxLength={6}
                  placeholder="Enter 6-digit sync code" 
                  value={parentInputCode}
                  onChange={e => setParentInputCode(e.target.value.replace(/\D/g,''))}
                  className="flex-1 px-3.5 py-2 bg-white/5 border border-white/5 rounded-xl text-white text-xs outline-none focus:border-cyan-500/30"
                />
                <button 
                  onClick={handleLinkDevice}
                  disabled={isLinking}
                  className="px-5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-white font-bold text-xs cursor-pointer shadow-lg"
                >
                  {isLinking ? 'Linking...' : 'Connect'}
                </button>
              </div>
              {linkError && <p className="text-red-400 text-[10px] font-bold mt-1">{linkError}</p>}
            </div>

            {/* QR camera scanner */}
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => setScanMode(!scanMode)}
                className="py-2.5 bg-white/5 border border-white/5 text-xs text-white font-bold rounded-xl cursor-pointer hover:bg-white/10 text-center flex items-center justify-center gap-1.5"
              >
                <Camera size={13} className="text-cyan-400" />
                <span>{scanMode ? 'Close Camera' : 'Scan QR Code'}</span>
              </button>

              {scanMode && (
                <div className="relative w-full aspect-square max-w-[280px] mx-auto rounded-xl overflow-hidden border border-white/10 mt-2 shadow-2xl">
                  <Webcam 
                    ref={webcamRef} 
                    audio={false} 
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover" 
                  />
                  <div className="absolute inset-4 border-2 border-dashed border-cyan-400 rounded-lg pointer-events-none" />
                </div>
              )}
            </div>

            {/* Unpair controls */}
            {activeChild && (
              <div className="border-t border-white/5 pt-4 mt-2">
                <button 
                  onClick={() => {
                    setShowUnpair(true);
                    setUnpairStep('password');
                    setUnpairPass('');
                    setUnpairError('');
                  }}
                  className="w-full py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 font-extrabold rounded-xl cursor-pointer hover:bg-red-500/20 text-center flex items-center justify-center gap-1.5"
                >
                  <Trash2 size={13} />
                  <span>Unpair {activeChild.name}'s Device</span>
                </button>
              </div>
            )}

          </div>
        )}
      </div>

      {/* 5. COLLAPSIBLE FACE REGISTRATION MODULE */}
      <div className="glass-card border border-white/5 rounded-2xl overflow-hidden mt-1">
        <div 
          onClick={() => setIsFaceRegOpen(!isFaceRegOpen)}
          className="flex items-center justify-between px-4 py-3.5 cursor-pointer bg-white/2 hover:bg-white/5 transition-all select-none"
        >
          <span className="text-xs font-extrabold text-cyan-400 tracking-wider uppercase flex items-center gap-1.5">
            <Camera size={14} />
            Face Guard Biometric Registry
          </span>
          <span className="text-slate-500 text-[10px] font-bold">
            {isFaceRegOpen ? 'Collapse' : 'Expand'}
          </span>
        </div>

        {isFaceRegOpen && (
          <div className="p-4 border-t border-white/5 bg-[#0b0b14]/50">
            {activeChild ? (
              <FaceRegistration childId={activeChild.id} />
            ) : (
              <p className="text-slate-400 text-xs py-2 text-center">Pair a device to register biometrics.</p>
            )}
          </div>
        )}
      </div>

      {/* Lock/Unlock Dialog Confirmations */}
      <ConfirmationModal 
        isOpen={showLockConfirm} 
        onClose={() => setShowLockConfirm(false)}
        onConfirm={() => {
          setShowLockConfirm(false);
          toggleControl(null, 'deviceState', 'locked');
        }}
        title="Lock Child Device?"
        message={`Are you sure you want to instantly lock the child's screen? They will be locked out of all apps immediately.`}
        confirmText="Lock Device"
      />
      <ConfirmationModal 
        isOpen={showUnlockConfirm} 
        onClose={() => setShowUnlockConfirm(false)}
        onConfirm={() => {
          setShowUnlockConfirm(false);
          toggleControl(null, 'deviceState', 'active');
        }}
        title="Unlock Child Device?"
        message={`Are you sure you want to resume access for ${activeChild?.name}? This clears any active lockout blocks.`}
        confirmText="Unlock"
      />

      {/* Unpair Password Confirmation Dialog */}
      {showUnpair && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4">
          <div className="bg-[#12121e] border border-red-500/30 p-6 rounded-2xl w-full max-w-[380px] text-center shadow-2xl">
            <ShieldAlert size={40} className="text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-extrabold text-lg mb-2">Unpair Child Device?</h3>
            <p className="text-slate-400 text-xs leading-normal mb-4">
              This completely detaches {activeChild?.name}'s phone from supervision. Enter your Parent Control Password to verify.
            </p>
            
            {unpairError && <p className="text-red-400 text-[11px] bg-red-500/10 border border-red-500/20 p-2 rounded-lg mb-3 font-semibold">{unpairError}</p>}
            
            <input 
              type="password" 
              placeholder="Parent Control Password"
              value={unpairPass}
              onChange={e => setUnpairPass(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-white text-sm text-center mb-4 outline-none focus:border-red-500/30"
            />

            <div className="flex gap-3">
              <button 
                onClick={() => setShowUnpair(false)}
                className="flex-1 py-2 border border-white/10 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleUnpair}
                disabled={isUnpairing}
                className="flex-1.5 py-2 bg-red-600 text-white text-xs font-black rounded-xl cursor-pointer"
              >
                {isUnpairing ? 'Unpairing...' : 'Unpair Device'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Controls;
