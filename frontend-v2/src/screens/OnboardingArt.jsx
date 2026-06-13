import React from 'react';
import { motion } from 'framer-motion';
import { Home, GraduationCap, Lock, Smartphone, Siren, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1];

/** Shared frame: fixed-height stage with a soft accent glow behind the art. */
const Frame = ({ accent, children }) => (
  <div className="relative w-full flex items-center justify-center" style={{ height: 210 }}>
    <div className="absolute w-56 h-56 rounded-full blur-[72px] opacity-[0.28]" style={{ background: accent }} />
    {children}
  </div>
);

/* ── Slide 1 · Real-time location ─────────────────────────────────────────── */
export const LocationArt = ({ accent }) => (
  <Frame accent={accent}>
    <div className="relative w-[232px] h-[186px] rounded-[28px] bg-white/[0.04] border border-white/10 backdrop-blur-xl overflow-hidden shadow-[0_22px_60px_rgba(0,0,0,0.55)]">
      <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '26px 26px' }} />
      <svg className="absolute inset-0" width="232" height="186"><path d="M48 56 C 92 86, 140 76, 178 132" stroke={accent} strokeWidth="2.5" fill="none" strokeDasharray="5 7" opacity="0.7" /></svg>
      <div className="absolute" style={{ left: 32, top: 40 }}>
        <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/40 flex items-center justify-center"><Home size={16} className="text-blue-300" /></div>
      </div>
      <div className="absolute" style={{ right: 28, bottom: 26 }}>
        <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-400/40 flex items-center justify-center"><GraduationCap size={16} className="text-violet-300" /></div>
      </div>
      <div className="absolute" style={{ left: 104, top: 78 }}>
        <motion.div className="absolute -inset-7 rounded-full border" style={{ borderColor: accent }} animate={{ scale: [1, 1.9], opacity: [0.55, 0] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeOut' }} />
        <div className="w-4 h-4 rounded-full" style={{ background: accent, boxShadow: `0 0 16px ${accent}` }} />
      </div>
    </div>
  </Frame>
);

/* ── Slide 2 · Device management ──────────────────────────────────────────── */
export const DeviceArt = ({ accent }) => {
  const C = 2 * Math.PI * 26;
  return (
    <Frame accent={accent}>
      <div className="relative w-[118px] h-[200px] rounded-[26px] bg-[#0b0c14] border border-white/12 shadow-[0_22px_60px_rgba(0,0,0,0.6)] flex flex-col items-center pt-3">
        <div className="w-10 h-1.5 rounded-full bg-white/15 mb-3" />
        <div className="relative w-16 h-16 mb-3">
          <svg width="64" height="64" className="-rotate-90">
            <circle cx="32" cy="32" r="26" stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
            <motion.circle cx="32" cy="32" r="26" stroke={accent} strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * 0.34 }} transition={{ duration: 1.4, ease: EASE }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center"><Smartphone size={18} className="text-white/80" /></div>
        </div>
        <div className="flex items-end gap-1.5 h-10">
          {[0.5, 0.8, 0.4, 0.95, 0.6].map((h, idx) => (
            <motion.div key={idx} className="w-2.5 rounded-full" style={{ background: idx === 3 ? accent : 'rgba(255,255,255,0.18)' }} initial={{ height: 4 }} animate={{ height: 40 * h }} transition={{ delay: 0.25 + idx * 0.08, duration: 0.5, ease: EASE }} />
          ))}
        </div>
      </div>
      <motion.div className="absolute" style={{ right: 64, top: 34 }} animate={{ y: [0, -6, 0] }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}>
        <div className="w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/12 backdrop-blur-xl flex items-center justify-center"><Lock size={16} style={{ color: accent }} /></div>
      </motion.div>
    </Frame>
  );
};

/* ── Slide 3 · Emergency SOS ──────────────────────────────────────────────── */
export const SosArt = ({ accent }) => (
  <Frame accent={accent}>
    {[0, 1, 2].map((i) => (
      <motion.div key={i} className="absolute rounded-full border-2" style={{ width: 92, height: 92, borderColor: accent }} animate={{ scale: [1, 2.4], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 2.6, delay: i * 0.7, ease: 'easeOut' }} />
    ))}
    <div className="relative w-[90px] h-[90px] rounded-full flex items-center justify-center" style={{ background: `${accent}26`, border: `1px solid ${accent}66`, boxShadow: `0 0 50px ${accent}66` }}>
      <Siren size={36} style={{ color: accent }} />
    </div>
    <div className="absolute bottom-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: accent }}>Live beacon</div>
  </Frame>
);

/* ── Slide 4 · AI monitoring ──────────────────────────────────────────────── */
export const AiArt = ({ accent }) => (
  <Frame accent={accent}>
    <motion.div className="absolute w-48 h-48 rounded-full border" style={{ borderColor: `${accent}3a` }} animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 20, ease: 'linear' }} />
    <div className="relative w-[152px] h-[158px] rounded-[26px] bg-white/[0.04] border border-white/10 backdrop-blur-xl p-4 flex flex-col justify-between shadow-[0_22px_60px_rgba(0,0,0,0.55)]">
      <div className="flex items-center justify-between">
        <ShieldCheck size={26} style={{ color: accent }} />
        <motion.div className="w-2.5 h-2.5 rounded-full bg-emerald-400" animate={{ opacity: [1, 0.3, 1] }} transition={{ repeat: Infinity, duration: 1.6 }} />
      </div>
      <svg width="120" height="46" viewBox="0 0 120 46">
        <motion.path d="M2 38 L24 30 L44 34 L64 16 L84 24 L118 6" fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: EASE }} />
      </svg>
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400"><Sparkles size={11} style={{ color: accent }} /> Safety insight</div>
    </div>
  </Frame>
);

/* ── Slide 5 · Privacy & trust ────────────────────────────────────────────── */
export const PrivacyArt = ({ accent }) => (
  <Frame accent={accent}>
    <motion.div className="absolute rounded-[30px] bg-white/[0.03] border border-white/[0.08]" style={{ width: 132, height: 162, x: -22 }} animate={{ rotate: [-9, -7, -9] }} transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }} />
    <motion.div className="absolute rounded-[30px] bg-white/[0.04] border border-white/10" style={{ width: 132, height: 162, x: 22 }} animate={{ rotate: [9, 7, 9] }} transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }} />
    <div className="relative w-[140px] h-[166px] rounded-[30px] bg-[#0b0c14] border border-white/12 flex flex-col items-center justify-center gap-4 shadow-[0_22px_60px_rgba(0,0,0,0.55)]">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `${accent}1f`, border: `1px solid ${accent}44`, boxShadow: `0 0 40px ${accent}44` }}>
          <ShieldCheck size={30} style={{ color: accent }} />
        </div>
        <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#0b0c14] border border-white/12 flex items-center justify-center"><Lock size={13} style={{ color: accent }} /></div>
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-emerald-400"><CheckCircle2 size={12} /> Encrypted</div>
    </div>
  </Frame>
);
