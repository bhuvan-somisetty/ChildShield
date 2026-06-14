import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Target as TargetIcon, Minus } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/ui';
import { api } from '../../lib/agClient';
import { useLiveList, TARGET_STATUS } from '../../lib/useGrowth';

const PRIORITIES = ['low', 'normal', 'high'];

const StatusPill = ({ status }) => {
  const m = TARGET_STATUS[status] || TARGET_STATUS.not_started;
  return <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${m.color}1a`, color: m.color }}>{m.label}</span>;
};

const TargetsPanel = ({ childId, childName }) => {
  const { items, setItems, loading, error } = useLiveList('parent', childId, { name: 'target', load: (cid) => api.listTargets(cid).then((r) => r.targets) });
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', description: '', category: 'study', priority: 'normal', endDate: '' });

  const create = useCallback(async () => {
    if (!f.title.trim()) return;
    const { target } = await api.createTarget({ childId, ...f });
    setItems((p) => [...p, target]); setOpen(false); setF({ title: '', description: '', category: 'study', priority: 'normal', endDate: '' });
  }, [f, childId, setItems]);

  const setProgress = useCallback(async (t, delta) => {
    const progress = Math.max(0, Math.min(100, (t.progress || 0) + delta));
    setItems((p) => p.map((x) => (x.id === t.id ? { ...x, progress } : x)));
    const { target } = await api.updateTarget(t.id, { progress });
    setItems((p) => p.map((x) => (x.id === t.id ? target : x)));
  }, [setItems]);

  const del = useCallback(async (id) => { await api.deleteTarget(id); setItems((p) => p.filter((x) => x.id !== id)); }, [setItems]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-[12.5px] font-bold uppercase tracking-wide">Targets</p>
        <button onClick={() => setOpen(true)} className="ag-tap inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-[12.5px] font-black"><Plus size={15} /> New Target</button>
      </div>
      {error && <Card className="p-4"><p className="text-rose-400 text-[13px] font-semibold text-center">{error}</p></Card>}
      {!loading && items.length === 0 && <Card className="p-8 flex flex-col items-center gap-2 text-center"><TargetIcon size={28} className="text-slate-600" /><p className="text-white font-bold text-[14px]">No targets yet</p><p className="text-slate-500 text-[12.5px] font-semibold">Set a goal for {childName}.</p></Card>}

      <AnimatePresence initial={false}>
        {items.map((t) => (
          <motion.div key={t.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
            <Card className="p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-[14.5px] leading-tight">{t.title}</p>
                  <div className="flex items-center gap-1.5 mt-1"><StatusPill status={t.status} /><span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-white/[0.06] text-slate-400">{t.category}</span></div>
                </div>
                <button onClick={() => del(t.id)} className="ag-tap w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center"><Trash2 size={14} className="text-rose-400" /></button>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between mb-1.5"><span className="text-slate-400 text-[12px] font-bold">Progress</span><span className="text-white text-[13px] font-black">{t.progress}%</span></div>
                <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500" animate={{ width: `${t.progress}%` }} transition={{ ease: [0.16, 1, 0.3, 1] }} /></div>
                <div className="flex items-center gap-2 mt-2.5">
                  <button onClick={() => setProgress(t, -10)} className="ag-tap w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><Minus size={15} /></button>
                  <button onClick={() => setProgress(t, 10)} className="ag-tap w-9 h-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><Plus size={15} /></button>
                  <div className="flex-1" />
                  <button onClick={() => setProgress(t, 100 - (t.progress || 0))} className="ag-tap h-9 px-3 rounded-xl bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[12px] font-bold">Mark Complete</button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <Modal open={open} onClose={() => setOpen(false)} variant="center" title={`New Target${childName ? ` for ${childName}` : ''}`}>
        <div className="flex flex-col gap-3.5 mt-1">
          <Input label="Title" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. Score 90% in Mathematics" />
          <Input label="Category" value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} placeholder="study / reading / exercise" />
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 px-1">Priority</p>
            <div className="flex gap-2">{PRIORITIES.map((p) => <button key={p} onClick={() => setF({ ...f, priority: p })} className={`ag-tap flex-1 h-10 rounded-xl text-[12.5px] font-bold capitalize border ${f.priority === p ? 'bg-indigo-500/15 border-indigo-400/40 text-indigo-300' : 'bg-[#0b0c14] border-white/10 text-slate-400'}`}>{p}</button>)}</div>
          </div>
          <Input label="Target Date" type="date" value={f.endDate} onChange={(e) => setF({ ...f, endDate: e.target.value })} />
          <div className="flex gap-3 mt-2"><div className="flex-1"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button></div><div className="flex-1"><Button disabled={!f.title.trim()} onClick={create}>Create</Button></div></div>
        </div>
      </Modal>
    </div>
  );
};

export default TargetsPanel;
