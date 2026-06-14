import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { Hash, ArrowRight, CheckCircle2, RefreshCw, AlertCircle, ChevronLeft, Copy, Check, QrCode, ShieldAlert } from 'lucide-react';
import { Screen, Button, Brand, Modal } from '../../components/ui';
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
  const [regening, setRegening] = useState(false);
  const [copied, setCopied] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const pollRef = useRef(null);

  // Create (or reuse) a real backend child + pending pairing → returns a 6-digit
  // code minted and stored server-side. The child device enters this code; the
  // backend validates it against PostgreSQL before activating the pairing.
  // If we already have a child but its code was revoked (e.g. the parent stopped
  // a previous attempt), we mint a fresh code for the SAME child rather than
  // creating a duplicate.
  const generate = useCallback(async (force = false) => {
    setBusy(true); setError('');
    try {
      const existing = jget('ag_pairing');
      if (existing && existing.code && existing.pairingId && !force) { setPairing(existing); setBusy(false); return; }
      const r = existing && existing.childId
        ? await api.regeneratePairing(existing.childId)
        : await api.createChild({ name: 'My Child', age: 10, grade: '', school: '', emoji: '🧒', color: '#10b981' });
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

  // Regenerate: server revokes the old pending code/QR and mints a brand-new one
  // (single active request per child). The poll effect re-arms on the new
  // pairingId automatically, so the waiting state updates itself.
  const regenerate = useCallback(async () => {
    const childId = jget('ag_pairing')?.childId || pairing?.childId;
    setRegening(true); setError(''); setCopied(false);
    try {
      if (!childId) { await generate(true); return; }
      const r = await api.regeneratePairing(childId);
      const next = { pairingId: r.pairing.id, childId: r.child.id, code: r.pairing.code };
      localStorage.setItem('ag_pairing', JSON.stringify(next));
      setPairing(next);
    } catch {
      setError('Could not generate a new code. Please try again.');
    } finally {
      setRegening(false);
    }
  }, [pairing, generate]);

  // Stop Connecting: invalidate the active request server-side (old code + old QR
  // immediately stop working), keep the child so a future visit mints a fresh
  // code, then return to the previous screen.
  const stopConnecting = useCallback(async () => {
    setExitOpen(false);
    const childId = pairing?.childId || jget('ag_pairing')?.childId;
    try { if (childId) await api.revokePairing(childId); } catch { /* best-effort */ }
    if (childId) localStorage.setItem('ag_pairing', JSON.stringify({ childId }));
    else localStorage.removeItem('ag_pairing');
    navigate('/setup');
  }, [pairing, navigate]);

  // One-click copy of the current code (with an execCommand fallback).
  const copy = useCallback(async () => {
    const value = pairing?.code || '';
    if (!value) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(value);
      else { const ta = document.createElement('textarea'); ta.value = value; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove(); }
      setCopied(true); setTimeout(() => setCopied(false), 1800);
    } catch { /* clipboard blocked */ }
  }, [pairing]);

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
        <button onClick={() => (pairing?.code && !error ? setExitOpen(true) : navigate('/setup'))} aria-label="Go back" className="ag-tap self-start mb-3 flex items-center justify-center w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <Brand variant="badge" className="mb-4" />
        <h1 className="text-[25px] font-black text-white tracking-tight leading-tight max-w-[300px]">Connect a Child Device</h1>

        {error ? (
          <div className="w-full flex flex-col items-center gap-4 py-8">
            <span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30"><AlertCircle size={24} className="text-rose-400" /></span>
            <p className="text-rose-400 text-[13.5px] font-semibold max-w-[280px]">{error}</p>
            <button onClick={() => generate(true)} className="ag-tap inline-flex items-center gap-2 h-[46px] px-5 rounded-2xl text-cyan-300 font-bold text-[13.5px]" style={{ background: 'rgba(0,255,255,0.05)', border: '1px solid rgba(0,255,255,0.15)' }}>
              <RefreshCw size={15} /> <span>Retry</span>
            </button>
          </div>
        ) : (
          <>
            {/* ── PRIMARY · Scan this QR Code ─────────────────────────────── */}
            <div className="flex items-center gap-2 mt-5 mb-4">
              <QrCode size={16} className="text-cyan-400" />
              <span className="text-[14px] text-white font-black tracking-tight">Scan this QR Code</span>
            </div>
            <div className="relative mb-2">
              <motion.div className="absolute -inset-1 rounded-[36px] bg-cyan-500/20 blur-xl" animate={{ opacity: [0.4, 0.7, 0.4] }} transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }} />
              <motion.div className="absolute inset-0 rounded-[34px] border border-cyan-400/25" animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0, 0.6] }} transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }} />
              <div className="relative z-10 bg-white p-6 rounded-[32px] border border-cyan-500/40 shadow-[0_0_64px_rgba(6,182,212,0.35)]">
                <AnimatePresence mode="wait">
                  <motion.div key={code || 'loading'} initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                    {code
                      ? <QRCodeSVG value={JSON.stringify({ code, v: 2 })} size={208} fgColor="#030307" bgColor="#ffffff" level="M" />
                      : <div className="w-[208px] h-[208px] flex items-center justify-center"><RefreshCw size={30} className={`text-slate-300 ${busy ? 'animate-spin' : ''}`} /></div>}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
            <p className="text-slate-500 text-[12.5px] font-semibold mb-6 max-w-[280px]">Open AlphaGuard AI on your child’s phone and scan this code.</p>

            {/* ── SECONDARY · Manual pairing code ─────────────────────────── */}
            <div className="flex items-center gap-3 w-full mb-4">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.15em] flex items-center gap-1.5"><Hash size={11} /> or enter code manually</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>
            <div className="w-full bg-[#0b0c14] border border-white/[0.07] py-4 px-5 rounded-3xl flex items-center justify-between gap-3">
              <AnimatePresence mode="wait">
                <motion.span key={code} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
                  className="text-[32px] font-black text-cyan-400 tracking-[8px] font-mono leading-none select-all ml-1.5">
                  {pretty}
                </motion.span>
              </AnimatePresence>
              <button onClick={copy} disabled={!code} aria-label="Copy pairing code"
                className={`ag-tap flex-shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-2xl text-[12.5px] font-bold transition-colors ${copied ? 'bg-emerald-500/15 border border-emerald-400/30 text-emerald-300' : 'bg-cyan-500/10 border border-cyan-400/25 text-cyan-300'}`}>
                {copied ? <><Check size={15} /> Copied</> : <><Copy size={15} /> Copy</>}
              </button>
            </div>

            {/* ── Generate New Code & QR ──────────────────────────────────── */}
            <button onClick={regenerate} disabled={regening || busy}
              className="ag-tap w-full mt-4 inline-flex items-center justify-center gap-2.5 min-h-[54px] rounded-2xl text-white text-[14px] font-black border border-cyan-400/30 disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.18), rgba(37,99,235,0.12))', boxShadow: '0 0 28px rgba(6,182,212,0.18)' }}>
              <RefreshCw size={17} className={regening ? 'animate-spin' : ''} />
              <span>{regening ? 'Generating…' : 'Generate New Code & QR'}</span>
            </button>

            {/* ── Waiting state ───────────────────────────────────────────── */}
            <div className="flex flex-col items-center gap-1.5 mt-7">
              <div className="flex items-center justify-center gap-2.5">
                <span className="relative flex h-2.5 w-2.5">
                  <motion.span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400/60" animate={{ scale: [1, 2.4], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }} />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
                </span>
                <span className="text-white font-bold text-[13.5px]">Waiting for your child to connect</span>
              </div>
              <p className="text-slate-500 text-[12px] font-medium max-w-[290px] leading-relaxed">This pairing request remains valid until used or regenerated.</p>
            </div>
          </>
        )}
      </div>

      <p className="text-center text-slate-600 text-[12px] font-semibold mt-4">Your connection is end-to-end encrypted.</p>

      {/* Exit confirmation — Back does not leave immediately while a request is live. */}
      <Modal open={exitOpen} onClose={() => setExitOpen(false)} variant="center" title="Stop Connecting Child Device?">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute -inset-2 rounded-2xl bg-amber-500/20 blur-lg" />
            <div className="relative w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-400/30 flex items-center justify-center">
              <ShieldAlert size={26} className="text-amber-400" />
            </div>
          </div>
          <p className="text-slate-400 text-[13.5px] font-medium leading-relaxed max-w-[300px]">
            Your current pairing code and QR code will no longer be available. You can continue waiting or stop the pairing process.
          </p>
        </div>
        <div className="flex flex-col gap-2.5 mt-6">
          <button onClick={() => setExitOpen(false)} className="ag-tap w-full min-h-[52px] rounded-2xl text-white text-[14px] font-black border border-cyan-400/30" style={{ background: 'linear-gradient(135deg,#06b6d4,#2563eb)', boxShadow: '0 0 26px rgba(6,182,212,0.28)' }}>
            Continue Waiting
          </button>
          <button onClick={stopConnecting} className="ag-tap w-full min-h-[52px] rounded-2xl text-rose-300 text-[14px] font-bold bg-rose-500/[0.08] border border-rose-500/25 hover:bg-rose-500/[0.14] transition-colors">
            Stop Connecting
          </button>
        </div>
      </Modal>
    </Screen>
  );
};

export default ConnectChild;
