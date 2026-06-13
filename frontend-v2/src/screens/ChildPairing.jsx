import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { RefreshCw, ScanLine, Hash } from 'lucide-react';
import { Screen } from '../components/ui';

const gen = () => String(Math.floor(100000 + Math.random() * 900000));

const ChildPairing = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('483921'); // mock starting code
  const [spin, setSpin] = useState(false);

  const regenerate = useCallback(() => {
    setSpin(true);
    setCode(gen());
    setTimeout(() => setSpin(false), 600);
  }, []);

  const pretty = `${code.slice(0, 3)} ${code.slice(3)}`;

  return (
    <Screen align="center" glow="#06b6d4">
      <div className="w-full flex flex-col items-center text-center">
        <h1 className="text-[27px] font-bold text-white leading-[1.32] max-w-[320px]">
          Connect to Parent<br />Account
        </h1>
        <p className="text-slate-500 text-[14px] mt-3 mb-8 max-w-[300px] font-semibold leading-relaxed">
          Scan the QR code from the parent device or enter the pairing code.
        </p>

        {/* ── Option 1 · Scan QR ─────────────────────────────────────────── */}
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/15"><ScanLine size={12} className="text-cyan-400" /></span>
          <span className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.14em]">Scan QR code</span>
        </div>

        <div className="relative mb-3">
          <motion.div className="absolute inset-0 rounded-[34px] border border-cyan-400/20" animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }} transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }} />
          <div className="relative z-10 bg-white p-5 rounded-[30px] border border-cyan-500/30 shadow-[0_0_48px_rgba(6,182,212,0.22)]">
            <AnimatePresence mode="wait">
              <motion.div key={code} initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                <QRCodeSVG value={JSON.stringify({ code, v: 2 })} size={188} fgColor="#030307" bgColor="#ffffff" />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* ── Option 2 · Enter code ──────────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-6 mb-4">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.06]"><Hash size={12} className="text-slate-400" /></span>
          <span className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.14em]">Enter pairing code</span>
        </div>

        <div className="w-full bg-[#0b0c14] border border-white/[0.07] py-5 px-6 rounded-3xl">
          <AnimatePresence mode="wait">
            <motion.span
              key={code}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}
              className="block text-[38px] font-black text-cyan-400 tracking-[10px] font-mono leading-none select-all ml-2.5"
            >
              {pretty}
            </motion.span>
          </AnimatePresence>
        </div>

        {/* Generate new code — secondary glass action */}
        <motion.button
          onClick={regenerate}
          whileTap={{ scale: 0.98 }}
          whileHover={{ boxShadow: '0 0 26px rgba(6,182,212,0.28)' }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="ag-tap inline-flex items-center justify-center gap-2 h-[46px] px-5 mt-6 rounded-2xl text-cyan-300 font-bold text-[13.5px] backdrop-blur-md"
          style={{ background: 'rgba(0,255,255,0.05)', border: '1px solid rgba(0,255,255,0.15)' }}
        >
          <RefreshCw size={15} className={spin ? 'animate-spin' : ''} />
          <span>Generate New Code</span>
        </motion.button>

        {/* Helper text */}
        <p className="text-slate-600 text-[11.5px] font-medium mt-2.5">Creates a new secure pairing code and QR.</p>

        {/* Waiting state — tap simulates the parent connecting (prototype) */}
        <button onClick={() => navigate('/child/connected')} className="ag-tap flex items-center justify-center gap-2.5 mt-7">
          <span className="relative flex h-2.5 w-2.5">
            <motion.span className="absolute inline-flex h-full w-full rounded-full bg-cyan-400/60" animate={{ scale: [1, 2.4], opacity: [0.6, 0] }} transition={{ repeat: Infinity, duration: 1.8, ease: 'easeOut' }} />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-400" />
          </span>
          <span className="text-slate-400 font-semibold text-[13px]">Waiting for parent connection…</span>
        </button>
      </div>
    </Screen>
  );
};

export default ChildPairing;
