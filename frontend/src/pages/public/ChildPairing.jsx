import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, Loader, RefreshCw, CheckCircle, Loader2 } from 'lucide-react';
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

  // Redirect to setup if no state available
  useEffect(() => {
    if (!childId) {
      navigate('/child-setup');
    }
  }, [childId, navigate]);

  // Poll backend every 3s to detect when parent has confirmed pairing
  useEffect(() => {
    if (!childId) return;
    isMountedRef.current = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/device/status/${childId}`);
        const data = await res.json();

        if (!isMountedRef.current) return;

        if (res.ok && data.success && data.connected === true) {
          // Pairing confirmed by parent - store full session including parent identity
          setPairingDetected(true);
          localStorage.setItem('child_session', JSON.stringify({
            childId,
            childName: data.childName || childName,
            parentName: data.parentName || 'Parent',
            parentId: data.status?.parentId || null,
            pairedAt: new Date().toISOString()
          }));

          // Short delay so the user can see the ✅ "Connected!" flash
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

  if (!childId) return null; // redirecting

  return (
    <div className="relative min-h-screen w-full bg-[#07070c] overflow-hidden flex items-center justify-center px-4 py-8 font-sans">
      
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] to-[#0f172a] pointer-events-none" />
      <div className="absolute top-[20%] left-[50%] -translate-x-[50%] w-[480px] h-[480px] rounded-full bg-blue-600/5 filter blur-[120px] pointer-events-none animate-pulse" />

      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[440px] px-6 py-10 bg-white/5 border border-white/5 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col items-center text-center"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6 shadow-[0_0_25px_rgba(59,130,246,0.15)]">
          <Smartphone className="text-blue-400" size={32} />
        </div>

        <h2 className="text-2xl font-black text-white tracking-wide">Ready to Connect</h2>
        <p className="text-slate-400 text-xs mt-2 mb-6 leading-relaxed max-w-[320px] font-semibold">
          Open the <strong className="text-blue-400">Parent App → Controls</strong> and enter the 6-digit sync code below.
        </p>

        {/* Error message */}
        {error && (
          <div className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 font-semibold">
            {error}
          </div>
        )}

        {/* QR Code */}
        <div className="bg-white p-5 rounded-2xl border-2 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.1)] mb-6 transform hover:scale-105 transition-transform duration-300">
          <QRCodeSVG value={JSON.stringify({ code: livePairingCode })} size={160} fgColor="#000000" bgColor="#ffffff" />
        </div>

        <div className="flex items-center gap-3 w-full my-4">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">— OR ENTER CODE —</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        {/* Pairing code display */}
        <div className="w-full bg-blue-950/20 border border-blue-500/20 py-4 px-6 rounded-2xl mb-6 shadow-[0_0_20px_rgba(59,130,246,0.1)]">
          <h2 className="text-3xl font-black text-blue-400 tracking-[8px] font-mono leading-none select-all">
            {livePairingCode || '------'}
          </h2>
        </div>

        {/* Generate New Code button */}
        <button
          id="refresh-code-btn"
          onClick={handleRefreshCode}
          disabled={refreshing || pairingDetected}
          className="w-full flex items-center justify-center gap-2 py-3 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl text-blue-400 font-bold text-xs tracking-wide uppercase cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-6 active:scale-95"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span>{refreshing ? 'Generating...' : 'Generate New Code'}</span>
        </button>

        {/* Status line */}
        {pairingDetected ? (
          <div className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs uppercase tracking-wider animate-bounce">
            <CheckCircle size={16} />
            <span>Connected! Opening...</span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/2 border border-white/5 text-slate-400 font-semibold text-xs">
            <Loader2 size={14} className="animate-spin text-blue-400" />
            <span>Waiting for parent authorization...</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default ChildPairing;
