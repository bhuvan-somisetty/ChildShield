import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck, MapPin, Bell, Phone, Check, ChevronRight, ChevronLeft,
  Plus, Trash2, Navigation, Users, PartyPopper,
} from 'lucide-react';
import { Screen, Button } from '../../components/ui';
import { useStepHistory } from '../../lib/useStepHistory';
import {
  getPerms, setPerms, requestLocation, requestNotifications,
  getContacts, setContacts, markSetupDone, isSetupDone,
} from '../../lib/permissions';

const TOTAL = 5;

const Bullet = ({ children }) => (
  <li className="flex items-start gap-2.5"><Check size={15} className="text-cyan-400 flex-shrink-0 mt-0.5" /><span className="text-slate-300 text-[13.5px] font-medium leading-relaxed">{children}</span></li>
);

const RELATIONSHIPS = ['Mother', 'Father', 'Guardian', 'Grandparent', 'Trusted Contact'];

const ParentSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [perms, setP] = useState(getPerms);
  const [busy, setBusy] = useState(false);

  // Returning parents skip the wizard entirely.
  useEffect(() => { if (isSetupDone()) navigate('/connect', { replace: true }); }, [navigate]);

  // Emergency contacts
  const [contacts, setC] = useState(getContacts);
  const [form, setForm] = useState({ name: '', rel: 'Mother', phone: '', email: '' });
  const addContact = () => {
    if (!form.name.trim() || !form.phone.trim()) return;
    const next = [...contacts, { ...form, id: Date.now() }];
    setC(next); setContacts(next); setForm({ name: '', rel: 'Mother', phone: '', email: '' });
  };
  const removeContact = (id) => { const next = contacts.filter((c) => c.id !== id); setC(next); setContacts(next); };

  const next = () => setStep((s) => Math.min(TOTAL, s + 1));
  const back = () => setStep((s) => Math.max(1, s - 1));
  useStepHistory(step, 1, back); // browser Back walks the wizard steps (state preserved)

  const askLocation = async () => { setBusy(true); const r = await requestLocation(); setP(getPerms()); setBusy(false); return r; };
  const askNotifications = async () => { setBusy(true); await requestNotifications(); setP(getPerms()); setBusy(false); };

  const finish = () => {
    // The Security PIN is created once, during signup, and stored server-side
    // (hashed). The wizard no longer collects a PIN — it only records that one
    // exists and finalizes device permissions.
    setPerms({ pinSet: true, battery: 'granted' });
    markSetupDone();
    navigate('/connect', { replace: true });
  };

  const statusPill = (s) => s === 'granted'
    ? <span className="text-[10px] font-black px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-400">ENABLED</span>
    : s === 'denied' ? <span className="text-[10px] font-black px-2 py-1 rounded-full bg-rose-500/15 text-rose-400">SKIPPED</span>
    : null;

  return (
    <Screen align="start" glow="#2563eb">
      {/* Progress header */}
      <div className="w-full flex items-center gap-3 mb-7">
        {step > 1 ? (
          <button onClick={back} aria-label="Go back" className="ag-tap w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={18} /></button>
        ) : <div className="w-9" />}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1.5"><span className="text-slate-400 text-[11px] font-bold uppercase tracking-wide">Parent Setup</span><span className="text-slate-500 text-[11px] font-bold">Step {step} of {TOTAL}</span></div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" initial={false} animate={{ width: `${(step / TOTAL) * 100}%` }} transition={{ ease: [0.16, 1, 0.3, 1] }} /></div>
        </div>
        <div className="w-9" />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }} className="flex-1 w-full flex flex-col">

          {/* STEP 1 — Welcome */}
          {step === 1 && (
            <div className="flex-1 flex flex-col">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-blue-600/30 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center mb-6"><ShieldCheck size={30} className="text-cyan-400" /></div>
              <h1 className="text-[28px] font-black text-white tracking-tight leading-tight">Welcome to AlphaGuard AI</h1>
              <p className="text-slate-400 text-[14px] font-semibold mt-2 leading-relaxed">Let’s set up everything to protect your family.</p>
              <ul className="flex flex-col gap-3 mt-7">
                <Bullet>Protect your family</Bullet>
                <Bullet>Monitor safety in real time</Bullet>
                <Bullet>Receive emergency alerts</Bullet>
                <Bullet>Manage screen time</Bullet>
                <Bullet>Stay connected, always</Bullet>
              </ul>
              <div className="flex-1" />
              <Button iconRight={ChevronRight} onClick={next} className="mt-8">Continue</Button>
            </div>
          )}

          {/* STEP 2 — Location */}
          {step === 2 && (
            <div className="flex-1 flex flex-col">
              <div className="w-16 h-16 rounded-3xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mb-6"><MapPin size={30} className="text-cyan-400" /></div>
              <h1 className="text-[26px] font-black text-white tracking-tight leading-tight">Allow Location Access</h1>
              <p className="text-slate-400 text-[14px] font-semibold mt-2">AlphaGuard uses your location to:</p>
              <ul className="flex flex-col gap-3 mt-5">
                <Bullet>Calculate distance from your child</Bullet>
                <Bullet>Provide navigation to your child</Bullet>
                <Bullet>Show nearby police stations</Bullet>
                <Bullet>Show nearby hospitals</Bullet>
                <Bullet>Emergency routing & Family Radar</Bullet>
              </ul>
              <div className="mt-5 flex items-center gap-2">{statusPill(perms.location)}</div>
              <div className="flex-1" />
              <div className="flex flex-col gap-3 mt-8">
                <Button icon={busy ? undefined : Navigation} loading={busy} onClick={async () => { await askLocation(); next(); }}>Allow Location Access</Button>
                <Button variant="ghost" onClick={next}>Not Now</Button>
              </div>
            </div>
          )}

          {/* STEP 3 — Notifications */}
          {step === 3 && (
            <div className="flex-1 flex flex-col">
              <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mb-6"><Bell size={30} className="text-amber-400" /></div>
              <h1 className="text-[26px] font-black text-white tracking-tight leading-tight">Stay Informed Instantly</h1>
              <p className="text-slate-400 text-[14px] font-semibold mt-2">Receive alerts for:</p>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-3 mt-5">
                <Bullet>SOS activations</Bullet><Bullet>Safe zone entry</Bullet>
                <Bullet>Safe zone exit</Bullet><Bullet>School arrival</Bullet>
                <Bullet>School departure</Bullet><Bullet>Low battery</Bullet>
                <Bullet>Device offline</Bullet><Bullet>Security alerts</Bullet>
              </ul>
              <div className="mt-5 flex items-center gap-2">{statusPill(perms.notifications)}</div>
              <div className="flex-1" />
              <div className="flex flex-col gap-3 mt-8">
                <Button icon={busy ? undefined : Bell} loading={busy} onClick={async () => { await askNotifications(); next(); }}>Enable Notifications</Button>
                <Button variant="ghost" onClick={next}>Not Now</Button>
              </div>
            </div>
          )}

          {/* STEP 4 — Emergency contacts */}
          {step === 4 && (
            <div className="flex-1 flex flex-col">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/15 border border-rose-400/30 flex items-center justify-center mb-5"><Phone size={28} className="text-rose-400" /></div>
              <h1 className="text-[25px] font-black text-white tracking-tight leading-tight">Emergency Contact Setup</h1>
              <p className="text-slate-400 text-[13.5px] font-semibold mt-2">Add people we can alert in an emergency.</p>

              {contacts.length > 0 && (
                <div className="flex flex-col gap-2 mt-5">{contacts.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-2xl border border-white/[0.08] bg-white/[0.03]">
                    <div className="w-9 h-9 rounded-xl bg-rose-500/15 flex items-center justify-center"><Users size={16} className="text-rose-400" /></div>
                    <div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px] truncate">{c.name} · <span className="text-slate-500">{c.rel}</span></p><p className="text-slate-500 text-[12px] font-semibold truncate">{c.phone}{c.email ? ` · ${c.email}` : ''}</p></div>
                    <button onClick={() => removeContact(c.id)} className="ag-tap w-8 h-8 rounded-lg bg-white/[0.06] flex items-center justify-center"><Trash2 size={14} className="text-slate-400" /></button>
                  </div>
                ))}</div>
              )}

              <div className="flex flex-col gap-2.5 mt-5">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" className="h-12 rounded-2xl bg-[#0b0c14] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 focus:border-cyan-400/40 outline-none" />
                <div className="flex gap-2 overflow-x-auto ag-no-scrollbar">{RELATIONSHIPS.map((r) => (<button key={r} onClick={() => setForm({ ...form, rel: r })} className={`ag-tap flex-shrink-0 h-9 px-3.5 rounded-full text-[12px] font-bold border ${form.rel === r ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>{r}</button>))}</div>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" placeholder="Phone Number" className="h-12 rounded-2xl bg-[#0b0c14] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 focus:border-cyan-400/40 outline-none" />
                <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="Email (optional)" className="h-12 rounded-2xl bg-[#0b0c14] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 focus:border-cyan-400/40 outline-none" />
                <button onClick={addContact} disabled={!form.name.trim() || !form.phone.trim()} className="ag-tap h-11 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 font-bold text-[13px] flex items-center justify-center gap-2 disabled:opacity-40"><Plus size={16} /> Add Contact</button>
              </div>

              <div className="flex-1" />
              <div className="flex gap-3 mt-7">
                <Button variant="secondary" onClick={next}>Skip</Button>
                <Button iconRight={ChevronRight} onClick={next}>Continue</Button>
              </div>
            </div>
          )}

          {/* STEP 5 — Complete */}
          {step === 5 && (
            <div className="flex-1 flex flex-col items-center text-center justify-center">
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }} className="w-24 h-24 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mb-7">
                <PartyPopper size={44} className="text-emerald-400" />
              </motion.div>
              <h1 className="text-[28px] font-black text-white tracking-tight leading-tight">Setup Complete</h1>
              <p className="text-slate-400 text-[14.5px] font-semibold mt-3 leading-relaxed max-w-[300px]">You’re ready to protect your family. The last step is to connect your child’s device.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step === TOTAL && <Button iconRight={ChevronRight} onClick={finish} className="mt-6">Connect Child Device</Button>}
    </Screen>
  );
};

export default ParentSetup;
