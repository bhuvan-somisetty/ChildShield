import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck, BatteryMedium, BatteryCharging, Wifi, Siren, Phone, MessageCircle, Sparkles, Target, Settings, MapPin, ChevronRight,
} from 'lucide-react';
import { useChildApp } from '../../../child/ChildAppContext';
import { Card } from './ui';

const SECTIONS = [
  { label: 'SOS', icon: Siren, to: '/child/app/sos', a: '#ef4444' },
  { label: 'Contacts', icon: Phone, to: '/child/app/contacts', a: '#10b981' },
  { label: 'Chat', icon: MessageCircle, to: '/child/app/chat', a: '#06b6d4' },
  { label: 'DISHA', icon: Sparkles, to: '/child/app/disha', a: '#a855f7' },
  { label: 'Goals', icon: Target, to: '/child/app/goals', a: '#f59e0b' },
  { label: 'Settings', icon: Settings, to: '/child/app/settings', a: '#64748b' },
];

const hour = new Date().getHours();
const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

const ChildHome = () => {
  const navigate = useNavigate();
  const { profile, tel, goals } = useChildApp();
  const Bat = tel.battery.charging ? BatteryCharging : BatteryMedium;
  const doneGoals = goals.filter((g) => g.done).length;

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-[13px] font-bold">{greeting}</p>
          <h1 className="text-[24px] font-black text-white tracking-tight leading-tight">Hi, {profile.name} {profile.emoji}</h1>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-400/25 text-emerald-400 text-[11px] font-black"><ShieldCheck size={13} /> PROTECTED</span>
      </div>

      {/* Identity + status card */}
      <div className="relative overflow-hidden rounded-[26px] border border-emerald-500/20 bg-gradient-to-br from-emerald-500/[0.08] to-transparent p-5">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="relative flex items-center gap-3.5">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl" style={{ background: `${profile.color}26`, border: `1px solid ${profile.color}55` }}>{profile.emoji}</div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-black text-[18px] leading-tight">{profile.name}, {profile.age}</p>
            <p className="text-slate-400 text-[12.5px] font-semibold truncate">{profile.grade} · {profile.school}</p>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-2 mt-4">
          {[
            { icon: Bat, label: `${tel.battery.level}%`, sub: tel.battery.charging ? 'Charging' : 'Battery', c: tel.battery.charging ? '#10b981' : '#22d3ee' },
            { icon: Wifi, label: tel.network, sub: 'Network', c: '#22d3ee' },
            { icon: ShieldCheck, label: 'Safe', sub: 'Status', c: '#10b981' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl bg-black/20 border border-white/[0.06] p-3 text-center">
              <s.icon size={16} className="mx-auto mb-1" style={{ color: s.c }} />
              <p className="text-white font-black text-[13px] leading-none truncate">{s.label}</p>
              <p className="text-slate-500 text-[10px] font-bold mt-1 truncate">{s.sub}</p>
            </div>
          ))}
        </div>
        <div className="relative flex items-center gap-2 mt-4 text-[12px] text-slate-400 font-semibold"><MapPin size={13} className="text-emerald-400" /> Location is shared with {profile.parentName}</div>
      </div>

      {/* Big SOS */}
      <button onClick={() => navigate('/child/app/sos')} className="ag-tap relative w-full overflow-hidden rounded-[24px] border border-rose-500/30 bg-gradient-to-r from-rose-600/20 to-red-600/10 p-5 flex items-center gap-4">
        <div className="relative">
          <motion.div className="absolute -inset-2 rounded-full bg-rose-500/30 blur-md" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.8 }} />
          <div className="relative w-12 h-12 rounded-full bg-rose-500/20 border border-rose-400/40 flex items-center justify-center"><Siren size={24} className="text-rose-400" /></div>
        </div>
        <div className="flex-1 text-left"><p className="text-white font-black text-[16px]">Emergency SOS</p><p className="text-rose-200/70 text-[12.5px] font-semibold">Tap if you need help right now</p></div>
        <ChevronRight size={20} className="text-rose-300/60" />
      </button>

      {/* Section grid */}
      <div>
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-1 mb-2.5">My AlphaGuard</p>
        <div className="grid grid-cols-3 gap-2.5">
          {SECTIONS.map((s) => (
            <button key={s.label} onClick={() => navigate(s.to)} aria-label={s.label} className="ag-tap flex flex-col items-center gap-2 py-4 rounded-2xl border border-white/[0.07] bg-[#0b0c14]">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${s.a}1f`, border: `1px solid ${s.a}3a` }}><s.icon size={19} style={{ color: s.a }} /></div>
              <span className="text-[11px] font-bold text-slate-300">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Goals snapshot */}
      <Card className="flex items-center gap-3.5 p-4">
        <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center"><Target size={20} className="text-amber-400" /></div>
        <div className="flex-1 min-w-0"><p className="text-white font-bold text-[14px]">Study goals</p><p className="text-slate-500 text-[12px] font-semibold">{doneGoals} of {goals.length} done today</p></div>
        <button onClick={() => navigate('/child/app/goals')} className="ag-tap text-emerald-400 text-[12.5px] font-bold flex items-center gap-0.5">Open <ChevronRight size={15} /></button>
      </Card>
    </div>
  );
};

export default ChildHome;
