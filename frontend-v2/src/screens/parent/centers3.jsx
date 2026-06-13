import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, FileText, Download, Mail, Share2, CalendarClock, Check, Bell, MapPin,
  Shield, Clock, Grid3x3, Sparkles, AlertTriangle, Cpu, Volume2, MessageCircle, Crown, Users, UserPlus,
  Star, Database, HardDriveDownload, RotateCcw, Archive, ArchiveRestore, HelpCircle, LifeBuoy, Ticket, Wrench, Lightbulb,
  Building2, Phone, Scale, Gavel, Copyright, Code2, Info, BadgeCheck, Trash2, ShieldCheck,
  Search, X, CheckCheck, Inbox, BookOpen,
} from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useRealtime } from '../../context/RealtimeContext';
import { useT } from '../../i18n/I18nContext';
import { fmtMins, notificationsFor, NOTIF_CATEGORIES } from '../../data/childDemo';

const NSEV = { low: { c: '#10b981', l: '' }, medium: { c: '#f59e0b', l: 'MED' }, high: { c: '#ef4444', l: 'HIGH' }, critical: { c: '#ef4444', l: 'SOS' } };

/* ── shared primitives ───────────────────────────────────────────────────── */
const Page = ({ title, sub, right, back = true, children }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        {back && <button onClick={() => navigate(-1)} className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>}
        <div className="flex-1 min-w-0"><h1 className="text-[22px] font-black text-white tracking-tight leading-tight">{title}</h1>{sub && <p className="text-slate-500 text-[13px] font-semibold mt-0.5">{sub}</p>}</div>
        {right}
      </div>
      {children}
    </div>
  );
};
const Card = ({ children, className = '' }) => <div className={`rounded-[22px] border border-white/[0.07] bg-[#0b0c14] ${className}`}>{children}</div>;
const Label = ({ children }) => <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-1">{children}</p>;
const Toggle = ({ on, onClick }) => <button onClick={onClick} className={`ag-tap w-12 h-7 rounded-full flex items-center px-0.5 ${on ? 'bg-cyan-500/80 justify-end' : 'bg-white/10 justify-start'}`}><span className="w-6 h-6 rounded-full bg-white" /></button>;

const Row = ({ icon: I, label, sub, badge, badgeColor = '#10b981', accent = '#64748b', danger, onClick }) => (
  <button onClick={onClick} className="ag-tap w-full flex items-center gap-3.5 p-3.5">
    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${danger ? '#ef4444' : accent}1f` }}><I size={17} style={{ color: danger ? '#ef4444' : accent }} /></div>
    <div className="flex-1 text-left min-w-0"><p className={`font-bold text-[14px] ${danger ? 'text-rose-400' : 'text-white'}`}>{label}</p>{sub && <p className="text-slate-500 text-[12px] font-semibold truncate">{sub}</p>}</div>
    {badge && <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${badgeColor}1f`, color: badgeColor }}>{badge}</span>}
    {onClick && <ChevronRight size={17} className="text-slate-600" />}
  </button>
);

const Hub = ({ title, sub, groups }) => {
  const navigate = useNavigate();
  return (
    <Page title={title} sub={sub}>
      {groups.map((g) => (
        <div key={g.label} className="flex flex-col gap-2.5">
          {g.label && <Label>{g.label}</Label>}
          <Card className="divide-y divide-white/[0.05]">{g.items.map((it) => <Row key={it.label} {...it} onClick={it.to ? () => navigate(it.to) : it.onClick} />)}</Card>
        </div>
      ))}
    </Page>
  );
};
const Doc = ({ title, sub, blocks }) => (
  <Page title={title} sub={sub}>{blocks.map((b, i) => (<Card key={i} className="p-5">{b.h && <p className="text-white font-black text-[14px] mb-1.5">{b.h}</p>}<p className="text-slate-400 text-[13px] font-medium leading-relaxed">{b.t}</p></Card>))}</Page>
);

/* ══ PHASE 10 · Reports Center ═══════════════════════════════════════════ */
export const ReportsCenter = () => {
  const { child } = useChild();
  const [period, setPeriod] = useState('Weekly');
  const periods = ['Daily', 'Weekly', 'Monthly', 'Yearly'];
  const total = period === 'Daily' ? child.screenTime.today : child.screenTime.today * (period === 'Weekly' ? 7 : period === 'Monthly' ? 30 : 365);
  const sections = [
    { t: 'Screen Time', v: fmtMins(total), i: Clock, a: '#06b6d4' },
    { t: 'App Usage', v: `${child.topApps.length} apps`, i: Grid3x3, a: '#3b82f6' },
    { t: 'Location History', v: `${child.activity.length} events`, i: MapPin, a: '#10b981' },
    { t: 'Safe Zone Events', v: child.safeZone.inside ? 'Inside' : 'Away', i: Shield, a: '#22c55e' },
    { t: 'Emergency Events', v: '0', i: AlertTriangle, a: '#ef4444' },
    { t: 'Night Activity', v: child.risk === 'Medium' ? 'Frequent' : 'Minimal', i: Clock, a: '#6366f1' },
    { t: 'School Activity', v: 'Normal', i: BadgeCheck, a: '#10b981' },
    { t: 'AI Insights', v: `${child.recommendations.length} tips`, i: Sparkles, a: '#a855f7' },
    { t: 'Behavior Trends', v: child.risk, i: Cpu, a: '#f59e0b' },
    { t: 'Risk Trends', v: `${child.trend <= 0 ? '' : '+'}${child.trend}%`, i: FileText, a: '#ec4899' },
  ];
  return (
    <Page title="Reports" sub={`${child.name} · safety reports`} back={false}>
      <div className="flex gap-2">{periods.map((p) => (<button key={p} onClick={() => setPeriod(p)} className={`ag-tap flex-1 h-10 rounded-xl text-[12.5px] font-bold border ${period === p ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>{p}</button>))}</div>
      <Card className="p-5"><p className="text-slate-400 text-[12px] font-bold uppercase">{period} screen time · {child.name}</p><p className="text-white font-black text-[26px] mt-1">{fmtMins(total)}</p></Card>
      <Label>Report Content</Label>
      <Card className="divide-y divide-white/[0.05]">{sections.map((s) => (<div key={s.t} className="flex items-center gap-3.5 p-3.5"><div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${s.a}1f` }}><s.i size={16} style={{ color: s.a }} /></div><span className="flex-1 text-white font-bold text-[13.5px]">{s.t}</span><span className="text-slate-400 font-bold text-[12.5px]">{s.v}</span></div>))}</Card>
      <Label>Export Options</Label>
      <div className="grid grid-cols-2 gap-2.5">
        {[{ t: 'Download PDF', i: FileText }, { t: 'Export CSV', i: Download }, { t: 'Email Report', i: Mail }, { t: 'Share Report', i: Share2 }].map((e) => (<button key={e.t} className="ag-tap flex items-center gap-2.5 p-3.5 rounded-2xl border border-white/[0.08] bg-[#0b0c14]"><e.i size={17} className="text-cyan-400" /><span className="text-white font-bold text-[13px]">{e.t}</span></button>))}
      </div>
      <button className="ag-tap w-full h-[52px] rounded-2xl bg-white/[0.05] border border-white/10 text-white font-bold flex items-center justify-center gap-2"><CalendarClock size={17} className="text-cyan-400" /> Schedule Report Delivery</button>
    </Page>
  );
};

/* ══ PHASE 11 · Notification Center ══════════════════════════════════════ */
const CAT_META = {
  Emergency: { i: AlertTriangle, a: '#ef4444' },
  Location: { i: MapPin, a: '#06b6d4' },
  'Safe Zones': { i: Shield, a: '#10b981' },
  'Screen Time': { i: Clock, a: '#f59e0b' },
  'App Usage': { i: Grid3x3, a: '#3b82f6' },
  'AI Insights': { i: Sparkles, a: '#a855f7' },
  'Security Alerts': { i: ShieldCheck, a: '#22c55e' },
  'System Alerts': { i: Cpu, a: '#64748b' },
};
const SEV_FILTERS = [['all', 'All'], ['low', 'Info'], ['medium', 'Medium'], ['high', 'High'], ['critical', 'SOS']];

// Reusable, fully-interactive notification feed backed by the realtime store:
// search, unread/severity/date filters, archived view, mark-read/unread,
// archive and delete — all persisted, so badge counts update everywhere.
const NotifFeed = ({ childId, cat }) => {
  const { listNotifs, archivedNotifs, markRead, markUnread, archiveNotif, unarchiveNotif, removeNotif, markAllRead } = useRealtime();
  const [q, setQ] = useState('');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [sev, setSev] = useState('all');
  const [day, setDay] = useState('all');
  const [showArchived, setShowArchived] = useState(false);

  const base = showArchived ? archivedNotifs(childId).filter((n) => !cat || n.cat === cat) : listNotifs(childId, { cat });
  const dates = ['all', ...Array.from(new Set(base.map((n) => n.date)))];
  const unread = base.filter((n) => n.state === 'unread').length;
  const filtered = base.filter((n) =>
    (!unreadOnly || n.state === 'unread') &&
    (sev === 'all' || n.sev === sev) &&
    (day === 'all' || n.date === day) &&
    (q === '' || `${n.type} ${n.sub}`.toLowerCase().includes(q.toLowerCase())),
  );
  const Chip = ({ active, onClick, children }) => (
    <button onClick={onClick} className={`ag-tap flex-shrink-0 h-8 px-3 rounded-full text-[11.5px] font-bold border ${active ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>{children}</button>
  );
  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search notifications…" aria-label="Search notifications" className="w-full h-11 rounded-2xl bg-[#0b0c14] border border-white/10 pl-10 pr-9 text-[14px] text-white placeholder:text-slate-600 focus:border-cyan-400/40 outline-none" />
        {q && <button onClick={() => setQ('')} aria-label="Clear search" className="ag-tap absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><X size={15} /></button>}
      </div>
      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto ag-no-scrollbar -mx-1 px-1">
        <Chip active={showArchived} onClick={() => setShowArchived(!showArchived)}>{showArchived ? 'Archived' : 'Inbox'}</Chip>
        <Chip active={unreadOnly} onClick={() => setUnreadOnly(!unreadOnly)}>Unread only</Chip>
        {SEV_FILTERS.map(([v, l]) => <Chip key={v} active={sev === v} onClick={() => setSev(v)}>{l}</Chip>)}
      </div>
      {dates.length > 2 && (
        <div className="flex gap-2 overflow-x-auto ag-no-scrollbar -mx-1 px-1">
          {dates.map((d) => <Chip key={d} active={day === d} onClick={() => setDay(d)}>{d === 'all' ? 'All dates' : d}</Chip>)}
        </div>
      )}
      <div className="flex items-center justify-between px-1">
        <span className="text-slate-500 text-[12px] font-bold">{filtered.length} shown · {unread} unread</span>
        <button onClick={() => markAllRead(childId, cat)} disabled={!unread} className="ag-tap flex items-center gap-1.5 text-cyan-400 text-[12px] font-bold disabled:opacity-40"><CheckCheck size={15} /> Mark all read</button>
      </div>
      {/* List */}
      {filtered.length === 0 ? (
        <Card className="flex flex-col items-center gap-2 py-10"><Inbox size={26} className="text-slate-600" /><p className="text-slate-500 text-[13px] font-semibold">{showArchived ? 'No archived notifications' : 'No notifications match'}</p></Card>
      ) : (
        <Card className="divide-y divide-white/[0.05]">{filtered.map((nt) => { const s = NSEV[nt.sev] || NSEV.low; const isUnread = nt.state === 'unread'; return (
          <div key={nt.id} className={`flex items-center gap-2.5 p-3.5 ${isUnread ? 'bg-white/[0.03]' : ''}`}>
            <button onClick={() => (isUnread ? markRead(childId, nt.id) : markUnread(childId, nt.id))} aria-label={isUnread ? 'Mark as read' : 'Mark as unread'} className="ag-tap flex items-center gap-2.5 flex-1 min-w-0 text-left">
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isUnread ? 'bg-cyan-400' : 'bg-transparent'}`} />
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${nt.accent}1f` }}><Bell size={15} style={{ color: nt.accent }} /></div>
              <div className="flex-1 min-w-0"><p className={`font-bold text-[13.5px] truncate ${isUnread ? 'text-white' : 'text-slate-300'}`}>{nt.type}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{nt.sub} · {nt.time}</p></div>
              {s.l && <span className="text-[9px] font-black px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: `${s.c}1f`, color: s.c }}>{s.l}</span>}
            </button>
            {showArchived
              ? <button onClick={() => unarchiveNotif(childId, nt.id)} aria-label="Unarchive" className="ag-tap w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0"><ArchiveRestore size={14} className="text-slate-300" /></button>
              : <button onClick={() => archiveNotif(childId, nt.id)} aria-label="Archive notification" className="ag-tap w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0"><Archive size={14} className="text-slate-400" /></button>}
            <button onClick={() => removeNotif(childId, nt.id)} aria-label="Delete notification" className="ag-tap w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center flex-shrink-0"><Trash2 size={14} className="text-slate-400" /></button>
            <ChevronRight size={15} className="text-slate-600 flex-shrink-0" />
          </div>
        ); })}</Card>
      )}
    </div>
  );
};

export const NotificationCenter = () => {
  const navigate = useNavigate();
  const t = useT();
  const { child, activeId } = useChild();
  const { unreadCount, pendingCount } = useRealtime();
  const [prefs, setPrefs] = useState({ push: true, email: true, voice: true, sms: false, override: true });
  const [vol, setVol] = useState(80);
  const reqN = pendingCount(activeId);
  return (
    <Page title={t('common.notifications')} sub={`${child.name} · ${unreadCount(activeId)} new`} back={false}>
      <Label>Categories</Label>
      <div className="grid grid-cols-2 gap-2.5">
        {NOTIF_CATEGORIES.map((c) => { const m = CAT_META[c]; const n = unreadCount(activeId, c); return (
          <button key={c} onClick={() => navigate(`/app/notifications/${encodeURIComponent(c)}`)} aria-label={`Open ${c} notifications`} className="ag-tap ag-press flex items-center gap-2 p-3 rounded-2xl border border-white/[0.07] bg-[#0b0c14] hover:bg-white/[0.03] transition-colors text-left">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${m.a}1f` }}><m.i size={15} style={{ color: m.a }} /></div>
            <span className="flex-1 text-white font-bold text-[12px] leading-tight truncate">{c}</span>
            {n > 0 && <span className="text-[10px] font-black w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0">{n}</span>}
            <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />
          </button>
        ); })}
        {/* App approval requests — opens the Approvals center */}
        <button onClick={() => navigate('/app/requests')} aria-label="Open app approval requests" className="ag-tap ag-press flex items-center gap-2 p-3 rounded-2xl border border-white/[0.07] bg-[#0b0c14] hover:bg-white/[0.03] transition-colors text-left col-span-2">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 bg-cyan-500/15"><Inbox size={15} className="text-cyan-400" /></div>
          <span className="flex-1 text-white font-bold text-[12px] leading-tight truncate">App Requests (Install & Delete)</span>
          {reqN > 0 && <span className="text-[10px] font-black w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center flex-shrink-0">{reqN}</span>}
          <ChevronRight size={14} className="text-slate-600 flex-shrink-0" />
        </button>
      </div>
      <Label>All Activity · {child.name}</Label>
      <NotifFeed childId={activeId} />
      <Label>Notification Settings</Label>
      <Card className="divide-y divide-white/[0.05]">
        {[['push', 'Push Notifications'], ['email', 'Email Notifications'], ['voice', 'Voice Alerts'], ['sms', 'SMS Ready'], ['override', 'Emergency Override']].map(([k, lbl]) => (<div key={k} className="flex items-center gap-3 p-4"><Bell size={17} className="text-cyan-400" /><span className="flex-1 text-white font-bold text-[14px]">{lbl}</span><Toggle on={prefs[k]} onClick={() => setPrefs({ ...prefs, [k]: !prefs[k] })} /></div>))}
        <div className="p-4"><div className="flex items-center justify-between mb-2"><span className="text-white font-bold text-[14px] flex items-center gap-2"><Volume2 size={16} className="text-cyan-400" /> AI Voice Volume</span><span className="text-cyan-400 font-black text-[13px]">{vol}%</span></div><input type="range" min="0" max="100" value={vol} onChange={(e) => setVol(+e.target.value)} className="w-full accent-cyan-400" /></div>
      </Card>
    </Page>
  );
};

// Per-category feed — opening it marks that category read (Instagram behaviour).
export const NotificationCategory = () => {
  const { cat } = useParams();
  const name = decodeURIComponent(cat || '');
  const { child, activeId } = useChild();
  const { markCategoryRead, listNotifs } = useRealtime();
  const count = listNotifs(activeId, { cat: name }).length;
  useEffect(() => { markCategoryRead(activeId, name); }, [activeId, name]); // eslint-disable-line
  const m = CAT_META[name] || { i: Bell, a: '#06b6d4' };
  return (
    <Page title={name} sub={`${child.name} · ${count} notifications`}>
      <div className="flex items-center gap-3 -mt-1">
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${m.a}1f` }}><m.i size={19} style={{ color: m.a }} /></div>
        <p className="text-slate-400 text-[13px] font-semibold">Filtered to {name} alerts.</p>
      </div>
      <NotifFeed childId={activeId} cat={name} />
    </Page>
  );
};

/* ══ Subscription Center ═════════════════════════════════════════════════ */
const PLANS = [
  { name: 'Free', price: '$0', sub: '1 child · basics', accent: '#64748b', current: true },
  { name: 'Premium', price: '$9', sub: 'Up to 3 children', accent: '#06b6d4' },
  { name: 'Family Plus', price: '$15', sub: 'Unlimited children', accent: '#a855f7', popular: true },
  { name: 'Enterprise Family', price: 'Custom', sub: 'Org & schools', accent: '#f59e0b' },
];
const COMPARE = [['Children', '1', '3', '∞', '∞'], ['Live Location', '✓', '✓', '✓', '✓'], ['AI Copilot', '—', '✓', '✓', '✓'], ['Emergency SOS', '✓', '✓', '✓', '✓'], ['PDF Reports', '—', '✓', '✓', '✓'], ['Priority Support', '—', '—', '✓', '✓']];
export const SubscriptionCenter = () => (
  <Page title="Subscription" sub="Choose your plan" >
    <div className="grid grid-cols-2 gap-3">
      {PLANS.map((p) => (
        <div key={p.name} className="relative rounded-[22px] border p-4" style={{ borderColor: p.popular ? `${p.accent}66` : 'rgba(255,255,255,0.08)', background: p.popular ? `${p.accent}12` : '#0b0c14' }}>
          {p.popular && <span className="absolute -top-2 right-3 text-[9px] font-black px-2 py-0.5 rounded-full bg-violet-500 text-white">POPULAR</span>}
          <div className="flex items-center gap-1.5"><Crown size={15} style={{ color: p.accent }} /><p className="text-white font-black text-[14px]">{p.name}</p></div>
          <p className="text-white font-black text-[22px] mt-1.5">{p.price}<span className="text-slate-500 text-[12px] font-bold">{p.price.startsWith('$') && p.price !== '$0' ? '/mo' : ''}</span></p>
          <p className="text-slate-500 text-[11.5px] font-semibold mt-0.5">{p.sub}</p>
          <button className={`ag-tap w-full mt-3 h-9 rounded-full text-[12px] font-bold ${p.current ? 'bg-white/[0.06] text-slate-400 border border-white/10' : 'text-white'}`} style={!p.current ? { background: p.accent } : {}}>{p.current ? 'Current' : 'Upgrade'}</button>
        </div>
      ))}
    </div>
    <Label>Compare Features</Label>
    <Card className="p-4 overflow-x-auto ag-no-scrollbar">
      <table className="w-full text-[12px]">
        <thead><tr className="text-slate-500 font-black uppercase text-[10px]"><th className="text-left pb-2">Feature</th><th>Free</th><th>Prem</th><th>Plus</th><th>Ent</th></tr></thead>
        <tbody>{COMPARE.map((r) => (<tr key={r[0]} className="border-t border-white/[0.05]"><td className="text-white font-semibold py-2 text-left">{r[0]}</td>{r.slice(1).map((c, i) => (<td key={i} className="text-center font-bold" style={{ color: c === '✓' ? '#10b981' : c === '—' ? '#475569' : '#fff' }}>{c}</td>))}</tr>))}</tbody>
      </table>
    </Card>
    <p className="text-slate-500 text-[12px] font-semibold text-center">Plans are illustrative — payment integration comes later.</p>
  </Page>
);

/* ══ Family Management ═══════════════════════════════════════════════════ */
const MEMBERS = [
  { n: 'Jane Doe', e: 'jane@family.com', role: 'Primary Parent', badge: 'OWNER', bc: '#06b6d4', av: 'J', g: 'from-indigo-500 to-blue-600' },
  { n: 'Mark Doe', e: 'mark@family.com', role: 'Secondary Parent', badge: 'PARENT', bc: '#3b82f6', av: 'M', g: 'from-emerald-500 to-teal-600' },
  { n: 'Susan Doe', e: 'Grandparent', role: 'Grandparent', badge: 'VIEW', bc: '#a855f7', av: 'S', g: 'from-violet-500 to-fuchsia-600' },
  { n: 'Coach Ray', e: 'Trusted Contact', role: 'Guardian', badge: 'GUARDIAN', bc: '#64748b', av: 'R', g: 'from-slate-500 to-slate-700' },
  { n: 'Aunt Lily', e: 'Emergency Contact', role: 'Emergency Contact', badge: 'SOS', bc: '#ef4444', av: 'L', g: 'from-rose-500 to-red-600' },
];
const PERMS = [
  ['Capability', 'Parent', 'Guardian', 'Contact'],
  ['View location', '✓', '✓', '—'],
  ['Manage controls', '✓', '—', '—'],
  ['Receive SOS', '✓', '✓', '✓'],
  ['Delete account', '✓', '—', '—'],
];
export const FamilyManagement = () => {
  const { list } = useChild();
  return (
    <Page title="Family" sub="Members, roles & permissions">
      <Label>Parents, Guardians & Contacts</Label>
      <Card className="divide-y divide-white/[0.05]">{MEMBERS.map((m) => (
        <div key={m.n} className="flex items-center gap-3.5 p-3.5"><div className={`w-11 h-11 rounded-full bg-gradient-to-br ${m.g} flex items-center justify-center text-white font-black`}>{m.av}</div><div className="flex-1 min-w-0"><p className="text-white font-bold text-[14px]">{m.n}</p><p className="text-slate-500 text-[12px] font-semibold truncate">{m.role}{m.e.includes('@') ? ` · ${m.e}` : ''}</p></div><span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${m.bc}1f`, color: m.bc }}>{m.badge}</span></div>
      ))}</Card>
      <Label>Children</Label>
      <Card className="divide-y divide-white/[0.05]">{list.map((c) => (<div key={c.id} className="flex items-center gap-3.5 p-4"><div className="w-11 h-11 rounded-full flex items-center justify-center text-xl" style={{ background: `${c.color}26`, border: `1px solid ${c.color}55` }}>{c.emoji}</div><div className="flex-1"><p className="text-white font-bold text-[14px]">{c.name}, {c.age}</p><p className="text-slate-500 text-[12px] font-semibold">{c.device}</p></div><span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/[0.06] text-slate-400">CHILD</span></div>))}</Card>
      <button className="ag-tap w-full h-[52px] rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold flex items-center justify-center gap-2"><UserPlus size={17} /> Invite Member</button>
      <Label>Role Permissions</Label>
      <Card className="p-4 overflow-x-auto ag-no-scrollbar">
        <table className="w-full text-[12px]"><thead><tr className="text-slate-500 font-black uppercase text-[10px]">{PERMS[0].map((h, i) => <th key={i} className={i === 0 ? 'text-left pb-2' : 'pb-2'}>{h}</th>)}</tr></thead>
        <tbody>{PERMS.slice(1).map((r) => (<tr key={r[0]} className="border-t border-white/[0.05]"><td className="text-white font-semibold py-2 text-left">{r[0]}</td>{r.slice(1).map((c, i) => <td key={i} className="text-center font-bold" style={{ color: c === '✓' ? '#10b981' : '#475569' }}>{c}</td>)}</tr>))}</tbody></table>
      </Card>
      <Card className="divide-y divide-white/[0.05]">
        <Row icon={Users} label="Transfer Ownership" sub="Requires Security PIN" accent="#3b82f6" onClick={() => {}} />
        <Row icon={Trash2} label="Remove Member" sub="Requires Security PIN" danger onClick={() => {}} />
      </Card>
    </Page>
  );
};

/* ══ Data Export (GDPR/CCPA portability — real client-side archive) ═══════ */
const lsJSON = (k, fallback) => { try { return JSON.parse(localStorage.getItem(k) || ''); } catch { return fallback; } };
// Build a machine-readable archive of the data this device holds for the user.
const buildArchive = (child, scope = 'all') => {
  const meta = { app: 'AlphaGuard AI', version: '2.0.0', exportedAt: new Date().toISOString(), scope, format: 'JSON (GDPR Art.20 / CCPA data portability)' };
  const creds = lsJSON('ag_parent_creds', {});
  const account = { email: creds.email || null };
  const c = child || {};
  const sections = {
    account: () => ({ account }),
    profile: () => ({ child: { name: c.name, age: c.age, device: c.device, risk: c.risk } }),
    reports: () => ({ screenTime: c.screenTime, topApps: c.topApps, recommendations: c.recommendations }),
    safety: () => ({ safeZones: lsJSON('ag_safezones', []), safeZone: c.safeZone, securityAlerts: c.securityAlerts || [] }),
    location: () => ({ location: c.location || null, activity: (c.activity || []).filter((a) => a.type === 'location' || a.type === 'zone') }),
    emergency: () => ({ emergencyContacts: c.contacts || [], activity: (c.activity || []).filter((a) => a.type === 'emergency' || a.type === 'sos') }),
    settings: () => ({ settings: lsJSON('ag_settings', {}) }),
  };
  const pick = scope === 'all' ? Object.keys(sections) : [scope];
  const data = pick.reduce((acc, k) => (sections[k] ? { ...acc, ...sections[k]() } : acc), {});
  return { meta, ...data };
};
const downloadArchive = (child, scope, filename) => {
  const blob = new Blob([JSON.stringify(buildArchive(child, scope), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

export const DataExportCenter = () => {
  const { child } = useChild();
  const [done, setDone] = useState('');
  const run = (scope, label, file) => { downloadArchive(child, scope, file); setDone(label); setTimeout(() => setDone(''), 2500); };
  const items = [
    { t: 'Export Child Data', s: `${child.name}'s full profile`, i: Database, scope: 'all', file: `alphaguard-${child.name}-full.json` },
    { t: 'Export Reports', s: 'Screen time & app usage', i: FileText, scope: 'reports', file: `alphaguard-${child.name}-reports.json` },
    { t: 'Export Safety History', s: 'Zones, alerts & risk', i: Shield, scope: 'safety', file: `alphaguard-${child.name}-safety.json` },
    { t: 'Export Location History', s: 'Geo trail', i: MapPin, scope: 'location', file: `alphaguard-${child.name}-location.json` },
    { t: 'Export Emergency Logs', s: 'SOS & timeline', i: AlertTriangle, scope: 'emergency', file: `alphaguard-${child.name}-emergency.json` },
  ];
  return (
    <Page title="Data Export" sub={`${child.name} · download datasets`}>
      <Card className="flex items-start gap-2.5 p-4 border-cyan-500/15 bg-cyan-500/[0.05]"><ShieldCheck size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" /><p className="text-[12px] text-slate-400 leading-relaxed font-medium">Exports are generated on your device as machine-readable JSON (GDPR Art. 20 / CCPA data-portability). Live monitoring media is never stored and is not part of any export.</p></Card>
      <div className="flex flex-col gap-2.5">{items.map((it) => (<Card key={it.t} className="flex items-center gap-3.5 p-4"><div className="w-10 h-10 rounded-2xl bg-cyan-500/15 flex items-center justify-center"><it.i size={18} className="text-cyan-400" /></div><div className="flex-1"><p className="text-white font-bold text-[14px]">{it.t}</p><p className="text-slate-500 text-[12px] font-semibold">{done === it.t ? 'Downloaded ✓' : it.s}</p></div><button onClick={() => run(it.scope, it.t, it.file)} aria-label={it.t} className="ag-tap w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center">{done === it.t ? <Check size={16} className="text-emerald-400" /> : <Download size={16} className="text-slate-300" />}</button></Card>))}</div>
    </Page>
  );
};

/* ══ Hubs (Data Control, Support, Contact, Legal, Compliance, Version, Licenses, Copyright) ══ */
export const DataControlCenter = () => {
  const { child } = useChild();
  return (<Hub title="Data & Privacy" sub="Control your family data" groups={[
    { label: 'Your Data', items: [
      { icon: HardDriveDownload, label: 'Download My Data', sub: 'Full account archive (JSON)', accent: '#06b6d4', onClick: () => downloadArchive(child, 'all', 'alphaguard-my-data.json') },
      { icon: Database, label: 'Export Family Data', sub: 'Per-child datasets', accent: '#3b82f6', to: '/app/settings/export' },
      { icon: Archive, label: 'Backup Management', sub: 'Auto-backup: weekly', accent: '#a855f7', onClick: () => {} },
    ] },
    { label: 'Requests', items: [
      { icon: RotateCcw, label: 'Account Recovery', sub: 'Recover a lost account', accent: '#10b981', onClick: () => {} },
      { icon: FileText, label: 'Data Retention Information', sub: 'How long we keep data', accent: '#64748b', to: '/app/settings/legal/data-protection' },
      { icon: Trash2, label: 'Delete Data Request', danger: true, to: '/app/settings/delete' },
    ] },
  ]} />);
};

export const SupportCenter = () => (<Hub title="Support" sub="We’re here to help" groups={[
  { label: 'Get Help', items: [
    { icon: HelpCircle, label: 'FAQ', sub: 'Common questions', accent: '#06b6d4', to: '/app/settings/help/faq' },
    { icon: LifeBuoy, label: 'Contact Support', sub: 'Avg reply < 2h', accent: '#10b981', to: '/app/settings/contact' },
    { icon: Mail, label: 'Email Support', sub: 'support@alphaguard.ai', accent: '#3b82f6', onClick: () => {} },
    { icon: MessageCircle, label: 'Live Chat', sub: 'Ready', accent: '#a855f7', onClick: () => {} },
  ] },
  { label: 'More', items: [
    { icon: Ticket, label: 'Ticket History', sub: 'No open tickets', accent: '#f59e0b', onClick: () => {} },
    { icon: Wrench, label: 'Troubleshooting Guides', accent: '#64748b', to: '/app/settings/help/faq' },
    { icon: AlertTriangle, label: 'Report a Problem', accent: '#ef4444', onClick: () => {} },
    { icon: Lightbulb, label: 'Feature Requests', accent: '#facc15', onClick: () => {} },
  ] },
]} />);

export const ContactCenter = () => (<Hub title="Contact" sub="Reach the team" groups={[
  { label: 'Email', items: [
    { icon: Building2, label: 'Business', sub: 'hello@alphaguard.ai', accent: '#3b82f6', onClick: () => {} },
    { icon: LifeBuoy, label: 'Support', sub: 'support@alphaguard.ai', accent: '#10b981', onClick: () => {} },
    { icon: Phone, label: 'Emergency Contact', sub: '24/7 safety line', accent: '#ef4444', onClick: () => {} },
  ] },
  { label: 'Company', items: [
    { icon: MessageCircle, label: 'Feedback Form', accent: '#a855f7', onClick: () => {} },
    { icon: Info, label: 'Company Information', sub: 'AlphaGuard AI, Inc.', accent: '#64748b', to: '/app/settings/about' },
    { icon: Share2, label: 'Social Links', sub: 'X · Instagram · LinkedIn', accent: '#06b6d4', onClick: () => {} },
  ] },
]} />);

export const LegalCenter = () => (<Hub title="Legal" sub="Policies & terms" groups={[
  { label: 'Policies', items: [
    { icon: Shield, label: 'Privacy Policy', accent: '#06b6d4', to: '/app/settings/legal/privacy' },
    { icon: Scale, label: 'Terms & Conditions', accent: '#3b82f6', to: '/app/settings/legal/terms' },
    { icon: ShieldCheck, label: 'Child Safety Policy', accent: '#10b981', to: '/app/settings/legal/child-safety' },
    { icon: Database, label: 'Data Protection Policy', accent: '#a855f7', to: '/app/settings/legal/data-protection' },
  ] },
  { label: 'More', items: [
    { icon: Users, label: 'Community Guidelines', accent: '#f59e0b', to: '/app/settings/legal/community' },
    { icon: Gavel, label: 'Acceptable Use Policy', accent: '#64748b', to: '/app/settings/legal/acceptable-use' },
    { icon: Info, label: 'Cookie Policy', accent: '#64748b', to: '/app/settings/legal/cookie' },
    { icon: FileText, label: 'Refund Policy', accent: '#64748b', to: '/app/settings/legal/refund' },
  ] },
  { label: 'Compliance & Disclosures', items: [
    { icon: BadgeCheck, label: 'COPPA Compliance', sub: 'Children’s privacy (US)', accent: '#10b981', to: '/app/settings/legal/coppa' },
    { icon: BadgeCheck, label: 'GDPR Compliance', sub: 'EU/UK data protection', accent: '#3b82f6', to: '/app/settings/legal/gdpr' },
    { icon: ShieldCheck, label: 'Google Play Families Policy', sub: 'Designed-for-families', accent: '#22c55e', to: '/app/settings/legal/play-families' },
    { icon: ShieldCheck, label: 'App Store Child Safety', sub: 'Apple review', accent: '#a855f7', to: '/app/settings/legal/app-store-safety' },
    { icon: Info, label: 'Permission Disclosure', sub: 'Why each permission is used', accent: '#06b6d4', to: '/app/settings/legal/permissions-disclosure' },
  ] },
]} />);

const EFFECTIVE = 'Effective 13 June 2026 · Version 2.0.0';
// Full, store-ready policy content. Rendered through the existing <Doc> blocks
// renderer (no UI change). Each entry is a list of { h, t } sections.
const LEGAL = {
  privacy: { title: 'Privacy Policy', blocks: [
    { h: 'Who we are', t: 'AlphaGuard AI, Inc. ("AlphaGuard", "we") provides a family-safety service that lets a verified parent or legal guardian monitor and protect a child’s device with the child’s awareness.' },
    { h: 'Data we collect', t: 'Account data (parent email, hashed password, name); child profile (name, age, device); precise and background location; battery and device status; safe-zone definitions and entry/exit events; chat messages between parent and child; SOS events; app-install/uninstall requests; and, only during an active monitoring session you start and the child accepts, live camera, microphone, or screen media (relayed peer-to-peer, never stored on our servers).' },
    { h: 'How we use it', t: 'Solely to deliver the safety features you enable: live location, geofencing, emergency SOS, parent–child chat, app approval, and consented live monitoring. We do not sell personal data, we do not use it for advertising, and we do not build advertising profiles of you or your child.' },
    { h: 'Legal bases (GDPR)', t: 'We process data on the basis of the parent’s consent and the performance of the family-safety service contract, and to meet our legal obligations to protect children. Verifiable parental consent is the basis for processing a child’s data (COPPA).' },
    { h: 'Sharing', t: 'We share data only with infrastructure processors strictly necessary to run the service (hosting, database, push delivery, TURN relay), under contract. We disclose data to authorities only when legally required or to protect a child from imminent harm. We never sell data.' },
    { h: 'Security', t: 'Data is encrypted in transit (TLS) and at rest. Live monitoring media is end-to-end encrypted (DTLS-SRTP) and relayed without server-side recording. Sensitive actions require a parent Security PIN.' },
    { h: 'Retention', t: 'We keep data only while your account is active. On deletion, personal data is purged within 30 days except where law requires longer retention. You can export or delete data at any time from Settings → Data & Privacy.' },
    { h: 'Your rights', t: 'You may access, correct, export (portability), restrict, or delete your and your child’s data, and withdraw consent. EU/UK (GDPR) and California (CCPA/CPRA) residents have these rights; we honour them globally. Contact privacy@alphaguard.ai or use the in-app Data Export and Delete Account flows.' },
    { h: 'Children', t: 'AlphaGuard is operated by parents on behalf of their children; a child never creates an independent account. See our COPPA Compliance and Child Safety Policy.' },
  ] },
  terms: { title: 'Terms of Service', blocks: [
    { h: 'Eligibility', t: 'You must be 18+ and the parent or legal guardian of every child you monitor, or otherwise legally authorised to monitor the device owner. By using AlphaGuard you confirm this.' },
    { h: 'Acceptable use', t: 'AlphaGuard may be used only to protect children in your care, with their awareness. Using it to stalk, harass, or surveil any person without lawful authority is strictly prohibited and may be a crime.' },
    { h: 'Your account', t: 'You are responsible for safeguarding your credentials and Security PIN, and for all activity under your account.' },
    { h: 'Subscriptions & billing', t: 'Paid plans renew until cancelled. Pricing and inclusions are shown in the Subscription center. See the Refund Policy for cancellations and refunds.' },
    { h: 'Service "as is"', t: 'AlphaGuard is a safety aid, not a guaranteed safety guarantee, and may be affected by device, OS, network, or permission state. It must not be relied on as the sole means of protecting a child. To the extent permitted by law the service is provided "as is".' },
    { h: 'Termination', t: 'You may delete your account at any time. We may suspend accounts that violate these terms or applicable law.' },
    { h: 'Changes', t: 'We may update these terms; material changes will be notified in-app. Continued use after changes constitutes acceptance.' },
  ] },
  'child-safety': { title: 'Child Safety Policy', blocks: [
    { h: 'Transparency first', t: 'AlphaGuard is built for transparent family safety, not covert spying. The child app shows a persistent, unmissable indicator whenever camera, microphone, or screen monitoring is active, and every such session requires the child to tap Accept first.' },
    { h: 'Consent for live monitoring', t: 'Camera, microphone, and screen access can never be enabled silently. The child receives an explicit request naming the parent and the type of access, and can Decline or Stop at any time.' },
    { h: 'Prohibited uses', t: 'It is forbidden to use AlphaGuard to abuse, control, intimidate, or stalk a child or any third party, to monitor a person you are not the legal guardian of, or to monitor anyone without the transparency this app enforces.' },
    { h: 'No CSAE tolerance', t: 'We have zero tolerance for child sexual abuse and exploitation (CSAE). The service may not be used to create, store, or transmit such material. We act on credible reports and cooperate with authorities.' },
    { h: 'Reporting', t: 'Report misuse or a child-safety concern to safety@alphaguard.ai. Emergencies should always go to local emergency services first.' },
    { h: 'Data minimisation for minors', t: 'We collect only what is needed for the safety features in use, never serve ads to children, and never sell children’s data.' },
  ] },
  'data-protection': { title: 'Data Protection Policy', blocks: [
    { h: 'Principles', t: 'We apply data minimisation, purpose limitation, storage limitation, and security-by-design across all processing, consistent with GDPR, UK GDPR, CCPA/CPRA, and COPPA.' },
    { h: 'Data categories & retention', t: 'Location & zone events: kept for the rolling history window then aggregated; chat: retained until you delete it or close the account; monitoring media: not stored; account & child profile: retained while the account is active. All personal data is deleted within 30 days of account deletion unless law requires otherwise.' },
    { h: 'Processors & transfers', t: 'Sub-processors (hosting, managed PostgreSQL, push, TURN relay) are bound by data-processing agreements. Cross-border transfers rely on Standard Contractual Clauses or equivalent safeguards.' },
    { h: 'Security controls', t: 'TLS in transit, encryption at rest, hashed passwords (bcrypt), JWT-scoped access, room-scoped realtime channels, PIN-gated sensitive actions, and end-to-end-encrypted monitoring media.' },
    { h: 'Breach response', t: 'We maintain an incident-response process and will notify affected users and regulators within the timelines required by applicable law.' },
    { h: 'Data Protection Officer', t: 'Contact our DPO at dpo@alphaguard.ai for access, portability, rectification, restriction, erasure, or objection requests.' },
  ] },
  community: { title: 'Community Guidelines', blocks: [
    { h: 'Be safety-focused', t: 'AlphaGuard exists to keep children safe. Use it respectfully and only for that purpose.' },
    { h: 'Respect the child', t: 'Monitoring should support trust and open conversation, not control or punishment. Talk with your child about what is monitored and why.' },
    { h: 'No misuse', t: 'No harassment, no surveillance of non-family members, no attempts to defeat the child-visibility indicators, and no sharing of another person’s data without authority.' },
    { h: 'Enforcement', t: 'Accounts that violate these guidelines or applicable law may be suspended or terminated.' },
  ] },
  'acceptable-use': { title: 'Acceptable Use Policy', blocks: [
    { h: 'Authorised devices only', t: 'Install AlphaGuard only on devices you own or that belong to a child under your legal guardianship, and only with the transparency the app provides.' },
    { h: 'Lawful purpose', t: 'Use the service solely for lawful family safety. Covert or unlawful surveillance of any person is prohibited.' },
    { h: 'No interference', t: 'Do not attempt to reverse-engineer, disrupt, overload, or bypass the consent and visibility safeguards of the service.' },
    { h: 'Consequences', t: 'Violations may result in suspension, termination, and referral to authorities where unlawful conduct is suspected.' },
  ] },
  cookie: { title: 'Cookie Policy', blocks: [
    { h: 'What we use', t: 'We use only strictly-necessary local storage and cookies: authentication tokens, your language and appearance preferences, and session state. These are required for the app to function.' },
    { h: 'What we do not use', t: 'No advertising cookies, no third-party ad trackers, and no cross-site behavioural profiling — for parents or children.' },
    { h: 'Managing storage', t: 'Clearing your browser/app storage signs you out and removes preferences. Strictly-necessary items cannot be disabled without breaking core functionality.' },
  ] },
  refund: { title: 'Refund Policy', blocks: [
    { h: 'Cancellation', t: 'You can cancel a subscription at any time from the Subscription center; access continues until the end of the current billing period.' },
    { h: 'Refunds', t: 'You may request a refund for the current billing period within 14 days of the charge. Store purchases (Google Play / App Store) are also subject to the respective store’s refund policy and may be requested there.' },
    { h: 'How to request', t: 'Email billing@alphaguard.ai with your account email and order reference.' },
  ] },
  coppa: { title: 'COPPA Compliance', blocks: [
    { h: 'Parent-operated by design', t: 'AlphaGuard is a service operated by a parent or legal guardian for their own child. Children do not register or provide data directly to us; the parent sets up and controls everything.' },
    { h: 'Verifiable parental consent', t: 'The parent creates and authenticates the account and explicitly enables each data-collecting feature during setup. This constitutes the verifiable parental consent required by the U.S. Children’s Online Privacy Protection Act (COPPA) before any child data is collected.' },
    { h: 'Data from children', t: 'We collect a child’s data only to provide the safety features the parent has enabled (e.g. location for Family Radar, messages for parent–child chat). We never condition participation on collecting more than is reasonably necessary.' },
    { h: 'No ads, no sale', t: 'We do not serve behavioural advertising to children and never sell or rent children’s personal information.' },
    { h: 'Parental controls', t: 'The parent can review, export, and delete the child’s data and revoke any permission at any time from Settings → Data & Privacy and Permissions.' },
    { h: 'Contact', t: 'COPPA questions: privacy@alphaguard.ai.' },
  ] },
  gdpr: { title: 'GDPR Compliance', blocks: [
    { h: 'Roles', t: 'For account data the parent is our customer; AlphaGuard acts as controller for the limited processing needed to run the service and as processor for content the parent manages about their child.' },
    { h: 'Lawful basis', t: 'Processing rests on consent and on performance of the family-safety contract, plus our legitimate and legal interest in protecting children. Special-category processing (e.g. precise location, live media) occurs only with explicit consent and active session control.' },
    { h: 'Data-subject rights', t: 'Access, rectification, erasure ("right to be forgotten"), restriction, portability, and objection are all supported. Use the in-app Data Export and Delete Account flows or email dpo@alphaguard.ai; we respond within one month.' },
    { h: 'International transfers', t: 'Where data leaves the EEA/UK we rely on Standard Contractual Clauses or an adequacy decision.' },
    { h: 'Supervisory authority', t: 'You have the right to lodge a complaint with your local data-protection authority.' },
  ] },
  'play-families': { title: 'Google Play Families Policy', blocks: [
    { h: 'Designed-for-families compliance', t: 'AlphaGuard targets parents and complies with Google Play’s Families and Developer Program policies for apps that handle children’s data.' },
    { h: 'Prominent disclosure & consent', t: 'Before collecting location, camera, microphone, or background data, the app presents a prominent in-context disclosure and requests runtime permission. Sensitive monitoring requires the child to accept and shows a persistent active-session indicator.' },
    { h: 'Permissions justification', t: 'Each sensitive permission maps to a core safety feature: location/background-location → Family Radar & geofencing; camera/microphone → consented live check-in; foreground service → reliable safety monitoring. We request no permission we do not use.' },
    { h: 'Data safety', t: 'Our Play Data safety form declares the data types collected, that data is encrypted in transit, that data is not sold, and that users can request deletion — matching this Privacy Policy.' },
    { h: 'No ads to children & CSAE', t: 'No ads are shown to children, and we operate a zero-tolerance CSAE standard with a published reporting channel (safety@alphaguard.ai), as required by Play policy.' },
  ] },
  'app-store-safety': { title: 'App Store Child Safety', blocks: [
    { h: 'Kids & privacy guidelines', t: 'AlphaGuard follows Apple’s App Review Guidelines covering privacy, data collection from minors, and parental-control apps.' },
    { h: 'Purpose strings & consent', t: 'Location, camera, and microphone access each use clear usage-description strings and the system permission prompt; live monitoring additionally requires the child to accept in-app and displays a continuous indicator.' },
    { h: 'Parental control allowance', t: 'AlphaGuard is a legitimate parental-control / family-safety app installed by a parent on their child’s device, with transparency to the child — not covert tracking, which Apple prohibits.' },
    { h: 'Data handling', t: 'Our App Privacy nutrition labels declare collected data types and link to this Privacy Policy. Data is encrypted, not sold, and deletable on request.' },
    { h: 'Account deletion', t: 'An in-app Delete Account flow is provided, as required for apps that support account creation.' },
  ] },
  'permissions-disclosure': { title: 'Permission Disclosure', blocks: [
    { h: 'Why we ask', t: 'AlphaGuard requests only the permissions its safety features need, and explains each before the system prompt appears (prominent disclosure).' },
    { h: 'Location & background location', t: 'Used to show your child on Family Radar, calculate distance/ETA, and trigger safe-zone enter/exit alerts. Background location keeps these working when the app is closed. Without it, location features are limited.' },
    { h: 'Camera', t: 'Used only during a live camera check-in that you start and your child accepts. It is never accessed silently; the child sees a persistent "Camera Monitoring Active" indicator and can stop it.' },
    { h: 'Microphone', t: 'Used only during a consented live audio check-in, with the same accept-and-indicator safeguards as camera.' },
    { h: 'Screen', t: 'Used only during a consented live screen-view session, again with explicit acceptance and a visible active indicator.' },
    { h: 'Notifications', t: 'Used to deliver SOS, safe-zone, and device alerts to the parent.' },
    { h: 'Battery optimisation exemption', t: 'Requested so safety monitoring is not killed by the OS in the background.' },
    { h: 'Your control', t: 'Every permission can be reviewed and revoked any time in Settings → Permissions and in your device settings.' },
  ] },
};
export const LegalDoc = () => {
  const { slug } = useParams();
  const d = LEGAL[slug] || { title: 'Document', blocks: [{ t: 'This document is unavailable.' }] };
  return <Doc title={d.title} sub={EFFECTIVE} blocks={[...d.blocks, { h: 'Contact', t: 'Questions about this policy? Email privacy@alphaguard.ai. For data requests, dpo@alphaguard.ai; for child-safety concerns, safety@alphaguard.ai.' }]} />;
};

export const FAQPage = () => (
  <Page title="FAQ" sub="Common questions">
    {[['How do I add another child?', 'Open the child switcher and tap “Add New Child”, then pair their device.'], ['Is my data private?', 'Yes — encrypted and never sold. See the Privacy Policy.'], ['What requires the Security PIN?', 'Deleting the account, unpairing a child, disabling monitoring, and changing security settings.'], ['Can I export my data?', 'Yes — Settings → Data & Privacy → Download My Data.']].map(([q, a], i) => (<Card key={i} className="p-4"><p className="text-white font-bold text-[14px] mb-1.5">{q}</p><p className="text-slate-400 text-[13px] font-medium leading-relaxed">{a}</p></Card>))}
  </Page>
);

export const CompliancePage = () => {
  const navigate = useNavigate();
  const rows = [
    ['COPPA', 'Children’s privacy', 'Compliant', '/app/settings/legal/coppa'],
    ['GDPR', 'EU/UK data protection', 'Compliant', '/app/settings/legal/gdpr'],
    ['CCPA / CPRA', 'California privacy', 'Compliant', '/app/settings/legal/privacy'],
    ['App Store Child Safety', 'Apple review', 'Ready', '/app/settings/legal/app-store-safety'],
    ['Play Families Policy', 'Google review', 'Ready', '/app/settings/legal/play-families'],
    ['Child Safety Standards', 'Family-safety', 'Compliant', '/app/settings/legal/child-safety'],
    ['Permission Disclosure', 'Transparency', 'Published', '/app/settings/legal/permissions-disclosure'],
    ['Data Protection', 'Retention & rights', 'Published', '/app/settings/legal/data-protection'],
  ];
  return (
    <Page title="Compliance" sub="Standards & disclosures">
      <Card className="divide-y divide-white/[0.05]">
        {rows.map(([t, s, st, to]) => (
          <button key={t} onClick={() => navigate(to)} className="ag-tap w-full flex items-center gap-3.5 p-4 text-left"><div className="w-9 h-9 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0"><BadgeCheck size={17} className="text-emerald-400" /></div><div className="flex-1 min-w-0"><p className="text-white font-bold text-[14px]">{t}</p><p className="text-slate-500 text-[12px] font-semibold">{s}</p></div><span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400">{st.toUpperCase()}</span><ChevronRight size={16} className="text-slate-600 flex-shrink-0" /></button>
        ))}
      </Card>
      <p className="text-slate-500 text-[12px] font-semibold text-center px-4">Tap any item to read the full policy. {EFFECTIVE}.</p>
    </Page>
  );
};

export const VersionCenter = () => (
  <Page title="About" sub="Version & release notes">
    <Card className="p-5 flex items-center gap-4"><div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center"><ShieldCheck size={26} className="text-cyan-400" /></div><div><p className="text-white font-black text-[16px]">AlphaGuard AI</p><p className="text-slate-500 text-[12.5px] font-semibold">Version 2.0.0 · Build 2026.06</p></div></Card>
    <Label>Release Notes</Label>
    <Card className="p-5"><p className="text-white font-bold text-[13.5px] mb-2">v2.0.0 — Production Platform</p><ul className="text-slate-400 text-[12.5px] font-medium leading-relaxed list-disc pl-4 space-y-1"><li>New multi-child dashboard & switching</li><li>Family Radar, Emergency Command, AI Copilot</li><li>Screen Time, Night & App control centers</li><li>Security Center + PIN-gated actions</li></ul></Card>
    <Label>Changelog · Upcoming</Label>
    <Card className="divide-y divide-white/[0.05]">{[['v1.9', 'Onboarding & pairing flow', '#10b981'], ['v2.0', 'Production parent platform', '#06b6d4'], ['v2.1', 'Real GPS & live monitoring (planned)', '#64748b'], ['v2.2', 'AI behavior models (planned)', '#64748b']].map(([v, t, a]) => (<div key={v} className="flex items-center gap-3 p-3.5"><span className="w-2.5 h-2.5 rounded-full" style={{ background: a }} /><span className="flex-1 text-white font-bold text-[13px]">{v}</span><span className="text-slate-500 text-[12px] font-semibold">{t}</span></div>))}</Card>
  </Page>
);

export const LicensesCenter = () => (
  <Page title="Open Source" sub="Licenses & credits">
    <Label>Framework Credits</Label>
    <Card className="divide-y divide-white/[0.05]">{[['React', 'MIT'], ['Vite', 'MIT'], ['Tailwind CSS', 'MIT'], ['Framer Motion', 'MIT'], ['lucide-react', 'ISC'], ['qrcode.react', 'ISC'], ['react-router', 'MIT']].map(([n, l]) => (<div key={n} className="flex items-center gap-3 p-3.5"><Code2 size={16} className="text-cyan-400" /><span className="flex-1 text-white font-bold text-[13.5px]">{n}</span><span className="text-slate-500 font-bold text-[12px]">{l}</span></div>))}</Card>
    <p className="text-slate-500 text-[12px] font-semibold text-center px-4">Full third-party attributions and dependency licenses are bundled with each release.</p>
  </Page>
);

/* ══ Settings hub (full) ═════════════════════════════════════════════════ */
export const SettingsHubV2 = () => {
  const navigate = useNavigate();
  const t = useT();
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState('');
  const confirmReset = () => { localStorage.removeItem('ag_settings'); localStorage.removeItem('ag_safezones'); window.location.reload(); };
  const G = [
    { label: t('settings.account'), items: [
      { icon: Info, label: 'Profile', accent: '#06b6d4', to: '/app/settings/profile' },
      { icon: ShieldCheck, label: 'Security Center', accent: '#3b82f6', to: '/app/settings/security' },
      { icon: BadgeCheck, label: 'Permissions', sub: 'Location, alerts & health', accent: '#06b6d4', to: '/app/settings/permissions' },
      { icon: ShieldCheck, label: 'VPN & Spoofing Detection', sub: 'Bypass-attempt alerts', accent: '#ef4444', to: '/app/settings/detections' },
      { icon: Crown, label: 'Subscription', sub: 'Free plan', badge: 'FREE', badgeColor: '#64748b', accent: '#a855f7', to: '/app/settings/subscription' },
    ] },
    { label: t('settings.preferences'), items: [
      { icon: Bell, label: t('common.notifications'), accent: '#f59e0b', to: '/app/notifications' },
      { icon: Info, label: t('lang.title'), accent: '#a855f7', to: '/app/settings/language' },
      { icon: Info, label: 'Appearance', accent: '#ec4899', to: '/app/settings/appearance' },
      { icon: Info, label: 'Connected Devices', accent: '#10b981', to: '/app/settings/devices' },
    ] },
    { label: t('settings.dataPrivacy'), items: [
      { icon: Database, label: t('settings.dataPrivacy'), sub: 'Download, export, retention', accent: '#06b6d4', to: '/app/settings/data' },
      { icon: HardDriveDownload, label: 'Data Export', accent: '#3b82f6', to: '/app/settings/export' },
    ] },
    { label: t('settings.supportLegal'), items: [
      { icon: BookOpen, label: 'User Manual', sub: 'Guides, FAQ & troubleshooting', accent: '#06b6d4', to: '/app/settings/manual' },
      { icon: LifeBuoy, label: 'Support', accent: '#10b981', to: '/app/settings/support' },
      { icon: Phone, label: 'Contact', accent: '#06b6d4', to: '/app/settings/contact' },
      { icon: Scale, label: 'Legal', accent: '#64748b', to: '/app/settings/legal' },
      { icon: BadgeCheck, label: 'Compliance', accent: '#22c55e', to: '/app/settings/compliance' },
      { icon: Info, label: 'About & Version', accent: '#64748b', to: '/app/settings/about' },
      { icon: Code2, label: 'Open Source', accent: '#64748b', to: '/app/settings/licenses' },
      { icon: Copyright, label: 'Copyright', accent: '#64748b', to: '/app/settings/copyright' },
    ] },
  ];
  return (
    <Page title={t('settings.title')} back={false}>
      <Card className="p-4 flex items-center gap-4"><div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-black text-xl">J</div><div><p className="text-white font-black text-[16px]">Jane Doe</p><p className="text-slate-500 text-[12.5px] font-semibold">jane@family.com</p></div></Card>
      {G.map((g) => (<div key={g.label} className="flex flex-col gap-2.5"><Label>{g.label}</Label><Card className="divide-y divide-white/[0.05]">{g.items.map((it) => <Row key={it.label} {...it} onClick={() => navigate(it.to)} />)}</Card></div>))}
      <Card className="divide-y divide-white/[0.05]">
        <Row icon={RotateCcw} label={t('common.resetSettings')} sub="Requires Security PIN" accent="#64748b" onClick={() => setPinOpen(true)} />
        <Row icon={Info} label={t('common.signOut')} badge="" accent="#f59e0b" onClick={() => navigate('/welcome')} />
        <Row icon={Trash2} label={t('common.deleteAccount')} danger onClick={() => navigate('/app/settings/delete')} />
      </Card>

      {/* Store-ready legal / version footer */}
      <div className="pt-2 pb-4 flex flex-col items-center gap-2 text-center">
        <p className="text-slate-600 text-[11px] font-bold">AlphaGuard AI · Version 2.0.0 · Build 2026.06.12</p>
        <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] font-semibold text-slate-500">
          {[['Privacy', '/app/settings/legal/privacy'], ['Terms', '/app/settings/legal/terms'], ['Child Safety', '/app/settings/legal/child-safety'], ['Data', '/app/settings/legal/data-protection'], ['Cookie', '/app/settings/legal/cookie'], ['Refund', '/app/settings/legal/refund'], ['Support', '/app/settings/support'], ['Contact', '/app/settings/contact'], ['Licenses', '/app/settings/licenses'], ['© 2026', '/app/settings/copyright']].map(([t, to]) => (
            <button key={t} onClick={() => navigate(to)} className="ag-tap hover:text-white">{t}</button>
          ))}
        </div>
      </div>

      {/* PIN gate for sensitive action */}
      {pinOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { setPinOpen(false); setPin(''); }} />
          <div className="relative z-10 w-full max-w-[440px] bg-[#0b0c14] border border-white/10 rounded-t-[28px] p-6" style={{ paddingBottom: 'calc(1.5rem + var(--ag-safe-bottom))' }}>
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15" />
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center"><ShieldCheck size={24} className="text-cyan-400" /></div>
              <p className="text-white font-black text-[16px]">Enter Parent Security PIN</p>
              <p className="text-slate-500 text-[12.5px] font-semibold">Required to reset settings.</p>
              <div className="relative w-full" onClick={(e) => e.currentTarget.querySelector('input').focus()}>
                <input autoFocus type="tel" inputMode="numeric" value={pin} maxLength={6} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))} className="absolute inset-0 w-full h-full opacity-0" />
                <div className="flex items-center justify-center gap-2">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className={`flex items-center justify-center w-11 h-14 rounded-2xl border-2 text-[20px] font-black text-white ${i < pin.length ? 'border-cyan-400/60 bg-cyan-500/[0.06]' : 'border-white/[0.08] bg-[#0b0c14]'}`}>{pin[i] ? '•' : ''}</div>))}</div>
              </div>
              <div className="flex gap-3 w-full mt-2">
                <button onClick={() => { setPinOpen(false); setPin(''); }} className="ag-tap flex-1 h-12 rounded-full bg-white/[0.05] border border-white/10 text-white font-bold">Cancel</button>
                <button disabled={pin.length !== 6} onClick={confirmReset} className="ag-tap flex-1 h-12 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold disabled:opacity-50">Confirm</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
};

export const CopyrightCenter = () => (<Doc title="Copyright" sub="Intellectual property" blocks={[
  { h: 'Copyright Notice', t: '© 2026 AlphaGuard AI, Inc. All rights reserved.' },
  { h: 'Trademark Information', t: 'AlphaGuard AI™ and the shield logo are trademarks of AlphaGuard AI, Inc.' },
  { h: 'Brand & Logo Usage', t: 'The AlphaGuard brand and logo may not be used without written permission. See brand guidelines for approved usage.' },
  { h: 'Intellectual Property', t: 'All software, designs, and content are protected by copyright and other intellectual-property laws.' },
]} />);
