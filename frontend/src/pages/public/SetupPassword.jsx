import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Delete, ArrowLeft, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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
        if (newVal.length === 4) {
          // Auto-advance to confirm stage after slight delay
          setTimeout(() => setStage(2), 300);
        }
      } else {
        setConfirmPin(newVal);
      }
    }
  };

  const handleBackspace = () => {
    if (stage === 1) {
      setPin(prev => prev.slice(0, -1));
    } else {
      setConfirmPin(prev => prev.slice(0, -1));
    }
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
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({ parentControlPassword: pin })
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
    if (stage === 2 && confirmPin.length === 4) {
      handleSubmit();
    }
  }, [confirmPin, stage]);

  const activeVal = stage === 1 ? pin : confirmPin;

  return (
    <div className="relative min-h-screen w-full bg-[#030307] overflow-hidden flex flex-col items-center justify-between px-6 py-10 font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020308] to-[#0b0c14] pointer-events-none" />
      <div className="absolute top-[10%] left-[10%] w-[380px] h-[380px] rounded-full bg-indigo-600/10 filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[10%] w-[380px] h-[380px] rounded-full bg-cyan-600/10 filter blur-[100px] pointer-events-none" />

      {/* Setup Password Content */}
      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[420px] flex-1 flex flex-col justify-center items-center gap-4"
      >
        
        {/* Header */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/30 mb-4 animate-pulse">
            <ShieldCheck size={26} className="text-cyan-400" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight leading-none">
            {stage === 1 ? 'Set Override PIN' : 'Confirm Override PIN'}
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1.5">
            {stage === 1 ? 'Choose 4-Digit Parent Code' : 'Verify chosen parent code'}
          </p>
        </div>

        {/* Warning Alert */}
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl mb-6 max-w-[340px]">
          <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <span className="text-[10px] text-amber-500/90 leading-normal font-bold">
            Do not forget this PIN! Children cannot log out without it and override features require it.
          </span>
        </div>

        {/* Dots Indicator */}
        <div className="flex items-center gap-4 my-4">
          {[0, 1, 2, 3].map(i => (
            <div 
              key={i}
              className={`w-3.5 h-3.5 rounded-full border transition-all duration-200 ${
                i < activeVal.length 
                  ? 'bg-cyan-400 border-cyan-400 scale-110 shadow-[0_0_8px_rgba(34,211,238,0.4)]' 
                  : 'bg-transparent border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2 px-4 rounded-xl mb-4 text-center font-bold">
            {error}
          </div>
        )}

        {/* Custom Keypad dialpad grid */}
        <div className="grid grid-cols-3 gap-y-4 gap-x-8 w-full max-w-[280px] my-6">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handleKeyPress(num.toString())}
              disabled={loading}
              className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-white text-lg font-black hover:bg-white/10 active:scale-95 transition-all cursor-pointer mx-auto"
            >
              {num}
            </button>
          ))}
          {/* Back/Reset Option */}
          <button
            onClick={stage === 2 && confirmPin.length === 0 ? () => setStage(1) : resetFlow}
            disabled={loading}
            className="w-16 h-16 rounded-full flex items-center justify-center text-slate-500 hover:text-white text-xs font-bold transition-all cursor-pointer mx-auto"
          >
            {stage === 2 && confirmPin.length === 0 ? <ArrowLeft size={18} /> : 'Reset'}
          </button>
          {/* 0 Key */}
          <button
            onClick={() => handleKeyPress('0')}
            disabled={loading}
            className="w-16 h-16 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-white text-lg font-black hover:bg-white/10 active:scale-95 transition-all cursor-pointer mx-auto"
          >
            0
          </button>
          {/* Backspace Key */}
          <button
            onClick={handleBackspace}
            disabled={loading}
            className="w-16 h-16 rounded-full flex items-center justify-center text-slate-500 hover:text-white transition-all cursor-pointer mx-auto"
          >
            <Delete size={18} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 text-xs text-cyan-400 font-extrabold mt-2 animate-pulse">
            <RefreshCw size={14} className="animate-spin" />
            <span>COMMITTING PIN...</span>
          </div>
        )}

      </motion.div>
    </div>
  );
};

export default SetupPassword;
