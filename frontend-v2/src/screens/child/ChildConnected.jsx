import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import { Screen, Button } from '../../components/ui';
import { CHILD, PARENT } from '../../data/childDemo';

const ChildConnected = () => {
  const navigate = useNavigate();
  return (
    <Screen align="between" glow="#10b981" footer={<Button iconRight={ArrowRight} onClick={() => navigate('/child/activate')}>Complete Device Setup</Button>}>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }} className="relative mb-8">
          {[0, 1].map((i) => (
            <motion.div key={i} className="absolute inset-0 rounded-full border border-emerald-400/40" animate={{ scale: [1, 1.6], opacity: [0.5, 0] }} transition={{ repeat: Infinity, duration: 2.4, delay: i * 0.8, ease: 'easeOut' }} />
          ))}
          <div className="relative w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)]">
            <ShieldCheck size={48} className="text-emerald-400" />
          </div>
        </motion.div>

        <h1 className="text-[26px] font-black text-white tracking-tight leading-tight max-w-[300px]">Child Device Connected</h1>
        <p className="text-slate-400 text-[14.5px] font-medium mt-3 max-w-[300px] leading-relaxed">
          Your device is connected to the parent account. Protection setup must be completed before monitoring can begin.
        </p>

        <div className="w-full mt-8 rounded-[22px] border border-white/[0.08] bg-[#0b0c14] divide-y divide-white/[0.05]">
          {[
            { k: 'Child', v: `${CHILD.name}, ${CHILD.age}`, badge: null },
            { k: 'Parent', v: `${PARENT.name} · ${PARENT.email}`, badge: null },
            { k: 'Device Status', v: 'Connected', badge: 'PENDING SETUP' },
          ].map((r) => (
            <div key={r.k} className="flex items-center justify-between px-4 py-3.5">
              <span className="text-slate-500 text-[12.5px] font-bold uppercase tracking-wide">{r.k}</span>
              <span className="flex items-center gap-2 text-white font-bold text-[13.5px]">
                {r.v}
                {r.badge && <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400">{r.badge}</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Screen>
  );
};

export default ChildConnected;
