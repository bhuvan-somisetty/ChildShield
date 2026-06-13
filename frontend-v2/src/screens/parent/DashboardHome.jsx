import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MapPin, Grid3x3, Monitor, Sparkles, FileText, Camera, ShieldCheck, BatteryMedium, ChevronRight, Bell } from 'lucide-react';
import { CHILD, ACTIVITY, fmtMins } from '../../data/childDemo';

const ACTIONS = [
  { label: 'Live Location', icon: MapPin, to: '/app/location', accent: '#06b6d4' },
  { label: 'App Controls', icon: Grid3x3, to: '/app/apps', accent: '#3b82f6' },
  { label: 'Screen View', icon: Monitor, to: '/app/screen-view', accent: '#a855f7' },
  { label: 'AI Insights', icon: Sparkles, to: '/app/ai', accent: '#f59e0b' },
  { label: 'Reports', icon: FileText, to: '/app/reports', accent: '#10b981' },
  { label: 'Camera', icon: Camera, to: '/app/camera', accent: '#ef4444' },
];

const ringPct = Math.min(100, Math.round((CHILD.screenTime.today / CHILD.screenTime.limitMins) * 100));

const DashboardHome = () => {
  const navigate = useNavigate();
  const C = 2 * Math.PI * 34;

  return (
    <div className="flex flex-col gap-5">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-[13px] font-bold">Good afternoon</p>
          <h1 className="text-[24px] font-black text-white tracking-tight leading-tight">Jane’s Family</h1>
        </div>
        <button onClick={() => navigate('/app/notifications')} className="ag-tap relative w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
          <Bell size={20} className="text-slate-300" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-rose-500" />
        </button>
      </div>

      {/* Child status card */}
      <div className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent p-5">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-3xl">{CHILD.emoji}</div>
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-400 border-[3px] border-[#0b0c14]" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black text-[19px] leading-tight">{CHILD.name}, {CHILD.age}</h2>
            <p className="text-emerald-400 text-[12.5px] font-bold mt-0.5">● Online · {CHILD.device}</p>
            <div className="flex items-center gap-1.5 mt-1.5 text-slate-400 text-[12px] font-semibold"><MapPin size={12} className="text-cyan-400" /> {CHILD.location.area}</div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-emerald-400 text-[12px] font-black"><BatteryMedium size={15} /> {CHILD.battery}%</div>
          </div>
        </div>

        {/* Screen-time ring */}
        <div className="relative mt-5 flex items-center gap-4 rounded-2xl bg-black/20 border border-white/[0.06] p-4">
          <div className="relative w-[76px] h-[76px] flex-shrink-0">
            <svg width="76" height="76" className="-rotate-90">
              <circle cx="38" cy="38" r="34" stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" />
              <motion.circle cx="38" cy="38" r="34" stroke="#06b6d4" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={C} initial={{ strokeDashoffset: C }} animate={{ strokeDashoffset: C * (1 - ringPct / 100) }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-white font-black text-[15px] leading-none">{ringPct}%</span></div>
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wide">Screen time today</p>
            <p className="text-white font-black text-[18px] mt-0.5">{fmtMins(CHILD.screenTime.today)} <span className="text-slate-500 text-[13px] font-bold">/ {fmtMins(CHILD.screenTime.limitMins)}</span></p>
            <p className="text-cyan-400 text-[11.5px] font-bold mt-0.5">On track · {fmtMins(CHILD.screenTime.limitMins - CHILD.screenTime.today)} left</p>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-3 px-1">Quick Actions</h3>
        <div className="grid grid-cols-3 gap-3">
          {ACTIONS.map((a) => (
            <button key={a.label} onClick={() => navigate(a.to)} className="ag-tap flex flex-col items-center gap-2.5 py-4 rounded-3xl border border-white/[0.07] bg-[#0b0c14]">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${a.accent}1f`, border: `1px solid ${a.accent}3a` }}><a.icon size={20} style={{ color: a.accent }} /></div>
              <span className="text-[11px] font-bold text-slate-300 text-center leading-tight">{a.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.14em]">Recent Activity</h3>
          <button onClick={() => navigate('/app/activity')} className="ag-tap flex items-center gap-0.5 text-cyan-400 text-[12px] font-bold">View all <ChevronRight size={14} /></button>
        </div>
        <div className="rounded-[22px] border border-white/[0.07] bg-[#0b0c14] divide-y divide-white/[0.05]">
          {ACTIVITY.slice(0, 3).map((a) => (
            <div key={a.id} className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${a.accent}1f` }}><ShieldCheck size={16} style={{ color: a.accent }} /></div>
              <div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px] truncate">{a.title}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{a.sub}</p></div>
              <span className="text-slate-600 text-[11px] font-bold flex-shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
