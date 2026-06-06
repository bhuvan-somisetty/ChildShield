import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, Brain, Navigation, AlertTriangle, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full bg-[#030307] overflow-hidden flex flex-col items-center justify-between px-6 py-10 font-sans">
      
      {/* Background Mesh Glows - Google Gemini inspired */}
      <div className="absolute top-[15%] left-[50%] -translate-x-[50%] w-[350px] h-[350px] rounded-full bg-gradient-to-tr from-indigo-600/15 via-blue-600/10 to-cyan-500/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[250px] h-[250px] rounded-full bg-purple-600/5 blur-[90px] pointer-events-none" />
      
      {/* Subtle geometric dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Top Header Label */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/5 border border-white/5 rounded-full backdrop-blur-md"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
        </span>
        <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest">
          Shield Protocol Active
        </span>
      </motion.div>

      {/* Centerpiece: Glowing Core Shield */}
      <div className="relative flex flex-col items-center justify-center my-auto">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="relative w-36 h-36 flex items-center justify-center mb-8"
        >
          {/* Pulsing Outer Rings */}
          <div className="absolute inset-0 rounded-full border border-white/5 bg-gradient-to-tr from-indigo-500/5 to-cyan-500/5 animate-pulse" />
          <div className="absolute -inset-4 rounded-full border border-dashed border-white/5 animate-[spin_40s_linear_infinite]" />
          
          {/* Main Shield Container */}
          <motion.div 
            animate={{ y: [0, -6, 0] }}
            transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
            className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 p-[1.5px] shadow-[0_0_40px_rgba(79,70,229,0.25)]"
          >
            <div className="w-full h-full rounded-3xl bg-[#0b0c14] flex items-center justify-center border border-white/5">
              <Shield size={44} className="text-cyan-400" />
            </div>
          </motion.div>
        </motion.div>

        {/* Text Positioning: Premium Startup-grade */}
        <div className="text-center max-w-[500px] px-2">
          <motion.h1 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.1] mb-3 font-sans"
          >
            Protect What Matters Most
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-base font-extrabold bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-400 bg-clip-text text-transparent mb-5"
          >
            AI-Powered Family Safety
          </motion.div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-slate-400 text-xs md:text-sm font-medium tracking-wide flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 max-w-[420px] mx-auto"
          >
            <span>Real-Time Tracking</span>
            <span className="text-white/20">•</span>
            <span>Safe Zones</span>
            <span className="text-white/20">•</span>
            <span>SOS Protection</span>
            <span className="text-white/20">•</span>
            <span>AI Insights</span>
          </motion.p>
        </div>
      </div>

      {/* Bottom Actions: Capsule Button */}
      <div className="w-full max-w-[320px] flex flex-col items-center gap-4">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="w-full"
        >
          <button 
            onClick={() => navigate('/onboarding')}
            id="welcome-get-started"
            className="group w-full py-4 bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-full text-[#030307] font-black text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_8px_32px_rgba(79,70,229,0.3)] hover:shadow-[0_12px_44px_rgba(6,182,212,0.45)] hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
          >
            <span>Get Started</span>
            <ChevronRight size={14} className="text-[#030307] group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={3} />
          </button>
        </motion.div>

        {/* Footer info */}
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-[9px] text-slate-600 font-extrabold tracking-widest uppercase"
        >
          AlphaGuard OS · Family Safety Redefined
        </motion.span>
      </div>

    </div>
  );
};

export default Welcome;
