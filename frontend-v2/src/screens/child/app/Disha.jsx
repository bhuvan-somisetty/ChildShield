import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Sparkles, Mic } from 'lucide-react';
import { useChildApp } from '../../../child/ChildAppContext';
import { childGreeting, childRespond, QUICK_PROMPTS } from '../../../child/dishaChild';

let _id = 1;
const Disha = () => {
  const navigate = useNavigate();
  const { profile, goals } = useChildApp();
  const [msgs, setMsgs] = useState(() => [{ id: _id++, role: 'disha', text: childGreeting(profile) }]);
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length, typing]);

  const ask = (t) => {
    const q = (t ?? text).trim(); if (!q) return;
    setMsgs((m) => [...m, { id: _id++, role: 'child', text: q }]); setText(''); setTyping(true);
    setTimeout(() => { setTyping(false); setMsgs((m) => [...m, { id: _id++, role: 'disha', text: childRespond(q, profile, goals) }]); }, 1100);
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 200px)' }}>
      {/* header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(140deg,#a855f7,#6366f1)' }}><Sparkles size={20} className="text-white" /></div>
        <div className="flex-1 min-w-0"><p className="text-white font-black text-[16px] leading-tight">DISHA</p><p className="text-violet-300 text-[11.5px] font-bold">Your study buddy</p></div>
        <button onClick={() => navigate('/child/app/disha/voice')} aria-label="Speak with DISHA" className="ag-tap flex items-center gap-1.5 px-3 h-10 rounded-2xl bg-violet-500/15 border border-violet-400/30 text-violet-200 font-bold text-[12.5px]"><Mic size={15} /> Speak</button>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto ag-no-scrollbar pb-2">
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'child' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[14px] leading-relaxed ${m.role === 'child' ? 'bg-gradient-to-br from-emerald-500/25 to-teal-600/20 border border-emerald-400/25 text-white rounded-tr-md' : 'bg-white/[0.05] border border-white/10 text-slate-200 rounded-tl-md'}`}>{m.text}</div>
          </div>
        ))}
        {typing && <div className="flex justify-start"><div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1">{[0, 1, 2].map((i) => <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-violet-300" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />)}</div></div>}
        <div ref={endRef} />
      </div>

      {/* quick prompts */}
      <div className="flex gap-2 overflow-x-auto ag-no-scrollbar -mx-1 px-1 mb-2">
        {QUICK_PROMPTS.map((p) => <button key={p.label} onClick={() => ask(p.text)} className="ag-tap flex-shrink-0 h-9 px-3.5 rounded-full text-[12px] font-bold border bg-[#0b0c14] border-white/10 text-slate-300">{p.label}</button>)}
      </div>

      <div className="flex items-center gap-2 pb-1">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && ask()} placeholder="Ask DISHA anything…" className="flex-1 h-11 rounded-full bg-[#11131d] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-violet-400/40" />
        <button onClick={() => ask()} disabled={!text.trim()} aria-label="Send" className="ag-tap w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40" style={{ background: 'linear-gradient(140deg,#a855f7,#6366f1)' }}><Send size={18} className="text-white" /></button>
      </div>
    </div>
  );
};

export default Disha;
