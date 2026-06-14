import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, History, X, ListChecks, StickyNote, MessageSquare, Repeat, Send } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/ui';
import { api } from '../../lib/agClient';
import { useTasks, STATE_META, CATEGORIES, CATEGORY_COLOR } from '../../lib/useTasks';
import { ensureSession } from '../../lib/session';
import TargetsPanel from './TargetsPanel';
import RewardsPanel from './RewardsPanel';
import Planner from './Planner';

const TABS = [{ id: 'tasks', label: 'Tasks' }, { id: 'targets', label: 'Targets' }, { id: 'rewards', label: 'Rewards' }, { id: 'planner', label: 'Planner' }];
const REPEATS = [['none', 'Does not repeat'], ['daily', 'Daily'], ['weekdays', 'Weekdays'], ['weekly', 'Weekly'], ['monthly', 'Monthly']];

// Realtime task comment thread (parent ↔ child).
const CommentsModal = ({ open, taskId, onClose }) => {
  const [items, setItems] = useState([]);
  const [body, setBody] = useState('');
  useEffect(() => {
    if (!open || !taskId) return undefined;
    api.taskComments(taskId).then((r) => setItems(r.comments)).catch(() => {});
    let off = () => {};
    ensureSession('parent').then((s) => { const h = (c) => { if (c.taskId === taskId) setItems((p) => (p.some((x) => x.id === c.id) ? p : [...p, c])); }; s.socket.on('task:comment', h); off = () => s.socket.off('task:comment', h); }).catch(() => {});
    return () => off();
  }, [open, taskId]);
  const send = async () => { if (!body.trim()) return; const r = await api.commentTask(taskId, body.trim()); setItems(r.comments); setBody(''); };
  return (
    <Modal open={open} onClose={onClose} variant="center" title="Task Discussion">
      <div className="max-h-[40vh] overflow-y-auto ag-no-scrollbar flex flex-col gap-2 mt-1 mb-3">
        {items.length === 0 ? <p className="text-slate-500 text-[13px] font-semibold text-center py-4">No comments yet.</p> : items.map((c) => (
          <div key={c.id} className={`p-2.5 rounded-2xl border max-w-[88%] ${c.authorRole === 'parent' ? 'self-end bg-indigo-500/[0.06] border-indigo-500/15' : 'self-start bg-cyan-500/[0.06] border-cyan-500/15'}`}>
            <p className="text-[10px] font-black uppercase" style={{ color: c.authorRole === 'parent' ? '#818cf8' : '#06b6d4' }}>{c.authorRole === 'parent' ? 'You' : 'Child'}</p>
            <p className="text-slate-200 text-[13px] font-medium">{c.body}</p>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2"><input value={body} onChange={(e) => setBody(e.target.value)} placeholder="Add a comment…" className="flex-1 h-11 rounded-2xl bg-[#0b0c14] border border-white/10 px-4 text-[14px] text-white placeholder:text-slate-600 outline-none" /><button onClick={send} className="ag-tap w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center"><Send size={17} className="text-white" /></button></div>
    </Modal>
  );
};

const StateChip = ({ state, onClick }) => {
  const m = STATE_META[state] || STATE_META.not_started;
  return (
    <button onClick={onClick} className="ag-tap flex items-center gap-1.5 px-2.5 h-8 rounded-xl border text-[12px] font-bold flex-shrink-0"
      style={{ borderColor: `${m.color}55`, background: `${m.color}1a`, color: m.color }}>
      <span className="text-[14px] leading-none">{m.icon}</span>{m.label}
    </button>
  );
};

const TaskEditor = ({ open, initial, childName, onClose, onSave }) => {
  const [f, setF] = useState({ title: '', description: '', note: '', category: 'Homework', repeat: 'none' });
  useEffect(() => { if (open) setF({ title: initial?.title || '', description: initial?.description || '', note: initial?.note || '', category: initial?.category || 'Homework', repeat: 'none' }); }, [open, initial]);
  return (
    <Modal open={open} onClose={onClose} variant="center" title={initial ? 'Edit Task' : `New Task${childName ? ` for ${childName}` : ''}`}>
      <div className="flex flex-col gap-3.5 mt-1">
        <Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Read for 20 minutes" />
        <div>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 px-1">Category</p>
          <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className="w-full h-11 rounded-2xl bg-[#0b0c14] border border-white/10 px-3 text-[14px] text-white outline-none">{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</select>
        </div>
        <Input label="Notes" icon={StickyNote} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} placeholder="Optional note" />
        {!initial && (
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 px-1 inline-flex items-center gap-1"><Repeat size={12} /> Repeat</p>
            <select value={f.repeat} onChange={(e) => setF({ ...f, repeat: e.target.value })} className="w-full h-11 rounded-2xl bg-[#0b0c14] border border-white/10 px-3 text-[14px] text-white outline-none">{REPEATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          </div>
        )}
        <div className="flex gap-3 mt-2">
          <div className="flex-1"><Button variant="secondary" onClick={onClose}>Cancel</Button></div>
          <div className="flex-1"><Button disabled={!f.title.trim()} onClick={() => onSave(f)}>{initial ? 'Save' : 'Create'}</Button></div>
        </div>
      </div>
    </Modal>
  );
};

const HistoryModal = ({ open, taskId, onClose }) => {
  const [items, setItems] = useState(null);
  useEffect(() => { if (open && taskId) { setItems(null); api.taskHistory(taskId).then((r) => setItems(r.history)).catch(() => setItems([])); } }, [open, taskId]);
  const describe = (h) => {
    if (h.changeType === 'create') return 'Created the task';
    if (h.changeType === 'state_change') return `Marked ${STATE_META[h.newValue]?.label || h.newValue}`;
    if (h.changeType === 'note') return 'Updated the note';
    if (h.changeType === 'delete') return 'Deleted the task';
    if (h.changeType === 'field_edit') return `Changed ${h.field}`;
    return h.changeType;
  };
  return (
    <Modal open={open} onClose={onClose} variant="center" title="Task History">
      <div className="mt-1 max-h-[50vh] overflow-y-auto ag-no-scrollbar flex flex-col gap-2.5">
        {items === null ? <p className="text-slate-500 text-[13px] font-semibold py-4 text-center">Loading…</p>
          : items.length === 0 ? <p className="text-slate-500 text-[13px] font-semibold py-4 text-center">No history yet.</p>
          : items.map((h) => (
            <div key={h.id} className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]">
              <span className={`mt-0.5 text-[10px] font-black px-2 py-1 rounded-full ${h.actorRole === 'parent' ? 'bg-indigo-500/15 text-indigo-300' : h.actorRole === 'child' ? 'bg-cyan-500/15 text-cyan-300' : 'bg-white/10 text-slate-300'}`}>{h.actorRole}</span>
              <div className="flex-1 min-w-0">
                <p className="text-white text-[13px] font-bold">{describe(h)}</p>
                <p className="text-slate-500 text-[11.5px] font-semibold mt-0.5">{new Date(h.at).toLocaleString()}</p>
              </div>
            </div>
          ))}
      </div>
    </Modal>
  );
};

const TasksCenter = () => {
  const [child, setChild] = useState(null);
  const [childErr, setChildErr] = useState('');
  const { tasks, loading, error, cycle, setTasks, reload } = useTasks('parent', child?.id);
  const [editor, setEditor] = useState({ open: false, task: null });
  const [historyId, setHistoryId] = useState(null);
  const [commentsId, setCommentsId] = useState(null);
  const [catFilter, setCatFilter] = useState(null);
  const [tab, setTab] = useState('tasks');

  useEffect(() => {
    api.listChildren()
      .then((r) => { const c = (r.children || [])[0]; if (c) setChild(c); else setChildErr('Connect a child device first to assign tasks.'); })
      .catch(() => setChildErr('Could not load your child profile.'));
  }, []);

  const save = useCallback(async (f) => {
    // New + repeating → create a recurring rule (instances arrive via socket).
    if (!editor.task && f.repeat && f.repeat !== 'none') {
      await api.createRecurring({ childId: child.id, title: f.title, category: f.category, note: f.note, frequency: f.repeat });
      setEditor({ open: false, task: null }); reload(); return;
    }
    const payload = { title: f.title, description: f.description, note: f.note, category: f.category };
    const { task } = editor.task ? await api.updateTask(editor.task.id, payload) : await api.createTask({ childId: child.id, ...payload });
    setTasks((prev) => { const i = prev.findIndex((t) => t.id === task.id); if (i === -1) return [...prev, task]; const n = prev.slice(); n[i] = task; return n; });
    setEditor({ open: false, task: null });
  }, [editor, child, setTasks, reload]);

  const del = useCallback(async (id) => { await api.deleteTask(id); setTasks((prev) => prev.filter((t) => t.id !== id)); }, [setTasks]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center"><ListChecks size={18} className="text-cyan-400" /></div>
          <div>
            <h1 className="text-[19px] font-black text-white tracking-tight leading-none">Tasks &amp; Targets</h1>
            {child && <p className="text-slate-500 text-[12px] font-semibold mt-1">{child.name}</p>}
          </div>
        </div>
        {child && tab === 'tasks' && <button onClick={() => setEditor({ open: true, task: null })} className="ag-tap inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-[13px] font-black"><Plus size={16} /> New</button>}
      </div>

      {/* Tab bar: Tasks | Targets | Rewards */}
      {child && (
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/[0.04] border border-white/[0.06]">
          {TABS.map((tb) => (
            <button key={tb.id} onClick={() => setTab(tb.id)} className={`ag-tap flex-1 h-9 rounded-xl text-[13px] font-bold transition-colors ${tab === tb.id ? 'bg-white/[0.08] text-white' : 'text-slate-500'}`}>{tb.label}</button>
          ))}
        </div>
      )}

      {child && tab === 'targets' && <TargetsPanel childId={child.id} childName={child.name} />}
      {child && tab === 'rewards' && <RewardsPanel childId={child.id} childName={child.name} />}
      {child && tab === 'planner' && <Planner />}

      {/* Category filter (Tasks tab) */}
      {child && tab === 'tasks' && tasks.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto ag-no-scrollbar pb-1">
          <button onClick={() => setCatFilter(null)} className={`ag-tap flex-shrink-0 h-8 px-3 rounded-full text-[12px] font-bold border ${!catFilter ? 'bg-white/[0.1] border-white/20 text-white' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>All</button>
          {[...new Set(tasks.map((t) => t.category).filter(Boolean))].map((c) => (
            <button key={c} onClick={() => setCatFilter(c)} className={`ag-tap flex-shrink-0 h-8 px-3 rounded-full text-[12px] font-bold border ${catFilter === c ? '' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`} style={catFilter === c ? { background: `${CATEGORY_COLOR[c] || '#64748b'}1f`, borderColor: `${CATEGORY_COLOR[c] || '#64748b'}66`, color: CATEGORY_COLOR[c] || '#94a3b8' } : undefined}>{c}</button>
          ))}
        </div>
      )}

      {childErr && <Card className="p-4"><p className="text-slate-400 text-[13px] font-semibold text-center">{childErr}</p></Card>}
      {error && <Card className="p-4"><p className="text-rose-400 text-[13px] font-semibold text-center">{error}</p></Card>}
      {child && tab === 'tasks' && !loading && tasks.length === 0 && !error && (
        <Card className="p-8 flex flex-col items-center text-center gap-2">
          <ListChecks size={30} className="text-slate-600" />
          <p className="text-white font-bold text-[14px]">No tasks yet</p>
          <p className="text-slate-500 text-[12.5px] font-semibold">Create the first task for {child.name}.</p>
        </Card>
      )}

      <div className={`flex flex-col gap-2.5 ${tab === 'tasks' ? '' : 'hidden'}`}>
        <AnimatePresence initial={false}>
          {tasks.filter((t) => !catFilter || t.category === catFilter).map((t) => (
            <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.2 }}>
              <Card className="p-3.5">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold text-[14.5px] leading-tight">{t.title}</p>
                    {t.description && <p className="text-slate-400 text-[12.5px] font-medium mt-0.5">{t.description}</p>}
                    {t.note && <p className="text-amber-300/80 text-[12px] font-semibold mt-1 inline-flex items-center gap-1"><StickyNote size={12} /> {t.note}</p>}
                    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${t.source === 'parent' ? 'bg-indigo-500/15 text-indigo-300' : 'bg-cyan-500/15 text-cyan-300'}`}>{t.source === 'parent' ? 'You' : 'Child'}</span>
                      {t.category && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md" style={{ background: `${CATEGORY_COLOR[t.category] || '#64748b'}1a`, color: CATEGORY_COLOR[t.category] || '#94a3b8' }}>{t.category}</span>}
                      {t.recurringId && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/[0.06] text-slate-400 inline-flex items-center gap-1"><Repeat size={10} /> Recurring</span>}
                      {t.dueAt && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/[0.06] text-slate-400">{String(t.dueAt).slice(5)}</span>}
                    </div>
                  </div>
                  <StateChip state={t.completionState} onClick={() => cycle(t.id)} />
                </div>
                <div className="flex items-center gap-1 mt-3 pt-3 border-t border-white/[0.06]">
                  <button onClick={() => setEditor({ open: true, task: t })} className="ag-tap flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-slate-300 hover:text-white text-[12px] font-bold"><Pencil size={13} /> Edit</button>
                  <button onClick={() => setCommentsId(t.id)} className="ag-tap flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-slate-300 hover:text-white text-[12px] font-bold"><MessageSquare size={13} /> Chat</button>
                  <button onClick={() => setHistoryId(t.id)} className="ag-tap flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-slate-300 hover:text-white text-[12px] font-bold"><History size={13} /> History</button>
                  <button onClick={() => del(t.id)} className="ag-tap flex items-center justify-center w-8 h-8 rounded-lg text-rose-400 hover:text-rose-300 ml-auto"><Trash2 size={13} /></button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <TaskEditor open={editor.open} initial={editor.task} childName={child?.name} onClose={() => setEditor({ open: false, task: null })} onSave={save} />
      <HistoryModal open={!!historyId} taskId={historyId} onClose={() => setHistoryId(null)} />
      <CommentsModal open={!!commentsId} taskId={commentsId} onClose={() => setCommentsId(null)} />
    </div>
  );
};

export default TasksCenter;
