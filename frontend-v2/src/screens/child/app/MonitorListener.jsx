import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Monitor, Check, X, Square } from 'lucide-react';
import { ensureSession } from '../../../lib/session';
import { createPublisher, captureMedia } from '../../../lib/webrtc';
import { useChildApp } from '../../../child/ChildAppContext';

const META = {
  camera: { icon: Camera, label: 'camera', title: 'Camera Monitoring Active', a: '#ef4444' },
  audio: { icon: Mic, label: 'microphone', title: 'Audio Monitoring Active', a: '#a855f7' },
  screen: { icon: Monitor, label: 'screen', title: 'Screen Monitoring Active', a: '#3b82f6' },
};

/**
 * Always-mounted in the child app. Listens for monitor requests from the parent,
 * asks the child for explicit consent, then publishes the real media stream over
 * WebRTC and shows a persistent "monitoring active" indicator the child can stop.
 * Transparency: nothing streams without an Accept; every session is visible.
 */
const MonitorListener = () => {
  const { profile } = useChildApp();
  const [pending, setPending] = useState(null);  // { kind }
  const [active, setActive] = useState(null);     // { kind, pub, facing }
  const sessionRef = useRef(null);
  const activeRef = useRef(null);
  activeRef.current = active;

  useEffect(() => {
    let mounted = true;
    ensureSession('child').then((s) => {
      if (!mounted) return;
      sessionRef.current = s;
      const onReq = (m) => { if (!m.kind) return; if (activeRef.current && activeRef.current.kind === m.kind) return; setPending({ kind: m.kind }); };
      const onStop = (m) => { const a = activeRef.current; if (a && a.kind === m.kind) { a.pub.teardown(); setActive(null); } };
      s.socket.on('monitor:request', onReq);
      s.socket.on('monitor:stop', onStop);
    }).catch(() => { /* backend offline — child app still works locally */ });
    return () => { mounted = false; const a = activeRef.current; if (a) a.pub.teardown(); };
  }, []);

  const decline = () => {
    const s = sessionRef.current; const k = pending?.kind;
    if (s && k) s.socket.emit('monitor:decline', { pairingId: s.pairingId, kind: k });
    setPending(null);
  };

  const accept = async () => {
    const s = sessionRef.current; const kind = pending?.kind; if (!s || !kind) return;
    setPending(null);
    try {
      const facing = 'environment';
      const stream = await captureMedia(kind, facing);
      const pub = createPublisher({
        socket: s.socket, pairingId: s.pairingId, kind, stream,
        onControl: async (action, value) => {
          const a = activeRef.current; if (!a) return;
          if (action === 'facing' && kind === 'camera') {
            try {
              const ns = await captureMedia('camera', value === 'front' ? 'user' : 'environment');
              const newTrack = ns.getVideoTracks()[0];
              a.pub.replaceVideoTrack(newTrack);
              // stop the previous video track only
              a.stream.getVideoTracks().forEach((t) => t.stop());
              a.stream = ns;
              setActive({ ...a, facing: value });
            } catch {}
          } else if (action === 'torch' && kind === 'camera') {
            try { await a.stream.getVideoTracks()[0].applyConstraints({ advanced: [{ torch: !!value }] }); } catch {}
          }
        },
      });
      pub.stream = stream;
      setActive({ kind, pub, stream, facing });
    } catch {
      // permission denied / no device → tell the parent it was declined
      s.socket.emit('monitor:decline', { pairingId: s.pairingId, kind });
    }
  };

  const stop = () => { if (active) { active.pub.stop(); setActive(null); } };

  return createPortal(
    <>
      {/* Consent prompt */}
      <AnimatePresence>
        {pending && (() => { const M = META[pending.kind]; const I = M.icon; return (
          <motion.div className="fixed inset-0 z-[90] flex items-end justify-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={decline} />
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', stiffness: 360, damping: 34 }} className="relative z-10 w-full max-w-[440px] bg-[#0b0c14] border border-white/10 rounded-t-[28px] p-6" style={{ paddingBottom: 'calc(1.5rem + var(--ag-safe-bottom))' }}>
              <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-white/15" />
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center" style={{ background: `${M.a}1f`, border: `1px solid ${M.a}55` }}><I size={28} style={{ color: M.a }} /></div>
                <p className="text-white font-black text-[17px]">{profile.parentName} requests {M.label} access</p>
                <p className="text-slate-400 text-[13px] font-semibold">They’ll be able to see your {M.label} live until you stop it. You’re in control.</p>
                <div className="flex gap-3 w-full mt-2">
                  <button onClick={decline} className="ag-tap flex-1 h-12 rounded-full bg-white/[0.05] border border-white/10 text-white font-bold flex items-center justify-center gap-2"><X size={17} /> Decline</button>
                  <button onClick={accept} className="ag-tap flex-1 h-12 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-extrabold flex items-center justify-center gap-2"><Check size={17} /> Accept</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        ); })()}
      </AnimatePresence>

      {/* Persistent monitoring indicator */}
      <AnimatePresence>
        {active && (() => { const M = META[active.kind]; const I = M.icon; return (
          <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }} className="fixed left-1/2 -translate-x-1/2 z-[85] w-full max-w-[440px] px-4" style={{ top: 'calc(var(--ag-safe-top) + 8px)' }}>
            <div className="flex items-center gap-3 rounded-2xl border border-rose-500/40 bg-[#1a0c0c]/95 backdrop-blur-xl px-4 py-2.5 shadow-[0_8px_28px_rgba(239,68,68,0.3)]">
              <span className="relative flex w-3 h-3"><motion.span className="absolute inline-flex h-full w-full rounded-full bg-rose-500/60" animate={{ scale: [1, 1.8, 1], opacity: [0.7, 0, 0.7] }} transition={{ repeat: Infinity, duration: 1.6 }} /><span className="relative inline-flex rounded-full w-3 h-3 bg-rose-500" /></span>
              <I size={16} style={{ color: M.a }} />
              <span className="flex-1 text-white font-bold text-[12.5px]">{M.title}</span>
              <button onClick={stop} className="ag-tap flex items-center gap-1.5 px-3 h-8 rounded-full bg-white/10 text-white font-bold text-[11.5px]"><Square size={12} /> Stop</button>
            </div>
          </motion.div>
        ); })()}
      </AnimatePresence>
    </>,
    document.body,
  );
};

export default MonitorListener;
