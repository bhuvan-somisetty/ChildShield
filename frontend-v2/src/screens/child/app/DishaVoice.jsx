import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, X, ChevronLeft, Sparkles } from 'lucide-react';
import Orb from '../../../components/voice/Orb';
import { SpeechToText, speak, cancelSpeech, supportsSTT } from '../../../voice/speech';
import { useChildApp } from '../../../child/ChildAppContext';
import { childGreeting, childRespond } from '../../../child/dishaChild';

const STATE_TEXT = { idle: 'Tap to talk to DISHA', listening: 'Listening…', thinking: 'Thinking…', speaking: 'DISHA is speaking…' };
const Dots = () => <span className="inline-flex gap-1 ml-1">{[0, 1, 2].map((i) => <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-300" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />)}</span>;

const ChildDishaVoice = () => {
  const navigate = useNavigate();
  const { profile, goals } = useChildApp();
  const [state, setState] = useState('idle');
  const [level, setLevel] = useState(0);
  const [interim, setInterim] = useState('');
  const [last, setLast] = useState('');
  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const sttRef = useRef(null);
  const meter = useRef({ raf: 0, stream: null, ac: null, sim: 0 });
  const cfg = useRef({ micOn, speakerOn, profile, goals });
  cfg.current = { micOn, speakerOn, profile, goals };

  const stopMeter = useCallback(() => { const m = meter.current; if (m.raf) cancelAnimationFrame(m.raf); if (m.sim) clearInterval(m.sim); if (m.stream) m.stream.getTracks().forEach((t) => t.stop()); if (m.ac && m.ac.state !== 'closed') m.ac.close().catch(() => {}); meter.current = { raf: 0, stream: null, ac: null, sim: 0 }; setLevel(0); }, []);

  const startMic = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC();
      const src = ac.createMediaStreamSource(stream); const an = ac.createAnalyser(); an.fftSize = 256; src.connect(an);
      const data = new Uint8Array(an.frequencyBinCount); meter.current.stream = stream; meter.current.ac = ac;
      const loop = () => { an.getByteTimeDomainData(data); let s = 0; for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; s += v * v; } setLevel(Math.min(1, Math.sqrt(s / data.length) * 3.2)); meter.current.raf = requestAnimationFrame(loop); };
      loop();
    } catch { /* no mic */ }
  }, []);

  const startListening = useCallback(() => { if (!cfg.current.micOn) { setState('idle'); return; } setInterim(''); setState('listening'); startMic(); const stt = sttRef.current; if (stt && stt.supported) stt.start(); }, [startMic]);

  const speakOut = useCallback((text) => {
    setLast(text); setState('speaking');
    if (!cfg.current.speakerOn) { setTimeout(() => { stopMeter(); startListening(); }, 600); return; }
    meter.current.sim = setInterval(() => setLevel(0.35 + Math.random() * 0.5), 110);
    speak(text, { code: 'en', onEnd: () => { stopMeter(); if (cfg.current.micOn) startListening(); else setState('idle'); } });
  }, [stopMeter, startListening]);

  const handle = useCallback((t) => {
    if (!t) return; setInterim(''); stopMeter(); setState('thinking');
    setTimeout(() => speakOut(childRespond(t, cfg.current.profile, cfg.current.goals)), 900);
  }, [stopMeter, speakOut]);

  useEffect(() => {
    const stt = new SpeechToText(); stt.setLang('en'); stt.onPartial = setInterim; stt.onFinal = handle; stt.onError = () => stopMeter(); sttRef.current = stt;
    const t = setTimeout(() => speakOut(childGreeting(cfg.current.profile)), 700);
    return () => { clearTimeout(t); try { stt.stop(); } catch {} cancelSpeech(); stopMeter(); };
  }, []); // eslint-disable-line

  const onTap = () => { if (state === 'listening') { sttRef.current?.stop(); stopMeter(); setState('idle'); } else startListening(); };
  const end = () => { sttRef.current?.stop(); cancelSpeech(); stopMeter(); navigate('/child/app/disha'); };

  return (
    <div className="fixed inset-0 z-[55] overflow-hidden" style={{ background: 'radial-gradient(circle at 50% 30%, #120a24 0%, #06040e 55%, #020308 100%)' }}>
      <div className="absolute inset-0 pointer-events-none">{Array.from({ length: 24 }).map((_, i) => <motion.span key={i} className="absolute rounded-full" style={{ width: 2 + (i % 3), height: 2 + (i % 3), left: `${(i * 37) % 100}%`, top: `${(i * 53) % 100}%`, background: i % 2 ? '#a855f755' : '#22d3ee55' }} animate={{ opacity: [0.1, 0.5, 0.1], y: [0, -12, 0] }} transition={{ repeat: Infinity, duration: 4 + (i % 5), delay: i * 0.2 }} />)}</div>

      <div className="relative z-10 flex items-center justify-between px-5" style={{ paddingTop: 'calc(var(--ag-safe-top) + 14px)' }}>
        <button onClick={end} aria-label="Back" className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-200"><ChevronLeft size={20} /></button>
        <div className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-white/[0.05] border border-white/10"><Sparkles size={14} className="text-violet-300" /><span className="text-slate-200 text-[12.5px] font-bold">DISHA</span></div>
        <div className="w-10" />
      </div>

      <div className="relative z-10 h-full flex flex-col items-center justify-center px-6" style={{ paddingTop: 'calc(var(--ag-safe-top) + 70px)', paddingBottom: 'calc(var(--ag-safe-bottom) + 200px)' }}>
        <button onClick={onTap} aria-label={STATE_TEXT[state]} className="ag-tap relative my-6 outline-none flex-shrink-0"><Orb state={state} level={level} size={290} /></button>
        <div className="h-9 flex items-center justify-center flex-shrink-0"><motion.p key={state} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="text-white font-black text-[20px] tracking-tight flex items-center">{STATE_TEXT[state]}{state === 'thinking' && <Dots />}</motion.p></div>
        <div className="mt-4 min-h-[58px] w-full max-w-[330px] flex items-start justify-center text-center flex-shrink-0">{interim ? <p className="text-violet-200/90 text-[14px] font-semibold italic leading-relaxed break-words">“{interim}”</p> : last && <p className="text-slate-400 text-[13px] font-medium leading-relaxed line-clamp-3 break-words">{last}</p>}</div>
        {!supportsSTT() && <p className="text-amber-300/80 text-[11.5px] font-semibold text-center max-w-[300px] mt-4">Voice input needs a supported browser. DISHA will still speak.</p>}
      </div>

      <div className="absolute left-0 right-0 z-10 flex items-center justify-center gap-3.5" style={{ bottom: 'calc(var(--ag-safe-bottom) + 28px)' }}>
        <Ctrl icon={micOn ? Mic : MicOff} label="Mic" active={micOn} onClick={() => setMicOn(!micOn)} />
        <button onClick={onTap} aria-label="Talk" className="ag-tap w-[68px] h-[68px] rounded-full flex items-center justify-center shadow-[0_10px_40px_rgba(124,58,237,0.5)]" style={{ background: state === 'listening' ? 'linear-gradient(140deg,#ef4444,#b91c1c)' : 'linear-gradient(140deg,#a855f7,#6366f1)' }}>{state === 'listening' ? <MicOff size={26} className="text-white" /> : <Mic size={26} className="text-white" />}</button>
        <Ctrl icon={speakerOn ? Volume2 : VolumeX} label="Speaker" active={speakerOn} onClick={() => setSpeakerOn(!speakerOn)} />
        <Ctrl icon={X} label="End" danger onClick={end} />
      </div>
    </div>
  );
};

const Ctrl = ({ icon: I, label, active, danger, onClick }) => (
  <button onClick={onClick} aria-label={label} aria-pressed={!!active} className="ag-tap flex flex-col items-center gap-1">
    <span className={`w-12 h-12 rounded-full flex items-center justify-center border ${danger ? 'border-rose-500/40 bg-rose-500/10' : active ? 'border-violet-400/40 bg-violet-500/15' : 'border-white/10 bg-white/[0.05]'}`}><I size={19} className={danger ? 'text-rose-400' : active ? 'text-violet-300' : 'text-slate-300'} /></span>
    <span className={`text-[9.5px] font-bold ${danger ? 'text-rose-400' : active ? 'text-violet-300' : 'text-slate-500'}`}>{label}</span>
  </button>
);

export default ChildDishaVoice;
