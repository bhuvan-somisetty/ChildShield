import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ChevronRight } from 'lucide-react';
import { Screen, Button, BRAND_NAME } from '../components/ui';

const Welcome = () => {
  const navigate = useNavigate();
  return (
    <Screen
      align="between"
      scroll={false}
      glow="#2563eb"
      footer={<Button iconRight={ChevronRight} onClick={() => navigate('/onboarding')}>Get Started</Button>}
    >
      {/* Hero mark */}
      <div className="w-full flex flex-col items-center pt-12">
        <motion.div
          animate={{ y: [0, -7, 0] }}
          transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut' }}
          className="relative flex items-center justify-center"
        >
          <motion.div
            className="absolute w-44 h-44 rounded-full bg-blue-500/20 blur-[60px]"
            animate={{ opacity: [0.55, 0.85, 0.55] }}
            transition={{ repeat: Infinity, duration: 3.6, ease: 'easeInOut' }}
          />
          <div className="relative flex items-center justify-center w-28 h-28 rounded-[34px] bg-gradient-to-br from-blue-600/30 to-cyan-500/15 border border-blue-400/30 shadow-[0_0_60px_rgba(37,99,235,0.4)]">
            <ShieldCheck size={56} className="text-cyan-300" strokeWidth={1.8} />
          </div>
        </motion.div>
      </div>

      {/* Copy */}
      <div className="w-full flex flex-col items-center text-center">
        <span className="text-[11px] font-black text-cyan-400/80 uppercase tracking-[0.32em] mb-5">{BRAND_NAME}</span>
        <h1 className="text-[33px] font-black tracking-tight leading-[1.12] ag-grad-text max-w-[300px]">
          Protect What<br />Matters Most
        </h1>
        <p className="text-slate-400 text-[15px] font-medium mt-5 max-w-[320px] leading-relaxed">
          AI powered protection, real time awareness, family location tracking, smart alerts, and complete peace of mind in one secure platform.
        </p>
      </div>

      {/* Spacer to anchor copy toward optical center above the CTA */}
      <div aria-hidden className="h-4" />
    </Screen>
  );
};

export default Welcome;
