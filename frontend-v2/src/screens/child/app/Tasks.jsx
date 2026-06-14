import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, StickyNote, ListChecks, X } from 'lucide-react';
import { useTasks, STATE_META } from '../../../lib/useTasks';
import { api } from '../../../lib/agClient';

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
  const submit = async () => { if (!title.trim()) return; await onCreate({ title: title.trim(), note: note.trim() }); setTitle(''); setNote(''); onClose(); };
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 34 }}
        className="relative z-10 w-full max-w-[440px] bg-[#0b0f0d] border border-white/10 rounded-t-[28px] p-6" style={{ paddingBottom: 'calc(1.5rem + var(--ag-safe-bottom))' }}>
        <div className="flex items-center justify-between mb-4"><p className="text-white font-black text-[16px]">New Task</p><button onClick={onClose} className="ag-tap text-slate-400"><X size={20} /></button></div>
        <input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What do you need to do?" className="w-full h-12 rounded-2xl bg-[#11161300] border border-white/10 px-4 text-[15px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40 mb-3" style={{ background: '#0e1411' }} />
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note (optional)" className="w-full h-12 rounded-2xl border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none focus:border-emerald-400/40 mb-4" style={{ background: '#0e1411' }} />
        <button onClick={submit} disabled={!title.trim()} className="ag-tap w-full h-12 rounded-full bg-gradient-to-r from-emerald-500 to-cyan-600 text-white font-extrabold disabled:opacity-50">Add Task</button>
      </motion.div>
    </div>
  );
};

const ChildTasks = () => {
  const { tasks, loading, error, cycle, setTasks } = useTasks('child');
  const [sheet, setSheet] = useState(false);

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
          <h1 className="text-[24px] font-black text-white tracking-tight leading-none">My Tasks</h1>
          <p className="text-emerald-400/90 text-[13px] font-bold mt-1.5">{done}/{tasks.length} completed</p>
        </div>
        <button onClick={() => setSheet(true)} className="ag-tap w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-600 flex items-center justify-center shadow-[0_8px_24px_rgba(16,185,129,0.4)]"><Plus size={22} className="text-white" /></button>
      </div>

      {error && <div className="p-4 rounded-2xl bg-rose-500/[0.08] border border-rose-500/20"><p className="text-rose-400 text-[13px] font-semibold text-center">{error}</p></div>}

      {!loading && tasks.length === 0 && !error && (
        <div className="flex flex-col items-center text-center gap-2 py-14">
          <ListChecks size={34} className="text-slate-600" />
          <p className="text-white font-bold text-[15px]">All clear!</p>
          <p className="text-slate-500 text-[13px] font-semibold">Tap + to add your first task.</p>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
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
                  <p className="text-slate-600 text-[11px] font-bold mt-0.5">{t.source === 'parent' ? 'From your parent' : 'Added by you'} · {m.label}</p>
                </div>
                {t.source === 'child' && (
                  <button onClick={() => del(t.id)} aria-label="Delete" className="ag-tap w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0"><Trash2 size={14} className="text-slate-400" /></button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <NewTaskSheet open={sheet} onClose={() => setSheet(false)} onCreate={create} />
    </div>
  );
};

export default ChildTasks;
