import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { RefreshCw, CheckCircle, Loader2, KeyRound } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';
import { Screen } from '../../components/ui';

const ChildPairing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { childId, pairingCode, childName } = location.state || {};

  const [livePairingCode, setLivePairingCode] = useState(pairingCode);
  const [refreshing, setRefreshing] = useState(false);
  const [pairingDetected, setPairingDetected] = useState(false);
  const [error, setError] = useState('');
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (!childId) navigate('/child-setup');
  }, [childId, navigate]);

  useEffect(() => {
    if (!childId) return;
    isMountedRef.current = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/device/status/${childId}`);
        const data = await res.json();
        if (!isMountedRef.current) return;
        if (res.ok && data.success && data.connected === true) {
          setPairingDetected(true);
          localStorage.setItem('child_session', JSON.stringify({
            childId,
            childName: data.childName || childName,
            parentName: data.parentName || 'Parent',
            parentId: data.status?.parentId || null,
            pairedAt: new Date().toISOString(),
          }));
          setTimeout(() => {
            if (isMountedRef.current) navigate('/child/permissions', { replace: true });
          }, 1500);
        }
      } catch (err) {
        console.log('Polling error:', err.message);
      }
    };

    const interval = setInterval(poll, 3000);
    poll();
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [childId, navigate, childName]);

  const handleRefreshCode = async () => {
    if (!childId || refreshing) return;
    setRefreshing(true);
    setError('');
    try {
      const res = await fetch(`/api/device/refresh-code/${childId}`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) setLivePairingCode(data.pairingCode);
      else setError(data.error || 'Failed to refresh code.');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  if (!childId) return null;

  return (
    <Screen ambient="brand" align="center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col items-center text-center"
      >
        {/* Title */}
        <h1 className="text-[27px] font-black text-white tracking-tight leading-tight">Connect this device</h1>
        <p className="text-slate-500 text-[14px] mt-3 mb-10 max-w-[300px] font-semibold leading-relaxed">
          Pair with the parent’s AlphaGuard AI app in one of two ways.
        </p>

        {error && (
          <div className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] p-3.5 rounded-2xl mb-8 font-semibold">
            {error}
          </div>
        )}

        {/* ── 1 · Scan QR (primary) ───────────────────────────────── */}
        <div className="flex items-center gap-2 mb-5">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/15 text-cyan-400 text-[11px] font-black">1</span>
          <span className="text-[12px] text-slate-400 font-bold uppercase tracking-[0.14em]">Scan the QR code</span>
        </div>

        <div className="relative mb-3">
          <div className="absolute inset-0 rounded-[36px] border border-cyan-500/15 animate-ping opacity-50 pointer-events-none" />
          <div className="relative z-10 bg-white p-5 rounded-[32px] border border-cyan-500/30 shadow-[0_0_48px_rgba(6,182,212,0.22)]">
            <QRCodeSVG value={JSON.stringify({ code: livePairingCode })} size={196} fgColor="#030307" bgColor="#ffffff" />
          </div>
        </div>

        {!pairingDetected && (
          <button
            onClick={handleRefreshCode}
            disabled={refreshing}
            className="ag-tap inline-flex items-center gap-1.5 text-slate-500 hover:text-cyan-400 text-[12px] font-bold mt-1 mb-9 disabled:opacity-50"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            <span>{refreshing ? 'Refreshing…' : 'Refresh code'}</span>
          </button>
        )}

        {/* ── 2 · Or enter code (secondary) ───────────────────────── */}
        <div className="flex items-center gap-2 mb-4">
          <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white/[0.06] text-slate-400 text-[11px] font-black">2</span>
          <span className="text-[12px] text-slate-500 font-bold uppercase tracking-[0.14em]">Or enter this code</span>
        </div>

        <div className="w-full bg-[#0b0c14] border border-white/[0.07] py-5 px-6 rounded-3xl">
          <span className="text-[40px] font-black text-cyan-400 tracking-[12px] font-mono leading-none select-all ml-3">
            {livePairingCode || '------'}
          </span>
        </div>

        {/* Status — subtle */}
        {pairingDetected ? (
          <div className="flex items-center justify-center gap-2 mt-8 text-emerald-400 font-bold text-[13.5px]">
            <CheckCircle size={17} />
            <span>Paired successfully — opening…</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mt-8 text-slate-500 font-semibold text-[13px]">
            <Loader2 size={14} className="animate-spin text-cyan-400" />
            <span>Waiting for parent to connect…</span>
          </div>
        )}

        <button
          onClick={() => navigate('/child/setup')}
          className="ag-tap flex items-center justify-center gap-2 mt-8 text-slate-500 hover:text-white text-[13px] font-bold"
        >
          <KeyRound size={15} /> Enter a code on this device instead
        </button>
      </motion.div>
    </Screen>
  );
};

export default ChildPairing;
