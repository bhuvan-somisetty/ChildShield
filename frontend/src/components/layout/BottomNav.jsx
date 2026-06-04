import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Users, Compass, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', Icon: LayoutGrid },
  { name: 'Family', path: '/controls', Icon: Users },
  { name: 'Live Tracking', path: '/location', Icon: Compass },
  { name: 'AI Assistant', path: '/ai-insights', Icon: Sparkles, isOrb: true },
  { name: 'Emergency', path: '/emergency', Icon: AlertCircle },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-[40] h-18 bg-[#0b0b14]/75 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-4 pb-safe shadow-[0_-8px_30px_rgb(0,0,0,0.5)]" 
      aria-label="Bottom navigation"
    >
      {navItems.map(({ name, path, Icon, isOrb }) => {
        const isActive = location.pathname === path;

        return (
          <NavLink
            key={name}
            to={path}
            className="relative flex flex-col items-center justify-center flex-1 h-full min-w-12 text-center no-underline transition-colors duration-200"
          >
            {/* Active Top Bar Indicator */}
            {isActive && (
              <motion.div 
                layoutId="activeIndicator"
                className="absolute top-0 w-8 h-[3px] rounded-b-md bg-gradient-to-r from-cyan-500 to-blue-500 shadow-[0_2px_10px_rgba(6,182,212,0.4)]"
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            {isOrb ? (
              // AI Assistant glowing orb tab icon
              <div className="relative flex items-center justify-center w-10 h-10 mb-0.5">
                <motion.div 
                  animate={isActive ? {
                    scale: [1, 1.1, 1],
                    rotate: 360
                  } : {}}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1.5px] shadow-[0_0_12px_rgba(168,85,247,0.4)] ${isActive ? 'shadow-[0_0_18px_rgba(6,182,212,0.6)]' : ''}`}
                >
                  <div className="w-full h-full rounded-full bg-[#0a0a14] flex items-center justify-center">
                    <Sparkles size={13} className={isActive ? "text-cyan-400" : "text-purple-400"} />
                  </div>
                </motion.div>
                {isActive && (
                  <span className="absolute w-2 h-2 bg-cyan-400 rounded-full blur-[2px] bottom-0" />
                )}
              </div>
            ) : (
              // Standard Icon
              <div className="relative flex flex-col items-center justify-center">
                <motion.div 
                  whileTap={{ scale: 0.9 }}
                  className={`p-1 transition-colors duration-200 ${isActive ? (name === 'Emergency' ? 'text-red-500' : 'text-cyan-400') : 'text-slate-400'}`}
                >
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                </motion.div>
              </div>
            )}

            <span 
              className={`text-[9.5px] font-bold tracking-wide mt-0.5 transition-colors duration-200 ${
                isActive 
                  ? (name === 'Emergency' ? 'text-red-500' : 'text-cyan-400') 
                  : 'text-slate-400'
              }`}
            >
              {name}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
};

export default BottomNav;
