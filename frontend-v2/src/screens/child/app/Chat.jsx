import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Smile, Check, CheckCheck, Phone } from 'lucide-react';
import { useChildApp } from '../../../child/ChildAppContext';
import { loadChat, sendChildMsg, receiveParentMsg } from '../../../child/chatStore';

const EMOJIS = ['😀', '😍', '🥰', '👍', '🙏', '🎉', '❤️', '😂', '🏠', '🏫', '📚', '⚽', '☀️', '🌙', '✅', '👋'];
const fmtTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
const Ticks = ({ status }) => status === 'read' ? <CheckCheck size={13} className="text-emerald-300" /> : status === 'delivered' ? <CheckCheck size={13} className="text-slate-500" /> : <Check size={13} className="text-slate-500" />;
const REPLY = (t) => { const q = t.toLowerCase(); if (q.includes('home')) return 'Okay sweetie, see you soon! 🏠'; if (q.includes('?')) return 'Yes of course 💙'; if (q.includes('love')) return 'Love you too! ❤️'; return 'Got it, thanks for letting me know 😊'; };

const Chat = () => {
  const { profile, liveChild, emitChat, onParentMessage } = useChildApp();
  const [msgs, setMsgs] = useState(() => loadChat(profile.id));
  const [text, setText] = useState('');
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs.length, typing]);

  // Live: receive the parent's real messages over the socket.
  useEffect(() => onParentMessage((m) => setMsgs([...receiveParentMsg(profile.id, m.text)])), [onParentMessage, profile.id]);

  const send = () => {
    const t = text.trim(); if (!t) return;
    setMsgs([...sendChildMsg(profile.id, t)]); setText(''); setEmojiOpen(false);
    if (liveChild) { emitChat(t); return; } // real parent replies over the socket
    setTyping(true);
    setTimeout(() => { setTyping(false); setMsgs([...receiveParentMsg(profile.id, REPLY(t))]); }, 1900);
  };

  return (
    <div className="flex flex-col" style={{ minHeight: 'calc(100dvh - 200px)' }}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-11 h-11 rounded-full bg-pink-500/15 border border-pink-400/30 flex items-center justify-center text-xl flex-shrink-0">👩</div>
        <div className="flex-1 min-w-0"><p className="text-white font-black text-[16px] leading-tight">{profile.parentName}</p><p className={`text-[11.5px] font-bold ${typing ? 'text-emerald-400' : 'text-emerald-400'}`}>{typing ? 'typing…' : 'Online'}</p></div>
        <a href={`tel:${profile.parentPhone}`} aria-label="Call parent" className="ag-tap w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center"><Phone size={17} className="text-emerald-400" /></a>
      </div>

      <div className="flex-1 flex flex-col gap-2 overflow-y-auto ag-no-scrollbar pb-2">
        {msgs.length === 0 && <p className="text-slate-500 text-[13px] font-semibold text-center py-10">Say hi to {profile.parentName} 👋</p>}
        {msgs.map((m) => (
          <div key={m.id} className={`flex ${m.from === 'child' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${m.from === 'child' ? 'bg-gradient-to-br from-emerald-500/25 to-teal-600/20 border border-emerald-400/25 rounded-tr-md' : 'bg-white/[0.05] border border-white/10 rounded-tl-md'}`}>
              <p className="text-white text-[14px] leading-relaxed">{m.text}</p>
              <div className="flex items-center justify-end gap-1 mt-0.5"><span className="text-slate-500 text-[10px] font-semibold">{fmtTime(m.at)}</span>{m.from === 'child' && <Ticks status={m.status} />}</div>
            </div>
          </div>
        ))}
        {typing && <div className="flex justify-start"><div className="bg-white/[0.05] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 flex gap-1">{[0, 1, 2].map((i) => <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} />)}</div></div>}
        <div ref={endRef} />
      </div>

      {emojiOpen && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-8 gap-1 p-2 mb-2 rounded-2xl bg-[#0b0c14] border border-white/10">
          {EMOJIS.map((e) => <button key={e} onClick={() => setText((t) => t + e)} className="ag-tap text-[20px] h-8">{e}</button>)}
        </motion.div>
      )}

      <div className="flex items-center gap-2 pb-1">
        <button onClick={() => setEmojiOpen((v) => !v)} aria-label="Emoji" className={`ag-tap w-11 h-11 rounded-full flex items-center justify-center border ${emojiOpen ? 'border-emerald-400/40 bg-emerald-500/15' : 'border-white/10 bg-white/[0.05]'}`}><Smile size={20} className={emojiOpen ? 'text-emerald-300' : 'text-slate-400'} /></button>
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder={`Message ${profile.parentName}…`} className="flex-1 h-11 rounded-full bg-[#11131d] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40" />
        <button onClick={send} disabled={!text.trim()} aria-label="Send" className="ag-tap w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-40" style={{ background: 'linear-gradient(140deg,#10b981,#059669)' }}><Send size={18} className="text-white" /></button>
      </div>
    </div>
  );
};

export default Chat;
