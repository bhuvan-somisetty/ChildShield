import React, { useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutGrid, ListChecks, Activity, MapPin, Eye, Settings, Sparkles, X, Send, Bell } from 'lucide-react';
import { isConnected } from '../../screens/parent/ConnectChild';
import { ChildProvider, useChild } from '../../context/ChildContext';
import { RealtimeProvider, useRealtime } from '../../context/RealtimeContext';
import { useT } from '../../i18n/I18nContext';
import ChildSwitcher from '../parent/ChildSwitcher';

// Header bell with a live unread badge (active child). Decreases as notifications
// are read; hides entirely at zero.
const NotifBell = () => {
  const navigate = useNavigate();
  const { activeId } = useChild();
  const { unreadCount } = useRealtime();
  const n = unreadCount(activeId);
  return (
    <button onClick={() => navigate('/app/notifications')} aria-label={`Notifications${n ? `, ${n} unread` : ''}`} className="ag-tap relative w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center">
      <Bell size={19} className="text-slate-300" />
      {n > 0 && <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-[#080910]">{n > 99 ? '99+' : n}</span>}
    </button>
  );
};

const TABS = [
  { to: '/app/home', key: 'nav.dashboard', icon: LayoutGrid },
  { to: '/app/tasks', key: 'nav.tasks', icon: ListChecks },
  { to: '/app/location', key: 'nav.location', icon: MapPin },
  { to: '/app/monitoring', key: 'nav.monitor', icon: Eye },
  { to: '/app/settings', key: 'nav.settings', icon: Settings },
];

const Disha = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button drag dragMomentum={false} dragConstraints={{ left: -300, right: 8, top: -560, bottom: 8 }} onClick={() => setOpen(true)} whileTap={{ scale: 0.92 }}
        className="ag-tap fixed z-40 right-5 bottom-28 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_12px_36px_rgba(168,85,247,0.5)]" style={{ background: 'linear-gradient(140deg,#a855f7,#6366f1)' }} aria-label="Open DISHA">
        <Sparkles size={24} className="text-white" />
        <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#030307]" />
      </motion.button>
      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-50 flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 34 }} className="relative z-10 w-full max-w-[440px] bg-[#0b0c14] border border-white/10 rounded-t-[28px]" style={{ paddingBottom: 'calc(2rem + var(--ag-safe-bottom))' }}>
              <div className="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-white/15" />
              <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-2.5"><div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(140deg,#a855f7,#6366f1)' }}><Sparkles size={18} className="text-white" /></div><div><p className="text-white font-black text-[15px] leading-none">DISHA</p><p className="text-emerald-400 text-[11px] font-semibold mt-1">● AI Family Assistant</p></div></div>
                <button onClick={() => setOpen(false)} className="ag-tap text-slate-400 hover:text-white"><X size={20} /></button>
              </div>
              <div className="px-6 flex flex-col gap-3 mt-2">
                <div className="self-start max-w-[80%] bg-white/[0.06] border border-white/10 rounded-2xl rounded-tl-md px-4 py-3 text-[13.5px] text-slate-200 leading-relaxed">Hi Jane 👋 Everyone’s safe right now. Ask me anything about your family.</div>
                <div className="flex items-center gap-2 mt-3 px-4 h-[52px] rounded-full bg-[#11131d] border border-white/10"><input placeholder="Message DISHA…" className="flex-1 bg-transparent outline-none text-white text-[15px] placeholder-slate-600" /><button className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(140deg,#a855f7,#6366f1)' }}><Send size={16} className="text-white" /></button></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const ParentShell = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const t = useT();
  if (!isConnected()) return <Navigate to="/connect" replace />;
  // Immersive routes hide the app chrome (header, bottom nav, DISHA bubble).
  const immersive = loc.pathname === '/app/ai/voice';

  if (immersive) {
    return (
      <ChildProvider>
        <RealtimeProvider>
          <Outlet />
        </RealtimeProvider>
      </ChildProvider>
    );
  }

  return (
    <ChildProvider>
      <RealtimeProvider>
      <div className="relative ag-min-h-screen w-full flex flex-col items-center overflow-hidden" style={{ background: 'var(--ag-bg)' }}>
        <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-b from-[#06070f] via-[#030307] to-[#02030a]" />

        {/* Sticky header — child switcher + notifications */}
        <header className="relative z-20 w-full max-w-[440px] flex items-center justify-between px-5 border-b border-white/[0.06] bg-[#080910]/80 backdrop-blur-xl"
          style={{ paddingTop: 'calc(var(--ag-space-3) + var(--ag-safe-top))', paddingBottom: 'var(--ag-space-3)' }}>
          <ChildSwitcher />
          <NotifBell />
        </header>

        {/* Content */}
        <div className="relative z-10 w-full max-w-[440px] flex-1 overflow-y-auto ag-no-scrollbar" style={{ paddingTop: 'var(--ag-space-5)', paddingLeft: 'var(--ag-space-5)', paddingRight: 'var(--ag-space-5)', paddingBottom: '120px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        <Disha />

        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[440px] border-t border-white/[0.07] bg-[#080910]/90 backdrop-blur-xl" style={{ paddingBottom: 'var(--ag-safe-bottom)' }}>
          <div className="flex items-stretch justify-around px-2 pt-2 pb-1.5">
            {TABS.map((tab) => (
              <NavLink key={tab.to} to={tab.to} className="ag-tap flex flex-col items-center gap-1 flex-1 py-1.5">
                {({ isActive }) => (<><tab.icon size={21} className={isActive ? 'text-cyan-400' : 'text-slate-500'} strokeWidth={isActive ? 2.6 : 2} /><span className={`text-[10px] font-bold ${isActive ? 'text-cyan-400' : 'text-slate-500'}`}>{t(tab.key)}</span></>)}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
      </RealtimeProvider>
    </ChildProvider>
  );
};

export default ParentShell;
