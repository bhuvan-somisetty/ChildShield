import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, ChevronRight } from 'lucide-react';
import { Screen, Button, Input, Brand } from '../components/ui';
import { api, setToken } from '../lib/agClient';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Real sign-in — authenticates against the backend, persists the JWT, then
  // proceeds to the parent setup wizard. Empty/invalid credentials are rejected.
  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setSubmitting(true);
    try {
      const { token } = await api.loginParent(email.trim().toLowerCase(), password);
      setToken(token);
      navigate('/setup');
    } catch (err) {
      setError(err.message === 'Invalid credentials' ? 'Incorrect email or password.' : 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen align="center" glow="#2563eb">
      <div className="w-full flex flex-col">
        <div className="flex flex-col items-center text-center mb-8">
          <Brand variant="stacked" className="mb-6" />
          <h1 className="text-[26px] font-black text-white tracking-tight leading-tight">Welcome back</h1>
          <p className="text-slate-500 text-[13px] font-semibold mt-2">Log in to your parent dashboard</p>
        </div>

        <form onSubmit={submit} className="flex flex-col gap-4">
          <Input label="Email Address" icon={Mail} type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} placeholder="parent@family.com" />
          <Input label="Password" icon={Lock} type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} placeholder="••••••••••••" />
          {error && <p className="text-rose-400 text-[12.5px] font-semibold -mt-1 px-1">{error}</p>}
          <button type="button" onClick={() => navigate('/forgot')} className="ag-tap self-end text-cyan-400/90 hover:text-cyan-300 text-[12.5px] font-bold -mt-1">
            Forgot Password?
          </button>
          <Button type="submit" loading={submitting} iconRight={ChevronRight} className="mt-2">Continue</Button>
        </form>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.15em]">or continue with</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <button className="ag-tap w-full flex items-center justify-center gap-3 min-h-[56px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-full text-white text-[14px] font-bold">
          <GoogleIcon /> <span>Sign in with Google</span>
        </button>

        <p className="text-center text-[13px] text-slate-400 mt-7 font-semibold">
          Don’t have an account?{' '}
          <button onClick={() => navigate('/signup')} className="text-cyan-400 font-extrabold hover:underline">Create Account</button>
        </p>
      </div>
    </Screen>
  );
};

export default Login;
