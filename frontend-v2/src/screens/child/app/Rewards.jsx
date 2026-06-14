import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Gift, Lock, Check } from 'lucide-react';
import { useLiveList, REWARD_STATUS } from '../../../lib/useGrowth';
import { api } from '../../../lib/agClient';

const ChildRewards = () => {
  const { items, setItems, loading } = useLiveList('child', null, { name: 'reward', load: () => api.listRewards().then((r) => r.rewards) });

  const acknowledge = useCallback(async (r) => {
    setItems((p) => p.map((x) => (x.id === r.id ? { ...x, childAcknowledged: true } : x)));
    const { reward } = await api.updateReward(r.id, { childAcknowledged: true });
    setItems((p) => p.map((x) => (x.id === r.id ? reward : x)));
  }, [setItems]);

  const active = items.filter((r) => r.status !== 'delivered');
  const delivered = items.filter((r) => r.status === 'delivered');

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-[24px] font-black text-white tracking-tight leading-none">Rewards</h1>
        <p className="text-amber-400/90 text-[13px] font-bold mt-1.5">Waiting for you ✨</p>
      </div>

      {!loading && items.length === 0 && (
        <div className="flex flex-col items-center text-center gap-2 py-14"><Gift size={34} className="text-slate-600" /><p className="text-white font-bold text-[15px]">No rewards yet</p><p className="text-slate-500 text-[13px] font-semibold">Complete your goals to unlock rewards.</p></div>
      )}

      <div className="flex flex-col gap-3">
        {active.map((r) => {
          const m = REWARD_STATUS[r.status] || REWARD_STATUS.pending;
          const unlocked = r.status === 'unlocked';
          return (
            <motion.div key={r.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-[24px] border" style={{ background: unlocked ? 'linear-gradient(135deg,rgba(16,185,129,0.14),rgba(6,182,212,0.06))' : '#0b0f0d', borderColor: `${m.color}40` }}>
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-[26px] flex-shrink-0" style={{ background: `${m.color}1a` }}>🎁</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><p className="text-white font-black text-[16px] leading-tight">{r.title}</p>{!unlocked && <Lock size={13} className="text-slate-500" />}</div>
                  {r.promiseText && <p className="text-slate-300 text-[13px] font-medium mt-1 italic leading-snug">“{r.promiseText}”</p>}
                  <span className="inline-block mt-2 text-[10px] font-black px-2 py-0.5 rounded-full" style={{ background: `${m.color}1a`, color: m.color }}>{unlocked ? 'Unlocked! 🎉' : m.label}</span>
                </div>
              </div>
              {!r.childAcknowledged && (
                <button onClick={() => acknowledge(r)} className="ag-tap mt-3 w-full h-10 rounded-xl bg-white/[0.06] border border-white/10 text-white text-[13px] font-bold inline-flex items-center justify-center gap-1.5"><Check size={14} /> Got it</button>
              )}
            </motion.div>
          );
        })}
      </div>

      {delivered.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-slate-500 text-[12px] font-bold uppercase tracking-wide">Received</p>
          {delivered.map((r) => (
            <div key={r.id} className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/[0.06]"><span className="text-[20px]">🎉</span><p className="text-slate-300 font-bold text-[14px] flex-1">{r.title}</p><span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300">Delivered</span></div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChildRewards;
