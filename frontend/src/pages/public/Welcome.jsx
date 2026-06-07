import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full bg-[#030307] overflow-hidden flex flex-col items-center justify-center px-6 py-12 font-sans select-none">
      
      {/* Background Mesh Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#030307] via-[#05060f] to-[#030307]" />
      <div className="absolute top-[10%] left-[50%] -translate-x-[50%] w-[380px] h-[380px] rounded-full bg-gradient-to-tr from-indigo-600/10 via-blue-600/10 to-cyan-500/10 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[280px] h-[280px] rounded-full bg-purple-600/5 blur-[90px] pointer-events-none" />
      
      {/* Background grid */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.012)_1.5px,transparent_1.5px)] bg-[size:32px_32px] pointer-events-none" />

      {/* Core Mobile Application Canvas Column */}
      <div className="relative z-10 w-full max-w-[420px] flex-1 flex flex-col justify-center items-center gap-8">
        
        {/* Content Block (Occupies ~65-70% of viewport height) */}
        <div className="flex-1 flex flex-col items-center justify-center w-full text-center gap-8">
          
          {/* Cinematic Hero Video Player in Bezel Mockup */}
          <motion.div 
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, type: 'spring', bounce: 0.25 }}
            className="relative w-[85%] max-w-[250px] aspect-[9/16] rounded-[36px] bg-[#0b0c14] border-[5px] border-white/10 shadow-[0_24px_50px_rgba(0,0,0,0.85)] flex items-center justify-center overflow-hidden"
          >
            {/* Concentric Tech Orbits in Background */}
            <div className="absolute -inset-10 rounded-full border border-dashed border-white/[0.02] animate-[spin_60s_linear_infinite]" />
            <div className="absolute -inset-20 rounded-full border border-white/[0.01] animate-[spin_80s_linear_infinite_reverse]" />

            {/* Glowing Border Accents */}
            <div className="absolute inset-0 rounded-[32px] border border-cyan-400/20 pointer-events-none z-20" />
            <div className="absolute inset-[1px] rounded-[31px] border border-indigo-500/10 pointer-events-none z-20" />

            {/* Ambient Background Video Glow */}
            <div className="absolute w-32 h-32 rounded-full bg-indigo-500/15 blur-[24px] pointer-events-none z-0" />

            {/* HTML5 Video loop */}
            <video 
              src="/Create_a_premium_cinematic_onb.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover relative z-10 scale-[1.01]"
            />
            
            {/* Top Speaker/Camera Notch Detail for Native Smartphone Feel */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-14 h-3.5 bg-black rounded-full z-30 flex items-center justify-center border border-white/5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#111] border border-white/5 mr-6" />
              <span className="w-4 h-0.5 rounded-full bg-[#222]" />
            </div>
          </motion.div>

          {/* Typography Copy Block */}
          <div className="flex flex-col gap-3 px-2">
            <motion.h1 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl font-black text-white tracking-tight leading-[1.08] font-sans"
            >
              Protect What<br />Matters Most
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-xs font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent uppercase tracking-wider"
            >
              AI-Powered Family Safety
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-slate-400 text-xs sm:text-sm leading-relaxed max-w-[340px] mx-auto font-semibold"
            >
              Real-time telemetry tracking, proactive AI insights, screen limit schedules, and instant distress SOS security loops.
            </motion.p>
          </div>

        </div>

        {/* Primary CTA (Width 85-90% on phones, min-height 56px, directly below content) */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="w-11/12 max-w-[360px] flex flex-col items-center gap-4 mt-auto sm:mt-0"
        >
          <button 
            onClick={() => navigate('/onboarding')}
            id="welcome-get-started"
            className="group w-full h-14 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-full text-[#030307] font-black text-sm tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2 shadow-[0_8px_32px_rgba(79,70,229,0.35)] hover:shadow-[0_12px_44px_rgba(6,182,212,0.5)] active:scale-[0.98] transition-all duration-300"
          >
            <span>Get Started</span>
            <ChevronRight size={16} className="text-[#030307] group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={3} />
          </button>

          <span className="text-[9px] text-slate-600 font-extrabold tracking-widest uppercase text-center">
            AlphaGuard OS · Family Safety Redefined
          </span>
        </motion.div>

      </div>

    </div>
  );
};

export default Welcome;
