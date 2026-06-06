import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const BACKEND = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:5000'
  : 'https://childshield-1sd6.onrender.com';

const Login = () => {
  const { login } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const [wakeTimeout, setWakeTimeout] = useState(false);

  useEffect(() => {
    let timer;
    if (isWakingServer) {
      timer = setTimeout(() => setWakeTimeout(true), 30000);
    } else {
      setWakeTimeout(false);
    }
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
      await new Promise(r => setTimeout(r, 3000));
      attempts++;
    }
    setIsWakingServer(false);
    window.location.href = `${BACKEND}/auth/${provider}`;
  };

  const oauthErrorMap = {
    facebook_not_configured: 'Facebook login needs setup - add your FACEBOOK_APP_ID to backend/.env',
    twitter_not_configured:  'X (Twitter) login needs setup - add your TWITTER_CONSUMER_KEY to backend/.env',
    google_not_configured:   'Google login needs setup - add your GOOGLE_CLIENT_ID to backend/.env',
    facebook_failed: 'Facebook login failed. Check your App ID & redirect URI in Facebook Developers.',
    twitter_failed:  'X (Twitter) login failed. Check your API Key & callback URL in Twitter Developer Portal.',
    google_failed:   'Google login failed. Check your Client ID & redirect URI in Google Cloud Console.',
    oauth_failed:    'Social login failed. Please try again or use email login.',
  };
  
  const urlError = searchParams.get('error');
  const initialErr = urlError ? (oauthErrorMap[urlError] || `Login error: ${urlError}`) : '';
  const [error, setError] = useState(initialErr);

  // Waking Server loading UI
  if (isWakingServer) {
    return (
      <div className="min-h-screen w-full bg-[#07070c] flex flex-col items-center justify-center gap-6 px-4 font-sans">
        <div className="relative w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(37,99,235,0.25)] animate-pulse">
          <Loader2 size={36} className="text-cyan-400 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-white font-extrabold text-base mb-1">
            {wakeTimeout ? 'Server taking longer to load...' : 'Securing your session...'}
          </p>
          <p className="text-slate-400 text-xs">
            {wakeTimeout ? 'Render free tier can take up to 90s to spin up.' : 'Waking AlphaGuard AI... please wait'}
          </p>
          {wakeTimeout && (
            <button
              onClick={() => { setIsWakingServer(false); setWakeTimeout(false); }}
              className="mt-4 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-white font-bold text-xs cursor-pointer shadow-lg"
            >
              Cancel & Retry
            </button>
          )}
        </div>
      </div>
    );
  }

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

  return (
    <div className="relative min-h-screen w-full bg-[#07070c] overflow-hidden flex items-center justify-center px-4 py-8 font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] to-[#0f172a] pointer-events-none" />
      <div className="absolute top-[10%] left-[10%] w-[380px] h-[380px] rounded-full bg-purple-600/10 filter blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[380px] h-[380px] rounded-full bg-cyan-600/10 filter blur-[100px] pointer-events-none animate-pulse" />

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-[430px] px-6 py-10 bg-white/5 border border-white/5 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]"
          >
            <Shield size={26} className="text-cyan-400" />
          </motion.div>
          <h2 className="text-2xl font-black text-white tracking-wide">Welcome Back</h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Log in to your parent dashboard</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off" className="flex flex-col gap-4">
          <input type="text" style={{ display: 'none' }} autoComplete="username" tabIndex="-1" readOnly />
          <input type="password" style={{ display: 'none' }} autoComplete="current-password" tabIndex="-1" readOnly />

          {/* Email field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute top-3.5 left-4 text-slate-500" />
              <input 
                type="email" 
                required 
                value={email} 
                onChange={e => setEmail(e.target.value)}
                autoComplete="off"
                className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="parent@example.com" 
              />
            </div>
          </div>

          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Password</label>
            <div className="relative">
              <Lock size={16} className="absolute top-3.5 left-4 text-slate-500" />
              <input 
                type={showPass ? 'text' : 'password'} 
                required 
                value={password} 
                onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                className="w-full pl-11 pr-10 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="Enter your password" 
              />
              <div 
                onClick={() => setShowPass(!showPass)} 
                className="absolute right-3.5 top-3.5 cursor-pointer text-slate-500 hover:text-white"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting}
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-xl text-white font-extrabold text-xs tracking-wider uppercase cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {submitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[10px] text-slate-500 font-extrabold uppercase tracking-widest">or continue with</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        {/* Social logins */}
        <div className="flex flex-col gap-2.5 mb-6">
          {/* Google */}
          <button 
            onClick={() => oauthRedirect('google')}
            className="w-full flex items-center justify-center gap-3 py-2.5 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl text-white text-xs font-bold cursor-pointer transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Google</span>
          </button>

          {/* Facebook */}
          <button 
            onClick={() => oauthRedirect('facebook')}
            className="w-full flex items-center justify-center gap-3 py-2.5 bg-white/2 hover:bg-white/5 border border-white/5 rounded-xl text-white text-xs font-bold cursor-pointer transition-all duration-200"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#1877F2"/>
              <path fill="white" d="M16.67 15.5l.44-2.85h-2.73v-1.85c0-.78.38-1.54 1.6-1.54h1.24V6.8s-1.12-.19-2.2-.19c-2.24 0-3.71 1.36-3.71 3.82v2.22H8.89V15.5h2.42V22.8c.49.07.98.11 1.49.11s1-.04 1.49-.11V15.5h2.38z"/>
            </svg>
            <span>Facebook</span>
          </button>
        </div>

        <p className="text-center text-xs text-slate-400">
          Don't have an account?{' '}
          <Link to="/signup" className="text-cyan-400 font-bold hover:underline">Create one</Link>
        </p>

      </div>

    </div>
  );
};

export default Login;
