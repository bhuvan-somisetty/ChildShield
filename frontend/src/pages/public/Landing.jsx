import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Smartphone, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const Landing = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="relative min-h-screen w-full bg-[#07070c] overflow-hidden flex items-center justify-center px-4 font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] to-[#0f172a] pointer-events-none" />
      <div className="absolute top-[10%] left-[10%] w-[350px] h-[350px] rounded-full bg-purple-600/10 filter blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[350px] h-[350px] rounded-full bg-cyan-600/10 filter blur-[100px] pointer-events-none animate-pulse" />

      {/* Main glass card container */}
      <div className="relative z-10 w-full max-w-[460px] px-6 py-10 bg-white/5 border border-white/5 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col">
        
        {/* Brand/Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <ShieldCheck size={32} className="text-cyan-400" />
          </motion.div>
          <h2 className="text-2xl font-black text-white tracking-wide">Choose Mode</h2>
          <p className="text-slate-400 text-xs md:text-sm mt-1.5 font-semibold">
            Continue as Parent supervisor or Child device
          </p>
        </div>

        {/* Option cards */}
        <div className="flex flex-col gap-4">
          
          {/* Parent Mode Option */}
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              localStorage.removeItem('cs_token'); // Clear stale tokens
              navigate('/login');
            }}
            className="group w-full flex items-center p-4 bg-white/2 hover:bg-cyan-500/5 border border-white/5 hover:border-cyan-500/30 rounded-2xl text-left cursor-pointer transition-all duration-300 shadow-md"
          >
            <div className="w-11 h-11 rounded-full bg-cyan-500/10 group-hover:bg-cyan-500/20 flex items-center justify-center mr-4 transition-colors">
              <User size={22} className="text-cyan-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white leading-tight">Parent Mode</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Login to monitor activity & set supervision rules
              </p>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all ml-2" strokeWidth={3} />
          </motion.button>

          {/* Child Mode Option */}
          <motion.button 
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/child-setup')}
            className="group w-full flex items-center p-4 bg-white/2 hover:bg-purple-500/5 border border-white/5 hover:border-purple-500/30 rounded-2xl text-left cursor-pointer transition-all duration-300 shadow-md"
          >
            <div className="w-11 h-11 rounded-full bg-purple-500/10 group-hover:bg-purple-500/20 flex items-center justify-center mr-4 transition-colors">
              <Smartphone size={22} className="text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-white leading-tight">Child Mode</h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Pair and register this device to begin protection
              </p>
            </div>
            <ChevronRight size={14} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all ml-2" strokeWidth={3} />
          </motion.button>

        </div>

      </div>

    </div>
  );
};

export default Landing;
