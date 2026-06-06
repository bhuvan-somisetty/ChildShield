import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, User, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChildSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNextStep = () => {
    if (!name.trim()) {
      setError('Please enter device companion name.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleInitPairing = async (selectedGender) => {
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/device/init-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childName: name, gender: selectedGender })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        navigate('/child-pairing', { 
          state: { childId: data.childId, pairingCode: data.pairingCode, childName: name, gender: selectedGender } 
        });
      } else {
        setError(data.error || 'Failed to initialize device.');
      }
    } catch (err) {
      setError(err.message || 'Connection error.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030307] overflow-hidden flex items-center justify-center px-4 py-8 font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020308] to-[#0b0c14] pointer-events-none" />
      <div className="absolute top-[15%] left-[10%] w-[380px] h-[380px] rounded-full bg-indigo-600/10 filter blur-[110px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[15%] right-[10%] w-[380px] h-[380px] rounded-full bg-cyan-600/10 filter blur-[110px] pointer-events-none animate-pulse" />

      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[420px] px-6 py-10 bg-white/5 border border-white/5 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col"
      >
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 mb-4 animate-bounce">
                  <Smartphone size={30} className="text-cyan-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight leading-none">Companion Setup</h2>
                <p className="text-slate-500 text-xs mt-1.5 font-bold uppercase tracking-wider">Device user registration</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center font-bold">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="bg-[#0b0c14] border border-white/5 rounded-2xl p-4 shadow-inner flex flex-col gap-1 focus-within:bg-white/[0.01]">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Device User Name</label>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-500" />
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                      className="w-full bg-transparent border-none text-white text-xs outline-none placeholder-slate-600 font-semibold py-1" 
                      placeholder="e.g. Device Companion" 
                    />
                  </div>
                </div>

                <button 
                  onClick={handleNextStep}
                  className="w-full mt-4 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full text-white font-black text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1.5 shadow-lg active:scale-[0.98] transition-all"
                >
                  <span>Continue</span> 
                  <ArrowRight size={13} strokeWidth={3} />
                </button>
                
                <button 
                  onClick={() => navigate('/')} 
                  className="text-center text-xs text-slate-500 hover:text-white font-bold transition-colors mt-2 cursor-pointer"
                >
                  Cancel Setup
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.3 }}
            >
              {/* Back Button */}
              <div className="flex items-center gap-3 mb-6">
                <button 
                  onClick={() => setStep(1)} 
                  className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 text-slate-400 hover:text-white cursor-pointer transition-all"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-lg font-black text-white leading-none">Avatar Profile</h2>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-wider mt-1">Select style profile</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center font-bold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                  onClick={() => handleInitPairing('boy')} 
                  disabled={loading}
                  className="group relative flex flex-col items-center justify-center p-6 bg-cyan-500/5 hover:bg-cyan-500/10 border border-cyan-500/20 hover:border-cyan-500/40 rounded-2xl cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-200">👦</div>
                  <div className="text-cyan-400 font-black text-xs tracking-wider uppercase">Profile A</div>
                </button>

                <button 
                  onClick={() => handleInitPairing('girl')} 
                  disabled={loading}
                  className="group relative flex flex-col items-center justify-center p-6 bg-purple-500/5 hover:bg-purple-500/10 border border-purple-500/20 hover:border-purple-500/40 rounded-2xl cursor-pointer transition-all active:scale-95 disabled:opacity-50"
                >
                  <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-200">👧</div>
                  <div className="text-purple-400 font-black text-xs tracking-wider uppercase">Profile B</div>
                </button>
              </div>

              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-xs font-extrabold text-cyan-400 animate-pulse"
                >
                  <Loader2 size={15} className="animate-spin" />
                  <span>PREPARING SYNC RADAR...</span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ChildSetup;
