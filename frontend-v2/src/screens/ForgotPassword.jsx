import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ShieldCheck, Lock, ChevronRight, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { Screen, Button, Input } from '../components/ui';

// Login-password recovery: email → 6-digit code → new password → done.
// (UI flow; a backend would send/verify the real code.)
const ForgotPassword = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const pwValid = pw.length >= 6 && pw === pw2;

  const footer = step === 1
    ? <Button iconRight={ChevronRight} disabled={!email.includes('@')} onClick={() => setStep(2)}>Send Verification Code</Button>
    : step === 2
      ? <Button iconRight={ChevronRight} disabled={code.length !== 6} onClick={() => setStep(3)}>Verify Code</Button>
      : step === 3
        ? <Button iconRight={ChevronRight} disabled={!pwValid} onClick={() => setStep(4)}>Reset Password</Button>
        : <Button iconRight={ChevronRight} onClick={() => navigate('/login')}>Back to Login</Button>;

  return (
    <Screen align="start" glow="#f59e0b" footer={footer}>
      <div className="w-full flex items-center gap-3 mb-7">
        {step < 4 && <button onClick={() => (step === 1 ? navigate('/login') : setStep(step - 1))} className="ag-tap w-10 h-10 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center text-slate-300"><ChevronLeft size={20} /></button>}
        <div className="flex-1"><div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden"><motion.div className="h-full rounded-full bg-gradient-to-r from-amber-500 to-orange-500" animate={{ width: `${(step / 4) * 100}%` }} /></div></div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }} className="w-full">
          {step === 1 && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center mb-5"><Mail size={24} className="text-amber-400" /></div>
              <h1 className="text-[25px] font-black text-white tracking-tight">Reset your password</h1>
              <p className="text-slate-400 text-[14px] font-semibold mt-2 mb-7">Enter your account email and we’ll send a verification code.</p>
              <Input label="Email Address" icon={Mail} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="parent@family.com" />
            </>
          )}
          {step === 2 && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center mb-5"><ShieldCheck size={24} className="text-cyan-400" /></div>
              <h1 className="text-[25px] font-black text-white tracking-tight">Enter the code</h1>
              <p className="text-slate-400 text-[14px] font-semibold mt-2 mb-7">We sent a 6-digit code to <span className="text-white font-bold">{email}</span>.</p>
              <div className="relative" onClick={(e) => e.currentTarget.querySelector('input').focus()}>
                <input autoFocus type="tel" inputMode="numeric" value={code} maxLength={6} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} className="absolute inset-0 w-full h-full opacity-0" />
                <div className="flex items-center justify-center gap-2">{Array.from({ length: 6 }).map((_, i) => (<div key={i} className={`flex items-center justify-center w-12 h-14 rounded-2xl border-2 text-[22px] font-black text-white ${i < code.length ? 'border-cyan-400/60 bg-cyan-500/[0.06]' : 'border-white/[0.08] bg-[#0b0c14]'}`}>{code[i] || ''}</div>))}</div>
              </div>
            </>
          )}
          {step === 3 && (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-400/30 flex items-center justify-center mb-5"><Lock size={24} className="text-emerald-400" /></div>
              <h1 className="text-[25px] font-black text-white tracking-tight">New password</h1>
              <p className="text-slate-400 text-[14px] font-semibold mt-2 mb-7">Choose a strong password (6+ characters).</p>
              <div className="flex flex-col gap-4">
                <Input label="New Password" icon={Lock} type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="••••••••" />
                <Input label="Confirm Password" icon={Lock} type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="••••••••" />
                {pw2.length > 0 && pw !== pw2 && <p className="text-rose-400 text-[12px] font-bold px-1">Passwords don’t match</p>}
              </div>
            </>
          )}
          {step === 4 && (
            <div className="flex flex-col items-center text-center pt-10">
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }} className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-7"><CheckCircle2 size={50} className="text-emerald-400" /></motion.div>
              <h1 className="text-[26px] font-black text-white tracking-tight">Password reset</h1>
              <p className="text-slate-400 text-[14px] font-semibold mt-3 max-w-[290px]">You can now sign in with your new password.</p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Screen>
  );
};

export default ForgotPassword;
