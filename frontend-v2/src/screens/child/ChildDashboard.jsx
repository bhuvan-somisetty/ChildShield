import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, MapPin, Clock, Plus, Siren, Sparkles, Trophy, Heart, ChevronRight } from 'lucide-react';
import { CHILD, PARENT, fmtMins } from '../../data/childDemo';

const ChildDashboard = () => {
  const [sos, setSos] = useState(false);
  const C = 2 * Math.PI * 52;
  const pct = Math.min(100, Math.round((CHILD.screenTime.today / CHILD.screenTime.limitMins) * 100));
  const left = Math.max(0, CHILD.screenTime.limitMins - CHILD.screenTime.today);

  return (
    <div className="relative ag-min-h-screen w-full flex flex-col items-center overflow-hidden" style={{ background: 'var(--ag-bg)' }}>
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#06120f] via-[#030307] to-[#02030a]" />
        <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[120vw] max-w-[620px] aspect-square rounded-full blur-[130px] opacity-20" style={{ background: 'radial-gradient(circle,#10b981 0%,transparent 60%)' }} />
      </div>

      <div className="relative z-10 w-full max-w-[440px] flex-1 overflow-y-auto ag-no-scrollbar flex flex-col gap-5"
        style={{ paddingTop: 'calc(var(--ag-space-6) + var(--ag-safe-top))', paddingLeft: 'var(--ag-space-5)', paddingRight: 'var(--ag-space-5)', paddingBottom: 'calc(var(--ag-space-8) + var(--ag-safe-bottom))' }}>

        {/* Greeting */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-500 text-[13px] font-bold">Good afternoon</p>
            <h1 className="text-[24px] font-black text-white tracking-tight leading-tight">Hi, {CHILD.name} {CHILD.emoji}</h1>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 text-[11px] font-black"><ShieldCheck size={13} /> PROTECTED</span>
        </div>

        {/* Protected status card */}
        <div className="relative overflow-hidden rounded-[26px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-5">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="relative flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center"><ShieldCheck size={24} className="text-emerald-400" /></div>
            <div className="flex-1">
              <p className="text-white font-black text-[16px]">You’re protected by AlphaGuard</p>
              <p className="text-slate-400 text-[12.5px] font-semibold mt-0.5">Connected to {PARENT.name} · Mom</p>
            </div>
          </div>
          <div className="relative flex items-center gap-2 mt-4 text-[12px] text-slate-400 font-semibold"><MapPin size={13} className="text-emerald-400" /> Location sharing is on with your family</div>
        </div>

        {/* Screen time ring */}
        <div className="rounded-[26px] border border-white/[0.08] bg-[#0b0c14] p-5 flex items-center gap-5">
          <div className="relative w-[120px] h-[120px] flex-shrink-0">
            <svg width="120" height="120" className="-rotate-90">
              <circle cx="60" cy="60" r="52" stroke="rgba(255,255,255,0.07)" strokeWidth="10" fill="none" />
              <motion.circle cx="60" cy="60" r="52" stroke="#06b6d4" strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - pct / 100) }} transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-white font-black text-[22px] leading-none">{fmtMins(left)}</span><span className="text-slate-500 text-[10px] font-bold uppercase mt-0.5">left today</span></div>
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wide flex items-center gap-1.5"><Clock size={13} className="text-cyan-400" /> Screen time</p>
            <p className="text-white font-black text-[17px] mt-1">{fmtMins(CHILD.screenTime.today)} <span className="text-slate-500 text-[13px]">of {fmtMins(CHILD.screenTime.limitMins)}</span></p>
            <button className="ag-tap mt-3 inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full bg-cyan-500/15 border border-cyan-400/25 text-cyan-300 font-bold text-[12.5px]"><Plus size={14} /> Request more time</button>
          </div>
        </div>

        {/* SOS */}
        <button onMouseDown={() => setSos(true)} onMouseUp={() => setSos(false)} onMouseLeave={() => setSos(false)}
          className="ag-tap relative w-full overflow-hidden rounded-[24px] border border-rose-500/30 bg-gradient-to-r from-rose-600/20 to-red-600/10 p-5 flex items-center gap-4">
          <div className="relative">
            <motion.div className="absolute -inset-2 rounded-full bg-rose-500/30 blur-md" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.8 }} />
            <div className="relative w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center"><Siren size={24} className="text-rose-400" /></div>
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-black text-[16px]">Emergency SOS</p>
            <p className="text-rose-200/70 text-[12.5px] font-semibold">{sos ? 'Sending alert to your family…' : 'Hold to alert your family instantly'}</p>
          </div>
        </button>

        {/* Focus mode */}
        <div className="rounded-[24px] border border-white/[0.08] bg-[#0b0c14] p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-violet-500/15 border border-violet-400/30 flex items-center justify-center"><Sparkles size={20} className="text-violet-400" /></div>
              <div><p className="text-white font-black text-[15px]">Focus Mode</p><p className="text-slate-500 text-[12px] font-semibold">Earn points by staying focused</p></div>
            </div>
            <span className="flex items-center gap-1 text-amber-400 font-black text-[13px]"><Trophy size={15} /> 240</span>
          </div>
          <button className="ag-tap w-full mt-4 h-[50px] rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-extrabold text-[14px]">Start a 25-min session</button>
        </div>

        {/* Message from family */}
        <div className="flex items-center gap-3 rounded-[22px] border border-white/[0.07] bg-[#0b0c14] p-4">
          <div className="w-10 h-10 rounded-full bg-pink-500/15 border border-pink-400/30 flex items-center justify-center"><Heart size={18} className="text-pink-400" /></div>
          <div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px]">Message from Mom</p><p className="text-slate-400 text-[12.5px] font-semibold truncate">“Love you! Have a great day 💙”</p></div>
          <ChevronRight size={18} className="text-slate-600" />
        </div>
      </div>
    </div>
  );
};

export default ChildDashboard;
