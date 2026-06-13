import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  KeyRound, Fingerprint, Smartphone, History, Monitor, ShieldCheck, ChevronLeft, ChevronRight, Check,
  Clock, Plus, Minus, Moon, Sun, Gamepad2, MessageCircle, Tv, Phone, GraduationCap, Lock, Unlock,
  MapPin, Search, Crosshair, Bell, Download, Trash2, AlertTriangle, RotateCcw,
} from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useRealtime } from '../../context/RealtimeContext';
import { fmtMins } from '../../data/childDemo';
import { api } from '../../lib/agClient';

/* ── shared ──────────────────────────────────────────────────────────────── */
const Page = ({ title, sub, right, children }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>
        <div className="flex-1 min-w-0"><h1 className="text-[22px] font-black text-white tracking-tight leading-tight">{title}</h1>{sub && <p className="text-slate-500 text-[13px] font-semibold mt-0.5">{sub}</p>}</div>
        {right}
      </div>
      {children}
    </div>
  );
};
const Card = ({ children, className = '' }) => <div className={`rounded-[22px] border border-white/[0.07] bg-[#0b0c14] ${className}`}>{children}</div>;
const Toggle = ({ on, onClick }) => <button onClick={onClick} className={`ag-tap w-12 h-7 rounded-full flex items-center px-0.5 transition-colors ${on ? 'bg-cyan-500/80 justify-end' : 'bg-white/10 justify-start'}`}><span className="w-6 h-6 rounded-full bg-white" /></button>;
const Label = ({ children }) => <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-1">{children}</p>;

/* ── PHASE 2 · Security Center ───────────────────────────────────────────── */
const loadProtection = () => { try { return { uninstall: true, forceStop: true, disableMonitoring: true, tamperAlerts: true, ...JSON.parse(localStorage.getItem('ag_protection') || '{}') }; } catch { return { uninstall: true, forceStop: true, disableMonitoring: true, tamperAlerts: true }; } };

// Change / recover the Security PIN. mode: 'change' | 'reset'.
const PinSheet = ({ mode, onClose }) => {
  const saved = localStorage.getItem('ag_pin') || '';
  const steps = mode === 'reset' ? ['email', 'code', 'new', 'confirm', 'done'] : (saved ? ['current', 'new', 'confirm', 'done'] : ['new', 'confirm', 'done']);
  const [idx, setIdx] = useState(0);
  const step = steps[idx];
  const [vals, setVals] = useState({ current: '', new: '', confirm: '', email: '', code: '' });
  const [err, setErr] = useState('');
  const set = (k, v) => { setErr(''); setVals((s) => ({ ...s, [k]: v })); };
  const TITLES = { current: 'Enter Current PIN', new: 'Enter New PIN', confirm: 'Confirm New PIN', email: 'Verify Your Email', code: 'Enter Verification Code' };
  const isPin = ['current', 'new', 'confirm'].includes(step);
  const key = step;
  const val = vals[key] ?? '';
  const maxLen = 6; // all PINs are 6 digits (matches the server-side Security PIN)
  const canNext = step === 'email' ? vals.email.includes('@') : val.length === 6;
  const next = async () => {
    if (step === 'current' && saved && vals.current !== saved) return setErr('Incorrect PIN');
    if (step === 'confirm') {
      if (vals.new !== vals.confirm) return setErr('PINs don’t match');
      try { await api.setPin(vals.new); } catch { return setErr('Could not update PIN. Please try again.'); }
      localStorage.setItem('ag_pin', vals.new);
    }
    setIdx((i) => i + 1);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 34 }} className="relative z-10 w-full max-w-[440px] bg-[#0b0c14] border border-white/10 rounded-t-[28px] p-6" style={{ paddingBottom: 'calc(1.5rem + var(--ag-safe-bottom))' }}>
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15" />
        {step === 'done' ? (
          <div className="flex flex-col items-center text-center gap-3 py-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center"><Check size={26} className="text-emerald-400" strokeWidth={3} /></div>
            <p className="text-white font-black text-[16px]">Security PIN updated</p>
            <button onClick={onClose} className="ag-tap w-full h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold mt-2">Done</button>
          </div>
        ) : (
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center"><KeyRound size={24} className="text-cyan-400" /></div>
            <p className="text-white font-black text-[16px]">{TITLES[step]}</p>
            {step === 'email' ? (
              <input autoFocus type="email" value={vals.email} onChange={(e) => set('email', e.target.value)} placeholder="parent@family.com" className="w-full h-12 rounded-2xl bg-[#11131d] border border-white/10 px-4 text-[15px] text-white text-center placeholder:text-slate-600 outline-none focus:border-cyan-400/40" />
            ) : (
              <div className="relative w-full" onClick={(e) => e.currentTarget.querySelector('input').focus()}>
                <input autoFocus type="tel" inputMode="numeric" value={val} maxLength={maxLen} onChange={(e) => set(key, e.target.value.replace(/\D/g, '').slice(0, maxLen))} className="absolute inset-0 w-full h-full opacity-0" />
                <div className="flex items-center justify-center gap-2">{Array.from({ length: maxLen }).map((_, i) => (<div key={i} className={`flex items-center justify-center ${maxLen === 6 ? 'w-10' : 'w-11'} h-14 rounded-2xl border-2 text-[20px] font-black text-white ${i < val.length ? 'border-cyan-400/60 bg-cyan-500/[0.06]' : 'border-white/[0.08] bg-[#0b0c14]'}`}>{val[i] ? (isPin ? '•' : val[i]) : ''}</div>))}</div>
              </div>
            )}
            {err && <p className="text-rose-400 text-[12.5px] font-bold">{err}</p>}
            <div className="flex gap-3 w-full mt-1">
              <button onClick={onClose} className="ag-tap flex-1 h-12 rounded-full bg-white/[0.05] border border-white/10 text-white font-bold">Cancel</button>
              <button disabled={!canNext} onClick={next} className="ag-tap flex-1 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold disabled:opacity-50">Continue</button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
export const SecurityCenter = () => {
  const [bio, setBio] = useState(true);
  const [alerts, setAlerts] = useState(false);
  const [pinSheet, setPinSheet] = useState(null); // 'change' | 'reset'
  const [prot, setProt] = useState(loadProtection);
  const toggleProt = (k) => setProt((p) => { const next = { ...p, [k]: !p[k] }; localStorage.setItem('ag_protection', JSON.stringify(next)); return next; });
  const PROT_ROWS = [
    { k: 'uninstall', i: ShieldCheck, t: 'Block Uninstall', s: 'Parent PIN required to remove AlphaGuard' },
    { k: 'forceStop', i: Lock, t: 'Block Force Stop', s: 'Prevent the child stopping the app' },
    { k: 'disableMonitoring', i: Smartphone, t: 'Lock Monitoring', s: 'Only a parent can disable protection' },
    { k: 'tamperAlerts', i: AlertTriangle, t: 'Tamper Alerts', s: 'Notify me on any uninstall attempt' },
  ];
  return (
    <Page title="Security Center" sub="Account protection">
      <Card className="p-4 flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center"><ShieldCheck size={20} className="text-emerald-400" /></div>
        <div className="flex-1"><p className="text-white font-black text-[15px]">Protection: Strong</p><p className="text-emerald-400 text-[12px] font-semibold">PIN + Biometrics active</p></div>
      </Card>

      <Label>Parent Security PIN</Label>
      <Card className="divide-y divide-white/[0.05]">
        {[{ t: 'Change PIN', s: 'Current → new → confirm', i: KeyRound, mode: 'change' }, { t: 'Forgot PIN', s: 'Recover via email verification', i: History, mode: 'reset' }].map((r) => (
          <button key={r.t} onClick={() => setPinSheet(r.mode)} className="ag-tap w-full flex items-center gap-3.5 p-4"><div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center"><r.i size={17} className="text-cyan-400" /></div><div className="flex-1 text-left"><p className="text-white font-bold text-[14px]">{r.t}</p><p className="text-slate-500 text-[12px] font-semibold">{r.s}</p></div><ChevronRight size={17} className="text-slate-600" /></button>
        ))}
      </Card>
      {pinSheet && <PinSheet mode={pinSheet} onClose={() => setPinSheet(null)} />}

      <Label>Login</Label>
      <Card className="flex items-center gap-3 p-4"><Fingerprint size={18} className="text-cyan-400" /><div className="flex-1"><p className="text-white font-bold text-[14px]">Biometric Login</p><p className="text-slate-500 text-[12px] font-semibold">Face ID / Fingerprint</p></div><Toggle on={bio} onClick={() => setBio(!bio)} /></Card>
      <Card className="flex items-center gap-3 p-4"><Bell size={18} className="text-cyan-400" /><div className="flex-1"><p className="text-white font-bold text-[14px]">Login Alerts</p><p className="text-slate-500 text-[12px] font-semibold">Notify on new device sign-in</p></div><Toggle on={alerts} onClick={() => setAlerts(!alerts)} /></Card>

      <Label>Trusted Devices · Active Sessions</Label>
      <Card className="divide-y divide-white/[0.05]">
        {[{ n: 'iPhone 15 Pro', s: 'This device · Austin, TX', now: true }, { n: 'iPad Air', s: 'Last active 2h ago', now: false }, { n: 'Chrome · Mac', s: 'Last active yesterday', now: false }].map((d) => (
          <div key={d.n} className="flex items-center gap-3.5 p-4"><div className="w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center"><Monitor size={16} className="text-slate-300" /></div><div className="flex-1"><p className="text-white font-bold text-[14px]">{d.n}</p><p className="text-slate-500 text-[12px] font-semibold">{d.s}</p></div>{d.now ? <span className="text-[11px] font-black text-emerald-400">ACTIVE</span> : <button className="text-rose-400 text-[12px] font-bold">Revoke</button>}</div>
        ))}
      </Card>

      <Label>AlphaGuard App Protection</Label>
      <Card className="divide-y divide-white/[0.05]">
        {PROT_ROWS.map((r) => (
          <div key={r.k} className="flex items-center gap-3 p-4"><div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center flex-shrink-0"><r.i size={17} className="text-rose-400" /></div><div className="flex-1 min-w-0"><p className="text-white font-bold text-[14px]">{r.t}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{r.s}</p></div><Toggle on={prot[r.k]} onClick={() => toggleProt(r.k)} /></div>
        ))}
      </Card>
      <Card className="flex items-start gap-2.5 p-4 border-amber-500/20 bg-amber-500/[0.05]"><ShieldCheck size={16} className="text-amber-400 flex-shrink-0 mt-0.5" /><p className="text-[12px] text-slate-400 leading-relaxed font-medium">On the child device these protections are enforced via Android Device Admin / Accessibility — uninstall, force-stop and disabling monitoring are blocked without your Security PIN.</p></Card>

      <Card className="flex items-start gap-2.5 p-4 border-cyan-500/15 bg-cyan-500/[0.05]"><ShieldCheck size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" /><p className="text-[12px] text-slate-400 leading-relaxed font-medium">Your PIN is required to delete the account, unpair a child, disable monitoring, or change security settings.</p></Card>
    </Page>
  );
};

/* ── PHASE 3 · Screen Time Control Center ────────────────────────────────── */
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const EXTEND = [{ m: 15, l: '+15 min' }, { m: 30, l: '+30 min' }, { m: 60, l: '+1 hour' }];
const APP_META = { YouTube: '#ef4444', Instagram: '#ec4899', TikTok: '#a855f7', Snapchat: '#eab308', Facebook: '#3b82f6', Games: '#22c55e', Chrome: '#0ea5e9', 'Khan Academy': '#10b981', Roblox: '#16a34a' };
const APP_USED = { YouTube: 52, Instagram: 18, TikTok: 30, Snapchat: 12, Facebook: 8, Games: 44, Chrome: 22, 'Khan Academy': 28, Roblox: 36 };
const APP_CAT = { YouTube: 'Entertainment', Instagram: 'Social', TikTok: 'Social', Snapchat: 'Social', Facebook: 'Social', Games: 'Gaming', Chrome: 'Utility', 'Khan Academy': 'Education', Roblox: 'Gaming' };
const lblMins = (m) => (m === 0 ? 'Unlimited' : m < 60 ? `${m} min` : `${(m / 60).toFixed(m % 60 ? 1 : 0)}h`);

export const ScreenTimeCenter = () => {
  const navigate = useNavigate();
  const { child, setting, updateSetting } = useChild();
  const limit = setting.screenLimit;
  const used = child.screenTime.today;
  const ext = setting.extensions.reduce((t, e) => t + e.mins, 0);
  const unlocked = setting.unlockForToday;
  const eff = unlocked ? Infinity : limit + ext;
  const remaining = unlocked ? Infinity : Math.max(0, eff - used);
  const reached = !unlocked && used >= eff;
  const setLimit = (v) => updateSetting({ screenLimit: Math.max(30, Math.min(720, v)) });
  const grant = (m) => updateSetting({ extensions: [...setting.extensions, { id: Date.now() + Math.random(), mins: m }] });
  const removeExt = (id) => updateSetting({ extensions: setting.extensions.filter((e) => e.id !== id) });
  const setWeek = (i, v) => { const w = [...setting.weeklyLimits]; w[i] = v; updateSetting({ weeklyLimits: w }); };
  const apps = Object.keys(setting.appLimits);

  return (
    <Page title="Screen Time" sub={`${child.name} · ${unlocked ? 'Unlimited' : fmtMins(remaining) + ' left'} today`}>
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-2.5">
        {[{ l: 'Used', v: fmtMins(used), a: '#06b6d4' }, { l: 'Limit', v: unlocked ? '∞' : fmtMins(limit), a: '#3b82f6' }, { l: 'Remaining', v: unlocked ? '∞' : fmtMins(remaining), a: '#10b981' }, { l: 'Extensions', v: ext > 0 ? `+${fmtMins(ext)}` : '—', a: '#a855f7' }, { l: 'Blocked apps', v: `${setting.lockedApps.length}`, a: '#ef4444' }, { l: 'Night', v: setting.night.on ? 'On' : 'Off', a: '#6366f1' }].map((s) => (
          <Card key={s.l} className="p-3"><p className="text-slate-500 text-[10px] font-bold uppercase truncate">{s.l}</p><p className="font-black text-[15px] mt-0.5 truncate" style={{ color: s.a }}>{s.v}</p></Card>
        ))}
      </div>

      {/* Daily limit slider */}
      <Card className="p-5">
        <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wide">Daily Screen Limit</p>
        <p className="text-white font-black text-[30px] mt-1 leading-none">{(limit / 60).toFixed(1)} <span className="text-slate-500 text-[15px] font-bold">hours</span></p>
        <input type="range" min="30" max="480" step="30" value={limit} onChange={(e) => setLimit(+e.target.value)} className="w-full mt-4 accent-cyan-400" />
        <div className="flex justify-between text-[11px] font-bold text-slate-600 mt-1"><span>30m</span><span>4h</span><span>8h</span></div>
      </Card>

      {/* Unlock-for-today toggle / extend */}
      {unlocked ? (
        <Card className="p-4 border-amber-500/30 bg-amber-500/[0.06] flex items-center gap-3">
          <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 flex-shrink-0">UNLOCKED FOR TODAY</span>
          <p className="flex-1 text-slate-400 text-[12px] font-semibold">No limit until midnight.</p>
          <button onClick={() => updateSetting({ unlockForToday: false })} className="ag-tap px-3 h-9 rounded-full bg-white/[0.06] border border-white/10 text-white font-bold text-[12px]">Disable</button>
        </Card>
      ) : (
        <Card className={`p-4 ${reached ? 'border-amber-500/30 bg-amber-500/[0.05]' : ''}`}>
          <div className="flex items-center gap-2 mb-1">{reached ? <AlertTriangle size={16} className="text-amber-400" /> : <Clock size={16} className="text-cyan-400" />}<p className="text-white font-bold text-[14px]">{reached ? 'Daily limit reached' : 'Extend time today'}</p></div>
          <p className="text-slate-500 text-[12px] font-semibold mb-3">{reached ? 'Blocked apps are locked. Educational & emergency apps stay available.' : `${fmtMins(remaining)} remaining of today’s limit.`}</p>
          <div className="grid grid-cols-3 gap-2">{EXTEND.map((x) => (<button key={x.m} onClick={() => grant(x.m)} className="ag-tap h-10 rounded-xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold text-[12.5px]">{x.l}</button>))}</div>
          <button onClick={() => updateSetting({ unlockForToday: true })} className="ag-tap w-full h-10 rounded-xl bg-white/[0.05] border border-white/10 text-white font-bold text-[12.5px] mt-2">Unlock for Today</button>
        </Card>
      )}

      {/* Granted extensions — individually removable */}
      {!unlocked && setting.extensions.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Label>Granted Extensions Today</Label>
          <Card className="divide-y divide-white/[0.05]">{setting.extensions.map((e) => (
            <div key={e.id} className="flex items-center gap-3 p-3.5"><div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center"><Plus size={15} className="text-emerald-400" /></div><span className="flex-1 text-white font-bold text-[14px]">+{fmtMins(e.mins)}</span><button onClick={() => removeExt(e.id)} className="ag-tap px-3.5 h-8 rounded-full bg-rose-500/15 text-rose-300 font-bold text-[12px]">Remove</button></div>
          ))}</Card>
        </div>
      )}

      {/* Weekly schedule — independent draggable sliders */}
      <Label>Weekly Schedule</Label>
      <Card className="p-3 flex flex-col gap-0.5">
        {DAYS.map((d, i) => (
          <div key={d} className="flex items-center gap-3 px-1 py-1.5">
            <span className="w-9 text-slate-400 font-bold text-[12.5px]">{d}</span>
            <input type="range" min="0" max="480" step="30" value={setting.weeklyLimits[i]} onChange={(e) => setWeek(i, +e.target.value)} className="flex-1 accent-cyan-400" />
            <span className="w-11 text-right text-white font-bold text-[12px]">{(setting.weeklyLimits[i] / 60).toFixed(1)}h</span>
          </div>
        ))}
      </Card>

      {/* App-specific limits — usage bar + tap to configure */}
      <Label>App-Specific Limits</Label>
      <Card className="divide-y divide-white/[0.05]">
        {apps.map((n) => { const lim = setting.appLimits[n]; const u = APP_USED[n] || 0; const unl = lim === 0; const pct = unl ? 0 : Math.min(100, (u / lim) * 100); const rem = unl ? 0 : Math.max(0, lim - u); const c = APP_META[n] || '#64748b'; return (
          <button key={n} onClick={() => navigate(`/app/app-config/${encodeURIComponent(n)}`)} className="ag-tap w-full text-left p-3.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-[13px]" style={{ background: c }}>{n[0]}</div>
              <span className="flex-1 text-white font-bold text-[14px]">{n}</span>
              <span className="text-slate-400 font-bold text-[12.5px]">{unl ? 'Unlimited' : `${fmtMins(u)} / ${fmtMins(lim)}`}</span>
              <ChevronRight size={16} className="text-slate-600" />
            </div>
            {!unl && <><div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden mt-2"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? '#ef4444' : c }} /></div><p className="text-slate-600 text-[11px] font-semibold mt-1">{fmtMins(rem)} remaining</p></>}
          </button>
        ); })}
      </Card>

      <Card className="flex items-center gap-3 p-4"><GraduationCap size={18} className="text-emerald-400" /><div className="flex-1"><p className="text-white font-bold text-[14px]">Educational App Exceptions</p><p className="text-slate-500 text-[12px] font-semibold truncate">{setting.eduApps.join(', ')} always allowed</p></div><Toggle on={setting.educationExceptions} onClick={() => updateSetting({ educationExceptions: !setting.educationExceptions })} /></Card>
      <p className="text-slate-500 text-[12px] font-semibold text-center px-4">Device locks automatically when the daily limit is reached.</p>
    </Page>
  );
};

/* ── App Limit Configuration ─────────────────────────────────────────────── */
const STEPS = [15, 30, 45, 60, 90, 120, 180, 0];
export const AppConfig = () => {
  const navigate = useNavigate();
  const { appName } = useParams();
  const name = decodeURIComponent(appName || '');
  const { child, setting, updateSetting } = useChild();
  const lim = setting.appLimits[name] ?? 60;
  const used = APP_USED[name] || 0;
  const c = APP_META[name] || '#64748b';
  const unl = lim === 0;
  const rem = unl ? 0 : Math.max(0, lim - used);
  const pct = unl ? 0 : Math.min(100, (used / lim) * 100);
  const idx = Math.max(0, STEPS.indexOf(lim));
  const restricted = setting.lockedApps.includes(name);
  const edu = setting.eduApps.includes(name);
  const night = setting.nightApps.includes(name);
  const setLim = (v) => updateSetting({ appLimits: { ...setting.appLimits, [name]: v } });
  const toggleIn = (key, arr) => updateSetting({ [key]: arr.includes(name) ? arr.filter((x) => x !== name) : [...arr, name] });

  return (
    <Page title={name} sub={`${child.name} · ${APP_CAT[name] || 'App'}`}>
      <Card className="p-5">
        <div className="flex items-center gap-3.5 mb-4"><div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-[18px]" style={{ background: c }}>{name[0]}</div><div className="flex-1"><p className="text-white font-black text-[16px]">{name}</p><p className="text-slate-500 text-[12px] font-semibold">{APP_CAT[name] || 'App'}</p></div></div>
        <div className="grid grid-cols-3 gap-2 mb-3">{[['Used', fmtMins(used)], ['Limit', unl ? 'Unlimited' : fmtMins(lim)], ['Remaining', unl ? '∞' : fmtMins(rem)]].map(([l, v]) => (<div key={l} className="rounded-xl bg-black/20 border border-white/[0.06] p-2.5 text-center"><p className="text-slate-500 text-[10px] font-bold uppercase">{l}</p><p className="text-white font-black text-[14px] mt-0.5">{v}</p></div>))}</div>
        {!unl && <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden"><div className="h-full rounded-full" style={{ width: `${pct}%`, background: pct >= 90 ? '#ef4444' : c }} /></div>}
      </Card>

      <Card className="p-5">
        <div className="flex items-center justify-between mb-3"><p className="text-white font-bold text-[14px]">Daily Limit</p><span className="text-cyan-400 font-black text-[15px]">{lblMins(lim)}</span></div>
        <input type="range" min="0" max={STEPS.length - 1} step="1" value={idx} onChange={(e) => setLim(STEPS[+e.target.value])} className="w-full accent-cyan-400" />
        <div className="flex justify-between text-[10px] font-bold text-slate-600 mt-1"><span>15m</span><span>1h</span><span>3h</span><span>∞</span></div>
      </Card>

      <Card className="divide-y divide-white/[0.05]">
        <div className="flex items-center gap-3 p-4"><Lock size={18} className="text-rose-400" /><span className="flex-1 text-white font-bold text-[14px]">Restricted</span><Toggle on={restricted} onClick={() => toggleIn('lockedApps', setting.lockedApps)} /></div>
        <div className="flex items-center gap-3 p-4"><GraduationCap size={18} className="text-emerald-400" /><span className="flex-1 text-white font-bold text-[14px]">Educational Exception</span><Toggle on={edu} onClick={() => toggleIn('eduApps', setting.eduApps)} /></div>
        <div className="flex items-center gap-3 p-4"><Moon size={18} className="text-indigo-300" /><span className="flex-1 text-white font-bold text-[14px]">Night Restriction</span><Toggle on={night} onClick={() => toggleIn('nightApps', setting.nightApps)} /></div>
      </Card>

      <button onClick={() => { updateSetting({ appLimits: { ...setting.appLimits, [name]: 60 } }); }} className="ag-tap w-full h-[52px] rounded-2xl bg-white/[0.05] border border-white/10 text-white font-bold flex items-center justify-center gap-2"><RotateCcw size={17} /> Reset to Default</button>
    </Page>
  );
};

/* ── PHASE 4 · Night Restriction Center ──────────────────────────────────── */
const fmt12 = (hhmm) => { let [h, m] = hhmm.split(':').map(Number); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; };
export const NightRestrictions = () => {
  const { child, setting, updateSetting } = useChild();
  const n = setting.night;
  const setN = (patch) => updateSetting({ night: patch });
  return (
    <Page title="Night Restrictions" sub={`${child.name} · protect sleep & focus`}>
      <Card className="p-5 flex items-center gap-4">
        <div className="w-14 h-14 rounded-3xl bg-indigo-500/15 border border-indigo-400/30 flex items-center justify-center"><Moon size={26} className="text-indigo-300" /></div>
        <div className="flex-1"><p className="text-white font-black text-[15px]">Night Restriction</p><p className="text-indigo-300 text-[13px] font-bold mt-0.5">{n.on ? `${fmt12(n.start)} → ${fmt12(n.end)}` : 'Disabled'}</p></div>
        <Toggle on={n.on} onClick={() => setN({ on: !n.on })} />
      </Card>

      <Label>Schedule</Label>
      <Card className="p-4 flex items-center gap-3">
        <div className="flex-1"><p className="text-slate-500 text-[11px] font-bold uppercase mb-1.5">Start time</p><input type="time" value={n.start} onChange={(e) => setN({ start: e.target.value })} className="w-full bg-[#11131d] border border-white/10 rounded-xl px-3 h-11 text-white font-bold text-[15px] accent-cyan-400" /></div>
        <div className="flex-1"><p className="text-slate-500 text-[11px] font-bold uppercase mb-1.5">End time</p><input type="time" value={n.end} onChange={(e) => setN({ end: e.target.value })} className="w-full bg-[#11131d] border border-white/10 rounded-xl px-3 h-11 text-white font-bold text-[15px] accent-cyan-400" /></div>
      </Card>

      <Label>During Night Mode</Label>
      <Card className="divide-y divide-white/[0.05]">
        {[{ k: 'games', t: 'Block Games', i: Gamepad2 }, { k: 'social', t: 'Block Social Media', i: MessageCircle }, { k: 'ent', t: 'Block Entertainment', i: Tv }, { k: 'edu', t: 'Allow Educational Apps', i: GraduationCap }].map((r) => (
          <div key={r.k} className="flex items-center gap-3 p-4"><r.i size={18} className="text-indigo-300" /><span className="flex-1 text-white font-bold text-[14px]">{r.t}</span><Toggle on={n[r.k]} onClick={() => setN({ [r.k]: !n[r.k] })} /></div>
        ))}
        <div className="flex items-center gap-3 p-4"><Phone size={18} className="text-emerald-400" /><span className="flex-1 text-white font-bold text-[14px]">Allow Emergency Calling</span><Toggle on={n.emergency} onClick={() => setN({ emergency: !n.emergency })} /></div>
      </Card>
    </Page>
  );
};

/* ── PHASE 5 · App Management Center ─────────────────────────────────────── */
const APPS = [
  { n: 'YouTube', cat: 'Entertainment', risk: 'Medium', mins: 64, c: '#ef4444', edu: false },
  { n: 'Instagram', cat: 'Social', risk: 'High', mins: 52, c: '#ec4899', edu: false },
  { n: 'TikTok', cat: 'Social', risk: 'High', mins: 96, c: '#a855f7', edu: false },
  { n: 'Snapchat', cat: 'Social', risk: 'High', mins: 34, c: '#eab308', edu: false },
  { n: 'Facebook', cat: 'Social', risk: 'Medium', mins: 20, c: '#3b82f6', edu: false },
  { n: 'Games', cat: 'Gaming', risk: 'Medium', mins: 60, c: '#22c55e', edu: false },
  { n: 'Chrome', cat: 'Utility', risk: 'Low', mins: 22, c: '#0ea5e9', edu: false },
  { n: 'Khan Academy', cat: 'Education', risk: 'Low', mins: 28, c: '#10b981', edu: true },
  { n: 'Roblox', cat: 'Gaming', risk: 'Medium', mins: 48, c: '#16a34a', edu: false },
];
const RISK_C = { Low: '#10b981', Medium: '#f59e0b', High: '#ef4444' };
export const AppManagement = () => {
  const navigate = useNavigate();
  const { child, setting, updateSetting } = useChild();
  const [tab, setTab] = useState('All');
  const locked = setting.lockedApps;
  const isLocked = (n) => locked.includes(n);
  const toggle = (n) => updateSetting({ lockedApps: isLocked(n) ? locked.filter((x) => x !== n) : [...locked, n] });
  const tabs = ['All', 'Most Used', 'Recent', 'Blocked'];
  const shown = tab === 'Blocked' ? APPS.filter((a) => isLocked(a.n))
    : tab === 'Most Used' ? [...APPS].sort((a, b) => b.mins - a.mins).slice(0, 5)
    : tab === 'Recent' ? APPS.slice(-4) : APPS;
  return (
    <Page title="App Management" sub={`${child.name} · ${locked.length} restricted`}>
      {/* Restricted apps surfaced at the top — reason, limit & lock status */}
      {locked.length > 0 && (
        <div className="flex flex-col gap-2.5">
          <Label>Restricted Apps ({locked.length})</Label>
          <Card className="divide-y divide-white/[0.05]">
            {APPS.filter((a) => isLocked(a.n)).map((a) => { const lim = setting.appLimits[a.n]; return (
              <button key={a.n} onClick={() => navigate(`/app/app-config/${encodeURIComponent(a.n)}`)} className="ag-tap w-full flex items-center gap-3 p-3.5 text-left">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-[14px] flex-shrink-0" style={{ background: a.c }}>{a.n[0]}</div>
                <div className="flex-1 min-w-0"><p className="text-white font-bold text-[14px]">{a.n}</p><p className="text-[11.5px] font-bold" style={{ color: RISK_C[a.risk] }}>{a.risk} risk · {a.cat}</p></div>
                <span className="text-[10.5px] font-black px-2 py-1 rounded-full bg-white/[0.06] text-slate-300 flex-shrink-0">{lim === 0 ? 'Unlimited' : fmtMins(lim)}</span>
                <div className="w-8 h-8 rounded-lg bg-rose-500/15 flex items-center justify-center flex-shrink-0"><Lock size={15} className="text-rose-400" /></div>
              </button>
            ); })}
          </Card>
        </div>
      )}
      <Label>All Apps</Label>
      <div className="flex gap-2 overflow-x-auto ag-no-scrollbar">{tabs.map((t) => (<button key={t} onClick={() => setTab(t)} className={`ag-tap flex-shrink-0 px-4 h-9 rounded-full text-[12.5px] font-bold border ${tab === t ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>{t}</button>))}</div>
      <div className="flex flex-col gap-3">
        {shown.length === 0 ? <Card className="p-6 text-center text-slate-500 text-[13px] font-semibold">No apps in this view.</Card> : shown.map((a) => { const lk = isLocked(a.n); return (
          <Card key={a.n} className="p-4">
            <div className="flex items-center gap-3.5">
              <button onClick={() => navigate(`/app/app-config/${encodeURIComponent(a.n)}`)} className="ag-tap flex items-center gap-3.5 flex-1 min-w-0 text-left">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black" style={{ background: a.c }}>{a.n[0]}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="text-white font-bold text-[14.5px]">{a.n}</p>{a.edu && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400">EDU</span>}{lk && <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400">LOCKED</span>}</div>
                  <div className="flex items-center gap-2 mt-0.5"><span className="text-slate-500 text-[11.5px] font-semibold">{a.cat}</span><span className="w-1 h-1 rounded-full bg-slate-600" /><span className="text-[11.5px] font-bold" style={{ color: RISK_C[a.risk] }}>{a.risk} risk</span></div>
                </div>
              </button>
              <button onClick={() => toggle(a.n)} className={`ag-tap w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${lk ? 'bg-rose-500/15' : 'bg-white/[0.06]'}`}>{lk ? <Lock size={16} className="text-rose-400" /> : <Unlock size={16} className="text-slate-400" />}</button>
            </div>
          </Card>
        ); })}
      </div>
    </Page>
  );
};

/* ── PHASE 7 · Safe Zone Manager ─────────────────────────────────────────── */
const zoneVerb = (t) => ({ enter: 'Entered', exit: 'Exited', late: 'Late arrival at', missed: 'Missed arrival at', stayed: 'Stayed longer at' }[t] || 'Event at');
const fmtDur = (ms) => { const m = Math.round((ms || 0) / 60000); return m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`; };
const evTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

export const SafeZoneManager = () => {
  const navigate = useNavigate();
  const { liveZoneEvents } = useRealtime();
  const [radius, setRadius] = useState(250);
  const zones = [{ n: 'Home', s: '221B Maple Ave', i: 'home', c: '#3b82f6' }, { n: 'School', s: 'Lincoln Elementary', i: 'school', c: '#10b981' }, { n: 'Tuition', s: 'Bright Minds Center', i: 'class', c: '#f59e0b' }, { n: "Grandma's", s: '14 Oak Street', i: 'heart', c: '#a855f7' }];
  const saved = JSON.parse(localStorage.getItem('ag_safezones') || '[]');
  return (
    <Page title="Safe Zones" sub="Geofence alerts">
      <div className="grid grid-cols-3 gap-2.5">
        {[{ t: 'Current', i: Crosshair }, { t: 'Map Pin', i: MapPin }, { t: 'Search', i: Search }].map((a) => (
          <button key={a.t} onClick={() => navigate('/app/safe-zones/add')} className="ag-tap flex flex-col items-center gap-2 py-3.5 rounded-2xl border border-white/[0.08] bg-[#0b0c14]"><div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center"><a.i size={17} className="text-cyan-400" /></div><span className="text-[11px] font-bold text-slate-300">{a.t}</span></button>
        ))}
      </div>
      {saved.length > 0 && (
        <div className="flex flex-col gap-3">
          {saved.map((z) => (
            <Card key={z.id} className="flex items-center gap-3.5 p-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center"><MapPin size={21} className="text-cyan-400" /></div>
              <div className="flex-1 min-w-0"><p className="text-white font-black text-[15px]">{z.name}</p><p className="text-slate-500 text-[12.5px] font-semibold truncate">{z.address || `${z.lat.toFixed(4)}, ${z.lng.toFixed(4)}`} · {z.radius >= 1000 ? '1km' : z.radius + 'm'}</p></div>
              <span className="text-[10px] font-black px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400">NEW</span>
            </Card>
          ))}
        </div>
      )}
      <Label>Radius</Label>
      <div className="flex gap-2">{[100, 250, 500, 1000].map((r) => (<button key={r} onClick={() => setRadius(r)} className={`ag-tap flex-1 h-10 rounded-xl text-[12.5px] font-bold border ${radius === r ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>{r >= 1000 ? '1km' : `${r}m`}</button>))}</div>
      <Label>Your Safe Zones</Label>
      <div className="flex flex-col gap-3">
        {zones.map((z) => (<Card key={z.n} className="flex items-center gap-3.5 p-4"><div className="w-11 h-11 rounded-2xl flex items-center justify-center" style={{ background: `${z.c}1f`, border: `1px solid ${z.c}3a` }}><MapPin size={19} style={{ color: z.c }} /></div><div className="flex-1"><p className="text-white font-black text-[15px]">{z.n}</p><p className="text-slate-500 text-[12px] font-semibold">{z.s}</p></div><ChevronRight size={17} className="text-slate-600" /></Card>))}
      </div>
      <Label>Zone History</Label>
      {liveZoneEvents && liveZoneEvents.length > 0 ? (
        <Card className="divide-y divide-white/[0.05]">
          {liveZoneEvents.slice(0, 20).map((e) => (
            <div key={e.id} className="flex items-center gap-3.5 p-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0"><MapPin size={16} className="text-emerald-400" /></div>
              <div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px] truncate">{zoneVerb(e.type)} {e.zoneName}</p><p className="text-slate-500 text-[12px] font-semibold">{evTime(e.at)}{e.type === 'exit' && e.durationMs ? ` · stayed ${fmtDur(e.durationMs)}` : ''}</p></div>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-300 flex-shrink-0">{(e.type || '').toUpperCase()}</span>
            </div>
          ))}
        </Card>
      ) : (
        <Card className="p-5 text-center text-slate-500 text-[12.5px] font-semibold">No zone events yet. They appear here as {`your child`} enters and exits safe zones.</Card>
      )}

      <Label>Alerts</Label>
      <Card className="divide-y divide-white/[0.05]">{[['Entered Safe Zone', true], ['Exited Safe Zone', true], ['Late Arrival', false]].map(([t, on]) => (<div key={t} className="flex items-center gap-3 p-4"><Bell size={17} className="text-cyan-400" /><span className="flex-1 text-white font-bold text-[14px]">{t}</span><Toggle on={on} /></div>))}</Card>
    </Page>
  );
};

/* ── PHASE 13 · Delete Account flow ──────────────────────────────────────── */
export const DeleteAccount = () => {
  const navigate = useNavigate();
  const { child } = useChild();
  const [step, setStep] = useState('report'); // report | confirm | pin | done
  const [pin, setPin] = useState('');
  const [saved, setSaved] = useState(false);
  const downloadReport = () => {
    const archive = { app: 'AlphaGuard AI', exportedAt: new Date().toISOString(), reason: 'pre-deletion 30-day report', child, settings: (() => { try { return JSON.parse(localStorage.getItem('ag_settings') || '{}'); } catch { return {}; } })(), safeZones: (() => { try { return JSON.parse(localStorage.getItem('ag_safezones') || '[]'); } catch { return []; } })() };
    const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'alphaguard-pre-deletion-report.json'; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1500); setSaved(true);
  };

  if (step === 'done') return (
    <Page title="Account Deleted"><Card className="p-8 flex flex-col items-center text-center"><div className="w-16 h-16 rounded-full bg-slate-500/15 flex items-center justify-center mb-4"><Check size={28} className="text-slate-300" /></div><p className="text-white font-black text-[16px]">Your account has been deleted</p><p className="text-slate-500 text-[13px] font-semibold mt-2">We’re sorry to see you go.</p><button onClick={() => navigate('/welcome')} className="ag-tap mt-6 px-6 h-12 rounded-full bg-white/[0.06] border border-white/10 text-white font-bold">Back to Start</button></Card></Page>
  );

  return (
    <Page title="Delete Account" sub="This action is permanent">
      {step === 'report' && (
        <Card className="p-5 flex flex-col items-center text-center gap-3">
          <Download size={30} className="text-cyan-400" />
          <p className="text-white font-black text-[16px]">Download your data before deleting?</p>
          <p className="text-slate-500 text-[13px] font-semibold leading-relaxed">You have the right to a copy of your child’s safety data (GDPR Art. 20 / CCPA). Save it now — it cannot be recovered after deletion.</p>
          <div className="flex gap-3 w-full mt-2"><button onClick={downloadReport} className="ag-tap flex-1 h-12 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold">{saved ? 'Downloaded ✓' : 'Download'}</button><button onClick={() => setStep('confirm')} className="ag-tap flex-1 h-12 rounded-full bg-white/[0.05] border border-white/10 text-white font-bold">{saved ? 'Continue' : 'Skip'}</button></div>
        </Card>
      )}
      {step === 'confirm' && (
        <Card className="p-5 flex flex-col items-center text-center gap-3 border-rose-500/25">
          <div className="w-14 h-14 rounded-full bg-rose-500/15 flex items-center justify-center"><AlertTriangle size={26} className="text-rose-400" /></div>
          <p className="text-white font-black text-[16px]">Delete your AlphaGuard account?</p>
          <p className="text-slate-500 text-[13px] font-semibold leading-relaxed">This permanently removes your account and every child profile, device pairing, location & safe-zone history, chat, reports, and settings.</p>
          <div className="w-full text-left rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5 flex flex-col gap-1.5">
            <p className="text-slate-300 text-[12px] font-semibold leading-relaxed">• Your child’s devices are unpaired and stop being monitored immediately.</p>
            <p className="text-slate-300 text-[12px] font-semibold leading-relaxed">• Personal data is erased from our systems within 30 days, except where law requires longer retention.</p>
            <p className="text-slate-300 text-[12px] font-semibold leading-relaxed">• Live monitoring media is never stored, so there is nothing to recover.</p>
            <p className="text-slate-300 text-[12px] font-semibold leading-relaxed">• This action is irreversible and cannot be undone.</p>
          </div>
          <button onClick={() => setStep('pin')} className="ag-tap w-full h-12 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold mt-1">Continue to verify</button>
        </Card>
      )}
      {step === 'pin' && (
        <Card className="p-5 flex flex-col items-center gap-4">
          <KeyRound size={26} className="text-cyan-400" />
          <p className="text-white font-black text-[15px]">Enter Parent Security PIN</p>
          <div className="relative w-full" onClick={(e) => e.currentTarget.querySelector('input').focus()}>
            <input autoFocus type="tel" inputMode="numeric" value={pin} maxLength={6} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} className="absolute inset-0 w-full h-full opacity-0" />
            <div className="flex items-center justify-center gap-2">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className={`flex items-center justify-center w-11 h-14 rounded-2xl border-2 text-[20px] font-black text-white ${i < pin.length ? 'border-cyan-400/60 bg-cyan-500/[0.06]' : 'border-white/[0.08] bg-[#0b0c14]'}`}>{pin[i] ? '•' : ''}</div>))}</div>
          </div>
          <button disabled={pin.length !== 6} onClick={() => setStep('done')} className="ag-tap w-full h-12 rounded-full bg-gradient-to-r from-rose-600 to-red-600 text-white font-extrabold disabled:opacity-50 flex items-center justify-center gap-2"><Trash2 size={17} /> Permanently Delete</button>
        </Card>
      )}
    </Page>
  );
};
