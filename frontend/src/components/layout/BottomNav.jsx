import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, Users, Compass, AlertCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { name: 'Home', path: '/dashboard', Icon: LayoutGrid },
  { name: 'Family', path: '/controls', Icon: Users },
  { name: 'Tracking', path: '/location', Icon: Compass },
  { name: 'AI', path: '/ai-insights', Icon: Sparkles, isOrb: true },
  { name: 'SOS', path: '/emergency', Icon: AlertCircle, isEmergency: true },
];

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[40] bg-[#0b0b14]/85 backdrop-blur-2xl border-t border-white/[0.06] flex items-stretch justify-around px-2 shadow-[0_-8px_30px_rgba(0,0,0,0.5)]"
      aria-label="Bottom navigation"
      style={{
        height: 'calc(64px + var(--ag-safe-bottom))',
        paddingBottom: 'var(--ag-safe-bottom)',
      }}
    >
      {navItems.map(({ name, path, Icon, isOrb, isEmergency }) => {
        const isActive = location.pathname === path;
        const activeColor = isEmergency ? 'text-rose-500' : 'text-cyan-400';

        return (
          <NavLink
            key={name}
            to={path}
            className="ag-tap relative flex flex-col items-center justify-center flex-1 min-w-[44px] gap-1 no-underline pt-2.5"
          >
            {isActive && (
              <motion.div
                layoutId="activeIndicator"
                className={`absolute top-0 w-9 h-[3px] rounded-b-full ${isEmergency ? 'bg-rose-500' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
              />
            )}

            {isOrb ? (
              <motion.div
                animate={isActive ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
                className={`w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1.5px] ${
                  isActive ? 'shadow-[0_0_18px_rgba(6,182,212,0.6)]' : 'shadow-[0_0_10px_rgba(168,85,247,0.35)]'
                }`}
              >
                <div className="w-full h-full rounded-full bg-[#0a0a14] flex items-center justify-center">
                  <Sparkles size={15} className={isActive ? 'text-cyan-400' : 'text-purple-400'} />
                </div>
              </motion.div>
            ) : (
              <Icon
                size={22}
                strokeWidth={isActive ? 2.6 : 1.9}
                className={isActive ? activeColor : 'text-slate-500'}
              />
            )}

            <span
              className={`text-[10px] font-bold tracking-wide ${
                isActive ? activeColor : 'text-slate-500'
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
