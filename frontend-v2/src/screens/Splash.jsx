import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { BRAND_NAME } from '../components/ui';
import { getToken } from '../lib/agClient';
import { markInstalled, isOnboarded } from '../lib/lifecycle';

// Branded launch screen. Shows the AlphaGuard mark for ~1.4s, then routes:
//   • authenticated        → dashboard (/app)
//   • onboarded, logged out → login
//   • brand-new device      → onboarding intro (/welcome)
// Onboarded users are never sent back through onboarding.
const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    markInstalled(); // record first-ever launch (idempotent)
    const dest = getToken() ? '/app' : (isOnboarded() ? '/login' : '/welcome');
    const t = setTimeout(() => navigate(dest, { replace: true }), 1400);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="relative w-full overflow-hidden flex flex-col items-center justify-center" style={{ minHeight: '100dvh', background: 'var(--ag-bg)' }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-[#06070f] via-[#030307] to-[#02030a]" />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(80vw,420px)] aspect-square rounded-full blur-[120px]"
          style={{ background: 'radial-gradient(circle, #2563eb 0%, transparent 60%)' }}
          animate={{ opacity: [0.18, 0.32, 0.18] }}
          transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
        />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          className="flex items-center justify-center rounded-[28px] bg-gradient-to-br from-blue-600/30 to-cyan-500/15 border border-blue-400/30 shadow-[0_0_60px_rgba(37,99,235,0.4)]"
          style={{ width: 'clamp(88px, 24vw, 116px)', height: 'clamp(88px, 24vw, 116px)' }}
        >
          <ShieldCheck className="text-cyan-300" strokeWidth={1.8} style={{ width: '46%', height: '46%' }} />
        </motion.div>
        <h1 className="text-white font-black tracking-tight mt-6" style={{ fontSize: 'clamp(22px, 6vw, 30px)' }}>{BRAND_NAME}</h1>
        <p className="text-cyan-400/70 font-bold uppercase mt-2" style={{ fontSize: 'clamp(9px, 2.6vw, 11px)', letterSpacing: '0.28em' }}>Family Safety Platform</p>
      </motion.div>

      {/* Loading indicator */}
      <motion.div
        className="absolute z-10 flex items-center gap-1.5"
        style={{ bottom: 'calc(var(--ag-safe-bottom) + 48px)' }}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
      >
        {[0, 1, 2].map((i) => (
          <motion.span key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400/70"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.18, ease: 'easeInOut' }} />
        ))}
      </motion.div>
    </div>
  );
};

export default Splash;
