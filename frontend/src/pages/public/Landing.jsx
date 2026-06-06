import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Smartphone, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Landing = () => {
  const navigate = useNavigate();
  const [activeRole, setActiveRole] = useState('parent'); // 'parent' or 'child'

  const roles = {
    parent: {
      title: "Parent Command Portal",
      tagline: "Supervise activity & set security lockouts",
      icon: User,
      colorClass: "from-indigo-600 via-indigo-700 to-indigo-900",
      glowColor: "rgba(99,102,241,0.25)",
      features: [
        "Real-Time Family GPS tracking",
        "Bedtime restrictions & App locks",
        "Alpha AI parenting assistant insights"
      ],
      btnText: "Secure Parent Access",
      route: "/login"
    },
    child: {
      title: "Child Companion Shield",
      tagline: "Link device to trigger safe supervision",
      icon: Smartphone,
      colorClass: "from-cyan-600 via-cyan-700 to-cyan-900",
      glowColor: "rgba(6,182,212,0.25)",
      features: [
        "Heartbeat synchronization logs",
        "Background location protection",
        "Distress panic SOS trigger access"
      ],
      btnText: "Link This Device",
      route: "/child-setup"
    }
  };

  const handleAction = () => {
    localStorage.removeItem('cs_token'); // Clear stale tokens
    navigate(roles[activeRole].route);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030307] overflow-hidden flex flex-col items-center justify-between px-6 py-10 font-sans">
      
      {/* Background Glows */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020308] to-[#0b0c14] pointer-events-none" />
      <div 
        className="absolute top-[20%] left-[50%] -translate-x-[50%] w-[350px] h-[350px] rounded-full filter blur-[120px] opacity-15 transition-all duration-700 pointer-events-none"
        style={{ backgroundColor: activeRole === 'parent' ? '#4f46e5' : '#06b6d4' }}
      />

      {/* Header */}
      <div className="text-center mt-4 relative z-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-white/5 border border-white/5 mb-4 shadow-lg"
        >
          <ShieldCheck size={26} className="text-cyan-400" />
        </motion.div>
        <h2 className="text-2xl font-black text-white tracking-tight leading-none">Select App Role</h2>
        <p className="text-slate-500 text-xs mt-1.5 font-bold uppercase tracking-wide">
          Choose dashboard mode to proceed
        </p>
      </div>

      {/* Wallet Overlapping Deck Container */}
      <div className="relative w-full max-w-[340px] h-72 flex items-center justify-center my-auto">
        <AnimatePresence>
          {/* Parent Card */}
          <motion.div
            style={{ zIndex: activeRole === 'parent' ? 30 : 10 }}
            animate={{
              scale: activeRole === 'parent' ? 1.05 : 0.9,
              y: activeRole === 'parent' ? 0 : -35,
              rotate: activeRole === 'parent' ? 0 : -5,
              opacity: activeRole === 'parent' ? 1 : 0.65
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            onClick={() => setActiveRole('parent')}
            className={`absolute w-full p-6 rounded-[24px] bg-gradient-to-tr ${roles.parent.colorClass} border border-white/10 shadow-2xl cursor-pointer select-none flex flex-col justify-between h-56`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 bg-white/10 px-2 py-0.5 rounded-full">
                  Supervisor Slate
                </span>
                <User size={18} className="text-indigo-200" />
              </div>
              <h3 className="text-base font-extrabold text-white leading-tight">{roles.parent.title}</h3>
              <p className="text-indigo-200/70 text-[10px] mt-1 font-semibold">{roles.parent.tagline}</p>
            </div>
            
            <div className="flex flex-col gap-1.5 mt-4">
              {roles.parent.features.map(f => (
                <div key={f} className="flex items-center gap-1.5 text-[9px] font-bold text-indigo-100">
                  <span className="w-1 h-1 rounded-full bg-indigo-300" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Child Card */}
          <motion.div
            style={{ zIndex: activeRole === 'child' ? 30 : 10 }}
            animate={{
              scale: activeRole === 'child' ? 1.05 : 0.9,
              y: activeRole === 'child' ? 0 : 35,
              rotate: activeRole === 'child' ? 0 : 5,
              opacity: activeRole === 'child' ? 1 : 0.65
            }}
            transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            onClick={() => setActiveRole('child')}
            className={`absolute w-full p-6 rounded-[24px] bg-gradient-to-tr ${roles.child.colorClass} border border-white/10 shadow-2xl cursor-pointer select-none flex flex-col justify-between h-56`}
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-200 bg-white/10 px-2 py-0.5 rounded-full">
                  Client Companion
                </span>
                <Smartphone size={18} className="text-cyan-200" />
              </div>
              <h3 className="text-base font-extrabold text-white leading-tight">{roles.child.title}</h3>
              <p className="text-cyan-200/70 text-[10px] mt-1 font-semibold">{roles.child.tagline}</p>
            </div>

            <div className="flex flex-col gap-1.5 mt-4">
              {roles.child.features.map(f => (
                <div key={f} className="flex items-center gap-1.5 text-[9px] font-bold text-cyan-100">
                  <span className="w-1 h-1 rounded-full bg-cyan-300" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Docked Drawer Action Trigger */}
      <div className="w-full max-w-[320px] flex flex-col items-center gap-2 relative z-40">
        <button 
          onClick={handleAction}
          className="group w-full py-4 bg-white text-[#030307] font-black text-xs tracking-wider uppercase rounded-full cursor-pointer flex items-center justify-center gap-1 shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
          style={{ boxShadow: `0 8px 30px ${roles[activeRole].glowColor}` }}
        >
          <span>{roles[activeRole].btnText}</span>
          <ChevronRight size={13} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
        <span className="text-[9px] text-slate-500 font-extrabold tracking-wide text-center">
          Tap cards above to toggle role modes
        </span>
      </div>

    </div>
  );
};

export default Landing;
