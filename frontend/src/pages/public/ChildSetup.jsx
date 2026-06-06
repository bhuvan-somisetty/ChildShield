import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, User, ArrowRight, ArrowLeft, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ChildSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [gender, setGender] = useState(''); // 'boy' or 'girl'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNextStep = () => {
    if (!name.trim()) {
      setError('Please enter your child\'s name.');
      return;
    }
    setError('');
    setStep(2);
  };

  const handleInitPairing = async (selectedGender) => {
    setGender(selectedGender);
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
    <div className="relative min-h-screen w-full bg-[#07070c] overflow-hidden flex items-center justify-center px-4 py-8 font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] to-[#0f172a] pointer-events-none" />
      <div className="absolute top-[15%] left-[10%] w-[380px] h-[380px] rounded-full bg-blue-600/10 filter blur-[110px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[15%] right-[10%] w-[380px] h-[380px] rounded-full bg-purple-600/10 filter blur-[110px] pointer-events-none animate-pulse" />

      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[420px] px-6 py-10 bg-white/5 border border-white/5 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col"
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
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/30 mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)] animate-bounce">
                  <Smartphone size={30} className="text-blue-400" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-wide">Child Setup</h2>
                <p className="text-slate-400 text-xs mt-1 font-semibold">Who will be using this device?</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center font-semibold">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Child's First Name</label>
                  <div className="relative">
                    <User size={16} className="absolute top-3.5 left-4 text-slate-500" />
                    <input 
                      type="text" 
                      required 
                      value={name} 
                      onChange={e => setName(e.target.value)} 
                      autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleNextStep()}
                      className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all font-semibold" 
                      placeholder="e.g. Liam, Emma" 
                    />
                  </div>
                </div>

                <button 
                  onClick={handleNextStep}
                  className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-white font-extrabold text-xs tracking-wider uppercase cursor-pointer shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Continue</span> 
                  <ArrowRight size={14} />
                </button>
                
                <button 
                  onClick={() => navigate('/')} 
                  className="text-center text-xs text-slate-400 hover:text-white font-bold transition-colors mt-2 cursor-pointer"
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
                  className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-white/2 hover:bg-white/5 border border-white/5 text-slate-400 hover:text-white cursor-pointer transition-all"
                >
                  <ArrowLeft size={16} />
                </button>
                <div>
                  <h2 className="text-lg font-black text-white">Profile Gender</h2>
                  <p className="text-slate-400 text-[10px] font-semibold">Select to personalize {name}'s experience.</p>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center font-semibold">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <button 
                  onClick={() => handleInitPairing('boy')} 
                  disabled={loading}
                  className="group relative flex flex-col items-center justify-center p-6 bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/20 hover:border-sky-500/40 rounded-2xl cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-200">👦</div>
                  <div className="text-sky-400 font-extrabold text-xs tracking-wider uppercase">Boy</div>
                </button>

                <button 
                  onClick={() => handleInitPairing('girl')} 
                  disabled={loading}
                  className="group relative flex flex-col items-center justify-center p-6 bg-pink-500/5 hover:bg-pink-500/10 border border-pink-500/20 hover:border-pink-500/40 rounded-2xl cursor-pointer transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-4xl mb-3 transform group-hover:scale-110 transition-transform duration-200">👧</div>
                  <div className="text-pink-400 font-extrabold text-xs tracking-wider uppercase">Girl</div>
                </button>
              </div>

              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center justify-center gap-2 text-xs font-semibold text-blue-400"
                >
                  <Loader2 size={16} className="animate-spin text-cyan-400" />
                  <span>Preparing profile & pairing code...</span>
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
