import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, User, ChevronLeft } from 'lucide-react';
import { Screen, Button, Input, Progress } from '../components/ui';
import { useStepHistory } from '../lib/useStepHistory';

const GENDERS = [
  { id: 'boy', emoji: '👦', label: 'Boy', accent: '#06b6d4' },
  { id: 'girl', emoji: '👧', label: 'Girl', accent: '#a855f7' },
];

const GenderCard = ({ data, selected, anyPicked, onSelect }) => (
  <motion.button
    type="button"
    onClick={onSelect}
    whileTap={{ scale: 0.97 }}
    animate={{ opacity: !anyPicked || selected ? 1 : 0.5, scale: selected ? 1 : 0.98 }}
    transition={{ type: 'spring', stiffness: 420, damping: 30 }}
    className={`ag-tap relative flex flex-col items-center justify-center py-9 rounded-[26px] border min-h-[196px] ${selected ? 'border-white/20 bg-white/[0.05]' : 'border-white/[0.08] bg-[#0b0c14]'}`}
    style={selected ? { boxShadow: `0 20px 56px ${data.accent}3a` } : undefined}
  >
    {selected && <span className="absolute top-3 right-3 z-10 flex items-center justify-center w-6 h-6 rounded-full" style={{ background: data.accent }}><Check size={14} className="text-[#030307]" strokeWidth={3.5} /></span>}
    <div className="relative mb-4">
      <motion.div className="absolute -inset-3 rounded-full" style={{ background: `${data.accent}33`, filter: 'blur(20px)' }} animate={{ opacity: selected ? [0.6, 0.95, 0.6] : 0.4 }} transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }} />
      <div className="relative w-[76px] h-[76px] rounded-full flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${data.accent}33, ${data.accent}0d)`, border: `1px solid ${data.accent}55` }}>
        <span className="text-[40px] leading-none">{data.emoji}</span>
      </div>
    </div>
    <div className="text-[16px] font-black text-white">{data.label}</div>
  </motion.button>
);

const ChildSetup = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [gender, setGender] = useState(null);
  const [name, setName] = useState('');

  const picked = GENDERS.find((g) => g.id === gender);

  // Back preserves entered data; from the first step it returns to role selection.
  const goBack = () => (step === 2 ? setStep(1) : navigate('/role'));
  useStepHistory(step, 1, () => setStep((s) => Math.max(1, s - 1)));

  const footer =
    step === 1
      ? <Button iconRight={ArrowRight} disabled={!gender} onClick={() => setStep(2)}>Continue</Button>
      : <Button iconRight={ArrowRight} disabled={!name.trim()} onClick={() => navigate('/pairing')}>Continue</Button>;

  return (
    <Screen align="between" glow={picked ? picked.accent : '#06b6d4'} footer={footer}>
      {/* back + progress */}
      <div className="w-full flex items-center gap-3">
        <button onClick={goBack} aria-label="Go back" className="ag-tap flex items-center justify-center w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/10 text-slate-300 hover:text-white flex-shrink-0">
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 flex justify-center">
          <Progress count={2} active={step - 1} color={picked ? picked.accent : '#06b6d4'} />
        </div>
        <span className="w-11 flex-shrink-0" />
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div key="gender" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="w-full">
              <div className="flex flex-col items-center text-center mb-9">
                <h1 className="text-[27px] font-black text-white tracking-tight leading-tight">Who is this device for?</h1>
                <p className="text-slate-500 text-[14px] font-semibold mt-2.5 max-w-[280px] leading-relaxed">Select a profile for this child device.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {GENDERS.map((g) => (
                  <GenderCard key={g.id} data={g} selected={gender === g.id} anyPicked={!!gender} onSelect={() => setGender(g.id)} />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div key="name" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }} className="w-full">
              <div className="flex flex-col items-center text-center mb-8">
                {picked && (
                  <div className="relative mb-6">
                    <div className="absolute -inset-2 rounded-full" style={{ background: `${picked.accent}33`, filter: 'blur(18px)' }} />
                    <div className="relative w-[72px] h-[72px] rounded-full flex items-center justify-center" style={{ background: `linear-gradient(160deg, ${picked.accent}33, ${picked.accent}0d)`, border: `1px solid ${picked.accent}55` }}>
                      <span className="text-[38px] leading-none">{picked.emoji}</span>
                    </div>
                  </div>
                )}
                <h1 className="text-[26px] font-black text-white tracking-tight leading-tight max-w-[290px]">What’s your child’s name?</h1>
                <p className="text-slate-500 text-[14px] font-semibold mt-2.5 max-w-[300px] leading-relaxed">This helps personalize protection and family identification.</p>
              </div>
              <Input label="Child Name" icon={User} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Emma" autoFocus />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="h-1" />
    </Screen>
  );
};

export default ChildSetup;
