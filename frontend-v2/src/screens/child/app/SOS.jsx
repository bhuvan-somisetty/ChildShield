import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Siren, Phone, Navigation, MapPin, Shield, Hospital, Check, X } from 'lucide-react';
import { useChildApp } from '../../../child/ChildAppContext';
import { readLocation } from '../../../child/telemetry';
import { NEARBY_HOSPITALS, NEARBY_POLICE } from '../../../child/childData';
import { Page, Card, Label } from './ui';

const HOLD_MS = 1500;
const openMaps = (q) => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`, '_blank', 'noopener');

const SOSCenter = () => {
  const { profile, contacts, emitSOS } = useChildApp();
  const [progress, setProgress] = useState(0);
  const [sent, setSent] = useState(false);
  const raf = useRef(0); const start = useRef(0);
  const primary = contacts.find((c) => c.primary) || contacts[0];

  const begin = () => {
    if (sent) return;
    start.current = Date.now();
    const loop = () => {
      const p = Math.min(1, (Date.now() - start.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) { trigger(); return; }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
  };
  const cancel = () => { cancelAnimationFrame(raf.current); if (!sent) setProgress(0); };
  const trigger = async () => {
    cancelAnimationFrame(raf.current);
    setSent(true); setProgress(1);
    const loc = await readLocation();
    // Send the SOS to the backend → parent receives instantly over Socket.IO.
    emitSOS(loc);
    // Also record locally as a fallback.
    try {
      const log = JSON.parse(localStorage.getItem('ag_child_sos') || '[]');
      log.unshift({ at: Date.now(), childId: profile.id, location: loc });
      localStorage.setItem('ag_child_sos', JSON.stringify(log.slice(0, 20)));
    } catch { /* noop */ }
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const ring = 2 * Math.PI * 86;

  return (
    <Page title="Emergency SOS" sub="Hold the button to alert your family" back>
      {sent ? (
        <Card className="p-6 flex flex-col items-center text-center gap-3 border-emerald-500/30 bg-emerald-500/[0.05]">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center"><Check size={30} className="text-emerald-400" strokeWidth={3} /></motion.div>
          <p className="text-white font-black text-[17px]">Alert sent to your family</p>
          <p className="text-slate-400 text-[13px] font-semibold">{profile.parentName} has been notified with your location.</p>
          <button onClick={() => { setSent(false); setProgress(0); }} className="ag-tap mt-1 px-4 h-10 rounded-full bg-white/[0.06] border border-white/10 text-white font-bold text-[13px] flex items-center gap-2"><X size={15} /> I’m safe now</button>
        </Card>
      ) : (
        <div className="flex flex-col items-center py-3">
          <button
            onMouseDown={begin} onMouseUp={cancel} onMouseLeave={cancel}
            onTouchStart={begin} onTouchEnd={cancel}
            className="ag-tap relative w-[200px] h-[200px] rounded-full flex items-center justify-center select-none"
            aria-label="Hold to send SOS"
          >
            <motion.div className="absolute -inset-3 rounded-full bg-rose-500/25 blur-xl" animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.8 }} />
            <svg width="200" height="200" className="absolute -rotate-90">
              <circle cx="100" cy="100" r="86" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
              <circle cx="100" cy="100" r="86" stroke="#ef4444" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={ring} strokeDashoffset={ring * (1 - progress)} />
            </svg>
            <div className="relative w-[150px] h-[150px] rounded-full bg-gradient-to-br from-rose-500 to-red-700 border border-rose-300/30 flex flex-col items-center justify-center shadow-[0_12px_44px_rgba(239,68,68,0.5)]">
              <Siren size={44} className="text-white" />
              <span className="text-white font-black text-[14px] mt-1">HOLD</span>
            </div>
          </button>
          <p className="text-slate-500 text-[12.5px] font-semibold mt-5">{progress > 0 ? 'Keep holding…' : 'Press and hold for 1.5 seconds'}</p>
        </div>
      )}

      {/* Quick call primary */}
      {primary && (
        <a href={`tel:${primary.phone}`} className="ag-tap w-full flex items-center justify-center gap-2 h-[54px] rounded-2xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-extrabold text-[14px]"><Phone size={18} /> Call {primary.name}</a>
      )}

      <Label>Emergency Contacts</Label>
      <Card className="divide-y divide-white/[0.05]">
        {contacts.map((c) => (
          <div key={c.id} className="flex items-center gap-3.5 p-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0"><Phone size={17} className="text-emerald-400" /></div>
            <div className="flex-1 min-w-0"><p className="text-white font-bold text-[14px] truncate">{c.name}</p><p className="text-slate-500 text-[12px] font-semibold">{c.relation}</p></div>
            <a href={`tel:${c.phone}`} aria-label={`Call ${c.name}`} className="ag-tap w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center"><Phone size={16} className="text-emerald-400" /></a>
          </div>
        ))}
      </Card>

      <Label>Nearby Help</Label>
      {[{ list: NEARBY_POLICE, icon: Shield, a: '#3b82f6', kind: 'Police' }, { list: NEARBY_HOSPITALS, icon: Hospital, a: '#ef4444', kind: 'Hospital' }].map((g) => (
        <div key={g.kind} className="flex flex-col gap-2.5">
          {g.list.map((s) => (
            <Card key={s.name} className="p-4">
              <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: `${g.a}1f` }}><g.icon size={18} style={{ color: g.a }} /></div><div className="flex-1 min-w-0"><p className="text-white font-bold text-[13.5px] truncate">{s.name}</p><p className="text-slate-500 text-[12px] font-semibold">{g.kind} · {s.dist}</p></div></div>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <a href={`tel:${s.phone}`} className="ag-tap flex items-center justify-center gap-1.5 h-9 rounded-xl bg-emerald-500/15 text-emerald-300 font-bold text-[12px]"><Phone size={13} /> Call</a>
                <button onClick={() => openMaps(s.name)} className="ag-tap flex items-center justify-center gap-1.5 h-9 rounded-xl bg-white/[0.05] border border-white/10 text-white font-bold text-[12px]"><Navigation size={13} /> Maps</button>
              </div>
            </Card>
          ))}
        </div>
      ))}
    </Page>
  );
};

export default SOSCenter;
