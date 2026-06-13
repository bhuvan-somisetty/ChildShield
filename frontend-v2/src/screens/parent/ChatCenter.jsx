import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Send, Smile, Search, X, Check, CheckCheck, Phone } from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useRealtime } from '../../context/RealtimeContext';

const EMOJIS = ['😀', '😍', '🥰', '👍', '🙏', '🎉', '❤️', '😂', '😢', '😮', '🏠', '🏫', '🎨', '📚', '⚽', '🍕', '☀️', '🌙', '✅', '👋'];
const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const Ticks = ({ status }) => status === 'read'
  ? <CheckCheck size={13} className="text-cyan-300" />
  : status === 'delivered' ? <CheckCheck size={13} className="text-slate-500" />
  : <Check size={13} className="text-slate-500" />;

// Canned child replies so the conversation feels alive (a socket replaces this).
const REPLY = (t) => {
  const q = t.toLowerCase();
  if (q.includes('home') || q.includes('come')) return 'On my way home now! 🏠';
  if (q.includes('?')) return 'Yes, all good here 👍';
  if (q.includes('love') || q.includes('❤')) return 'Love you too ❤️';
  return 'Okay! 😊';
};

const ChatCenter = () => {
  const navigate = useNavigate();
  const { child } = useChild();
  const { listChat, sendChat, receiveChat, live, liveChildId } = useRealtime();
  const realChat = live && child.id === liveChildId; // real child replies over the socket
  const msgs = listChat(child.id);
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length, typing]);

  const send = () => {
    const t = text.trim(); if (!t) return;
    sendChat(child.id, t); setText(''); setEmojiOpen(false);
    if (realChat) return; // the real child device will reply over the socket
    setTyping(true);
    setTimeout(() => { setTyping(false); receiveChat(child.id, REPLY(t)); }, 1900);
  };

  const filtered = useMemo(() => (search ? msgs.filter((m) => m.text.toLowerCase().includes(search.toLowerCase())) : msgs), [msgs, search]);

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 220px)' }}>
      {/* header */}
      <div className="flex items-center gap-3 mb-3">
        <button onClick={() => navigate(-1)} aria-label="Back" className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>
        <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ background: `${child.color}26`, border: `1px solid ${child.color}55` }}>{child.emoji}</div>
        <div className="flex-1 min-w-0"><p className="text-white font-black text-[16px] leading-tight">{child.name}</p><p className={`text-[11.5px] font-bold ${typing ? 'text-cyan-400' : child.online ? 'text-emerald-400' : 'text-slate-500'}`}>{typing ? 'typing…' : child.online ? 'Online' : 'Offline'}</p></div>
        <button onClick={() => setSearchOpen((v) => !v)} aria-label="Search messages" className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><Search size={18} /></button>
        <button onClick={() => (child.phone ? (window.location.href = `tel:${child.phone}`) : navigate('/app/settings/profile'))} aria-label={`Call ${child.name}`} className="ag-tap w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center"><Phone size={17} className="text-emerald-400" /></button>
      </div>

      {searchOpen && (
        <div className="relative mb-3">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search messages…" className="w-full h-10 rounded-2xl bg-[#0b0c14] border border-white/10 pl-9 pr-9 text-[13px] text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/40" />
          {search && <button onClick={() => setSearch('')} className="ag-tap absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"><X size={15} /></button>}
        </div>
      )}

      {/* messages */}
      <div className="flex-1 flex flex-col gap-2 overflow-y-auto ag-no-scrollbar pb-2">
        {filtered.length === 0 && <p className="text-slate-500 text-[13px] font-semibold text-center py-10">No messages</p>}
        {filtered.map((m) => (
          <div key={m.id} className={`flex ${m.from === 'parent' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${m.from === 'parent' ? 'bg-gradient-to-br from-cyan-500/25 to-blue-600/20 border border-cyan-400/25 rounded-tr-md' : 'bg-white/[0.05] border border-white/10 rounded-tl-md'}`}>
              <p className="text-white text-[14px] leading-relaxed">{m.text}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5"><span className="text-slate-500 text-[10px] font-semibold">{fmtTime(m.at)}</span>{m.from === 'parent' && <Ticks status={m.status} />}</div>
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start"><div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1">{[0, 1, 2].map((i) => <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />)}</div></div>
        )}
        <div ref={endRef} />
      </div>

      {/* emoji palette */}
      <AnimatePresence>
        {emojiOpen && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="grid grid-cols-10 gap-1 p-2 mb-2 rounded-2xl bg-[#0b0c14] border border-white/10">
            {EMOJIS.map((e) => <button key={e} onClick={() => setText((t) => t + e)} className="ag-tap text-[20px] h-8">{e}</button>)}
          </motion.div>
        )}
      </AnimatePresence>

      {/* composer */}
      <div className="flex items-center gap-2 pb-1">
        <button onClick={() => setEmojiOpen((v) => !v)} aria-label="Emoji" className={`ag-tap w-11 h-11 rounded-full flex items-center justify-center border ${emojiOpen ? 'border-cyan-400/40 bg-cyan-500/15' : 'border-white/10 bg-white/[0.05]'}`}><Smile size={20} className={emojiOpen ? 'text-cyan-300' : 'text-slate-400'} /></button>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={`Message ${child.name}…`} className="flex-1 h-11 rounded-full bg-[#11131d] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-cyan-400/40" />
        <button onClick={send} disabled={!text.trim()} aria-label="Send" className="ag-tap w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40" style={{ background: 'linear-gradient(140deg,#3b82f6,#06b6d4)' }}><Send size={18} className="text-white" /></button>
      </div>
      <p className="text-slate-600 text-[10.5px] font-semibold text-center pt-1">End-to-end encrypted · WebSocket-ready</p>
    </div>
  );
};

export default ChatCenter;
