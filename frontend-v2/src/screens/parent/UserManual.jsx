import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronDown, Search, X, BookOpen, ShieldCheck, Smartphone, Eye, Clock, Grid3x3,
  Siren, MapPin, Sparkles, Bell, KeyRound, Lock, Wifi, MessageCircle, HelpCircle, Wrench, Star,
} from 'lucide-react';

const Page = ({ title, sub, children }) => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>
        <div className="flex-1 min-w-0"><h1 className="text-[22px] font-black text-white tracking-tight leading-tight">{title}</h1>{sub && <p className="text-slate-500 text-[13px] font-semibold mt-0.5">{sub}</p>}</div>
      </div>
      {children}
    </div>
  );
};
const Card = ({ children, className = '' }) => <div className={`rounded-[22px] border border-white/[0.07] bg-[#0b0c14] ${className}`}>{children}</div>;
const Label = ({ children }) => <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-1">{children}</p>;

const TOPICS = [
  { i: ShieldCheck, a: '#06b6d4', q: 'What is AlphaGuard AI?', t: 'AlphaGuard AI is a family-safety platform that lets a parent protect a child’s device — live location, screen-time limits, app controls, monitoring, emergency SOS, and an AI assistant (DISHA), all from one dashboard.' },
  { i: Smartphone, a: '#3b82f6', q: 'How does pairing work?', t: 'Install AlphaGuard on the child’s phone, then connect it from your dashboard by scanning the QR code or entering the 6-digit pairing code shown on the child device. The dashboard unlocks once a child is connected.' },
  { i: Eye, a: '#a855f7', q: 'How does monitoring work?', t: 'Camera, Audio and Screen View open a live session only after you tap Start — nothing auto-starts. The child is always notified while monitoring is active. Camera and screen captures are saved to Monitoring History.' },
  { i: Clock, a: '#f59e0b', q: 'How does screen time work?', t: 'Set a daily limit, a weekly schedule, and per-app limits. Grant temporary extensions or Unlock-for-Today. When the limit is reached the device locks; educational and emergency apps stay available.' },
  { i: Grid3x3, a: '#10b981', q: 'How do app approvals work?', t: 'Children can’t install or remove apps freely. Each attempt creates a request you Approve or Reject from App Requests. Every decision is logged in the approval history.' },
  { i: Siren, a: '#ef4444', q: 'How does SOS work?', t: 'When a child triggers SOS, you get an instant alert with their name, location and battery, and DISHA can announce it by voice. Emergency contacts are notified based on your auto-action settings.' },
  { i: MapPin, a: '#06b6d4', q: 'How does Family Radar work?', t: 'Family Radar shows your child’s live location on a real map, distance and directions, plus nearby police and hospitals. You can navigate, share the location, or call the child directly.' },
  { i: Sparkles, a: '#a855f7', q: 'How does the AI Assistant work?', t: 'DISHA answers questions about your family in chat or premium voice mode. Ask “Where is Emma?”, “How much screen time today?” or “Show app requests”, and DISHA replies and navigates for you, in your language.' },
  { i: Bell, a: '#f59e0b', q: 'How do notifications work?', t: 'Notifications are grouped by category (Emergency, Location, Safe Zones, Screen Time, App Usage, AI, Security, System). Opening a category marks it read and the badge count drops immediately. You can archive or delete any alert.' },
  { i: KeyRound, a: '#3b82f6', q: 'How do permissions work?', t: 'During setup you grant Location and Notifications. The Permissions Center shows a health score and lets you enable anything later. Location powers Family Radar, directions and nearby services.' },
  { i: Lock, a: '#22c55e', q: 'How does privacy work?', t: 'Your family’s data is encrypted in transit and at rest and never sold. Monitoring is transparent — the child is always told when tools are used. You can export or delete your data anytime.' },
  { i: ShieldCheck, a: '#06b6d4', q: 'How does the Security PIN work?', t: 'A 4-digit Security PIN protects sensitive actions: deleting the account, removing a child, disabling monitoring, or changing security settings. Change it anytime, or recover it via email verification.' },
  { i: Wifi, a: '#ef4444', q: 'How does VPN detection work?', t: 'AlphaGuard flags VPNs, proxies, mock-location and GPS-spoofing apps the child might use to bypass monitoring. Each detection raises a Security Alert with the app, time, device and risk level.' },
  { i: MessageCircle, a: '#06b6d4', q: 'How does Child Chat work?', t: 'Message your child directly with read receipts, delivery status, typing indicators and emoji. Conversations are searchable and end-to-end encrypted.' },
];
const FAQ = [
  ['Is AlphaGuard available on iOS and Android?', 'Yes — the parent app and child app target both the App Store and Google Play.'],
  ['Can I protect more than one child?', 'Yes. Use the child switcher to add and switch between children; each has its own settings.'],
  ['What happens if my child turns the phone off?', 'You’ll see the device go offline with the last known status; alerts resume when it reconnects.'],
];
const TROUBLE = [
  ['Location not updating', 'Open Permissions and ensure Location and Background Location are enabled on both devices.'],
  ['Notifications not arriving', 'Enable Notification permission, and check Notification Settings for the category.'],
  ['Monitoring won’t connect', 'Make sure the child device is online; tap Start again to renegotiate the session.'],
];
const BEST = [
  'Talk to your child about monitoring — transparency builds trust.',
  'Set realistic screen-time limits and review them together weekly.',
  'Keep your Security PIN private and enable biometric login.',
];

const UserManual = () => {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(null);
  const ql = q.trim().toLowerCase();
  const topics = useMemo(() => (ql ? TOPICS.filter((t) => (t.q + t.t).toLowerCase().includes(ql)) : TOPICS), [ql]);

  return (
    <Page title="User Manual" sub="Everything about AlphaGuard AI">
      <Card className="flex items-center gap-3.5 p-4"><div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600/30 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center"><BookOpen size={22} className="text-cyan-400" /></div><div className="flex-1"><p className="text-white font-black text-[15px]">Help Center</p><p className="text-slate-500 text-[12.5px] font-semibold">Guides, FAQ & troubleshooting</p></div></Card>

      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the manual…" aria-label="Search manual" className="w-full h-11 rounded-2xl bg-[#0b0c14] border border-white/10 pl-10 pr-9 text-[14px] text-white placeholder:text-slate-600 focus:border-cyan-400/40 outline-none" />
        {q && <button onClick={() => setQ('')} aria-label="Clear" className="ag-tap absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><X size={15} /></button>}
      </div>

      <Label>{ql ? `${topics.length} results` : 'Guides'}</Label>
      <div className="flex flex-col gap-2.5">
        {topics.map((t, i) => {
          const isOpen = open === t.q;
          return (
            <Card key={t.q}>
              <button onClick={() => setOpen(isOpen ? null : t.q)} className="ag-tap w-full flex items-center gap-3.5 p-4 text-left">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${t.a}1f` }}><t.i size={17} style={{ color: t.a }} /></div>
                <span className="flex-1 text-white font-bold text-[14px]">{t.q}</span>
                <ChevronDown size={18} className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>{isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                  <p className="text-slate-300 text-[13.5px] font-medium leading-relaxed px-4 pb-4">{t.t}</p>
                </motion.div>
              )}</AnimatePresence>
            </Card>
          );
        })}
      </div>

      {!ql && (
        <>
          <Label>FAQ</Label>
          <Card className="divide-y divide-white/[0.05]">{FAQ.map(([qq, aa]) => (<div key={qq} className="p-4"><p className="text-white font-bold text-[13.5px] mb-1 flex items-center gap-2"><HelpCircle size={14} className="text-cyan-400" /> {qq}</p><p className="text-slate-400 text-[12.5px] font-medium leading-relaxed pl-6">{aa}</p></div>))}</Card>

          <Label>Troubleshooting</Label>
          <Card className="divide-y divide-white/[0.05]">{TROUBLE.map(([qq, aa]) => (<div key={qq} className="p-4"><p className="text-white font-bold text-[13.5px] mb-1 flex items-center gap-2"><Wrench size={14} className="text-amber-400" /> {qq}</p><p className="text-slate-400 text-[12.5px] font-medium leading-relaxed pl-6">{aa}</p></div>))}</Card>

          <Label>Best Practices</Label>
          <Card className="p-4 flex flex-col gap-3">{BEST.map((b, i) => (<div key={i} className="flex items-start gap-2.5"><Star size={15} className="text-violet-400 flex-shrink-0 mt-0.5" /><p className="text-slate-300 text-[13px] font-medium leading-relaxed">{b}</p></div>))}</Card>

          <Label>App Version & Release Notes</Label>
          <Card className="p-5"><p className="text-white font-black text-[14px]">AlphaGuard AI · v2.0.0</p><p className="text-slate-500 text-[12px] font-semibold mb-3">Build 2026.06.12</p><ul className="text-slate-400 text-[12.5px] font-medium leading-relaxed list-disc pl-4 space-y-1"><li>Premium DISHA voice assistant</li><li>Parent ↔ child chat</li><li>VPN & spoofing detection</li><li>App install/delete approvals</li><li>Live monitoring with capture history</li></ul></Card>
        </>
      )}
    </Page>
  );
};

export default UserManual;
