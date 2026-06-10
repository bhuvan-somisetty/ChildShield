import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, User, ArrowRight, Loader2, KeyRound, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, Button, TextField, ScreenHeader } from '../../components/ui';

// Two premium gender profiles only — no abstract "Profile A/B/C/D".
const PROFILES = [
  { id: 'boy', emoji: '👦', label: 'Boy', accent: '#06b6d4', glow: 'rgba(6,182,212,0.30)' },
  { id: 'girl', emoji: '👧', label: 'Girl', accent: '#a855f7', glow: 'rgba(168,85,247,0.30)' },
];

const ChildSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  // Pre-fill the child's name if it was captured during parent signup.
  const [name, setName] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ag_onboarding_child'))?.name || ''; }
    catch { return ''; }
  });
  const [picked, setPicked] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleNextStep = () => {
    if (!name.trim()) {
      setError('Please enter a name for this device.');
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
        body: JSON.stringify({ childName: name, gender: selectedGender }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        navigate('/child-pairing', {
          state: { childId: data.childId, pairingCode: data.pairingCode, childName: name, gender: selectedGender },
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

  const footer =
    step === 1 ? (
      <>
        <Button onClick={handleNextStep} iconRight={ArrowRight}>Continue</Button>
        <button
          onClick={() => navigate('/child/setup')}
          className="ag-tap w-full flex items-center justify-center gap-2 mt-4 text-slate-400 hover:text-white text-[13px] font-bold"
        >
          <KeyRound size={15} /> I already have a pairing code
        </button>
      </>
    ) : (
      <Button onClick={() => picked && handleInitPairing(picked)} loading={loading} disabled={!picked} iconRight={ArrowRight}>
        {loading ? 'Securing connection' : 'Generate Pairing Code'}
      </Button>
    );

  return (
    <Screen ambient="brand" align="between" footer={footer}>
      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="s1" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.25 }} className="w-full">
            <div className="flex flex-col items-center text-center mb-10 pt-4">
              <motion.div
                animate={{ y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                className="w-[72px] h-[72px] rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6"
              >
                <Smartphone size={32} className="text-cyan-400" />
              </motion.div>
              <h1 className="text-[26px] font-black text-white tracking-tight leading-tight">Set up this device</h1>
              <p className="text-slate-500 text-[14px] font-semibold mt-3 max-w-[300px] leading-relaxed">
                Give the child’s device a name so it’s easy to recognise on the parent dashboard.
              </p>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] p-3.5 rounded-2xl mb-6 text-center font-semibold">
                {error}
              </div>
            )}

            <TextField
              label="Device / Child Name"
              icon={User}
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleNextStep()}
              placeholder="e.g. Emma’s Phone"
              autoFocus
            />
          </motion.div>
        ) : (
          <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="w-full flex flex-col">
            <ScreenHeader title="Choose Child Profile" subtitle="This personalises their experience" onBack={() => setStep(1)} className="mb-10" />

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] p-3.5 rounded-2xl mb-6 text-center font-semibold">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-5">
              {PROFILES.map((p) => {
                const active = picked === p.id;
                return (
                  <motion.button
                    key={p.id}
                    onClick={() => setPicked(p.id)}
                    disabled={loading}
                    whileTap={{ scale: 0.97 }}
                    animate={{ scale: active ? 1 : 0.97, opacity: active ? 1 : 0.7 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                    className={`ag-tap relative flex flex-col items-center justify-center py-12 rounded-[28px] border min-h-[200px] ${
                      active ? 'border-white/25 bg-white/[0.06]' : 'border-white/[0.07] bg-[#0b0c14]'
                    }`}
                    style={active ? { boxShadow: `0 20px 56px ${p.glow}` } : undefined}
                  >
                    {active && (
                      <span className="absolute top-4 right-4 flex items-center justify-center w-7 h-7 rounded-full" style={{ background: p.accent }}>
                        <Check size={15} className="text-[#030307]" strokeWidth={3.5} />
                      </span>
                    )}
                    <div className="text-[64px] leading-none mb-4">{p.emoji}</div>
                    <div className="text-[16px] font-black text-white">{p.label}</div>
                  </motion.button>
                );
              })}
            </div>

            {loading && (
              <div className="flex items-center justify-center gap-2 text-[13px] font-extrabold text-cyan-400 mt-8">
                <Loader2 size={16} className="animate-spin" />
                <span>Securing your connection…</span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </Screen>
  );
};

export default ChildSetup;
