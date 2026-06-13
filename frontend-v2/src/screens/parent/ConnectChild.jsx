import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { ScanLine, Hash, ArrowRight, CheckCircle2, RefreshCw, AlertCircle, ChevronLeft } from 'lucide-react';
import { Screen, Button, Brand } from '../../components/ui';
import { CHILD } from '../../data/childDemo';
import { api } from '../../lib/agClient';

export const markConnected = () => localStorage.setItem('ag_connected', '1');
export const isConnected = () => localStorage.getItem('ag_connected') === '1';

const jget = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null'); } catch { return null; } };

const ConnectChild = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('pair'); // pair | success
  const [pairing, setPairing] = useState(null); // { pairingId, childId, code }
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const pollRef = useRef(null);

  // Create (or reuse) a real backend child + pending pairing → returns a 6-digit
  // code minted and stored server-side. The child device enters this code; the
  // backend validates it against PostgreSQL before activating the pairing.
  const generate = useCallback(async (force = false) => {
    setBusy(true); setError('');
    try {
      const existing = jget('ag_pairing');
      if (existing && existing.code && !force) { setPairing(existing); setBusy(false); return; }
      const r = await api.createChild({ name: 'My Child', age: 10, grade: '', school: '', emoji: '🧒', color: '#10b981' });
      const next = { pairingId: r.pairing.id, childId: r.child.id, code: r.pairing.code };
      localStorage.setItem('ag_pairing', JSON.stringify(next));
      setPairing(next);
    } catch (err) {
      setError(err.message && err.message.toLowerCase().includes('unauthorized')
        ? 'Your session expired. Please sign in again.'
        : 'Could not generate a pairing code. Check your connection and retry.');
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => { generate(false); }, [generate]);

  // Poll the backend until the child device claims the code (status → active).
  useEffect(() => {
    if (mode !== 'pair' || !pairing) return undefined;
    const check = async () => {
      try {
        const { pairings = [] } = await api.pairStatus();
        const mine = pairings.find((p) => p.id === pairing.pairingId);
        if (mine && mine.status === 'active') { markConnected(); setMode('success'); }
      } catch { /* transient — keep polling */ }
    };
    pollRef.current = setInterval(check, 3000);
    check();
    return () => clearInterval(pollRef.current);
  }, [mode, pairing]);

  /* ── Connection success ───────────────────────────────────────────────── */
  if (mode === 'success') {
    return (
      <Screen align="center" glow="#10b981" footer={<Button iconRight={ArrowRight} onClick={() => navigate('/app/home')}>Enter Dashboard</Button>}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="flex flex-col items-center text-center">
          <div className="relative mb-7">
            <div className="absolute -inset-2 rounded-full bg-emerald-500/20 blur-xl" />
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.35)]">
              <CheckCircle2 size={50} className="text-emerald-400" />
            </div>
          </div>
          <h1 className="text-[26px] font-black text-white tracking-tight">Device Connected</h1>
          <p className="text-slate-400 text-[15px] font-medium mt-3 max-w-[290px] leading-relaxed">
            You’re now protecting <span className="text-white font-bold">{CHILD.name}’s {CHILD.device}</span>. Your family safety platform is ready.
          </p>
          <div className="mt-7 flex items-center gap-3 px-5 py-3 rounded-2xl bg-white/[0.04] border border-white/[0.08]">
            <div className="w-11 h-11 rounded-full bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center text-xl">{CHILD.emoji}</div>
            <div className="text-left">
              <p className="text-white font-bold text-[14px]">{CHILD.name}, {CHILD.age}</p>
              <p className="text-emerald-400 text-[12px] font-semibold">● Online · {CHILD.device}</p>
            </div>
          </div>
        </motion.div>
      </Screen>
    );
  }

  /* ── Pairing: show the backend-generated code + QR, wait for the child ──── */
  const code = pairing?.code || '';
  const pretty = code ? `${code.slice(0, 3)} ${code.slice(3)}` : '— — —';

  return (
    <Screen align="between" glow="#06b6d4">
      <div className="w-full flex flex-col items-center text-center">
        <button onClick={() => navigate('/setup')} aria-label="Go back" className="ag-tap self-start mb-4 flex items-center justify-center w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <Brand variant="badge" className="mb-6" />
        <h1 className="text-[26px] font-black text-white tracking-tight leading-tight max-w-[300px]">Connect a Child Device</h1>
        <p className="text-slate-500 text-[14px] font-semibold mt-3 mb-7 max-w-[300px] leading-relaxed">
          Open AlphaGuard AI on your child’s phone and enter this pairing code, or scan the QR.
        </p>

        {error ? (
          <div className="w-full flex flex-col items-center gap-4 py-6">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30"><AlertCircle size={24} className="text-rose-400" /></span>
            <p className="text-rose-400 text-[13.5px] font-semibold max-w-[280px]">{error}</p>
            <button onClick={() => generate(true)} className="ag-tap inline-flex items-center gap-2 h-[46px] px-5 rounded-2xl text-cyan-300 font-bold text-[13.5px]" style={{ background: 'rgba(0,255,255,0.05)', border: '1px solid rgba(0,255,255,0.15)' }}>
              <RefreshCw size={15} /> <span>Retry</span>
            </button>
          </div>
        ) : (
          <>
            {/* QR */}
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/15"><ScanLine size={12} className="text-cyan-400" /></span>
              <span className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.14em]">Scan QR code</span>
            </div>
            <div className="relative mb-7">
              <motion.div className="absolute inset-0 rounded-[34px] border border-cyan-400/20" animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }} />
              <div className="relative z-10 bg-white p-5 rounded-[30px] border border-cyan-500/30 shadow-[0_0_48px_rgba(6,182,212,0.22)]">
                {code
                  ? <QRCodeSVG value={JSON.stringify({ code, v: 2 })} size={172} fgColor="#030307" bgColor="#ffffff" />
                  : <div className="w-[172px] h-[172px] flex items-center justify-center"><RefreshCw size={28} className={`text-slate-300 ${busy ? 'animate-spin' : ''}`} /></div>}
              </div>
            </div>

            {/* Code */}
            <div className="flex items-center gap-2 mb-4">
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.06]"><Hash size={12} className="text-slate-400" /></span>
              <span className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.14em]">Pairing code</span>
            </div>
            <div className="w-full bg-[#0b0c14] border border-white/[0.07] py-5 px-6 rounded-3xl">
              <AnimatePresence mode="wait">
                <motion.span key={code} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                  className="block text-[38px] font-black text-cyan-400 tracking-[10px] font-mono leading-none select-all ml-2.5">
                  {pretty}
                </motion.span>
              </AnimatePresence>
            </div>

            {/* Waiting indicator (live poll) */}
            <div className="flex items-center justify-center gap-2.5 mt-7">
              <span className="relative flex h-2.5 w-2.5">
                <motion.span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400/60" animate={{ scale: [1, 2.4], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }} />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
              </span>
              <span className="text-slate-400 font-semibold text-[13px]">Waiting for child device…</span>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-slate-600 text-[12px] font-semibold">Your connection is end-to-end encrypted.</p>
    </Screen>
  );
};

export default ConnectChild;
