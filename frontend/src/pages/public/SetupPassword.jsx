/**
 * SetupPassword.jsx
 * Standalone page shown after every new Google/OAuth login.
 * Forces user to set a Parent Control Password before accessing the app.
 * On success → navigates to /controls.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

const SetupPassword = () => {
  const navigate = useNavigate();
  const { user, token, updateUser } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If user somehow lands here without needing setup, redirect
  useEffect(() => {
    /*
    if (user && !user.needsPasswordSetup) {
      navigate('/controls', { replace: true });
    }
    if (!user && !token && !localStorage.getItem('cs_token')) {
      navigate('/login', { replace: true });
    }
    */
  }, [user, token, navigate]);

  const strength = password.length === 0 ? 0
    : password.length < 5 ? 1
    : password.length < 8 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
    : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColorClass = [
    '',
    'text-red-400 bg-red-500/20',
    'text-amber-400 bg-amber-500/20',
    'text-blue-400 bg-blue-500/20',
    'text-emerald-400 bg-emerald-500/20'
  ][strength];
  
  const strengthBarClass = [
    'bg-white/5',
    'bg-red-500',
    'bg-amber-500',
    'bg-blue-500',
    'bg-emerald-500'
  ][strength];

  const handleSubmit = async () => {
    if (password.length < 4) { setError('Password must be at least 4 characters'); return; }
    if (password !== confirm) { setError('Passwords do not match'); return; }
    setLoading(true); setError('');
    try {
      const jwt = token || localStorage.getItem('cs_token');
      const res = await fetch('/api/auth/set-control-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${jwt}` },
        body: JSON.stringify({ parentControlPassword: password })
      });
      const data = await res.json();
      if (data.success) {
        updateUser({ needsPasswordSetup: false });
        navigate('/controls', { replace: true });
      } else {
        setError(data.error || 'Failed to set password. Try again.');
      }
    } catch {
      setError('Network error. Please check your connection.');
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#07070c] overflow-hidden flex items-center justify-center px-4 py-8 font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] to-[#0f172a] pointer-events-none" />
      <div className="absolute top-[10%] left-[10%] w-[380px] h-[380px] rounded-full bg-blue-600/10 filter blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[380px] h-[380px] rounded-full bg-purple-600/10 filter blur-[100px] pointer-events-none animate-pulse" />

      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[460px] px-6 py-10 bg-white/5 border border-white/5 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 mx-auto mb-4 shadow-[0_0_20px_rgba(59,130,246,0.15)] animate-pulse">
            <ShieldCheck size={32} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight leading-tight">
            Set Your Control Password
          </h1>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed max-w-[340px] mx-auto font-semibold">
            This <strong className="text-blue-400">Parent Control Password</strong> protects critical actions — child device logout, app unlocking, and security overrides. It is separate from your Google password.
          </p>
        </div>

        {/* Warning Alert */}
        <div className="flex items-start gap-2.5 p-3.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl mb-6">
          <AlertTriangle size={16} className="text-amber-500 mt-0.5 flex-shrink-0" />
          <span className="text-[11px] text-amber-500/95 leading-normal font-bold">
            Remember this password! Children cannot log out without it and you cannot unlock apps without it.
          </span>
        </div>

        {/* Input Fields */}
        <div className="flex flex-col gap-4 mb-6">
          
          {/* Password field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">
              Control Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute top-3.5 left-4 text-slate-500" />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 4 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && document.getElementById('confirm-input')?.focus()}
                className="w-full pl-11 pr-10 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              <button 
                onClick={() => setShowPass(!showPass)} 
                className="absolute right-3.5 top-3.5 cursor-pointer text-slate-500 hover:text-white transition-colors"
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength meter */}
            {password.length > 0 && (
              <div className="mt-1.5 flex flex-col gap-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div 
                      key={i} 
                      className={`flex-1 h-[3px] rounded-full transition-all duration-300 ${i <= strength ? strengthBarClass : 'bg-white/5'}`} 
                    />
                  ))}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider inline-block self-start px-2 py-0.5 rounded ${strengthColorClass}`}>
                  {strengthLabel}
                </span>
              </div>
            )}
          </div>

          {/* Confirm field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">
              Confirm Password
            </label>
            <div className="relative">
              <Lock size={16} className="absolute top-3.5 left-4 text-slate-500" />
              <input
                id="confirm-input"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                className="w-full pl-11 pr-10 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
              />
              <button 
                onClick={() => setShowConfirm(!showConfirm)} 
                className="absolute right-3.5 top-3.5 cursor-pointer text-slate-500 hover:text-white transition-colors"
              >
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Match indicator */}
            {confirm.length > 0 && (
              <div className={`mt-1.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide ${password === confirm ? 'text-emerald-400' : 'text-red-400'}`}>
                {password === confirm ? (
                  <>
                    <CheckCircle size={12} />
                    <span>Passwords match</span>
                  </>
                ) : (
                  <span>Passwords do not match</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Error alert */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-4 text-center font-semibold animate-fade-in">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !password || !confirm || password !== confirm}
          className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-xl text-white font-extrabold text-xs tracking-wider uppercase cursor-pointer shadow-lg active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Setting Password...' : 'Set Control Password & Continue →'}
        </button>
      </motion.div>
    </div>
  );
};

export default SetupPassword;
