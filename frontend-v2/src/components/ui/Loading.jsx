import React from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

/**
 * Loading — premium full-area loading state with a breathing shield.
 */
const Loading = ({ label = 'Securing your session', sub = 'One moment…', icon: Icon = ShieldCheck }) => (
  <div className="flex flex-col items-center text-center gap-6 px-8">
    <div className="relative w-20 h-20">
      <motion.div
        className="absolute inset-0 rounded-full border-2 border-cyan-400/30"
        animate={{ scale: [1, 1.25, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
      />
      <div className="absolute inset-0 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_44px_rgba(37,99,235,0.35)]">
        <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}>
          <Icon size={34} className="text-cyan-400" />
        </motion.div>
      </div>
    </div>
    <div>
      <p className="text-white font-extrabold text-[16px]">{label}</p>
      <p className="text-slate-500 text-[13px] font-semibold mt-1.5 max-w-[260px]">{sub}</p>
    </div>
  </div>
);

export default Loading;
