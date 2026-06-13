import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Plus, Check, X, BatteryMedium, BatteryCharging } from 'lucide-react';
import { useChild } from '../../context/ChildContext';
import { useRealtime } from '../../context/RealtimeContext';

/* Instagram-style active-child header + switch sheet. */
const ChildSwitcher = () => {
  const navigate = useNavigate();
  const { list, child, activeId, setActiveId } = useChild();
  const { getTelemetry } = useRealtime();
  const [open, setOpen] = useState(false);
  const activeRef = useRef(null);

  // When the sheet opens, scroll the current child into view.
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => activeRef.current?.scrollIntoView({ block: 'nearest' }), 60);
    return () => clearTimeout(t);
  }, [open]);

  const stat = (c) => { const tel = getTelemetry(c.id); return { bat: tel ? tel.battery.level : c.battery, charging: tel && tel.battery.charging, online: tel ? tel.online : c.online }; };
  const cur = stat(child);
  const CurBat = cur.charging ? BatteryCharging : BatteryMedium;

  return (
    <>
      <button onClick={() => setOpen(true)} className="ag-tap flex items-center gap-2.5">
        <div className="relative">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ background: `${child.color}26`, border: `1px solid ${child.color}55` }}>{child.emoji}</div>
          <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#080910] ${child.online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
        </div>
        <div className="text-left leading-tight">
          <p className="text-white font-black text-[16px] flex items-center gap-1">{child.name} <ChevronDown size={15} className="text-slate-500" /></p>
          <p className={`text-[11px] font-bold ${child.online ? 'text-emerald-400' : 'text-slate-500'}`}>{child.online ? 'Online' : 'Offline'} · {child.device}</p>
        </div>
      </button>

      {/* Rendered into <body> so the sheet is viewport-fixed (the header's
          backdrop-blur would otherwise clip a fixed child to the header box). */}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div className="fixed inset-0 z-[80] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setOpen(false)} />
              <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 34 }}
                className="relative z-10 w-full max-w-[440px] max-h-[85vh] bg-[#0b0c14] border border-white/10 rounded-t-[28px] flex flex-col">
                <div className="mx-auto mt-3 mb-1 h-1.5 w-10 rounded-full bg-white/15 flex-shrink-0" />
                <div className="flex items-center justify-between px-6 py-3 flex-shrink-0">
                  <h3 className="text-white font-black text-[17px]">Switch child</h3>
                  <button onClick={() => setOpen(false)} aria-label="Close" className="ag-tap text-slate-400 hover:text-white"><X size={20} /></button>
                </div>

                {/* Current child summary */}
                <div className="px-4 flex-shrink-0">
                  <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-2 mb-1.5">Current child</p>
                  <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/10">
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: `${child.color}26`, border: `1px solid ${child.color}55` }}>{child.emoji}</div>
                      <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0b0c14] ${cur.online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-black text-[15px]">{child.name}, {child.age}</p>
                      <p className="text-slate-500 text-[12px] font-semibold flex items-center gap-1.5 truncate"><span className={cur.online ? 'text-emerald-400' : 'text-slate-500'}>{cur.online ? 'Online' : 'Offline'}</span> · <CurBat size={12} className={cur.charging ? 'text-emerald-400' : ''} /> {cur.bat}% · {child.device}</p>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.14em] px-6 mt-3 mb-1.5 flex-shrink-0">Connected children</p>

                {/* Scrollable child list — flexes; Add button stays pinned below */}
                <div className="px-4 flex-1 min-h-0 overflow-y-auto ag-no-scrollbar overscroll-contain flex flex-col gap-1.5">
                  {list.map((c) => { const s = stat(c); const Bat = s.charging ? BatteryCharging : BatteryMedium; const isActive = c.id === activeId; return (
                    <button ref={isActive ? activeRef : null} key={c.id} onClick={() => { setActiveId(c.id); setOpen(false); }} aria-label={`Switch to ${c.name}`} aria-current={isActive} className={`ag-tap flex items-center gap-3.5 p-3 rounded-2xl transition-colors ${isActive ? 'bg-cyan-500/[0.08] border border-cyan-400/40 shadow-[0_0_22px_rgba(34,211,238,0.16)]' : 'border border-transparent hover:bg-white/[0.04]'}`}>
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ background: `${c.color}26`, border: `1px solid ${c.color}55` }}>{c.emoji}</div>
                        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0b0c14] ${s.online ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-white font-bold text-[15px]">{c.name}, {c.age}</p>
                        <p className="text-slate-500 text-[12px] font-semibold flex items-center gap-1.5 truncate"><span className={s.online ? 'text-emerald-400' : 'text-slate-500'}>{s.online ? 'Online' : 'Offline'}</span> · <Bat size={12} className={s.charging ? 'text-emerald-400' : ''} /> {s.bat}% · {c.device}</p>
                      </div>
                      {isActive && <span className="w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center flex-shrink-0"><Check size={14} className="text-[#030307]" strokeWidth={3.5} /></span>}
                    </button>
                  ); })}
                </div>

                {/* Add New Child — pinned at the bottom, always visible */}
                <div className="px-4 pt-2 mt-1 border-t border-white/[0.06] flex-shrink-0" style={{ paddingBottom: 'calc(1rem + var(--ag-safe-bottom))' }}>
                  <button onClick={() => { setOpen(false); navigate('/connect'); }} aria-label="Add a new child" className="ag-tap w-full flex items-center gap-3.5 p-3 rounded-2xl hover:bg-white/[0.04]">
                    <div className="w-12 h-12 rounded-full bg-white/[0.05] border border-dashed border-white/20 flex items-center justify-center flex-shrink-0"><Plus size={22} className="text-cyan-400" /></div>
                    <span className="text-cyan-400 font-bold text-[15px]">Add New Child</span>
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};

export default ChildSwitcher;
