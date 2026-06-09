import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, RefreshCw, CheckCircle, Loader2, KeyRound } from 'lucide-react';
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
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-5">
          <Smartphone className="text-cyan-400" size={28} />
        </div>

        <h1 className="text-[24px] font-black text-white tracking-tight leading-tight">Ready to connect</h1>
        <p className="text-slate-500 text-[13px] mt-2 mb-7 max-w-[300px] font-semibold leading-relaxed">
          On the parent device, open AlphaGuard AI and scan this QR — or enter the code below.
        </p>

        {error && (
          <div className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] p-3 rounded-2xl mb-5 font-semibold">
            {error}
          </div>
        )}

        {/* QR with radar pulse */}
        <div className="relative p-6 mb-6">
          <div className="absolute inset-0 rounded-full border border-cyan-500/15 animate-ping opacity-60 pointer-events-none" />
          <div className="absolute -inset-4 rounded-full border border-blue-500/10 animate-ping opacity-30 pointer-events-none" style={{ animationDelay: '0.8s' }} />
          <div className="relative z-10 bg-white p-4 rounded-3xl border border-cyan-500/30 shadow-[0_0_36px_rgba(6,182,212,0.18)]">
            <QRCodeSVG value={JSON.stringify({ code: livePairingCode })} size={150} fgColor="#030307" bgColor="#ffffff" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full my-2">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.15em]">or use code</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        {/* Code */}
        <div className="w-full bg-[#0b0c14] border border-white/[0.07] py-4 px-6 rounded-2xl my-5">
          <h2 className="text-[34px] font-black text-cyan-400 tracking-[10px] font-mono leading-none select-all ml-2.5">
            {livePairingCode || '------'}
          </h2>
        </div>

        <button
          id="refresh-code-btn"
          onClick={handleRefreshCode}
          disabled={refreshing || pairingDetected}
          className="ag-tap w-full flex items-center justify-center gap-2 min-h-[48px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] rounded-2xl text-cyan-400 font-bold text-[13px] uppercase tracking-wide disabled:opacity-50 mb-5"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Generating…' : 'Refresh code'}</span>
        </button>

        {/* Status */}
        {pairingDetected ? (
          <div className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[13px] uppercase tracking-wide">
            <CheckCircle size={16} />
            <span>Paired successfully!</span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-white/[0.04] border border-white/[0.07] text-slate-400 font-semibold text-[13px]">
            <Loader2 size={14} className="animate-spin text-cyan-400" />
            <span>Waiting for parent to connect…</span>
          </div>
        )}

        <button
          onClick={() => navigate('/child/setup')}
          className="ag-tap flex items-center justify-center gap-2 mt-5 text-slate-400 hover:text-white text-[13px] font-bold"
        >
          <KeyRound size={15} /> Enter a code instead
        </button>
      </motion.div>
    </Screen>
  );
};

export default ChildPairing;
