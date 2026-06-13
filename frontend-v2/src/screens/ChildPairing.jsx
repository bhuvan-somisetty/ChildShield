import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Hash, ArrowRight, ChevronLeft, ScanLine, QrCode } from 'lucide-react';
import jsQR from 'jsqr';
import { Screen, Button } from '../components/ui';
import { api, setToken } from '../lib/agClient';
import { useStepHistory } from '../lib/useStepHistory';

// Child device pairing. The PARENT device generates the 6-digit code + QR
// (backend mints it on the authenticated POST /children call). The child joins
// here via EITHER method:
//   A) Scan the parent's QR  → extract the code → same /pair/claim endpoint
//   B) Enter the 6-digit code → same /pair/claim endpoint
// Backend pairing security is unchanged: the code is validated against
// PostgreSQL; invalid/expired/used codes are rejected by the server. The child
// only ever consumes a parent-generated code — it never generates its own QR.

// Accept the parent QR payload { code, v } or a bare 6-digit string.
const extractCode = (data) => {
  try { const o = JSON.parse(data); if (o && /^\d{6}$/.test(String(o.code))) return String(o.code); } catch { /* not json */ }
  const s = String(data).trim();
  return /^\d{6}$/.test(s) ? s : null;
};

const ChildPairing = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState('enter'); // 'enter' | 'scan'
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [scanError, setScanError] = useState('');
  const [busy, setBusy] = useState(false);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(0);
  const claimedRef = useRef(false);

  // Single pairing path shared by manual entry and QR scan.
  const claim = useCallback(async (theCode) => {
    if (claimedRef.current) return;
    claimedRef.current = true;
    setBusy(true); setError(''); setScanError('');
    try {
      const res = await api.claimPairing(theCode, 'web'); // → { token, child, pairingId }
      setToken(res.token);
      localStorage.setItem('ag_child_token', JSON.stringify(res.token));
      localStorage.setItem('ag_pairing', JSON.stringify({ pairingId: res.pairingId, childId: res.child.id, code: theCode }));
      navigate('/child/connected');
    } catch (err) {
      claimedRef.current = false;
      // Prefer the backend's actionable message (e.g. a regenerated/used code →
      // "Pairing request is no longer valid. Ask your parent for a new code.").
      const msg = err.message && /valid|code/i.test(err.message)
        ? err.message
        : 'Pairing failed. Check the code and try again.';
      setError(msg); setScanError(msg);
      setMode('enter'); // surface the failure on the manual screen
    } finally {
      setBusy(false);
    }
  }, [navigate]);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    const s = streamRef.current;
    if (s) { s.getTracks().forEach((t) => t.stop()); streamRef.current = null; }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  // Camera scanning loop (only while mode === 'scan').
  useEffect(() => {
    if (mode !== 'scan') return undefined;
    let cancelled = false;
    setScanError('');

    const tick = () => {
      if (cancelled) return;
      const v = videoRef.current, c = canvasRef.current;
      if (v && c && v.readyState === v.HAVE_ENOUGH_DATA) {
        c.width = v.videoWidth; c.height = v.videoHeight;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(v, 0, 0, c.width, c.height);
        const img = ctx.getImageData(0, 0, c.width, c.height);
        const found = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
        if (found && found.data) {
          const scanned = extractCode(found.data);
          if (scanned) { stopCamera(); claim(scanned); return; }
          setScanError('Invalid QR code — scan your parent’s AlphaGuard pairing QR.');
        }
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    (async () => {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setScanError('Camera isn’t available on this device. Enter the 6-digit code instead.');
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        const v = videoRef.current;
        v.srcObject = stream; v.setAttribute('playsinline', 'true'); v.muted = true;
        await v.play();
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        setScanError('Camera access was blocked. Allow camera access, or enter the code manually.');
      }
    })();

    return () => { cancelled = true; stopCamera(); };
  }, [mode, claim, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]); // cleanup on unmount

  const submitManual = () => { if (code.length === 6) claim(code); };

  // Browser Back inside the scanner returns to manual entry instead of leaving
  // the pairing flow; from manual entry it returns to the child-setup route.
  useStepHistory(mode === 'scan' ? 2 : 1, 1, () => setMode('enter'));

  /* ── QR SCANNER ───────────────────────────────────────────────────────── */
  if (mode === 'scan') {
    return (
      <Screen align="between" glow="#06b6d4">
        <div className="w-full">
          <button onClick={() => setMode('enter')} aria-label="Back" className="ag-tap w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          <h1 className="text-[22px] font-black text-white tracking-tight mb-1.5">Scan Parent QR Code</h1>
          <p className="text-slate-500 text-[13px] font-semibold mb-7 max-w-[280px] text-center">Point your camera at the QR code on the parent dashboard.</p>

          <div className="relative w-[260px] h-[260px] rounded-[32px] overflow-hidden bg-black border border-white/10">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            {/* corner brackets */}
            {[['top-3 left-3', 'border-t-2 border-l-2 rounded-tl-xl'], ['top-3 right-3', 'border-t-2 border-r-2 rounded-tr-xl'], ['bottom-3 left-3', 'border-b-2 border-l-2 rounded-bl-xl'], ['bottom-3 right-3', 'border-b-2 border-r-2 rounded-br-xl']].map(([pos, b], i) => (
              <span key={i} className={`absolute ${pos} w-9 h-9 ${b} border-cyan-400 pointer-events-none`} />
            ))}
            <motion.div className="absolute left-5 right-5 h-0.5 bg-cyan-400 shadow-[0_0_14px_#06b6d4] pointer-events-none" animate={{ top: ['18%', '82%', '18%'] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }} />
          </div>

          {scanError
            ? <p className="text-rose-400 text-[12.5px] font-semibold mt-6 max-w-[290px] text-center">{scanError}</p>
            : <p className="text-slate-400 text-[13px] font-semibold mt-6">{busy ? 'Pairing…' : 'Scanning for QR code…'}</p>}

          <button onClick={() => setMode('enter')} className="ag-tap mt-5 text-cyan-300 font-bold text-[13.5px] inline-flex items-center gap-1.5">
            <Hash size={15} /> Enter code manually instead
          </button>
        </div>
        <div className="h-2" />
      </Screen>
    );
  }

  /* ── MANUAL ENTRY (+ Scan QR button) ──────────────────────────────────── */
  return (
    <Screen align="between" glow="#06b6d4"
      footer={<Button iconRight={ArrowRight} loading={busy} disabled={code.length !== 6} onClick={submitManual}>Connect to Parent</Button>}>
      <div className="w-full flex flex-col items-center text-center pt-2">
        <button onClick={() => navigate('/child-setup')} aria-label="Go back" className="ag-tap self-start mb-4 flex items-center justify-center w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white">
          <ChevronLeft size={20} />
        </button>
        <h1 className="text-[27px] font-bold text-white leading-[1.32] max-w-[320px]">
          Connect to Parent<br />Account
        </h1>
        <p className="text-slate-500 text-[14px] mt-3 mb-7 max-w-[300px] font-semibold leading-relaxed">
          Scan the QR code from the parent dashboard, or enter the 6-digit pairing code.
        </p>

        {/* Prominent Scan QR button — primary method, above the manual inputs */}
        <button onClick={() => setMode('scan')} className="ag-tap w-full flex items-center justify-center gap-3 min-h-[60px] rounded-3xl text-white text-[15px] font-black shadow-[0_12px_32px_rgba(6,182,212,0.32)]" style={{ background: 'linear-gradient(135deg,#06b6d4,#2563eb)' }}>
          <QrCode size={22} /> <span>Scan QR Code</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 w-full my-6">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.15em]">or enter code</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.06]"><Hash size={12} className="text-slate-400" /></span>
          <span className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.14em]">Pairing code</span>
        </div>

        <div className="relative w-full" onClick={(e) => e.currentTarget.querySelector('input').focus()}>
          <input
            type="tel" inputMode="numeric" value={code} maxLength={6}
            onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(''); }}
            className="absolute inset-0 w-full h-full opacity-0"
          />
          <div className="flex items-center justify-center gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`flex items-center justify-center w-12 h-14 rounded-2xl border-2 text-[22px] font-black text-white transition-colors ${
                i < code.length ? 'border-cyan-400/60 bg-cyan-500/[0.06]' : i === code.length ? 'border-blue-500/60 bg-white/[0.03]' : 'border-white/[0.08] bg-[#0b0c14]'}`}>
                {code[i] || ''}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="text-rose-400 text-[12.5px] font-semibold mt-5 max-w-[300px]">
            {error}
          </motion.p>
        )}
      </div>

      <p className="text-center text-slate-600 text-[12px] font-semibold">Your connection is end-to-end encrypted.</p>
    </Screen>
  );
};

export default ChildPairing;
