import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronRight, Activity, Brain, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen w-full bg-[#07070c] overflow-hidden flex flex-col items-center justify-center font-sans">
      
      {/* Background Mesh Glows */}
      <div className="absolute top-[10%] left-[5%] w-[380px] h-[380px] rounded-full bg-blue-600/10 blur-[90px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[5%] w-[420px] h-[420px] rounded-full bg-purple-600/10 blur-[110px] pointer-events-none animate-pulse" />
      
      {/* Subtle Vector grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-[600px] px-6 text-center flex flex-col items-center">
        
        {/* Floating Shield Brand Logo */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring' }}
          className="mb-8"
        >
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
            className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 p-[1.5px] shadow-[0_0_30px_rgba(37,99,235,0.25)]"
          >
            <div className="w-full h-full rounded-2xl bg-[#0a0a14] flex items-center justify-center border border-white/5">
              <Shield size={38} className="text-cyan-400" />
            </div>
          </motion.div>
        </motion.div>

        {/* AI Pill Badge */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6"
        >
          <Brain size={12} className="text-cyan-400" />
          <span className="text-[10.5px] font-extrabold text-cyan-400 tracking-wider uppercase">
            Smart AI Parenting for Gen Alpha
          </span>
        </motion.div>

        {/* Shimmering Hero Title */}
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-4xl md:text-5xl font-black text-white tracking-tight leading-[1.15] mb-4"
        >
          Welcome to{' '}
          <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-400 bg-clip-text text-transparent bg-[size:200%_auto] animate-[shimmer_4s_linear_infinite]">
            AlphaGuard
          </span>
          <span className="text-slate-500"> AI</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-slate-400 text-sm md:text-base leading-relaxed max-w-[440px] mb-10"
        >
          An <strong className="text-white font-semibold">AI-powered behavior + safety dashboard</strong> designed to protect, connect, and nurture your child's digital life.
        </motion.p>

        {/* Feature Pills (Staggered layout) */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.5 } }
          }}
          className="flex flex-wrap gap-2.5 justify-center mb-12"
        >
          {[
            { icon: Brain, label: 'Behavior Insights', color: 'text-cyan-400', bg: 'bg-cyan-500/5 border-cyan-500/10' },
            { icon: Activity, label: 'Smart Supervision', color: 'text-indigo-400', bg: 'bg-indigo-500/5 border-indigo-500/10' },
            { icon: Zap, label: 'Focus Assistant', color: 'text-purple-400', bg: 'bg-purple-500/5 border-purple-500/10' }
          ].map((feat, i) => (
            <motion.div 
              key={i}
              variants={{
                hidden: { opacity: 0, y: 10 },
                visible: { opacity: 1, y: 0 }
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border ${feat.bg} backdrop-blur-md`}
            >
              <feat.icon size={13} className={feat.color} />
              <span className="text-xs font-bold text-slate-200">{feat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Primary CTA button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <button 
            onClick={() => navigate('/onboarding')}
            id="welcome-get-started"
            className="group relative px-8 py-3.5 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-500 rounded-full text-[#07070c] font-black text-sm tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-[0_0_24px_rgba(37,99,235,0.3)] hover:shadow-[0_0_36px_rgba(6,182,212,0.55)] hover:-translate-y-0.5 active:scale-95 transition-all duration-300"
          >
            <span>Get Started</span>
            <ChevronRight size={16} className="text-[#07070c] group-hover:translate-x-0.5 transition-transform duration-200" strokeWidth={3} />
          </button>
        </motion.div>

      </div>

      {/* Styled Footer */}
      <div className="absolute bottom-5 text-[10px] text-slate-600 font-bold tracking-widest uppercase">
        © {new Date().getFullYear()} AlphaGuard AI · Securing Gen Alpha
      </div>

    </div>
  );
};

export default Welcome;
