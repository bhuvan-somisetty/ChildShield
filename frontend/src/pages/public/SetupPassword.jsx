import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Delete, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';
import { Screen } from '../../components/ui';

const SetupPassword = () => {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [stage, setStage] = useState(1); // 1 = Enter PIN, 2 = Confirm PIN
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && !user.needsPasswordSetup) {
      navigate('/controls', { replace: true });
    }
    if (!user && !token && !localStorage.getItem('cs_token')) {
      navigate('/login', { replace: true });
    }
  }, [user, token, navigate]);

  const handleKeyPress = (num) => {
    setError('');
    const target = stage === 1 ? pin : confirmPin;
    if (target.length < 4) {
      const newVal = target + num;
      if (stage === 1) {
        setPin(newVal);
        if (newVal.length === 4) setTimeout(() => setStage(2), 300);
      } else {
        setConfirmPin(newVal);
      }
    }
  };

  const handleBackspace = () => {
    if (stage === 1) setPin((p) => p.slice(0, -1));
    else setConfirmPin((p) => p.slice(0, -1));
  };

  const resetFlow = () => {
    setPin('');
    setConfirmPin('');
    setStage(1);
    setError('');
  };

  const handleSubmit = async () => {
    if (pin !== confirmPin) {
      setError('PINs do not match. Please try again.');
      resetFlow();
      return;
    }
    setLoading(true);
    setError('');
    try {
      const jwt = token || localStorage.getItem('cs_token');
      const res = await fetch('/api/auth/set-control-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
        body: JSON.stringify({ parentControlPassword: pin }),
      });
      const data = await res.json();
      if (data.success) {
        updateUser({ needsPasswordSetup: false });
        navigate('/controls', { replace: true });
      } else {
        setError(data.error || 'Failed to set PIN. Try again.');
        resetFlow();
      }
    } catch {
      setError('Network error. Check your connection.');
      resetFlow();
    }
    setLoading(false);
  };

  useEffect(() => {
    if (stage === 2 && confirmPin.length === 4) handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirmPin, stage]);

  const activeVal = stage === 1 ? pin : confirmPin;

  const Key = ({ children, onClick, disabled, muted }) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`ag-tap w-[72px] h-[72px] rounded-full flex items-center justify-center mx-auto text-[22px] font-black
        ${muted ? 'text-slate-400' : 'text-white bg-white/[0.03] border border-white/[0.07] hover:bg-white/[0.08]'}`}
    >
      {children}
    </button>
  );

  return (
    <Screen ambient="brand" align="center" scroll={false}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col items-center"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(37,99,235,0.25)]">
            <ShieldCheck size={30} className="text-cyan-400" />
          </div>
          <h1 className="text-[24px] font-black text-white tracking-tight leading-tight">
            {stage === 1 ? 'Set your Override PIN' : 'Confirm your PIN'}
          </h1>
          <p className="text-slate-500 text-[12px] font-bold uppercase tracking-[0.12em] mt-2">
            {stage === 1 ? 'Choose a 4-digit parent code' : 'Re-enter to confirm'}
          </p>
        </div>

        {/* Warning */}
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/[0.06] border border-amber-500/20 rounded-2xl mb-7 max-w-[330px]">
          <AlertTriangle size={15} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <span className="text-[11.5px] text-amber-300/90 leading-relaxed font-semibold">
            Don’t forget this PIN. Children can’t sign out without it, and overrides require it.
          </span>
        </div>

        {/* Dots */}
        <div className="flex items-center gap-4 mb-6">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-3.5 h-3.5 rounded-full border-2 transition-all duration-200 ${
                i < activeVal.length
                  ? 'bg-cyan-400 border-cyan-400 scale-110 shadow-[0_0_10px_rgba(34,211,238,0.5)]'
                  : 'bg-transparent border-slate-700'
              }`}
            />
          ))}
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] py-2.5 px-4 rounded-2xl mb-5 text-center font-semibold max-w-[330px]">
            {error}
          </div>
        )}

        {/* Keypad */}
        <div className="grid grid-cols-3 gap-y-3.5 gap-x-6 w-full max-w-[300px]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <Key key={n} onClick={() => handleKeyPress(String(n))}>{n}</Key>
          ))}
          <Key muted onClick={stage === 2 && confirmPin.length === 0 ? () => setStage(1) : resetFlow}>
            {stage === 2 && confirmPin.length === 0 ? <ArrowLeft size={20} /> : <span className="text-[13px] font-bold">Reset</span>}
          </Key>
          <Key onClick={() => handleKeyPress('0')}>0</Key>
          <Key muted onClick={handleBackspace}><Delete size={20} /></Key>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-[13px] text-cyan-400 font-extrabold mt-6">
            <RefreshCw size={15} className="animate-spin" />
            <span>Securing your PIN…</span>
          </div>
        )}
      </motion.div>
    </Screen>
  );
};

export default SetupPassword;
