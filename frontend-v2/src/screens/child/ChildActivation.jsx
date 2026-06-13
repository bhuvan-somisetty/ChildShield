import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin, Bell, Camera, Mic, Monitor, Accessibility, BarChart3, Layers, RefreshCw,
  Check, ShieldCheck, ArrowRight, Loader2,
} from 'lucide-react';
import { Screen, Button } from '../../components/ui';
import { CHILD, PARENT } from '../../data/childDemo';

const PERMISSIONS = [
  { id: 'location', name: 'Location Access', purpose: 'Live location, safe zones, emergency tracking', icon: MapPin, accent: '#06b6d4' },
  { id: 'notifications', name: 'Notifications Access', purpose: 'Safety alerts and monitoring events', icon: Bell, accent: '#f59e0b' },
  { id: 'camera', name: 'Camera Access', purpose: 'Emergency camera and safety verification', icon: Camera, accent: '#ef4444' },
  { id: 'microphone', name: 'Microphone Access', purpose: 'Emergency audio and voice safety', icon: Mic, accent: '#a855f7' },
  { id: 'screen', name: 'Screen Monitoring', purpose: 'Screen activity protection and AI analysis', icon: Monitor, accent: '#3b82f6' },
  { id: 'accessibility', name: 'Accessibility Service', purpose: 'App protection, lock features, usage monitoring', icon: Accessibility, accent: '#10b981' },
  { id: 'usage', name: 'Usage Access', purpose: 'App usage analytics and screen-time reports', icon: BarChart3, accent: '#8b5cf6' },
  { id: 'overlay', name: 'Overlay Permission', purpose: 'Safety alerts, lock screens, notifications', icon: Layers, accent: '#06b6d4' },
  { id: 'background', name: 'Background Activity', purpose: 'Continuous protection and location updates', icon: RefreshCw, accent: '#22c55e' },
];

const FEATURES = ['Live Location', 'Safe Zones', 'App Monitoring', 'Usage Analytics', 'Screen Monitoring', 'AI Safety Insights', 'Emergency Protection'];

const ChildActivation = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const allPreset = params.get('all') === '1';

  const [enabled, setEnabled] = useState(() => {
    const init = {};
    PERMISSIONS.forEach((p) => { init[p.id] = allPreset; });
    return init;
  });
  const [opening, setOpening] = useState(null);
  const [stage, setStage] = useState(params.get('stage') || 'permissions'); // permissions | complete | final

  const count = Object.values(enabled).filter(Boolean).length;
  const all = count === PERMISSIONS.length;
  const pct = Math.round((count / PERMISSIONS.length) * 100);

  const enable = (id) => {
    if (enabled[id] || opening) return;
    setOpening(id); // simulate opening the OS permission screen
    setTimeout(() => { setEnabled((e) => ({ ...e, [id]: true })); setOpening(null); }, 650);
  };

  /* ── Completion state ─────────────────────────────────────────────────── */
  if (stage === 'complete') {
    return (
      <Screen align="between" glow="#10b981" footer={<Button iconRight={ArrowRight} onClick={() => setStage('final')}>Continue</Button>}>
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col items-center text-center pt-4 mb-7">
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }}
              className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)] mb-6">
              <ShieldCheck size={40} className="text-emerald-400" />
            </motion.div>
            <h1 className="text-[25px] font-black text-white tracking-tight">Protection Setup Complete</h1>
            <p className="text-slate-400 text-[14px] font-medium mt-2.5 max-w-[300px] leading-relaxed">All required permissions are enabled. Your device is now protected by AlphaGuard AI.</p>
          </div>
          <div className="rounded-[22px] border border-white/[0.08] bg-[#0b0c14] divide-y divide-white/[0.05]">
            {PERMISSIONS.map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className="flex items-center gap-3 px-4 py-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0"><Check size={12} className="text-[#030307]" strokeWidth={3.5} /></span>
                <span className="text-white font-semibold text-[13.5px]">{p.name.replace(' Access', '').replace(' Permission', '').replace(' Service', '')} Enabled</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Screen>
    );
  }

  /* ── Final success ────────────────────────────────────────────────────── */
  if (stage === 'final') {
    return (
      <Screen align="between" glow="#10b981" footer={<Button iconRight={ArrowRight} onClick={() => navigate('/child/dashboard')}>Enter Child Dashboard</Button>}>
        <div className="flex-1 flex flex-col">
          <div className="flex flex-col items-center text-center pt-4 mb-6">
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }} className="relative mb-6">
              <div className="absolute -inset-2 rounded-full bg-emerald-500/20 blur-xl" />
              <div className="relative w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_50px_rgba(16,185,129,0.4)]"><ShieldCheck size={40} className="text-emerald-400" /></div>
            </motion.div>
            <h1 className="text-[24px] font-black text-white tracking-tight max-w-[300px] leading-tight">AlphaGuard Protection Activated</h1>
            <p className="text-slate-400 text-[14px] font-medium mt-2.5 max-w-[300px] leading-relaxed">Your device is now connected and protected. The parent account can access approved monitoring and safety features.</p>
          </div>

          <div className="flex items-center justify-between rounded-2xl border border-white/[0.08] bg-[#0b0c14] p-4 mb-4">
            <div className="text-center flex-1"><div className="w-10 h-10 mx-auto rounded-full bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-white font-black mb-1.5">{PARENT.name[0]}</div><p className="text-white text-[12px] font-bold">{PARENT.name}</p><p className="text-slate-500 text-[10px] font-semibold">Parent</p></div>
            <div className="flex flex-col items-center px-2"><div className="w-8 h-px bg-emerald-400/40" /><span className="text-emerald-400 text-[9px] font-black mt-1">LINKED</span></div>
            <div className="text-center flex-1"><div className="w-10 h-10 mx-auto rounded-full bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-lg mb-1.5">{CHILD.emoji}</div><p className="text-white text-[12px] font-bold">{CHILD.name}</p><p className="text-slate-500 text-[10px] font-semibold">Protected</p></div>
          </div>

          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.14em] px-1 mb-2.5">Features Activated</p>
          <div className="grid grid-cols-2 gap-2.5">
            {FEATURES.map((feat, i) => (
              <motion.div key={feat} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-[#0b0c14] px-3 py-2.5">
                <Check size={14} className="text-emerald-400 flex-shrink-0" strokeWidth={3} />
                <span className="text-slate-200 font-semibold text-[12px] leading-tight">{feat}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </Screen>
    );
  }

  /* ── Permission configuration ─────────────────────────────────────────── */
  return (
    <Screen align="between" glow="#06b6d4"
      footer={
        <>
          <Button iconRight={ArrowRight} disabled={!all} onClick={() => setStage('complete')}>Activate Protection</Button>
          {!all && <p className="text-center text-slate-500 text-[12px] font-semibold mt-3">Complete all required permissions to activate protection.</p>}
        </>
      }>
      <div className="w-full flex flex-col">
        {/* Header + progress */}
        <div className="flex flex-col items-center text-center pt-2 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mb-4"><ShieldCheck size={26} className="text-cyan-300" /></div>
          <h1 className="text-[23px] font-black text-white tracking-tight leading-tight max-w-[300px]">Activate AlphaGuard Protection</h1>
          <p className="text-slate-500 text-[13.5px] font-semibold mt-2.5 max-w-[300px] leading-relaxed">Grant the required permissions to enable monitoring, safety features, and protection services.</p>
        </div>

        <div className="mb-5">
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[12px] font-black text-white">{count} / {PERMISSIONS.length} Permissions Enabled</span>
            <span className="text-[12px] font-bold text-cyan-400">{pct}%</span>
          </div>
          <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400" animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 200, damping: 26 }} />
          </div>
        </div>

        {/* Permission cards */}
        <div className="flex flex-col gap-2.5">
          {PERMISSIONS.map((p) => {
            const on = enabled[p.id];
            const busy = opening === p.id;
            return (
              <div key={p.id} className={`flex items-center gap-3 p-3.5 rounded-2xl border ${on ? 'border-emerald-500/25 bg-emerald-500/[0.05]' : 'border-white/[0.07] bg-[#0b0c14]'}`}>
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${p.accent}1f`, border: `1px solid ${p.accent}3a` }}><p.icon size={18} style={{ color: p.accent }} /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-[13.5px] leading-tight">{p.name}</p>
                  <p className="text-slate-500 text-[11.5px] font-semibold mt-0.5 leading-snug">{p.purpose}</p>
                </div>
                {on ? (
                  <motion.span initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="flex items-center gap-1 text-[11px] font-black text-emerald-400 flex-shrink-0">
                    <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={12} className="text-[#030307]" strokeWidth={3.5} /></span> Enabled
                  </motion.span>
                ) : (
                  <button onClick={() => enable(p.id)} disabled={busy} className="ag-tap flex-shrink-0 px-4 h-9 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold text-[12.5px] flex items-center gap-1.5 disabled:opacity-60">
                    {busy ? <><Loader2 size={13} className="animate-spin" /> Opening…</> : 'Enable'}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Screen>
  );
};

export default ChildActivation;
