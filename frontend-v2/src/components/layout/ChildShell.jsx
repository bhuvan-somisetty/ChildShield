import React from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, MessageCircle, Siren, Sparkles, Settings } from 'lucide-react';
import { ChildAppProvider } from '../../child/ChildAppContext';
import MonitorListener from '../../screens/child/app/MonitorListener';

const TABS = [
  { to: '/child/app/home', label: 'Home', icon: Home },
  { to: '/child/app/chat', label: 'Chat', icon: MessageCircle },
  { to: '/child/app/disha', label: 'DISHA', icon: Sparkles },
  { to: '/child/app/settings', label: 'Settings', icon: Settings },
];

const ChildShell = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const immersive = loc.pathname === '/child/app/disha/voice'; // fullscreen voice

  if (immersive) {
    return <ChildAppProvider><MonitorListener /><Outlet /></ChildAppProvider>;
  }

  return (
    <ChildAppProvider>
      <MonitorListener />
      <div className="relative ag-min-h-screen w-full flex flex-col items-center overflow-hidden" style={{ background: 'var(--ag-bg)' }}>
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-[#06120f] via-[#030307] to-[#02030a]" />
          <div className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[120vw] max-w-[620px] aspect-square rounded-full blur-[130px] opacity-[0.16]" style={{ background: 'radial-gradient(circle,#10b981 0%,transparent 60%)' }} />
        </div>

        <div className="relative z-10 w-full max-w-[440px] flex-1 overflow-y-auto ag-no-scrollbar" style={{ paddingTop: 'calc(var(--ag-space-6) + var(--ag-safe-top))', paddingLeft: 'var(--ag-space-5)', paddingRight: 'var(--ag-space-5)', paddingBottom: '120px' }}>
          <AnimatePresence mode="wait">
            <motion.div key={loc.pathname} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom nav with a raised central SOS */}
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 z-30 w-full max-w-[440px] border-t border-white/[0.07] bg-[#070b09]/90 backdrop-blur-xl" style={{ paddingBottom: 'var(--ag-safe-bottom)' }}>
          <div className="flex items-stretch justify-around px-2 pt-2 pb-1.5">
            {TABS.slice(0, 2).map((t) => <Tab key={t.to} t={t} />)}
            <button onClick={() => navigate('/child/app/sos')} aria-label="Emergency SOS" className="ag-tap flex flex-col items-center gap-1 flex-1 -mt-5">
              <span className="relative w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_28px_rgba(239,68,68,0.5)]" style={{ background: 'linear-gradient(140deg,#ef4444,#b91c1c)' }}>
                <motion.span className="absolute -inset-1 rounded-full bg-rose-500/40 blur-md" animate={{ opacity: [0.4, 0.8, 0.4] }} transition={{ repeat: Infinity, duration: 1.8 }} />
                <Siren size={26} className="relative text-white" />
              </span>
              <span className={`text-[10px] font-black ${loc.pathname === '/child/app/sos' ? 'text-rose-400' : 'text-slate-500'}`}>SOS</span>
            </button>
            {TABS.slice(2).map((t) => <Tab key={t.to} t={t} />)}
          </div>
        </nav>
      </div>
    </ChildAppProvider>
  );
};

const Tab = ({ t }) => (
  <NavLink to={t.to} className="ag-tap flex flex-col items-center gap-1 flex-1 py-1.5">
    {({ isActive }) => (<><t.icon size={21} className={isActive ? 'text-emerald-400' : 'text-slate-500'} strokeWidth={isActive ? 2.6 : 2} /><span className={`text-[10px] font-bold ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>{t.label}</span></>)}
  </NavLink>
);

export default ChildShell;
