import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { User, Lock, Mail, Loader2, AlertCircle, ChevronRight, ChevronLeft, ShieldCheck, Baby, Cake } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen, Button, TextField, BrandMark, ProgressDots } from '../../components/ui';

const BACKEND = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://childshield-1sd6.onrender.com';

const STEP_LABELS = ['Parent details', 'Security', 'Family setup'];

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Signup = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1 = parent details, 2 = security, 3 = family setup
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirmPassword: '', childName: '', childAge: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const [wakeTimeout, setWakeTimeout] = useState(false);

  useEffect(() => {
    let timer;
    if (isWakingServer) timer = setTimeout(() => setWakeTimeout(true), 30000);
    else setWakeTimeout(false);
    return () => clearTimeout(timer);
  }, [isWakingServer]);

  // Already-authenticated users who have finished setup skip signup.
  if (user && !user.needsPasswordSetup) return <Navigate to="/controls" />;

  const oauthRedirect = async (provider) => {
    setIsWakingServer(true);
    let attempts = 0;
    while (attempts < 25) {
      try {
        const res = await fetch(`${BACKEND}/api/health`, { cache: 'no-store' });
        if (res.ok) break;
      } catch (err) {}
      await new Promise((r) => setTimeout(r, 3000));
      attempts++;
    }
    setIsWakingServer(false);
    window.location.href = `${BACKEND}/auth/${provider}`;
  };

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  // Step 1 → 2
  const handleIdentity = (e) => {
    e?.preventDefault();
    setError('');
    if (!form.fullName.trim() || !form.email.trim()) {
      setError('Please enter your name and email.');
      return;
    }
    setStep(2);
  };

  // Step 2 → 3
  const handleSecurity = (e) => {
    e?.preventDefault();
    setError('');
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setStep(3);
  };

  // Step 3 → create account.
  // Backend register accepts only { fullName, email, password } — child details are
  // persisted locally to pre-fill the family/pairing flow and never touch the auth API.
  const handleCreate = async ({ withChild = true } = {}) => {
    setError('');
    setSubmitting(true);
    try {
      if (withChild && form.childName.trim()) {
        localStorage.setItem('ag_onboarding_child', JSON.stringify({
          name: form.childName.trim(),
          age: form.childAge ? Number(form.childAge) : null,
        }));
      }
      const result = await register({
        fullName: form.fullName,
        email: form.email,
        password: form.password,
      });
      const needsSetup = result && typeof result === 'object' ? result.needsPasswordSetup : true;
      navigate(needsSetup ? '/setup-password' : '/controls', { replace: true });
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isWakingServer) {
    return (
      <Screen ambient="brand" align="center" scroll={false}>
        <div className="flex flex-col items-center text-center gap-6">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.3)]">
            <Loader2 size={34} className="text-cyan-400 animate-spin" />
          </div>
          <div>
            <p className="text-white font-extrabold text-base mb-1.5">
              {wakeTimeout ? 'Almost there…' : 'Connecting securely'}
            </p>
            <p className="text-slate-400 text-[13px] max-w-[280px]">
              {wakeTimeout ? 'The secure server is waking up — up to 90 seconds on first connect.' : 'Reaching AlphaGuard AI…'}
            </p>
          </div>
          {wakeTimeout && (
            <Button variant="secondary" size="md" fullWidth={false} onClick={() => { setIsWakingServer(false); setWakeTimeout(false); }}>
              Cancel & Retry
            </Button>
          )}
        </div>
      </Screen>
    );
  }

  const footer =
    step === 1 ? (
      <Button onClick={handleIdentity} iconRight={ChevronRight}>Continue</Button>
    ) : step === 2 ? (
      <Button onClick={handleSecurity} iconRight={ChevronRight}>Continue</Button>
    ) : (
      <Button onClick={() => handleCreate({ withChild: true })} loading={submitting} iconRight={ChevronRight}>Create Account</Button>
    );

  return (
    <Screen ambient="brand" align="between" footer={footer}>
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-9">
          <BrandMark variant="stacked" className="mb-7" />
          <h1 className="text-[28px] font-black text-white tracking-tight leading-tight">Create your account</h1>
          <div className="flex flex-col items-center gap-2.5 mt-4">
            <ProgressDots count={3} active={step - 1} />
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.12em]">
              Step {step} of 3 · {STEP_LABELS[step - 1]}
            </span>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] p-3.5 rounded-2xl mb-6 font-semibold">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.form
              key="s1"
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleIdentity}
              className="flex flex-col gap-5"
            >
              <TextField label="Full Name" icon={User} value={form.fullName} onChange={set('fullName')} placeholder="Jane Doe" required autoFocus />
              <TextField label="Email Address" icon={Mail} type="email" value={form.email} onChange={set('email')} placeholder="parent@domain.com" required />
            </motion.form>
          ) : step === 2 ? (
            <motion.form
              key="s2"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSecurity}
              className="flex flex-col gap-5"
            >
              <TextField label="Create Password" icon={Lock} type="password" value={form.password} onChange={set('password')} placeholder="At least 6 characters" required autoFocus
                hint={!form.password ? 'Use 6+ characters' : undefined}
                success={form.password.length >= 6 ? 'Strong enough' : undefined} />
              <TextField label="Confirm Password" icon={Lock} type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Re-enter password" required
                error={form.confirmPassword && form.confirmPassword !== form.password ? 'Passwords do not match' : undefined}
                success={form.confirmPassword && form.confirmPassword === form.password ? 'Passwords match' : undefined} />

              <div className="flex items-start gap-2.5 p-4 bg-blue-500/[0.06] border border-blue-500/15 rounded-2xl mt-1">
                <ShieldCheck size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                  After signup, you’ll set a 4-digit <span className="text-slate-200 font-bold">Override PIN</span> to approve device changes and unlocks.
                </p>
              </div>

              <button
                type="button"
                onClick={() => { setStep(1); setError(''); }}
                className="ag-tap self-start flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold mt-1"
              >
                <ChevronLeft size={15} /> Back to details
              </button>
            </motion.form>
          ) : (
            <motion.form
              key="s3"
              initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.25 }}
              onSubmit={(e) => { e.preventDefault(); handleCreate({ withChild: true }); }}
              className="flex flex-col gap-5"
            >
              <div className="flex items-start gap-2.5 p-4 bg-cyan-500/[0.06] border border-cyan-500/15 rounded-2xl">
                <Baby size={16} className="text-cyan-400 flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-slate-400 leading-relaxed font-medium">
                  Tell us about your child so we can personalise their protection. You can add more children anytime.
                </p>
              </div>

              <TextField label="Child's Name" icon={User} value={form.childName} onChange={set('childName')} placeholder="e.g. Emma" autoFocus />
              <TextField label="Child's Age" icon={Cake} type="number" inputMode="numeric" min="1" max="18" value={form.childAge} onChange={set('childAge')} placeholder="e.g. 10" />

              <button
                type="button"
                onClick={() => { setStep(2); setError(''); }}
                className="ag-tap self-start flex items-center gap-1 text-slate-400 hover:text-white text-xs font-bold mt-1"
              >
                <ChevronLeft size={15} /> Back to security
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() => handleCreate({ withChild: false })}
                className="ag-tap self-center text-slate-500 hover:text-slate-300 text-[12.5px] font-bold mt-1"
              >
                I’ll add my child later
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* OAuth — only on first step to keep later steps focused */}
        {step === 1 && (
          <>
            <div className="flex items-center gap-3 my-8">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.15em]">or sign up with</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>
            <button
              onClick={() => oauthRedirect('google')}
              className="ag-tap w-full flex items-center justify-center gap-3 min-h-[56px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-full text-white text-[14px] font-bold"
            >
              <GoogleIcon />
              <span>Continue with Google</span>
            </button>
          </>
        )}

        <p className="text-center text-[13px] text-slate-400 mt-9 font-semibold">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 font-extrabold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </Screen>
  );
};

export default Signup;
