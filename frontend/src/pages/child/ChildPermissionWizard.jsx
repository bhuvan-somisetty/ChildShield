import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera, Mic, Bell, Monitor, Battery, CheckCircle, XCircle, ChevronRight, ShieldCheck, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, Button, ProgressDots } from '../../components/ui';

const PERMISSIONS = [
  {
    id: 'location', icon: MapPin, color: '#10b981',
    title: 'Location Access',
    desc: 'Lets your parent see where you are in real time. This keeps you safe and helps them know your whereabouts.',
    request: async () =>
      new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(() => resolve(true), () => resolve(false), { enableHighAccuracy: true, timeout: 10000 });
      }),
  },
  {
    id: 'camera', icon: Camera, color: '#3b82f6',
    title: 'Camera Access',
    desc: 'Lets your parent remotely view the camera when needed. This helps verify your safety.',
    request: async () => {
      try { const s = await navigator.mediaDevices.getUserMedia({ video: true }); s.getTracks().forEach((t) => t.stop()); return true; }
      catch { return false; }
    },
  },
  {
    id: 'microphone', icon: Mic, color: '#f59e0b',
    title: 'Microphone Access',
    desc: 'Lets your parent listen to surroundings when needed. Used only for safety purposes.',
    request: async () => {
      try { const s = await navigator.mediaDevices.getUserMedia({ audio: true }); s.getTracks().forEach((t) => t.stop()); return true; }
      catch { return false; }
    },
  },
  {
    id: 'notifications', icon: Bell, color: '#ef4444',
    title: 'Notifications',
    desc: 'Lets the app show important alerts such as screen time limits, pauses, and lock notifications.',
    request: async () => {
      if (!('Notification' in window)) return false;
      const result = await Notification.requestPermission();
      return result === 'granted';
    },
  },
  {
    id: 'screen', icon: Monitor, color: '#8b5cf6',
    title: 'Screen Sharing',
    desc: 'When your parent requests a screen view, the system will ask you to approve sharing. This cannot be done silently — you’ll always see a prompt.',
    request: null,
  },
  {
    id: 'battery', icon: Battery, color: '#06b6d4',
    title: 'Battery Optimization',
    desc: 'For background tracking to work reliably, disable battery optimization for this app in your device settings. This prevents the system from stopping location updates.',
    request: null,
  },
];

const ChildPermissionWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [statuses, setStatuses] = useState({});
  const [requesting, setRequesting] = useState(false);

  const perm = PERMISSIONS[step];
  const isLast = step === PERMISSIONS.length - 1;
  const isComplete = step >= PERMISSIONS.length;
  const status = statuses[perm?.id];

  useEffect(() => {
    if (!perm) return;
    const checkInitial = async () => {
      if (perm.id === 'location' && navigator.permissions) {
        try {
          const res = await navigator.permissions.query({ name: 'geolocation' });
          if (res.state === 'granted') setStatuses((s) => ({ ...s, location: 'granted' }));
          if (res.state === 'denied') setStatuses((s) => ({ ...s, location: 'denied' }));
        } catch (e) {}
      } else if (perm.id === 'notifications' && 'Notification' in window) {
        if (Notification.permission === 'granted') setStatuses((s) => ({ ...s, notifications: 'granted' }));
        if (Notification.permission === 'denied') setStatuses((s) => ({ ...s, notifications: 'denied' }));
      }
    };
    checkInitial();
  }, [perm]);

  const handleRequest = useCallback(async () => {
    if (!perm?.request) {
      setStatuses((s) => ({ ...s, [perm.id]: 'info' }));
      return;
    }
    setRequesting(true);
    try {
      const granted = await perm.request();
      setStatuses((prev) => ({ ...prev, [perm.id]: granted ? 'granted' : 'denied' }));
    } catch {
      setStatuses((prev) => ({ ...prev, [perm.id]: 'denied' }));
    } finally {
      setRequesting(false);
    }
  }, [perm]);

  const handleTryAgain = async () => {
    if (perm.id === 'location' && navigator.permissions) {
      setRequesting(true);
      try {
        const res = await navigator.permissions.query({ name: 'geolocation' });
        if (res.state === 'prompt') { setRequesting(false); handleRequest(); }
        else if (res.state === 'granted') { setStatuses((s) => ({ ...s, location: 'granted' })); setRequesting(false); }
        else if (res.state === 'denied') { setStatuses((s) => ({ ...s, location: 'denied' })); setRequesting(false); }
      } catch (e) { setRequesting(false); handleRequest(); }
    } else {
      handleRequest();
    }
  };

  const handleNext = () => {
    if (isLast) setStep(PERMISSIONS.length);
    else setStep(step + 1);
  };

  const handleFinish = () => {
    localStorage.setItem('cs_permissions_done', 'true');
    navigate('/child/device', { replace: true });
  };

  /* ── Summary ─────────────────────────────────────────────────────────────── */
  if (isComplete) {
    const allGranted = PERMISSIONS.every((p) => statuses[p.id] === 'granted' || statuses[p.id] === 'info');
    return (
      <Screen ambient="brand" glowColor="radial-gradient(circle, #10b981 0%, transparent 60%)" align="between"
        footer={
          <Button onClick={handleFinish} disabled={!allGranted}>
            {allGranted ? 'Continue to Device' : 'Allow all permissions to continue'}
          </Button>
        }
      >
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="w-full flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mb-5">
            <ShieldCheck size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-[26px] font-black text-white tracking-tight">Setup complete</h1>
          <p className="text-slate-500 text-[13px] font-semibold mt-2 mb-7">Your device is ready for safe monitoring.</p>

          <div className="w-full flex flex-col gap-2.5">
            {PERMISSIONS.map((p, i) => {
              const s = statuses[p.id];
              const ok = s === 'granted' || s === 'info';
              return (
                <button
                  key={p.id}
                  onClick={() => { if (!ok) setStep(i); }}
                  className={`ag-tap flex items-center gap-3 p-3.5 rounded-2xl border text-left ${
                    ok ? 'bg-emerald-500/[0.06] border-emerald-500/20 cursor-default' : 'bg-rose-500/[0.06] border-rose-500/20'
                  }`}
                >
                  <p.icon size={18} style={{ color: p.color }} className="flex-shrink-0" />
                  <span className="flex-1 text-[14px] text-white font-bold">
                    {p.title}
                    {!ok && <span className="block text-[11px] text-rose-400 font-bold mt-0.5">Tap to retry</span>}
                  </span>
                  {ok ? <CheckCircle size={18} className="text-emerald-400" /> : <XCircle size={18} className="text-rose-400" />}
                </button>
              );
            })}
          </div>
        </motion.div>
      </Screen>
    );
  }

  /* ── Per-permission step ─────────────────────────────────────────────────── */
  const primary = perm.request ? (
    status === 'denied' ? (
      <Button variant="danger" onClick={handleTryAgain} loading={requesting}>Try Again</Button>
    ) : (
      <Button onClick={handleRequest} loading={requesting} disabled={status === 'granted'}
        style={status !== 'granted' ? { background: perm.color, color: '#0f172a' } : undefined}>
        {status === 'granted' ? 'Permission Granted' : 'Allow Permission'}
      </Button>
    )
  ) : (
    <Button onClick={() => setStatuses((s) => ({ ...s, [perm.id]: 'info' }))} disabled={status === 'info'}
      style={status !== 'info' ? { background: perm.color, color: '#0f172a' } : undefined}>
      {status === 'info' ? 'Understood' : 'I Understand'}
    </Button>
  );

  return (
    <Screen ambient="brand" glowColor={`radial-gradient(circle, ${perm.color} 0%, transparent 60%)`} align="between"
      footer={
        <div className="flex flex-col gap-2.5">
          {primary}
          <Button variant="ghost" onClick={handleNext} disabled={status !== 'granted' && status !== 'info'} iconRight={ChevronRight}>
            {isLast ? 'Finish Setup' : 'Next'}
          </Button>
        </div>
      }
    >
      <div className="w-full flex items-center justify-between mb-2">
        <span className="text-[11px] text-slate-500 font-black tracking-[0.12em] uppercase">Step {step + 1} of {PERMISSIONS.length}</span>
        <ProgressDots count={PERMISSIONS.length} active={step} color={perm.color} />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={perm.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-7 border-2"
            style={{ background: `${perm.color}14`, borderColor: `${perm.color}40` }}>
            <perm.icon size={40} style={{ color: perm.color }} />
          </div>
          <h1 className="text-[24px] font-black text-white tracking-tight mb-3">{perm.title}</h1>
          <p className="text-slate-400 text-[14px] leading-relaxed max-w-[330px]">{perm.desc}</p>

          {status && (
            <div className="mt-6">
              {status === 'granted' || status === 'info' ? (
                <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 font-bold text-[13px]">
                  <CheckCircle size={15} /> {status === 'info' ? 'Acknowledged' : 'Granted'}
                </span>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-500/10 border border-rose-500/30 rounded-full text-rose-400 font-bold text-[13px]">
                    <XCircle size={15} /> Not Granted
                  </span>
                  <span className="text-[12px] text-rose-400/90 max-w-[320px] leading-relaxed">
                    {perm.id === 'location'
                      ? 'Location is blocked. Allow it from your browser Site Settings, then reload.'
                      : `${perm.title} is blocked. Allow it from settings, then reload.`}
                  </span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Screen>
  );
};

export default ChildPermissionWizard;
