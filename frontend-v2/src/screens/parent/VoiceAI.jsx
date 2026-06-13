import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, X, History, Search, Trash2, Repeat, Sparkles, Siren, ChevronLeft } from 'lucide-react';
import { VoiceAIProvider, useVoiceAI } from '../../voice/VoiceAIContext';
import { LANG_BY_CODE } from '../../i18n/languages';
import Orb from '../../components/voice/Orb';

const STATE_TEXT = {
  idle: 'Tap to speak with DISHA',
  listening: 'Listening…',
  thinking: 'Thinking…',
  speaking: 'DISHA is speaking…',
};

const Dots = () => (
  <span className="inline-flex gap-1 ml-1">{[0, 1, 2].map((i) => (
    <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-300" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />
  ))}</span>
);

const VoiceInner = () => {
  const navigate = useNavigate();
  const v = useVoiceAI();
  const [histOpen, setHistOpen] = useState(false);
  const [q, setQ] = useState('');

  // Auto-greeting when entering voice mode (TTS doesn't need a gesture in most browsers).
  useEffect(() => { const t = setTimeout(() => v.begin(), 700); return () => clearTimeout(t); }, []); // eslint-disable-line

  const langName = (LANG_BY_CODE[v.activeLang] || LANG_BY_CODE.en).name;
  const filtered = useMemo(() => v.messages.filter((m) => !q || m.text.toLowerCase().includes(q.toLowerCase())), [v.messages, q]);
  const onOrbTap = () => { if (v.state === 'idle') v.begin(); else v.toggleListen(); };

  return (
    <div className="fixed inset-0 z-[55] overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 30%, #0a1024 0%, #04060e 55%, #020308 100%)' }}>
      {/* ambient particles backdrop */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 26 }).map((_, i) => (
          <motion.span key={i} className="absolute rounded-full" style={{ width: 2 + (i % 3), height: 2 + (i % 3), left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, background: i % 2 ? '#22d3ee55' : '#7c3aed55' }} animate={{ opacity: [0.1, 0.5, 0.1], y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 4 + (i % 5), delay: i * 0.2 }} />
        ))}
      </div>

      {/* top bar */}
      <div className="relative z-10 flex items-center justify-between px-5" style={{ paddingTop: 'calc(var(--ag-safe-top) + 14px)' }}>
        <button onClick={() => { v.stopAll(); navigate('/app/ai'); }} aria-label="Back to AI" className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-200"><ChevronLeft size={20} /></button>
        <div className="flex items-center gap-2 px-3 h-9 rounded-full bg-white/[0.05] border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="text-slate-200 text-[12.5px] font-bold">{langName}</span>
        </div>
        <button onClick={() => setHistOpen(true)} aria-label="Conversation history" className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-200"><History size={19} /></button>
      </div>

      {/* centerpiece */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6" style={{ paddingTop: 'calc(var(--ag-safe-top) + 70px)', paddingBottom: 'calc(var(--ag-safe-bottom) + 224px)' }}>
        {/* DISHA label */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Sparkles size={16} className="text-violet-400" />
          <span className="text-violet-300 text-[12px] font-black uppercase tracking-[0.2em]">DISHA{v.emergency ? ' · Emergency' : ''}</span>
        </div>

        {/* Orb */}
        <button onClick={onOrbTap} aria-label={STATE_TEXT[v.state]} className="ag-tap relative my-6 outline-none flex-shrink-0">
          <OrbLazy state={v.state} level={v.level} emergency={v.emergency} />
        </button>

        {/* Status area — fixed height so changing state never shifts layout */}
        <div className="h-9 flex items-center justify-center flex-shrink-0">
          <motion.p key={v.state} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-white font-black text-[20px] tracking-tight flex items-center">
            {STATE_TEXT[v.state]}{v.state === 'thinking' && <Dots />}
          </motion.p>
        </div>

        {/* Conversation area — separate container, wraps up to 3 lines, max-width */}
        <div className="mt-4 min-h-[58px] w-full max-w-[330px] flex items-start justify-center text-center flex-shrink-0">
          {v.interim
            ? <p className="text-cyan-200/90 text-[14px] font-semibold italic leading-relaxed break-words">“{v.interim}”</p>
            : v.messages.length > 0 && <p className="text-slate-400 text-[13px] font-medium leading-relaxed line-clamp-3 break-words">{v.messages[v.messages.length - 1].text}</p>}
        </div>

        {!v.supported.stt && <p className="text-amber-300/80 text-[11.5px] font-semibold text-center max-w-[300px] mt-4 flex-shrink-0">Voice input needs a browser with the Web Speech API. DISHA will still speak responses.</p>}
      </div>

      {/* bottom controls */}
      <div className="absolute left-0 right-0 z-10 flex flex-col items-center gap-4" style={{ bottom: 'calc(var(--ag-safe-bottom) + 26px)' }}>
        <button onClick={v.announceSOS} aria-label="Play SOS announcement" className="ag-tap flex items-center gap-2 px-4 h-9 rounded-full bg-rose-500/15 border border-rose-400/30 text-rose-300 text-[12px] font-bold"><Siren size={14} /> SOS Voice Alert</button>
        <div className="flex items-center gap-3.5">
          <CtrlBtn icon={v.micOn ? Mic : MicOff} label="Mic" active={v.micOn} onClick={() => v.setMicOn(!v.micOn)} />
          <CtrlBtn icon={v.speakerOn ? Volume2 : VolumeX} label="Speaker" active={v.speakerOn} onClick={() => v.setSpeakerOn(!v.speakerOn)} />
          <button onClick={onOrbTap} aria-label={v.state === 'listening' ? 'Stop listening' : 'Start listening'} className="ag-tap w-[68px] h-[68px] rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(124,58,237,0.5)]" style={{ background: v.state === 'listening' ? 'linear-gradient(140deg,#ef4444,#b91c1c)' : 'linear-gradient(140deg,#3b82f6,#7c3aed)' }}>
            {v.state === 'listening' ? <MicOff size={26} className="text-white" /> : <Mic size={26} className="text-white" />}
          </button>
          <CtrlBtn icon={Repeat} label="Continuous" active={v.continuous} onClick={() => v.setContinuous(!v.continuous)} />
          <CtrlBtn icon={X} label="End" onClick={() => { v.stopAll(); navigate('/app/ai'); }} danger />
        </div>
      </div>

      {/* history sheet */}
      <AnimatePresence>
        {histOpen && (
          <motion.div className="fixed inset-0 z-[60] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setHistOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 34 }} className="relative z-10 w-full max-w-[440px] max-h-[80vh] bg-[#0b0c14] border border-white/10 rounded-t-[28px] flex flex-col" style={{ paddingBottom: 'calc(1rem + var(--ag-safe-bottom))' }}>
              <div className="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-white/15" />
              <div className="flex items-center justify-between px-5 py-3">
                <h3 className="text-white font-black text-[16px]">Conversation</h3>
                <div className="flex items-center gap-2">
                  <button onClick={v.clearHistory} aria-label="Clear conversation" className="ag-tap text-rose-400 text-[12px] font-bold flex items-center gap-1"><Trash2 size={14} /> Clear</button>
                  <button onClick={() => setHistOpen(false)} aria-label="Close" className="ag-tap text-slate-400"><X size={20} /></button>
                </div>
              </div>
              <div className="px-5 pb-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search transcripts…" className="w-full h-10 rounded-2xl bg-[#11131d] border border-white/10 pl-9 pr-3 text-[13px] text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/40" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto ag-no-scrollbar px-5 py-2 flex flex-col gap-2">
                {filtered.length === 0 ? <p className="text-slate-500 text-[13px] font-semibold text-center py-10">No conversation yet</p>
                  : filtered.map((m) => (
                    <div key={m.id} className={`group flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed ${m.role === 'user' ? 'bg-cyan-500/15 border border-cyan-400/25 text-cyan-50 rounded-tr-md' : 'bg-white/[0.05] border border-white/10 text-slate-200 rounded-tl-md'}`}>{m.text}
                        <button onClick={() => v.deleteMessage(m.id)} aria-label="Delete message" className="ag-tap ml-2 text-slate-500 opacity-0 group-hover:opacity-100"><Trash2 size={11} /></button>
                      </div>
                    </div>
                  ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CtrlBtn = ({ icon: I, label, active, danger, onClick }) => (
  <button onClick={onClick} aria-label={label} aria-pressed={!!active} className={`ag-tap flex flex-col items-center gap-1`}>
    <span className={`w-12 h-12 rounded-full flex items-center justify-center border ${danger ? 'border-rose-500/40 bg-rose-500/10' : active ? 'border-cyan-400/40 bg-cyan-500/15' : 'border-white/10 bg-white/[0.05]'}`}>
      <I size={19} className={danger ? 'text-rose-400' : active ? 'text-cyan-300' : 'text-slate-300'} />
    </span>
    <span className={`text-[9.5px] font-bold ${danger ? 'text-rose-400' : active ? 'text-cyan-300' : 'text-slate-500'}`}>{label}</span>
  </button>
);

const OrbLazy = (props) => <Orb {...props} size={296} />;

const VoiceAI = () => (
  <VoiceAIProvider><VoiceInner /></VoiceAIProvider>
);
export default VoiceAI;
