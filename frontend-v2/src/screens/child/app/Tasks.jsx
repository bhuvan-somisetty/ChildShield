import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, StickyNote, ListChecks, X, Target } from 'lucide-react';
import { MessageCircle, Send } from 'lucide-react';
import { useTasks, STATE_META, CATEGORY_COLOR, CATEGORIES } from '../../../lib/useTasks';
import { useLiveList, TARGET_STATUS } from '../../../lib/useGrowth';
import { ensureSession } from '../../../lib/session';
import { api } from '../../../lib/agClient';

// Child-side task discussion (realtime).
const CommentsSheet = ({ taskId, onClose }) => {
  const [items, setItems] = useState([]);
  const [body, setBody] = useState('');
  useEffect(() => {
    if (!taskId) return undefined;
    api.taskComments(taskId).then((r) => setItems(r.comments)).catch(() => {});
    let off = () => {};
    ensureSession('child').then((s) => { const h = (c) => { if (c.taskId === taskId) setItems((p) => (p.some((x) => x.id === c.id) ? p : [...p, c])); }; s.socket.on('task:comment', h); off = () => s.socket.off('task:comment', h); }).catch(() => {});
    return () => off();
  }, [taskId]);
  const send = async () => { if (!body.trim()) return; const r = await api.commentTask(taskId, body.trim()); setItems(r.comments); setBody(''); };
  if (!taskId) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 34 }} className="relative z-10 w-full max-w-[440px] bg-[#0b0f0d] border border-white/10 rounded-t-[28px] p-5" style={{ paddingBottom: 'calc(1.25rem + var(--ag-safe-bottom))' }}>
        <p className="text-white font-black text-[15px] mb-3">Task Chat</p>
        <div className="max-h-[40vh] overflow-y-auto ag-no-scrollbar flex flex-col gap-2 mb-3">
          {items.length === 0 ? <p className="text-slate-500 text-[13px] font-semibold text-center py-4">No messages yet.</p> : items.map((c) => (
            <div key={c.id} className={`p-2.5 rounded-2xl border max-w-[85%] ${c.authorRole === 'child' ? 'self-end bg-emerald-500/[0.08] border-emerald-500/15' : 'self-start bg-cyan-500/[0.06] border-cyan-500/15'}`}><p className="text-[10px] font-black uppercase" style={{ color: c.authorRole === 'child' ? '#10b981' : '#06b6d4' }}>{c.authorRole === 'child' ? 'You' : 'Parent'}</p><p className="text-slate-200 text-[13px] font-medium">{c.body}</p></div>
          ))}
        </div>
        <div className="flex items-center gap-2"><input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Message…" className="flex-1 h-11 rounded-2xl bg-[#0e1411] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none" /><button onClick={send} className="ag-tap w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center"><Send size={17} className="text-white" /></button></div>
      </motion.div>
    </div>
  );
};

// Child Targets view — see goals and nudge personal progress.
const ChildTargets = () => {
  const { items, setItems, loading } = useLiveList('child', null, { name: 'target', load: () => api.listTargets().then((r) => r.targets) });
  const bump = async (t) => {
    const progress = Math.min(100, (t.progress || 0) + 10);
    setItems((p) => p.map((x) => (x.id === t.id ? { ...x, progress } : x)));
    const { target } = await api.updateTarget(t.id, { progress });
    setItems((p) => p.map((x) => (x.id === t.id ? target : x)));
  };
  if (!loading && items.length === 0) return <div className="flex flex-col items-center text-center gap-2 py-14"><Target size={34} className="text-slate-600" /><p className="text-white font-bold text-[15px]">No goals yet</p><p className="text-slate-500 text-[13px] font-semibold">Your parent will set goals for you.</p></div>;
  return (
    <div className="flex flex-col gap-2.5">
      {items.map((t) => {
        const m = TARGET_STATUS[t.status] || TARGET_STATUS.not_started;
        return (
          <div key={t.id} className="p-4 rounded-[22px] border bg-[#0b0f0d]" style={{ borderColor: `${m.color}33` }}>
            <div className="flex items-center justify-between"><p className="text-white font-bold text-[15px]">{t.title}</p><span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${m.color}1a`, color: m.color }}>{m.label}</span></div>
            <div className="flex items-center justify-between mt-2.5 mb-1.5"><span className="text-slate-400 text-[12px] font-bold">{t.category}</span><span className="text-white text-[13px] font-black">{t.progress}%</span></div>
            <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden"><div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-cyan-500" style={{ width: `${t.progress}%` }} /></div>
            {t.status !== 'completed' && <button onClick={() => bump(t)} className="ag-tap mt-3 w-full h-10 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[13px] font-bold">+10% progress</button>}
          </div>
        );
      })}
    </div>
  );
};

// Big tap target that cycles ⬜ → ✅ → ❌ → ⬜ with a spring pop.
const StateButton = ({ state, onTap }) => {
  const m = STATE_META[state] || STATE_META.not_started;
  return (
    <button onClick={onTap} aria-label={`Cycle status (now ${m.label})`} className="ag-tap relative flex-shrink-0">
      <AnimatePresence mode="wait">
        <motion.span key={state} initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} transition={{ type: 'spring', stiffness: 500, damping: 24 }}
          className="flex items-center justify-center w-12 h-12 rounded-2xl border-2 text-[26px] leading-none"
          style={{ borderColor: `${m.color}66`, background: `${m.color}1a` }}>
          {m.icon}
        </motion.span>
      </AnimatePresence>
    </button>
  );
};

const NewTaskSheet = ({ open, onClose, onCreate }) => {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('Homework');
  const submit = async () => { if (!title.trim()) return; await onCreate({ title: title.trim(), note: note.trim(), category }); setTitle(''); setNote(''); setCategory('Homework'); onClose(); };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 34 }}
        className="relative z-10 w-full max-w-[440px] bg-[#0b0f0d] border border-white/10 rounded-t-[28px] p-6" style={{ paddingBottom: 'calc(1.5rem + var(--ag-safe-bottom))' }}>
        <div className="flex items-center justify-between mb-4"><p className="text-white font-black text-[16px]">New Task</p><button onClick={onClose} className="ag-tap text-slate-400"><X size={20} /></button></div>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you need to do?" className="w-full h-12 rounded-2xl bg-[#11161300] border border-white/10 px-4 text-[15px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40 mb-3" style={{ background: '#0e1411' }} />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (optional)" className="w-full h-12 rounded-2xl border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40 mb-3" style={{ background: '#0e1411' }} />
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full h-12 rounded-2xl border border-white/10 px-3 text-[14px] text-white outline-none focus:border-emerald-400/40 mb-4" style={{ background: '#0e1411' }}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        <button onClick={submit} disabled={!title.trim()} className="ag-tap w-full h-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-extrabold disabled:opacity-50">Add Task</button>
      </motion.div>
    </div>
  );
};

const ChildTasks = () => {
  const { tasks, loading, error, cycle, setTasks } = useTasks('child');
  const [sheet, setSheet] = useState(false);
  const [tab, setTab] = useState('tasks');
  const [commentsId, setCommentsId] = useState(null);

  const create = useCallback(async (data) => {
    const { task } = await api.createTask(data);
    setTasks((prev) => [...prev, task]);
  }, [setTasks]);

  const del = useCallback(async (id) => { await api.deleteTask(id); setTasks((prev) => prev.filter((t) => t.id !== id)); }, [setTasks]);

  const done = tasks.filter((t) => t.completionState === 'completed').length;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-black text-white tracking-tight leading-none">Tasks &amp; Targets</h1>
          <p className="text-emerald-400/90 text-[13px] font-bold mt-1.5">{done}/{tasks.length} tasks done</p>
        </div>
        {tab === 'tasks' && <button onClick={() => setSheet(true)} className="ag-tap w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.4)]"><Plus size={22} className="text-white" /></button>}
      </div>

      <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
        {[['tasks', 'Tasks'], ['targets', 'Goals']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} className={`ag-tap flex-1 h-9 rounded-xl text-[13px] font-bold ${tab === id ? 'bg-white/[0.08] text-white' : 'text-slate-500'}`}>{label}</button>
        ))}
      </div>

      {tab === 'targets' && <ChildTargets />}

      {tab === 'tasks' && error && <div className="p-4 rounded-2xl bg-rose-500/[0.08] border border-rose-500/20"><p className="text-rose-400 text-[13px] font-semibold text-center">{error}</p></div>}

      {tab === 'tasks' && !loading && tasks.length === 0 && !error && (
        <div className="flex flex-col items-center text-center gap-2 py-14">
          <ListChecks size={34} className="text-slate-600" />
          <p className="text-white font-bold text-[15px]">All clear!</p>
          <p className="text-slate-500 text-[13px] font-semibold">Tap + to add your first task.</p>
        </div>
      )}

      <div className={`flex flex-col gap-2.5 ${tab === 'tasks' ? '' : 'hidden'}`}>
        <AnimatePresence initial={false}>
          {tasks.map((t) => {
            const m = STATE_META[t.completionState] || STATE_META.not_started;
            return (
              <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}
                className="flex items-center gap-3.5 p-3.5 rounded-[22px] border bg-[#0b0f0d]" style={{ borderColor: t.completionState === 'not_started' ? 'rgba(255,255,255,0.08)' : `${m.color}40` }}>
                <StateButton state={t.completionState} onTap={() => cycle(t.id)} />
                <div className="flex-1 min-w-0">
                  <p className={`font-bold text-[15px] leading-tight ${t.completionState === 'completed' ? 'text-slate-500 line-through' : 'text-white'}`}>{t.title}</p>
                  {t.note && <p className="text-amber-300/80 text-[12px] font-semibold mt-0.5 inline-flex items-center gap-1"><StickyNote size={11} /> {t.note}</p>}
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {t.category && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md" style={{ background: `${CATEGORY_COLOR[t.category] || '#64748b'}1a`, color: CATEGORY_COLOR[t.category] || '#94a3b8' }}>{t.category}</span>}
                    <span className="text-slate-600 text-[10.5px] font-bold">{t.source === 'parent' ? 'From parent' : 'By you'}</span>
                  </div>
                </div>
                <button onClick={() => setCommentsId(t.id)} aria-label="Chat" className="ag-tap w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0"><MessageCircle size={14} className="text-cyan-400" /></button>
                {t.source === 'child' && (
                  <button onClick={() => del(t.id)} aria-label="Delete" className="ag-tap w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0"><Trash2 size={14} className="text-slate-400" /></button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <NewTaskSheet open={sheet} onClose={() => setSheet(false)} onCreate={create} />
      <CommentsSheet taskId={commentsId} onClose={() => setCommentsId(null)} />
    </div>
  );
};

export default ChildTasks;
