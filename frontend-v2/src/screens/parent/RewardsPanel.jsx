import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Gift, Check } from 'lucide-react';
import { Card, Button, Input, Modal } from '../../components/ui';
import { api } from '../../lib/agClient';
import { useLiveList, REWARD_STATUS } from '../../lib/useGrowth';

const StatusPill = ({ status }) => {
  const m = REWARD_STATUS[status] || REWARD_STATUS.pending;
  return <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${m.color}1a`, color: m.color }}>{m.label}</span>;
};

const RewardsPanel = ({ childId, childName }) => {
  const { items, setItems, loading, error } = useLiveList('parent', childId, { name: 'reward', load: (cid) => api.listRewards(cid).then((r) => r.rewards) });
  const [targets, setTargets] = useState([]);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ title: '', type: 'gift', promiseText: '', targetId: '', dueDate: '' });

  useEffect(() => { if (childId) api.listTargets(childId).then((r) => setTargets(r.targets)).catch(() => {}); }, [childId, open]);
  const targetTitle = (id) => targets.find((t) => t.id === id)?.title;

  const create = useCallback(async () => {
    if (!f.title.trim()) return;
    const { reward } = await api.createReward({ childId, ...f });
    setItems((p) => [...p, reward]); setOpen(false); setF({ title: '', type: 'gift', promiseText: '', targetId: '', dueDate: '' });
  }, [f, childId, setItems]);

  const setStatus = useCallback(async (r, status) => { const { reward } = await api.updateReward(r.id, { status }); setItems((p) => p.map((x) => (x.id === r.id ? reward : x))); }, [setItems]);
  const del = useCallback(async (id) => { await api.deleteReward(id); setItems((p) => p.filter((x) => x.id !== id)); }, [setItems]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-[12.5px] font-bold uppercase tracking-wide">Rewards &amp; Promises</p>
        <button onClick={() => setOpen(true)} className="ag-tap inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[12.5px] font-black"><Plus size={15} /> New Reward</button>
      </div>
      {error && <Card className="p-4"><p className="text-rose-400 text-[13px] font-semibold text-center">{error}</p></Card>}
      {!loading && items.length === 0 && <Card className="p-8 flex flex-col items-center gap-2 text-center"><Gift size={28} className="text-slate-600" /><p className="text-white font-bold text-[14px]">No rewards yet</p><p className="text-slate-500 text-[12.5px] font-semibold">Promise {childName} a reward for a target.</p></Card>}

      <AnimatePresence initial={false}>
        {items.map((r) => (
          <motion.div key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}>
            <Card className="p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-[18px]">🎁</span><p className="text-white font-bold text-[14.5px] leading-tight">{r.title}</p></div>
                  {r.promiseText && <p className="text-slate-400 text-[12.5px] font-medium mt-1 italic">“{r.promiseText}”</p>}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <StatusPill status={r.status} />
                    {r.targetId && targetTitle(r.targetId) && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-indigo-500/15 text-indigo-300">🎯 {targetTitle(r.targetId)}</span>}
                    {r.childAcknowledged && <span className="text-[10px] font-black px-1.5 py-0.5 rounded-md bg-cyan-500/15 text-cyan-300">Seen by child</span>}
                  </div>
                </div>
                <button onClick={() => del(r.id)} className="ag-tap w-8 h-8 rounded-lg bg-white/[0.05] flex items-center justify-center flex-shrink-0"><Trash2 size={14} className="text-rose-400" /></button>
              </div>
              {r.status !== 'delivered' && (
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-white/[0.06]">
                  {r.status === 'pending' && <button onClick={() => setStatus(r, 'unlocked')} className="ag-tap h-8 px-3 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[12px] font-bold">Unlock now</button>}
                  {r.status === 'unlocked' && <button onClick={() => setStatus(r, 'delivered')} className="ag-tap inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-[12px] font-bold"><Check size={13} /> Mark delivered</button>}
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </AnimatePresence>

      <Modal open={open} onClose={() => setOpen(false)} variant="center" title={`New Reward${childName ? ` for ${childName}` : ''}`}>
        <div className="flex flex-col gap-3.5 mt-1">
          <Input label="Reward" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="e.g. New Bicycle" />
          <Input label="Promise" value={f.promiseText} onChange={(e) => setF({ ...f, promiseText: e.target.value })} placeholder="If you score above 90%, I will buy you a bicycle." />
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wide mb-1.5 px-1">Link to target</p>
            <select value={f.targetId} onChange={(e) => setF({ ...f, targetId: e.target.value })} className="w-full h-12 rounded-2xl bg-[#0b0c14] border border-white/10 px-3 text-[14px] text-white outline-none">
              <option value="">No target</option>
              {targets.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
            </select>
          </div>
          <Input label="Due date" type="date" value={f.dueDate} onChange={(e) => setF({ ...f, dueDate: e.target.value })} />
          <div className="flex gap-3 mt-2"><div className="flex-1"><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button></div><div className="flex-1"><Button disabled={!f.title.trim()} onClick={create}>Create</Button></div></div>
        </div>
      </Modal>
    </div>
  );
};

export default RewardsPanel;
