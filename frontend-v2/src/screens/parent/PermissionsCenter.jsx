import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, MapPin, Bell, Fingerprint, Navigation, BatteryCharging, Crosshair,
  ShieldCheck, AlertTriangle, Info,
} from 'lucide-react';
import {
  getPerms, setPerms, requestLocation, requestNotifications, healthScore, PERM_KEYS,
} from '../../lib/permissions';

const Page = ({ title, sub, children }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>
        <div className="flex-1 min-w-0"><h1 className="text-[22px] font-black text-white tracking-tight leading-tight">{title}</h1>{sub && <p className="text-slate-500 text-[13px] font-semibold mt-0.5">{sub}</p>}</div>
      </div>
      {children}
    </div>
  );
};
const Card = ({ children, className = '' }) => <div className={`rounded-[22px] border border-white/[0.07] bg-[#0b0c14] ${className}`}>{children}</div>;

const StatusPill = ({ s }) => s === 'granted'
  ? <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">ENABLED</span>
  : s === 'denied' ? <span className="text-[10px] font-black px-2 py-1 rounded-full bg-rose-500/15 text-rose-400">DISABLED</span>
  : <span className="text-[10px] font-black px-2 py-1 rounded-full bg-white/[0.06] text-slate-400">NOT SET</span>;

const PermissionsCenter = () => {
  const [perms, setP] = useState(getPerms);
  const [busy, setBusy] = useState('');
  const refresh = () => setP(getPerms());

  const doLocation = async () => { setBusy('location'); await requestLocation(); refresh(); setBusy(''); };
  const doNotifications = async () => { setBusy('notifications'); await requestNotifications(); refresh(); setBusy(''); };
  const toggle = (key) => { setPerms({ [key]: perms[key] === 'granted' ? 'denied' : 'granted' }); refresh(); };

  const score = healthScore(perms);
  const total = PERM_KEYS.length;
  const pct = Math.round((score / total) * 100);

  const ROWS = [
    { key: 'location', icon: MapPin, a: '#06b6d4', label: 'Location Permission', sub: 'Distance, directions & radar', action: doLocation },
    { key: 'notifications', icon: Bell, a: '#f59e0b', label: 'Notification Permission', sub: 'SOS, safe zone & device alerts', action: doNotifications },
    { key: 'biometric', icon: Fingerprint, a: '#a855f7', label: 'Biometric Permission', sub: 'Face ID / Fingerprint login', action: () => toggle('biometric') },
    { key: 'background', icon: Navigation, a: '#3b82f6', label: 'Background Location', sub: 'Track while app is closed', action: () => toggle('background') },
    { key: 'battery', icon: BatteryCharging, a: '#10b981', label: 'Battery Optimization', sub: 'Keep monitoring reliable', action: () => toggle('battery') },
    { key: 'accuracy', icon: Crosshair, a: '#ec4899', label: 'Location Accuracy', sub: 'High-precision positioning', action: () => toggle('accuracy') },
  ];

  const ring = 2 * Math.PI * 30;
  return (
    <Page title="Permissions" sub={`${score}/${total} permissions enabled`}>
      {/* Prominent disclosure (Play Families / App Store requirement) */}
      <button onClick={() => navigate('/app/settings/legal/permissions-disclosure')} className="ag-tap w-full flex items-start gap-2.5 p-4 rounded-[22px] border border-cyan-500/15 bg-cyan-500/[0.05] text-left">
        <Info size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
        <p className="flex-1 text-[12px] text-slate-400 leading-relaxed font-medium">AlphaGuard requests location, camera, microphone, and background access only to deliver safety features — camera, mic and screen are used only during sessions your child accepts and sees. <span className="text-cyan-300 font-bold">Read the full Permission Disclosure →</span></p>
      </button>
      {/* Health score */}
      <Card className="p-5 flex items-center gap-5">
        <div className="relative w-[78px] h-[78px] flex-shrink-0">
          <svg width="78" height="78" className="-rotate-90">
            <circle cx="39" cy="39" r="30" stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" />
            <motion.circle cx="39" cy="39" r="30" stroke={pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'} strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={ring} initial={{ strokeDashoffset: ring }} animate={{ strokeDashoffset: ring * (1 - score / total) }} transition={{ duration: 1 }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-white font-black text-[18px] leading-none">{score}/{total}</span></div>
        </div>
        <div className="flex-1">
          <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wide">Permission Health</p>
          <p className="font-black text-[17px] mt-0.5" style={{ color: pct >= 80 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444' }}>{pct >= 80 ? 'Excellent' : pct >= 50 ? 'Needs attention' : 'Action required'}</p>
          <p className="text-slate-500 text-[12px] font-semibold mt-0.5">{total - score} permission{total - score === 1 ? '' : 's'} disabled</p>
        </div>
      </Card>

      <Card className="divide-y divide-white/[0.05]">
        {ROWS.map((r) => { const s = perms[r.key]; return (
          <div key={r.key} className="flex items-center gap-3.5 p-4">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${r.a}1f` }}><r.icon size={18} style={{ color: r.a }} /></div>
            <div className="flex-1 min-w-0"><p className="text-white font-bold text-[14px]">{r.label}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{r.sub}</p></div>
            {s === 'granted'
              ? <StatusPill s={s} />
              : <button onClick={r.action} disabled={busy === r.key} className="ag-tap text-[12px] font-bold px-3 h-8 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 disabled:opacity-50">{busy === r.key ? '…' : 'Enable'}</button>}
          </div>
        ); })}
      </Card>

      {/* Family Radar dependency note */}
      <Card className={`flex items-start gap-2.5 p-4 ${perms.location === 'granted' ? 'border-cyan-500/15 bg-cyan-500/[0.05]' : 'border-amber-500/25 bg-amber-500/[0.05]'}`}>
        {perms.location === 'granted' ? <ShieldCheck size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" /> : <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />}
        <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
          {perms.location === 'granted'
            ? 'Location is enabled — Family Radar, distance, directions, emergency routing, and nearby police & hospitals are fully active.'
            : 'Location is off. Family Radar, distance, directions, emergency routing, and nearby police & hospitals are limited until you enable it.'}
        </p>
      </Card>
    </Page>
  );
};

export default PermissionsCenter;
