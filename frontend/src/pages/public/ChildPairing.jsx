import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

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
    if (!childId) {
      navigate('/child-setup');
    }
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
            pairedAt: new Date().toISOString()
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
    poll(); // immediate first check
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
      if (data.success) {
        setLivePairingCode(data.pairingCode);
      } else {
        setError(data.error || 'Failed to refresh code.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  if (!childId) return null;

  return (
    <div className="relative min-h-screen w-full bg-[#030307] overflow-hidden flex flex-col items-center justify-between px-6 py-10 font-sans">
      
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020308] to-[#0b0c14] pointer-events-none" />
      <div className="absolute top-[20%] left-[50%] -translate-x-[50%] w-[480px] h-[480px] rounded-full bg-indigo-600/5 filter blur-[120px] pointer-events-none animate-pulse" />

      {/* Child Pairing Content */}
      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[420px] flex-1 flex flex-col justify-center items-center gap-4 text-center"
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-5">
          <Smartphone className="text-cyan-400" size={28} />
        </div>

        <h2 className="text-2xl font-black text-white tracking-tight leading-none">Ready to Connect</h2>
        <p className="text-slate-500 text-xs mt-2 mb-6 max-w-[320px] font-semibold leading-relaxed">
          Open the Parent App Control Center and scan the QR or key in the code.
        </p>

        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 font-bold">
            {error}
          </div>
        )}

        {/* Pulse Radar QR code container */}
        <div className="relative p-6 mb-6">
          {/* Concentric Pulsing Radar Rings */}
          <div className="absolute inset-0 rounded-full border border-cyan-500/10 animate-ping opacity-60 pointer-events-none" />
          <div className="absolute -inset-4 rounded-full border border-indigo-500/5 animate-ping opacity-30 pointer-events-none" style={{ animationDelay: '0.8s' }} />
          
          <div className="relative z-10 bg-white p-4.5 rounded-3xl border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.15)] transform hover:scale-105 transition-transform duration-300">
            <QRCodeSVG value={JSON.stringify({ code: livePairingCode })} size={150} fgColor="#030307" bgColor="#ffffff" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full my-4">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">or sync code</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        {/* Pairing code display */}
        <div className="w-full bg-[#0b0c14] border border-white/5 py-4.5 px-6 rounded-2xl mb-6 shadow-inner">
          <h2 className="text-3xl font-black text-cyan-400 tracking-[8px] font-mono leading-none select-all ml-2">
            {livePairingCode || '------'}
          </h2>
        </div>

        {/* Generate New Code button */}
        <button
          id="refresh-code-btn"
          onClick={handleRefreshCode}
          disabled={refreshing || pairingDetected}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-cyan-400 font-bold text-xs tracking-wide uppercase cursor-pointer disabled:opacity-50 transition-all mb-6 active:scale-[0.98]"
        >
          <RefreshCw size={12} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Generating...' : 'Refresh Radar'}</span>
        </button>

        {/* Connection status line */}
        {pairingDetected ? (
          <div className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider animate-bounce">
            <CheckCircle size={15} />
            <span>Paired Successfully!</span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/5 text-slate-400 font-semibold text-xs">
            <Loader2 size={13} className="animate-spin text-cyan-400" />
            <span>Scanning radar signals...</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ChildPairing;
