import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, ChevronRight, ChevronLeft, CheckCircle2, ShieldCheck, Eye, EyeOff, KeyRound, Loader2 } from 'lucide-react';
import { Screen, Button, Input, Brand, Progress, Modal } from '../components/ui';
import { api, setToken } from '../lib/agClient';
import { signInWithGoogle } from '../lib/google';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const pwStrength = (p) => {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.min(s, 3); // 0..3
};
const STRENGTH = [
  { label: '', color: '#334155' },
  { label: 'Weak', color: '#f43f5e' },
  { label: 'Fair', color: '#f59e0b' },
  { label: 'Strong', color: '#10b981' },
];

/* 6-digit PIN entry — masked, tap to focus, optional reveal */
const PinField = ({ value, onChange, reveal }) => {
  const ref = useRef(null);
  return (
    <div className="relative w-full" onClick={() => ref.current?.focus()}>
      <input ref={ref} type="tel" inputMode="numeric" value={value} maxLength={6}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className="absolute inset-0 w-full h-full opacity-0" />
      <div className="flex items-center justify-center gap-2">
        {Array.from({ length: 6 }).map((_, i) => {
          const filled = i < value.length;
          const cursor = i === value.length;
          return (
            <div key={i} className={`flex items-center justify-center w-11 h-14 rounded-2xl border-2 text-[20px] font-black text-white transition-colors ${
              filled ? 'border-cyan-400/60 bg-cyan-500/[0.06]' : cursor ? 'border-blue-500/60 bg-white/[0.03]' : 'border-white/[0.08] bg-[#0b0c14]'}`}>
              {filled ? (reveal ? value[i] : '•') : ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const Signup = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [googleAuth, setGoogleAuth] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [revealPin, setRevealPin] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState('');

  const [f, setF] = useState({ name: '', email: '', pass: '', confirm: '' });
  const [pin, setPin] = useState('');
  const [pin2, setPin2] = useState('');
  const [emailStatus, setEmailStatus] = useState('idle'); // idle | checking | ok | taken | error
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const emailFormatOk = /.+@.+\..+/.test(f.email);

  // Check email availability against the backend AS THE USER TYPES, so a
  // "already registered" error appears immediately — not only after submit.
  useEffect(() => {
    if (!emailFormatOk) { setEmailStatus('idle'); return undefined; }
    setEmailStatus('checking');
    let active = true;
    const t = setTimeout(async () => {
      try {
        const { available } = await api.emailAvailable(f.email.trim().toLowerCase());
        if (active) setEmailStatus(available ? 'ok' : 'taken');
      } catch {
        if (active) setEmailStatus('error'); // don't block on network failure; register still validates
      }
    }, 400);
    return () => { active = false; clearTimeout(t); };
  }, [f.email, emailFormatOk]);

  const step1Valid = f.name.trim() && emailFormatOk && emailStatus !== 'taken' && emailStatus !== 'checking';
  const strength = pwStrength(f.pass);
  const passValid = f.pass.length >= 8;
  const passMatch = f.confirm.length > 0 && f.confirm === f.pass;
  const pinValid = pin.length === 6 && pin2.length === 6 && pin === pin2;
  const pinMismatch = pin2.length === 6 && pin !== pin2;

  // Real Google sign-up — opens the account-selection popup and creates (or
  // links) the parent account via the backend BEFORE the PIN screen. The account
  // already exists by the time we advance to step 3, so the PIN is then attached
  // to the authenticated account. No bypass, no setTimeout.
  const continueWithGoogle = async () => {
    setError('');
    setGoogleBusy(true);
    try {
      const r = await signInWithGoogle(); // verifies identity server-side + sets token
      setGoogleAuth(true);
      if (r.needsPin) setStep(3);          // new/PIN-less account → collect the Security PIN
      else setDone(true);                  // returning account already has a PIN
    } catch (err) {
      if (err.message === 'popup_closed' || err.message === 'access_denied') { /* user cancelled */ }
      else if (err.message === 'google_not_configured') setError('Google sign-in is unavailable right now.');
      else setError('Google sign-in failed. Please try again.');
    } finally {
      setGoogleBusy(false);
    }
  };

  // Finalize: email accounts are registered here (with hashed password + PIN);
  // Google accounts already exist, so we only attach the Security PIN. Only the
  // fields relevant to the active flow are validated.
  const confirmPin = async () => {
    setModalOpen(false);
    setError('');
    const detailsOk = googleAuth ? true : (step1Valid && passValid && passMatch);
    if (!detailsOk || !pinValid) { setError('Please complete all fields correctly.'); return; }
    setSubmitting(true);
    try {
      if (googleAuth) {
        await api.setPin(pin); // authenticated via the token from signInWithGoogle
      } else {
        const { token } = await api.registerParent(f.email.trim().toLowerCase(), f.pass, f.name.trim(), pin);
        setToken(token);
      }
      setDone(true);
    } catch (err) {
      setError(err.message === 'Email already registered'
        ? 'An account with this email already exists.'
        : (err.message || 'Could not create your account. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Success ──────────────────────────────────────────────────────────── */
  if (done) {
    return (
      <Screen align="center" glow="#10b981" footer={<Button iconRight={ChevronRight} onClick={() => navigate('/setup')}>Continue Setup</Button>}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }} className="flex flex-col items-center text-center">
          <div className="flex items-center justify-center w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/30 shadow-[0_0_60px_rgba(16,185,129,0.35)] mb-7">
            <CheckCircle2 size={52} className="text-emerald-400" />
          </div>
          <h1 className="text-[26px] font-black text-white tracking-tight max-w-[300px] leading-tight">Account Created Successfully</h1>
          <p className="text-slate-400 text-[15px] font-medium mt-3 max-w-[300px] leading-relaxed">
            Your parent account is ready. Let’s finish setting up your family’s protection.
          </p>
        </motion.div>
      </Screen>
    );
  }

  /* ── Footer per step ──────────────────────────────────────────────────── */
  const footer =
    step === 1 ? <Button iconRight={ChevronRight} disabled={!step1Valid} onClick={() => setStep(2)}>Continue</Button>
    : step === 2 ? <Button iconRight={ChevronRight} disabled={!passValid || !passMatch} onClick={() => setStep(3)}>Continue</Button>
    : <Button iconRight={ChevronRight} loading={submitting} disabled={!pinValid} onClick={() => setModalOpen(true)}>Create Security PIN</Button>;

  const activeDot = step - 1;

  return (
    <Screen align="between" glow={step === 3 ? '#06b6d4' : '#4f46e5'} footer={footer}>
      <div className="w-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-7">
          {step === 3 ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }} className="relative mb-5">
              <div className="absolute -inset-3 rounded-3xl bg-cyan-500/20 blur-xl" />
              <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500/30 to-blue-600/15 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                <ShieldCheck size={32} className="text-cyan-300" />
              </div>
            </motion.div>
          ) : (
            <Brand variant="stacked" className="mb-5" />
          )}

          <h1 className="text-[24px] font-black text-white tracking-tight leading-tight max-w-[300px]">
            {step === 1 ? 'Parent Details' : step === 2 ? 'Create Your Account Password' : 'Create Parent Security PIN'}
          </h1>
          <div className="flex flex-col items-center gap-2 mt-3.5">
            <Progress count={3} active={activeDot} color={step === 3 ? '#06b6d4' : '#4f46e5'} />
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.12em]">
              Step {step} of 3{googleAuth && step === 3 ? ' · Google verified' : ''}
            </span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1 — Parent details */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} transition={{ duration: 0.25 }} className="flex flex-col gap-4">
              <Input label="Full Name" icon={User} value={f.name} onChange={set('name')} placeholder="Jane Doe" />
              <Input label="Email Address" icon={Mail} type="email" value={f.email} onChange={set('email')} placeholder="parent@family.com"
                error={emailStatus === 'taken' ? 'An account with this email already exists.' : undefined}
                success={emailStatus === 'ok' ? 'Email available' : undefined} />
              {emailStatus === 'checking' && <span className="text-slate-500 text-[11.5px] font-semibold -mt-2 px-1">Checking availability…</span>}
              {emailStatus === 'taken' && (
                <button type="button" onClick={() => navigate('/login')} className="self-start -mt-2 px-1 text-cyan-400 text-[12px] font-bold hover:underline">Sign in instead →</button>
              )}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-white/[0.07]" />
                <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.15em]">or sign up with</span>
                <div className="flex-1 h-px bg-white/[0.07]" />
              </div>
              <button onClick={continueWithGoogle} disabled={googleBusy} className="ag-tap w-full flex items-center justify-center gap-3 min-h-[56px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-full text-white text-[14px] font-bold disabled:opacity-60">
                {googleBusy ? <Loader2 size={18} className="animate-spin" /> : <GoogleIcon />}
                <span>{googleBusy ? 'Connecting…' : 'Continue with Google'}</span>
              </button>
              {error && step === 1 && <p className="text-rose-400 text-[12.5px] font-semibold text-center px-1">{error}</p>}
            </motion.div>
          )}

          {/* STEP 2 — Account password */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="flex flex-col gap-4">
              <p className="text-slate-400 text-[13px] font-medium leading-relaxed -mt-1">
                This password securely accesses your AlphaGuard AI account — used for login, new devices, and recovery. It is never used for child-control actions.
              </p>
              <Input label="Create Password" icon={Lock} type="password" value={f.pass} onChange={set('pass')} placeholder="At least 8 characters"
                error={f.pass && !passValid ? 'Use 8 or more characters' : undefined} />
              {/* strength meter */}
              <div className="-mt-1.5 flex items-center gap-2">
                <div className="flex-1 flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div key={i} className="h-1.5 flex-1 rounded-full" animate={{ backgroundColor: i < strength ? STRENGTH[strength].color : 'rgba(255,255,255,0.1)' }} transition={{ duration: 0.3 }} />
                  ))}
                </div>
                {f.pass && <span className="text-[11px] font-bold" style={{ color: STRENGTH[strength].color }}>{STRENGTH[strength].label}</span>}
              </div>
              <Input label="Confirm Password" icon={Lock} type="password" value={f.confirm} onChange={set('confirm')} placeholder="Re-enter password"
                error={f.confirm && !passMatch ? 'Passwords do not match' : undefined}
                success={passMatch ? 'Passwords match' : undefined} />
              <button onClick={() => setStep(1)} className="ag-tap self-start flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold mt-1">
                <ChevronLeft size={15} /> Back
              </button>
            </motion.div>
          )}

          {/* STEP 3 — Parent Security PIN */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="flex flex-col gap-5">
              <button onClick={() => { setError(''); setStep(googleAuth ? 1 : 2); }} className="ag-tap self-start flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold -mt-1">
                <ChevronLeft size={15} /> Back
              </button>
              <p className="text-slate-400 text-[13px] font-medium leading-relaxed text-center -mt-2 max-w-[320px] mx-auto">
                This PIN protects your child’s safety settings and approves important parental actions like unlocking apps, removing restrictions, or disconnecting a device.
              </p>

              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] px-1">Enter 6-digit PIN</span>
                <PinField value={pin} onChange={setPin} reveal={revealPin} />
              </div>
              <div className="flex flex-col gap-2.5">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.12em] px-1">Confirm PIN</span>
                <PinField value={pin2} onChange={setPin2} reveal={revealPin} />
                {pinMismatch && <span className="text-[11px] font-semibold text-rose-400 px-1">PINs do not match</span>}
                {pinValid && <span className="text-[11px] font-semibold text-emerald-400 px-1">PINs match</span>}
              </div>

              <button onClick={() => setRevealPin((v) => !v)} className="ag-tap self-center inline-flex items-center gap-1.5 text-slate-500 hover:text-white text-[12.5px] font-bold">
                {revealPin ? <EyeOff size={14} /> : <Eye size={14} />} {revealPin ? 'Hide PIN' : 'Show PIN'}
              </button>

              <div className="flex items-start gap-2.5 p-3.5 bg-cyan-500/[0.06] border border-cyan-500/15 rounded-2xl">
                <KeyRound size={15} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11.5px] text-slate-400 leading-relaxed font-medium">
                  Keep this PIN private. It’s separate from your account password and authorizes sensitive parental controls.
                </p>
              </div>
              {error && <p className="text-rose-400 text-[12.5px] font-semibold text-center px-1">{error}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        {step === 1 && (
          <p className="text-center text-[13px] text-slate-400 mt-7 font-semibold">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-indigo-400 font-extrabold hover:underline">Sign in</button>
          </p>
        )}
      </div>

      {/* PIN confirmation modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Confirm Parent Security PIN">
        <p className="text-slate-400 text-[13.5px] font-medium leading-relaxed">
          This PIN will be required to approve sensitive actions and protect your child’s safety settings. Please verify that your PIN is correct before continuing.
        </p>
        <div className="flex items-center justify-center gap-2 my-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="w-9 h-11 rounded-xl border border-white/10 bg-[#0b0c14] flex items-center justify-center text-[18px] font-black text-white">
              {revealPin ? pin[i] : '•'}
            </div>
          ))}
        </div>
        <p className="text-slate-500 text-[12px] font-medium leading-relaxed mb-5">
          If you ever forget it, account recovery can help you reset it.
        </p>
        <div className="flex gap-3">
          <div className="flex-1"><Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button></div>
          <div className="flex-1"><Button onClick={confirmPin}>Confirm PIN</Button></div>
        </div>
      </Modal>
    </Screen>
  );
};

export default Signup;
