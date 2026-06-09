import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Screen, Button, TextField, BrandMark } from '../../components/ui';

const BACKEND = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://childshield-1sd6.onrender.com';

const GoogleIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const WakingServer = ({ timedOut, onCancel }) => (
  <Screen ambient="brand" align="center" scroll={false}>
    <div className="flex flex-col items-center text-center gap-6">
      <div className="relative w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.3)]">
        <Loader2 size={34} className="text-cyan-400 animate-spin" />
      </div>
      <div>
        <p className="text-white font-extrabold text-base mb-1.5">
          {timedOut ? 'Almost there…' : 'Securing your session'}
        </p>
        <p className="text-slate-400 text-[13px] max-w-[280px]">
          {timedOut
            ? 'The secure server is waking up — this can take up to 90 seconds on first connect.'
            : 'Connecting to AlphaGuard AI…'}
        </p>
      </div>
      {timedOut && (
        <Button variant="secondary" size="md" fullWidth={false} onClick={onCancel}>
          Cancel & Retry
        </Button>
      )}
    </div>
  </Screen>
);

const Login = () => {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const [wakeTimeout, setWakeTimeout] = useState(false);

  useEffect(() => {
    let timer;
    if (isWakingServer) timer = setTimeout(() => setWakeTimeout(true), 30000);
    else setWakeTimeout(false);
    return () => clearTimeout(timer);
  }, [isWakingServer]);

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

  const oauthErrorMap = {
    facebook_not_configured: 'Facebook login needs setup - add your FACEBOOK_APP_ID to backend/.env',
    twitter_not_configured: 'X (Twitter) login needs setup - add your TWITTER_CONSUMER_KEY to backend/.env',
    google_not_configured: 'Google login needs setup - add your GOOGLE_CLIENT_ID to backend/.env',
    facebook_failed: 'Facebook login failed. Check your App ID & redirect URI in Facebook Developers.',
    twitter_failed: 'X (Twitter) login failed. Check your API Key & callback URL in Twitter Developer Portal.',
    google_failed: 'Google login failed. Check your Client ID & redirect URI in Google Cloud Console.',
    oauth_failed: 'Social login failed. Please try again or use email login.',
  };

  const urlError = searchParams.get('error');
  const initialErr = urlError ? (oauthErrorMap[urlError] || `Login error: ${urlError}`) : '';
  const [error, setError] = useState(initialErr);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      localStorage.removeItem('child_session');
      localStorage.removeItem('cs_active_child');
      await login(email, password);
      navigate('/controls', { replace: true });
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (isWakingServer) {
    return <WakingServer timedOut={wakeTimeout} onCancel={() => { setIsWakingServer(false); setWakeTimeout(false); }} />;
  }

  return (
    <Screen ambient="brand" align="center">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full flex flex-col"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-9">
          <BrandMark variant="stacked" className="mb-6" />
          <h1 className="text-[26px] font-black text-white tracking-tight leading-tight">Welcome back</h1>
          <p className="text-slate-500 text-[13px] font-semibold mt-1.5">Log in to your parent dashboard</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-300 text-[13px] p-3.5 rounded-2xl mb-5 font-semibold">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
          <input type="text" style={{ display: 'none' }} autoComplete="username" tabIndex="-1" readOnly />
          <input type="password" style={{ display: 'none' }} autoComplete="current-password" tabIndex="-1" readOnly />

          <TextField
            label="Email Address"
            icon={Mail}
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="parent@domain.com"
            autoComplete="off"
          />
          <TextField
            label="Password"
            icon={Lock}
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••••••"
            autoComplete="new-password"
          />

          <Button type="submit" loading={submitting} className="mt-2">
            Sign In
          </Button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-white/[0.07]" />
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-[0.15em]">or continue with</span>
          <div className="flex-1 h-px bg-white/[0.07]" />
        </div>

        <button
          onClick={() => oauthRedirect('google')}
          className="ag-tap w-full flex items-center justify-center gap-3 min-h-[52px] bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] rounded-full text-white text-[14px] font-bold"
        >
          <GoogleIcon />
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-[13px] text-slate-400 mt-7 font-semibold">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-cyan-400 font-extrabold hover:underline">Create one</Link>
        </p>
      </motion.div>
    </Screen>
  );
};

export default Login;
