import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full bg-[#030307] overflow-hidden flex flex-col justify-end font-sans select-none">
      
      {/* Immersive Full-Screen Background Video */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden pointer-events-none">
        <video 
          src="/Create_a_premium_cinematic_onb.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Premium Dark Gradient Overlay for perfect typography contrast and visual focus */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030307]/10 via-[#030307]/60 to-[#030307] z-10" />
      </div>

      {/* Main Content Column (Z-Index above video background) */}
      <div className="relative z-20 w-full max-w-[480px] mx-auto flex flex-col justify-end items-center px-6 pb-12 pt-20 min-h-screen safe-area-bottom">
        
        {/* Absolute Top: Small Brand Shield Badge */}
        <div className="absolute top-8 left-0 right-0 flex justify-center z-30">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md"
          >
            <Shield size={14} className="text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              AlphaGuard OS
            </span>
          </motion.div>
        </div>

        {/* Content Block (Occupies ~60-70% of viewport height, aligned at the bottom) */}
        <div className="flex flex-col items-center text-center w-full gap-8 mt-auto z-20">
          
          {/* Typography Copy Block */}
          <div className="flex flex-col gap-4 px-2">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.8, type: 'spring' }}
              className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] text-glow-cyan"
            >
              Protect What<br />Matters Most
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-xs font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent uppercase tracking-widest"
            >
              AI-Powered Family Safety
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="text-slate-200 text-sm sm:text-base leading-relaxed max-w-[360px] mx-auto font-medium drop-shadow-md px-1"
            >
              Real-time telemetry tracking, proactive AI insights, screen limit schedules, and instant distress SOS security loops.
            </motion.p>
          </div>

          {/* Primary CTA (Width 85-90% on phones, min-height 56px, directly below content) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="w-full flex flex-col items-center gap-5 mt-2"
          >
            <button 
              onClick={() => navigate('/onboarding')}
              id="welcome-get-started"
              className="group w-11/12 max-w-[380px] h-14 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-full text-[#030307] font-black text-sm tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(79,70,229,0.35)] hover:shadow-[0_12px_44px_rgba(6,182,212,0.5)] active:scale-[0.98] transition-all duration-300"
            >
              <span>Get Started</span>
              <ChevronRight size={16} className="text-[#030307] group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={3} />
            </button>

            <span className="text-[9px] text-slate-500 font-extrabold tracking-widest uppercase text-center opacity-80">
              Family Safety Redefined
            </span>
          </motion.div>

        </div>

      </div>

    </div>
  );
};

export default Welcome;

