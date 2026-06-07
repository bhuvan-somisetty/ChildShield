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
          className="w-full h-full object-cover object-top"
        />
        {/* Premium Dark Gradient Overlay focused towards the bottom to keep the shield clear at the top */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#030307]/10 via-[#030307]/50 to-[#030307] z-10" />
      </div>

      {/* Main Content Column (Z-Index above video background) */}
      <div className="relative z-20 w-full max-w-[480px] mx-auto flex flex-col justify-end items-center px-6 pb-14 pt-6 min-h-screen safe-area-bottom">
        
        {/* Top brand header absolute (clear of the shield animation) */}
        <div className="absolute top-8 left-0 right-0 flex justify-center z-30">
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 8.0, duration: 0.8 }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-full backdrop-blur-md"
          >
            <Shield size={14} className="text-cyan-400 drop-shadow-[0_0_6px_rgba(6,182,212,0.4)]" />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">
              AlphaGuard OS
            </span>
          </motion.div>
        </div>

        {/* Large Spacer to force copy into the bottom 60% of the viewport, keeping the top-center shield visible */}
        <div className="flex-1 min-h-[38vh]" />

        {/* Content Block (Centered hierarchy, breathing spacing) */}
        <div className="w-full flex flex-col items-center text-center gap-12 z-20">
          
          {/* Typography Copy Block */}
          <div className="flex flex-col items-center gap-6 px-2">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 8.0, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              className="text-5xl sm:text-6xl font-black text-white tracking-tight leading-[1.05] text-glow-cyan drop-shadow-[0_4px_32px_rgba(0,0,0,0.6)]"
            >
              Protect What<br />Matters Most
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 8.8, duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
              className="text-sm sm:text-base font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent uppercase tracking-[0.25em] drop-shadow-sm mt-1"
            >
              AI-Powered Family Safety
            </motion.div>
          </div>

          {/* Premium Upgraded CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 9.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center gap-6"
          >
            <button 
              onClick={() => navigate('/onboarding')}
              id="welcome-get-started"
              className="group w-11/12 max-w-[390px] h-16 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-full text-[#030307] font-black text-base tracking-widest uppercase cursor-pointer flex items-center justify-center gap-2.5 shadow-[0_12px_40px_rgba(79,70,229,0.4)] hover:shadow-[0_16px_48px_rgba(6,182,212,0.6)] active:scale-[0.98] transition-all duration-300 border border-white/10"
            >
              <span>Get Started</span>
              <ChevronRight size={18} className="text-[#030307] group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={3.5} />
            </button>

            <span className="text-[10px] text-slate-500 font-extrabold tracking-[0.25em] uppercase opacity-70">
              Family Safety Redefined
            </span>
          </motion.div>

        </div>

      </div>

    </div>
  );
};

export default Welcome;

