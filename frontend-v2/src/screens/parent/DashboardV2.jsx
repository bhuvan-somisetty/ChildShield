import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { EmergencyCard } from './centers2';
import {
  BatteryMedium, BatteryCharging, Wifi, RefreshCw, MapPin, Navigation, Lock, Siren, Sparkles,
  ShieldCheck, Clock, ChevronRight, TrendingDown, TrendingUp, Bell, CheckCircle2, Grid3x3, Moon, SlidersHorizontal, Phone, MessageCircle,
} from 'lucide-react';
import { useChild, effLimit } from '../../context/ChildContext';
import { useRealtime } from '../../context/RealtimeContext';
import { useT } from '../../i18n/I18nContext';
import { fmtMins } from '../../data/childDemo';

const riskColor = (r) => (r === 'Low' ? '#10b981' : r === 'Medium' ? '#f59e0b' : '#ef4444');

// Relative "updated N ago" for live telemetry timestamps.
const ago = (ts) => { if (!ts) return '—'; const s = Math.max(0, Math.floor((Date.now() - ts) / 1000)); if (s < 10) return 'Just now'; if (s < 60) return `${s} sec ago`; const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`; return `${Math.floor(m / 60)}h ago`; };

const QUICK = [
  { label: 'App Management', icon: Grid3x3, to: '/app/app-management', accent: '#06b6d4' },
  // Remote OS-level lock isn't reliable without MDM, so this opens the real
  // Controls (screen time, app & night restrictions) rather than implying a lock.
  { label: 'Controls', icon: SlidersHorizontal, to: '/app/controls', accent: '#3b82f6' },
  { label: 'SOS Center', icon: Siren, to: '/app/emergency', accent: '#ef4444' },
  { label: 'AI Assistant', icon: Sparkles, to: '/app/ai', accent: '#a855f7' },
];

const Card = ({ children, className = '' }) => <div className={`rounded-[22px] border border-white/[0.08] bg-[#0b0c14] ${className}`}>{children}</div>;
const Label = ({ children }) => <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.14em] mb-2.5 px-1">{children}</h3>;

const DashboardV2 = () => {
  const navigate = useNavigate();
  const t = useT();
  const sos = new URLSearchParams(useLocation().search).get('sos') === '1';
  const { child, setting } = useChild();
  const { getTelemetry } = useRealtime();
  const tel = getTelemetry(child.id) || { battery: { level: child.battery, charging: false, updatedAt: Date.now() }, network: child.network, lastSyncAt: Date.now() };
  // Refresh relative timestamps every 5s so "updated N ago" stays live.
  const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force((x) => x + 1), 5000); return () => clearInterval(i); }, []);
  const limit = setting.screenLimit;
  const eff = effLimit(setting);
  const unlimited = eff === Infinity;
  const remaining = unlimited ? 0 : Math.max(0, eff - child.screenTime.today);
  const remainingLabel = unlimited ? 'Unlimited' : fmtMins(remaining);
  const sc = 2 * Math.PI * 34;          // safety ring
  const stc = 2 * Math.PI * 30;         // screen-time ring
  const stPct = Math.min(100, Math.round((child.screenTime.today / limit) * 100));
  const Trend = child.trend <= 0 ? TrendingDown : TrendingUp;
  const trendColor = child.trend <= 0 ? '#10b981' : '#ef4444';
  const ns = (() => {
    const n = setting.night;
    if (!n.on) return { l: 'Night Restriction', v: 'Off' };
    const now = new Date(); const mins = now.getHours() * 60 + now.getMinutes();
    const [sh, sm] = n.start.split(':').map(Number); const [eh, em] = n.end.split(':').map(Number);
    const sMin = sh * 60 + sm, eMin = eh * 60 + em;
    const active = sMin > eMin ? (mins >= sMin || mins < eMin) : (mins >= sMin && mins < eMin);
    if (active) return { l: 'Night Restriction', v: 'Active now' };
    let diff = sMin - mins; if (diff < 0) diff += 1440;
    return { l: 'Night starts in', v: `${Math.floor(diff / 60)}h ${diff % 60}m` };
  })();

  return (
    <div className="flex flex-col gap-5">
      {/* SOS emergency card — shown immediately when a child triggers SOS */}
      {sos && <EmergencyCard child={child} />}

      {/* 1 · Child Status Card */}
      <div className="relative overflow-hidden rounded-[26px] border border-white/[0.08] bg-gradient-to-br from-white/[0.06] to-transparent p-5">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-3xl" style={{ background: `${child.color}1a` }} />
        <div className="relative flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: `${child.color}26`, border: `1px solid ${child.color}55` }}>{child.emoji}</div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-[3px] border-[#0b0c14] ${child.online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-black text-[20px] leading-tight">{child.name}, {child.age}</h2>
            <p className={`text-[12.5px] font-bold mt-0.5 ${child.online ? 'text-emerald-400' : 'text-slate-500'}`}>● {child.online ? 'Online' : 'Offline'} · {child.device}</p>
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <button onClick={() => navigate('/app/chat')} aria-label={`Message ${child.name}`} className="ag-tap w-11 h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center"><MessageCircle size={19} className="text-cyan-300" /></button>
            <button onClick={() => (child.phone ? (window.location.href = `tel:${child.phone}`) : navigate('/app/settings/profile'))} aria-label={`Call ${child.name}`} className="ag-tap w-11 h-11 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center"><Phone size={19} className="text-emerald-400" /></button>
          </div>
        </div>
        <div className="relative grid grid-cols-3 gap-2 mt-4">
          {[
            { icon: tel.battery.charging ? BatteryCharging : BatteryMedium, label: `${tel.battery.level}%`, sub: tel.battery.charging ? 'Charging' : 'Battery', color: tel.battery.charging ? '#10b981' : tel.battery.level <= 20 ? '#ef4444' : '#22d3ee' },
            { icon: Wifi, label: (tel.network || '').split(' · ')[0] || 'Network', sub: (tel.network || '').split(' · ')[1] || 'Network', color: '#22d3ee' },
            { icon: RefreshCw, label: ago(tel.lastSyncAt), sub: 'Last update', color: '#22d3ee' },
          ].map((s, i) => (
            <div key={i} className="rounded-2xl bg-black/20 border border-white/[0.06] p-3 text-center">
              <s.icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
              <p className="text-white font-black text-[13px] leading-none truncate">{s.label}</p>
              <p className="text-slate-500 text-[10px] font-bold mt-1 truncate">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2 · Safety Score */}
      <Card className="p-5 flex items-center gap-5">
        <div className="relative w-[84px] h-[84px] flex-shrink-0">
          <svg width="84" height="84" className="-rotate-90">
            <circle cx="42" cy="42" r="34" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
            <motion.circle cx="42" cy="42" r="34" stroke={riskColor(child.risk)} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={sc} initial={{ strokeDashoffset: sc }} animate={{ strokeDashoffset: sc * (1 - child.safetyScore / 100) }} transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }} />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-white font-black text-[22px] leading-none">{child.safetyScore}</span></div>
        </div>
        <div className="flex-1">
          <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wide">{t('dash.safetyScore')}</p>
          <p className="font-black text-[17px] mt-0.5" style={{ color: riskColor(child.risk) }}>{child.risk} Risk</p>
          <p className="text-[12px] font-bold mt-1 flex items-center gap-1" style={{ color: trendColor }}><Trend size={14} /> {Math.abs(child.trend)}% this week</p>
        </div>
      </Card>

      {/* 3 · Quick Actions */}
      <div>
        <Label>{t('dash.quickActions')}</Label>
        <div className="grid grid-cols-4 gap-2.5">
          {QUICK.map((a) => (
            <button key={a.label} onClick={() => navigate(a.to)} className="ag-tap flex flex-col items-center gap-2 py-3.5 rounded-2xl border border-white/[0.07] bg-[#0b0c14]">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${a.accent}1f`, border: `1px solid ${a.accent}3a` }}><a.icon size={18} style={{ color: a.accent }} /></div>
              <span className="text-[10px] font-bold text-slate-300 text-center leading-[1.15]">{a.label.split(' ').map((w, wi) => <span key={wi} className="block">{w}</span>)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Family-safety status cards */}
      <div>
        <Label>{t('dash.familySafety')}</Label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { i: Clock, a: '#06b6d4', l: t('dash.remainingToday'), v: remainingLabel, to: '/app/screen-time' },
            { i: ShieldCheck, a: child.safeZone.inside ? '#10b981' : '#f59e0b', l: t('dash.safeZone'), v: child.safeZone.inside ? `Inside ${child.safeZone.name}` : 'Away', to: '/app/safe-zones' },
            { i: Moon, a: '#6366f1', l: ns.l, v: ns.v, to: '/app/night' },
            { i: Lock, a: '#ef4444', l: t('dash.appsRestricted'), v: `${setting.lockedApps.length} apps`, to: '/app/app-management' },
          ].map((s, i) => (
            <button key={i} onClick={() => navigate(s.to)} aria-label={`${s.l}: ${s.v}`} className="ag-tap ag-press text-left transition-colors hover:bg-white/[0.03] rounded-[22px] border border-white/[0.08] bg-[#0b0c14] p-3.5 relative">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2" style={{ background: `${s.a}1f` }}><s.i size={15} style={{ color: s.a }} /></div>
              <ChevronRight size={15} className="text-slate-600 absolute top-3.5 right-3" />
              <p className="text-slate-500 text-[10.5px] font-bold uppercase tracking-wide truncate">{s.l}</p>
              <p className="text-white font-black text-[15px] mt-0.5 truncate">{s.v}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 4 · Today's Screen Time */}
      <button onClick={() => navigate('/app/screen-time')} aria-label="Open Screen Time Center" className="ag-tap ag-press w-full text-left">
        <Card className="p-5 flex items-center gap-4 transition-colors hover:bg-white/[0.03]">
          <div className="relative w-[72px] h-[72px] flex-shrink-0">
            <svg width="72" height="72" className="-rotate-90">
              <circle cx="36" cy="36" r="30" stroke="rgba(255,255,255,0.08)" strokeWidth="7" fill="none" />
              <motion.circle cx="36" cy="36" r="30" stroke="#06b6d4" strokeWidth="7" fill="none" strokeLinecap="round" strokeDasharray={stc} initial={{ strokeDashoffset: stc }} animate={{ strokeDashoffset: stc * (1 - stPct / 100) }} transition={{ duration: 1.1 }} />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-white font-black text-[14px]">{stPct}%</span></div>
          </div>
          <div className="flex-1">
            <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wide flex items-center gap-1.5"><Clock size={13} className="text-cyan-400" /> {t('dash.screenTime')}</p>
            <p className="text-white font-black text-[18px] mt-0.5">{fmtMins(child.screenTime.today)} <span className="text-slate-500 text-[13px]">/ {unlimited ? 'Unlimited' : fmtMins(limit)}</span></p>
          </div>
          <ChevronRight size={20} className="text-slate-500 flex-shrink-0" />
        </Card>
      </button>

      {/* 5 · Location preview + 6 · Safe Zone */}
      <div>
        <Label>{t('dash.location')}</Label>
        <button onClick={() => navigate('/app/location')} className="ag-tap w-full text-left">
          <Card className="relative overflow-hidden h-[150px] p-0">
            <div className="absolute inset-0 opacity-[0.14]" style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '28px 28px' }} />
            <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 50% 45%, ${child.color}22, transparent 60%)` }} />
            <div className="absolute left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2">
              <motion.div className="absolute -inset-6 rounded-full border" style={{ borderColor: `${child.color}55` }} animate={{ scale: [1, 2, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2.6 }} />
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg" style={{ background: `${child.color}33`, border: `2px solid ${child.color}` }}>{child.emoji}</div>
            </div>
            <div className="absolute bottom-3 left-3 right-3 flex items-center gap-2.5 rounded-2xl bg-black/45 backdrop-blur-md border border-white/10 p-2.5">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${child.safeZone.inside ? 'bg-emerald-500/15' : 'bg-amber-500/15'}`}><MapPin size={15} className={child.safeZone.inside ? 'text-emerald-400' : 'text-amber-400'} /></div>
              <div className="flex-1 min-w-0"><p className="text-white font-bold text-[12.5px] truncate">{child.location.area}</p><p className="text-slate-400 text-[11px] font-semibold">{child.safeZone.inside ? `Inside ${child.safeZone.name} · Safe Zone` : `Away from ${child.safeZone.name}`}</p></div>
            </div>
          </Card>
        </button>
      </div>

      {/* 7 · Emergency Status */}
      <button onClick={() => navigate('/app/emergency')} aria-label="Open Emergency Command Center" className="ag-tap ag-press w-full text-left">
        <Card className={`flex items-center gap-3.5 p-4 transition-colors hover:bg-white/[0.03] ${child.emergency.ok ? '' : 'border-rose-500/30'}`}>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${child.emergency.ok ? 'bg-emerald-500/15' : 'bg-rose-500/15'}`}>
            {child.emergency.ok ? <CheckCircle2 size={20} className="text-emerald-400" /> : <Siren size={20} className="text-rose-400" />}
          </div>
          <div className="flex-1"><p className="text-white font-bold text-[14px]">{t('dash.emergencyStatus')}</p><p className={`text-[12.5px] font-semibold ${child.emergency.ok ? 'text-emerald-400' : 'text-rose-400'}`}>{child.emergency.status}</p></div>
          <ChevronRight size={20} className="text-slate-500 flex-shrink-0" />
        </Card>
      </button>

      {/* 8 · Recent Alerts */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h3 className="text-[12px] font-bold text-slate-400 uppercase tracking-[0.14em]">{t('dash.recentAlerts')}</h3>
          <button onClick={() => navigate('/app/activity')} className="ag-tap flex items-center gap-0.5 text-cyan-400 text-[12px] font-bold">{t('dash.viewAll')} <ChevronRight size={14} /></button>
        </div>
        <Card className="divide-y divide-white/[0.05]">
          {child.alerts.map((a, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${a.accent}1f` }}><Bell size={15} style={{ color: a.accent }} /></div>
              <div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px] truncate">{a.title}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{a.sub}</p></div>
            </div>
          ))}
        </Card>
      </div>

      {/* 9 · AI Recommendations */}
      <div>
        <Label>{t('dash.aiRecommendations')}</Label>
        <Card className="p-4 flex flex-col gap-3">
          {child.recommendations.map((r, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${r.accent}1f` }}><Sparkles size={15} style={{ color: r.accent }} /></div>
              <p className="text-slate-300 text-[13px] font-medium leading-relaxed">{r.text}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
};

export default DashboardV2;
