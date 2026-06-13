import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ScanLine, Hash, ArrowRight, CheckCircle2, ChevronLeft } from 'lucide-react';
import { Screen, Button, Brand } from '../../components/ui';
import { CHILD } from '../../data/childDemo';

export const markConnected = () => localStorage.setItem('ag_connected', '1');
export const isConnected = () => localStorage.getItem('ag_connected') === '1';

const ConnectChild = () => {
  const navigate = useNavigate();
  const params = new URLSearchParams(useLocation().search);
  const [mode, setMode] = useState(params.get('mode') || 'choose'); // choose | camera | code | success
  const [code, setCode] = useState('');

  useEffect(() => {
    if (params.get('success') === '1') { markConnected(); setMode('success'); }
  }, []); // eslint-disable-line

  // Camera path: simulate a scan, then auto-connect (no buttons).
  useEffect(() => {
    if (mode !== 'camera' || params.get('mode') === 'camera') return; // don't auto-advance in review preset
    const t = setTimeout(() => { markConnected(); setMode('success'); }, 2400);
    return () => clearTimeout(t);
  }, [mode]); // eslint-disable-line

  const connectViaCode = () => { markConnected(); setMode('success'); };

  /* ── Camera scanner ───────────────────────────────────────────────────── */
  if (mode === 'camera') {
    return (
      <Screen align="between" glow="#06b6d4">
        <div className="w-full">
          <button onClick={() => setMode('choose')} className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="relative w-[252px] h-[252px] rounded-[32px] overflow-hidden bg-black border border-white/10">
            {/* faux camera feed */}
            <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 40%, #0e2a33, #04070a)' }} />
            {/* corner brackets */}
            {[['top-3 left-3', 'border-t-2 border-l-2 rounded-tl-xl'], ['top-3 right-3', 'border-t-2 border-r-2 rounded-tr-xl'], ['bottom-3 left-3', 'border-b-2 border-l-2 rounded-bl-xl'], ['bottom-3 right-3', 'border-b-2 border-r-2 rounded-br-xl']].map(([pos, b], i) => (
              <span key={i} className={`absolute ${pos} w-9 h-9 ${b} border-cyan-400`} />
            ))}
            {/* scanning line */}
            <motion.div className="absolute left-5 right-5 h-0.5 bg-cyan-400 shadow-[0_0_14px_#06b6d4]" animate={{ top: ['18%', '82%', '18%'] }} transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }} />
            <div className="absolute inset-0 flex items-center justify-center"><ScanLine size={34} className="text-cyan-400/30" /></div>
          </div>
          <p className="text-white font-bold text-[15px] mt-8">Scanning for QR code…</p>
          <p className="text-slate-500 text-[13px] font-semibold mt-1.5 max-w-[280px] text-center">Point your camera at the code shown on your child’s device.</p>
        </div>
        <div className="h-2" />
      </Screen>
    );
  }

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

  /* ── Enter pairing code ───────────────────────────────────────────────── */
  if (mode === 'code') {
    return (
      <Screen align="between" glow="#06b6d4"
        footer={<Button iconRight={ArrowRight} disabled={code.length !== 6} onClick={connectViaCode}>Connect Device</Button>}>
        <div className="w-full">
          <button onClick={() => setMode('choose')} className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center">
          <h1 className="text-[24px] font-black text-white tracking-tight">Enter Pairing Code</h1>
          <p className="text-slate-500 text-[14px] font-semibold mt-2.5 mb-8 max-w-[280px] text-center leading-relaxed">Type the 6-digit code shown on your child’s device.</p>
          <div className="relative w-full" onClick={(e) => e.currentTarget.querySelector('input').focus()}>
            <input autoFocus type="tel" inputMode="numeric" value={code} maxLength={6} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="absolute inset-0 w-full h-full opacity-0" />
            <div className="flex items-center justify-center gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={`flex items-center justify-center w-12 h-14 rounded-2xl border-2 text-[22px] font-black text-white ${i < code.length ? 'border-cyan-400/60 bg-cyan-500/[0.06]' : i === code.length ? 'border-blue-500/60 bg-white/[0.03]' : 'border-white/[0.08] bg-[#0b0c14]'}`}>{code[i] || ''}</div>
              ))}
            </div>
          </div>
        </div>
        <div className="h-2" />
      </Screen>
    );
  }

  /* ── Choose method (cards are the actions — no footer CTA) ────────────── */
  return (
    <Screen align="between" glow="#06b6d4">
      <div className="w-full flex flex-col">
        <div className="flex flex-col items-center text-center mb-9 pt-2">
          <Brand variant="badge" className="mb-7" />
          <h1 className="text-[26px] font-black text-white tracking-tight leading-tight max-w-[300px]">Connect a Child Device</h1>
          <p className="text-slate-500 text-[14px] font-semibold mt-3 max-w-[300px] leading-relaxed">
            Set up AlphaGuard AI on your child’s phone, then choose how to connect it.
          </p>
        </div>

        <div className="flex flex-col gap-3.5">
          <button onClick={() => setMode('camera')} className="ag-tap flex items-center gap-4 p-4 rounded-[22px] border border-white/[0.08] bg-[#0b0c14] text-left">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center flex-shrink-0"><ScanLine size={22} className="text-cyan-400" /></div>
            <div className="flex-1 min-w-0"><h3 className="text-white font-black text-[16px]">Scan QR Code</h3><p className="text-slate-400 text-[12.5px] font-semibold mt-0.5">Use your camera to scan the child device</p></div>
            <ArrowRight size={18} className="text-slate-600" />
          </button>
          <button onClick={() => setMode('code')} className="ag-tap flex items-center gap-4 p-4 rounded-[22px] border border-white/[0.08] bg-[#0b0c14] text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/12 flex items-center justify-center flex-shrink-0"><Hash size={22} className="text-slate-300" /></div>
            <div className="flex-1 min-w-0"><h3 className="text-white font-black text-[16px]">Enter Pairing Code</h3><p className="text-slate-400 text-[12.5px] font-semibold mt-0.5">Type the 6-digit code manually</p></div>
            <ArrowRight size={18} className="text-slate-600" />
          </button>
        </div>
      </div>

      <p className="text-center text-slate-600 text-[12px] font-semibold">Your connection is end-to-end encrypted.</p>
    </Screen>
  );
};

export default ConnectChild;
