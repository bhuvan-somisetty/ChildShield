import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Check, Globe, ShieldCheck, Phone, HelpCircle, Info, ChevronRight, ChevronDown, MapPin, Bell, Mic,
} from 'lucide-react';
import { useChildApp } from '../../../child/ChildAppContext';
import { useI18n } from '../../../i18n/I18nContext';
import { LANGUAGES, LANG_BY_CODE } from '../../../i18n/languages';
import { requestLocation, requestNotifications } from '../../../lib/permissions';
import { Card, Label } from './ui';

const FAQ = [
  ['What is SOS?', 'Hold the big red button to instantly alert your family with your location when you need help.'],
  ['Can my parent see my screen?', 'Only when they start a monitoring session — and you’ll always be told when it’s active.'],
  ['How do I ask for more screen time?', 'Tap “Request more time” and your parent will get a request to approve.'],
];

const ChildSettings = () => {
  const navigate = useNavigate();
  const { profile, updateProfile } = useChildApp();
  const { lang, setLang } = useI18n();
  const [p, setP] = useState({ name: profile.name, grade: profile.grade, school: profile.school, photo: profile.photo || '' });
  const [saved, setSaved] = useState(false);
  const [open, setOpen] = useState(null); // 'lang' | 'perm' | 'help' | 'about'
  const [perm, setPerm] = useState({ location: 'prompt', notifications: 'prompt' });

  const onPhoto = (e) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setP((x) => ({ ...x, photo: r.result })); r.readAsDataURL(f); };
  const save = () => { updateProfile(p); setSaved(true); setTimeout(() => setSaved(false), 2000); };
  const initial = (p.name || 'A').trim()[0]?.toUpperCase() || 'A';
  const toggleSec = (k) => setOpen((o) => (o === k ? null : k));

  const Row = ({ icon: I, a, label, sub, onClick, openKey, expanded }) => (
    <button onClick={onClick} className="ag-tap w-full flex items-center gap-3.5 p-4">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${a}1f` }}><I size={17} style={{ color: a }} /></div>
      <div className="flex-1 text-left min-w-0"><p className="text-white font-bold text-[14px]">{label}</p>{sub && <p className="text-slate-500 text-[12px] font-semibold truncate">{sub}</p>}</div>
      {openKey ? <ChevronDown size={17} className={`text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`} /> : <ChevronRight size={17} className="text-slate-600" />}
    </button>
  );

  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-[24px] font-black text-white tracking-tight">Settings</h1>

      {/* Editable profile */}
      <Card className="p-5 flex items-center gap-4">
        <label className="ag-tap relative cursor-pointer">
          {p.photo ? <img src={p.photo} alt="" className="w-16 h-16 rounded-full object-cover" /> : <div className="w-16 h-16 rounded-full flex items-center justify-center text-3xl" style={{ background: `${profile.color}26`, border: `1px solid ${profile.color}55` }}>{profile.emoji}</div>}
          <span className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-[#0b0c14]"><Camera size={12} className="text-[#030307]" /></span>
          <input type="file" accept="image/*" onChange={onPhoto} className="hidden" />
        </label>
        <div className="flex-1 min-w-0"><p className="text-white font-black text-[17px] truncate">{p.name}</p><p className="text-slate-500 text-[12.5px] font-semibold truncate">{p.grade} · {p.school}</p></div>
      </Card>

      <div className="flex flex-col gap-2.5">
        <input value={p.name} onChange={(e) => { setP({ ...p, name: e.target.value }); setSaved(false); }} placeholder="Name" className="h-12 rounded-2xl bg-[#0b0c14] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40" />
        <input value={p.grade} onChange={(e) => { setP({ ...p, grade: e.target.value }); setSaved(false); }} placeholder="Class / Grade" className="h-12 rounded-2xl bg-[#0b0c14] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40" />
        <input value={p.school} onChange={(e) => { setP({ ...p, school: e.target.value }); setSaved(false); }} placeholder="School" className="h-12 rounded-2xl bg-[#0b0c14] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40" />
        <button onClick={save} className="ag-tap h-[52px] rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold flex items-center justify-center gap-2">{saved ? <><Check size={18} /> Saved</> : 'Save Changes'}</button>
      </div>

      <Label>Preferences</Label>
      <Card className="divide-y divide-white/[0.05]">
        <Row icon={Globe} a="#a855f7" label="Language" sub={(LANG_BY_CODE[lang] || LANG_BY_CODE.en).name} onClick={() => toggleSec('lang')} openKey expanded={open === 'lang'} />
        <AnimatePresence>{open === 'lang' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="max-h-[240px] overflow-y-auto ag-no-scrollbar">{LANGUAGES.slice(0, 16).map((l) => (
              <button key={l.code} onClick={() => setLang(l.code)} className="ag-tap w-full flex items-center justify-between px-4 py-3"><span className="text-white font-semibold text-[13.5px]">{l.name} <span className="text-slate-500">· {l.native}</span></span>{lang === l.code && <span className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"><Check size={12} className="text-[#030307]" strokeWidth={3.5} /></span>}</button>
            ))}</div>
          </motion.div>
        )}</AnimatePresence>

        <Row icon={ShieldCheck} a="#06b6d4" label="Permissions" sub="Location, notifications, mic" onClick={() => toggleSec('perm')} openKey expanded={open === 'perm'} />
        <AnimatePresence>{open === 'perm' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 pb-2 flex flex-col gap-2">
            {[{ k: 'location', i: MapPin, t: 'Location', fn: async () => { const v = await requestLocation(); setPerm((x) => ({ ...x, location: v })); } }, { k: 'notifications', i: Bell, t: 'Notifications', fn: async () => { const v = await requestNotifications(); setPerm((x) => ({ ...x, notifications: v })); } }].map((r) => (
              <div key={r.k} className="flex items-center gap-3 py-1.5"><r.i size={16} className="text-cyan-400" /><span className="flex-1 text-white font-bold text-[13.5px]">{r.t}</span>{perm[r.k] === 'granted' ? <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">ON</span> : <button onClick={r.fn} className="ag-tap text-[12px] font-bold px-3 h-8 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300">Enable</button>}</div>
            ))}
          </motion.div>
        )}</AnimatePresence>

        <Row icon={Phone} a="#10b981" label="Emergency Contacts" sub="Manage who can help you" onClick={() => navigate('/child/app/contacts')} />
      </Card>

      <Label>Support</Label>
      <Card className="divide-y divide-white/[0.05]">
        <Row icon={HelpCircle} a="#f59e0b" label="Help" sub="How AlphaGuard works" onClick={() => toggleSec('help')} openKey expanded={open === 'help'} />
        <AnimatePresence>{open === 'help' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 pb-3 flex flex-col gap-3 pt-1">
            {FAQ.map(([q, a]) => <div key={q}><p className="text-white font-bold text-[13px]">{q}</p><p className="text-slate-400 text-[12.5px] font-medium leading-relaxed mt-0.5">{a}</p></div>)}
          </motion.div>
        )}</AnimatePresence>
        <Row icon={Info} a="#64748b" label="About" sub="AlphaGuard Child · v2.0.0" onClick={() => toggleSec('about')} openKey expanded={open === 'about'} />
        <AnimatePresence>{open === 'about' && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden px-4 pb-4 pt-1">
            <p className="text-slate-400 text-[12.5px] font-medium leading-relaxed">AlphaGuard keeps you safe and connected with your family. You’re always told when safety tools are used. Version 2.0.0 · Build 2026.06.12</p>
          </motion.div>
        )}</AnimatePresence>
      </Card>
    </div>
  );
};

export default ChildSettings;
