import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowUpCircle, Wrench, Zap, Plus, X, ShieldAlert } from 'lucide-react';
import { api, APP_VERSION } from '../lib/agClient';
import { consumeVersionChange, whatsNewSeen, markWhatsNewSeen, updateDismissed, dismissUpdate } from '../lib/lifecycle';

// App update lifecycle, layered over the authenticated app:
//   • MANDATORY update (client < server minimumVersion) → full-screen block, no dismiss
//   • OPTIONAL update  (client < server currentVersion)  → dismissible "Update Available"
//   • WHAT'S NEW        (client just updated to a new build) → release notes, once per version
//
// The version fetch is non-blocking: children render immediately (a slow/offline
// version endpoint must never lock the user out); a mandatory update, when
// detected, then overlays a blocking screen.

// On web, "Update Now" reloads to pick up the freshly-deployed bundle. In a
// native wrapper this is where a store deep-link would go.
const applyUpdate = () => { try { window.location.reload(); } catch { /* noop */ } };

const hasNotes = (n) => !!n && ((n.added || []).length || (n.improved || []).length || (n.fixed || []).length);

const ReleaseNotes = ({ notes }) => {
  if (!hasNotes(notes)) return <p className="text-slate-400 text-[13px] font-medium">This release brings general improvements and stability fixes.</p>;
  const groups = [
    { label: 'New Features', items: notes.added, icon: Plus, color: '#10b981' },
    { label: 'Improvements', items: notes.improved, icon: Zap, color: '#06b6d4' },
    { label: 'Fixes', items: notes.fixed, icon: Wrench, color: '#f59e0b' },
  ].filter((g) => (g.items || []).length);
  return (
    <div className="flex flex-col gap-4">
      {groups.map((g) => (
        <div key={g.label}>
          <div className="flex items-center gap-2 mb-2"><g.icon size={15} style={{ color: g.color }} /><p className="text-white font-black text-[13px]">{g.label}</p></div>
          <ul className="flex flex-col gap-1.5">
            {g.items.map((it, i) => (
              <li key={i} className="flex items-start gap-2 text-slate-400 text-[13px] font-medium leading-relaxed">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: g.color }} />{it}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};

// Shared responsive bottom-sheet shell (no fixed widths/heights).
const Sheet = ({ children, onClose }) => (
  <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center">
    <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
    <motion.div
      initial={{ y: '100%', opacity: 0.6 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 360, damping: 34 }}
      className="relative z-10 w-full max-w-[440px] bg-[#0b0c14] border border-white/10 rounded-t-[28px] sm:rounded-[28px] flex flex-col"
      style={{ maxHeight: 'min(88vh, 720px)' }}
    >
      {children}
    </motion.div>
  </div>
);

const UpdateGate = ({ children }) => {
  const [info, setInfo] = useState(null);
  const [forced, setForced] = useState(false);
  const [showUpdate, setShowUpdate] = useState(false);
  const [whatsNew, setWhatsNew] = useState(null);

  useEffect(() => {
    let cancelled = false;
    // Detect "just updated" locally (instant, offline-safe).
    const prev = consumeVersionChange();
    (async () => {
      try {
        const v = await api.appVersion(APP_VERSION);
        if (cancelled) return;
        setInfo(v);
        if (v.mandatory) { setForced(true); return; }            // force blocks everything else
        if (v.updateAvailable && !updateDismissed(v.currentVersion)) setShowUpdate(true);
      } catch { /* offline / cold start → never gate */ }
      // What's New after an update (skipped when a mandatory update is pending).
      if (!cancelled && prev && !whatsNewSeen(APP_VERSION)) {
        try {
          const { changelog } = await api.changelog();
          const entry = (changelog || []).find((c) => c.version === APP_VERSION);
          if (!cancelled) setWhatsNew(entry || { version: APP_VERSION });
        } catch { /* ignore */ }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const dismissOptional = () => { if (info) dismissUpdate(info.currentVersion); setShowUpdate(false); };
  const closeWhatsNew = () => { markWhatsNewSeen(APP_VERSION); setWhatsNew(null); };

  return (
    <>
      {children}
      <AnimatePresence>
        {/* ── MANDATORY: full-screen block, no dismiss ── */}
        {forced && info && (
          <motion.div key="forced" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-center justify-center p-5" style={{ background: 'rgba(2,3,7,0.92)', backdropFilter: 'blur(8px)' }}>
            <div className="w-full max-w-[420px] bg-[#0b0c14] border border-rose-500/25 rounded-[26px] p-6 flex flex-col items-center text-center" style={{ paddingBottom: 'calc(1.5rem + var(--ag-safe-bottom))' }}>
              <div className="w-16 h-16 rounded-2xl bg-rose-500/12 border border-rose-500/30 flex items-center justify-center mb-4"><ShieldAlert size={30} className="text-rose-400" /></div>
              <h2 className="text-white font-black tracking-tight" style={{ fontSize: 'clamp(19px,5vw,22px)' }}>Update Required</h2>
              <p className="text-slate-400 text-[13.5px] font-medium mt-2 leading-relaxed max-w-[320px]">
                A newer version of AlphaGuard is required to keep your family protected. Please update to continue — your data is safe.
              </p>
              <div className="w-full text-left mt-5 mb-5 max-h-[34vh] overflow-y-auto ag-no-scrollbar"><ReleaseNotes notes={info.releaseNotes} /></div>
              <button onClick={applyUpdate} className="ag-tap w-full h-[52px] rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold flex items-center justify-center gap-2">
                <ArrowUpCircle size={19} /> Update Now
              </button>
              <p className="text-slate-600 text-[11px] font-bold mt-3">Current: v{APP_VERSION} · Required: v{info.minimumVersion}</p>
            </div>
          </motion.div>
        )}

        {/* ── OPTIONAL: Update Available ── */}
        {!forced && showUpdate && info && (
          <Sheet key="update" onClose={dismissOptional}>
            <div className="p-6 overflow-y-auto ag-no-scrollbar" style={{ paddingBottom: 'calc(1.5rem + var(--ag-safe-bottom))' }}>
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15 sm:hidden" />
              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mb-3"><ArrowUpCircle size={26} className="text-cyan-400" /></div>
                <h2 className="text-white font-black tracking-tight" style={{ fontSize: 'clamp(18px,5vw,21px)' }}>Update Available</h2>
                <p className="text-slate-500 text-[12.5px] font-semibold mt-1">Version {info.currentVersion} is ready</p>
              </div>
              <div className="mt-5 mb-6 text-left"><p className="text-slate-500 text-[11px] font-black uppercase tracking-[0.12em] mb-3">What’s New</p><ReleaseNotes notes={info.releaseNotes} /></div>
              <div className="flex flex-col gap-2.5">
                <button onClick={applyUpdate} className="ag-tap w-full h-[52px] rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-extrabold flex items-center justify-center gap-2"><ArrowUpCircle size={19} /> Update Now</button>
                <button onClick={dismissOptional} className="ag-tap w-full h-12 rounded-full bg-white/[0.05] border border-white/10 text-slate-300 font-bold">Later</button>
              </div>
            </div>
          </Sheet>
        )}

        {/* ── WHAT'S NEW after updating (once per version) ── */}
        {!forced && !showUpdate && whatsNew && (
          <Sheet key="whatsnew" onClose={closeWhatsNew}>
            <div className="flex items-center gap-3 p-5 border-b border-white/[0.07]">
              <div className="w-10 h-10 rounded-xl bg-violet-500/15 flex items-center justify-center flex-shrink-0"><Sparkles size={19} className="text-violet-400" /></div>
              <div className="flex-1 min-w-0"><p className="text-white font-black text-[16px]">What’s New</p><p className="text-slate-500 text-[12px] font-semibold">Version {whatsNew.version || APP_VERSION}</p></div>
              <button onClick={closeWhatsNew} aria-label="Close" className="ag-tap w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-300"><X size={17} /></button>
            </div>
            <div className="overflow-y-auto ag-no-scrollbar p-5" style={{ paddingBottom: 'calc(1.25rem + var(--ag-safe-bottom))' }}>
              <ReleaseNotes notes={whatsNew} />
              <button onClick={closeWhatsNew} className="ag-tap w-full h-12 mt-6 rounded-full bg-gradient-to-r from-violet-500 to-indigo-600 text-white font-extrabold">Got it</button>
            </div>
          </Sheet>
        )}
      </AnimatePresence>
    </>
  );
};

export default UpdateGate;
