import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Shield, User, Lock, Mail, Key, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000' 
  : 'https://childshield-1sd6.onrender.com';

const Signup = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '', parentControlPassword: '' });
  const [show, setShow] = useState({ pass: false, confirm: false, parent: false });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState('');
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

  if (user) return <Navigate to="/controls" />;

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

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });
  const toggleShow   = k => setShow(s => ({ ...s, [k]: !s[k] }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');
    if (!formData.parentControlPassword) return setError('Parent Control Password is required.');
    setError('');
    setShowConfirmModal(true);
  };

  const confirmRegistration = async () => {
    setSubmitting(true);
    try { 
      await register(formData); 
    }
    catch (err) { 
      setError(err.message || 'Registration failed.'); 
      setShowConfirmModal(false); 
    }
    finally { 
      setSubmitting(false); 
    }
  };

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
              className="mt-4 px-5 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 rounded-full text-white font-bold text-xs cursor-pointer shadow-lg animate-fade-in"
            >
              Cancel & Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#07070c] overflow-hidden flex items-center justify-center px-4 py-12 font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020617] to-[#0f172a] pointer-events-none" />
      <div className="absolute top-[10%] left-[10%] w-[380px] h-[380px] rounded-full bg-purple-600/10 filter blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[380px] h-[380px] rounded-full bg-cyan-600/10 filter blur-[100px] pointer-events-none animate-pulse" />

      {/* Confirm details Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[440px] p-8 bg-[#0d0d17]/90 border border-white/10 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.8)] backdrop-blur-xl text-center flex flex-col"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/30 mx-auto mb-4 shadow-[0_0_20px_rgba(168,85,247,0.15)]">
                <Shield size={28} className="text-purple-400" />
              </div>
              <h3 className="text-xl font-black text-white tracking-wide mb-2">Confirm Your Details</h3>
              <p className="text-slate-400 text-xs mb-6 font-semibold">Please double-check the information below before finalizing.</p>

              <div className="bg-white/3 p-5 rounded-2xl text-left border border-white/5 mb-6 flex flex-col gap-4">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Full Name</span>
                  <div className="text-white font-extrabold text-sm mt-0.5">{formData.fullName}</div>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Email Address</span>
                  <div className="text-white font-extrabold text-sm mt-0.5">{formData.email}</div>
                </div>
                <div className="bg-purple-950/20 border-l-4 border-purple-500 p-3.5 rounded-r-xl">
                  <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Important Override Warning:
                  </span>
                  <div className="text-slate-300 text-xs mt-1.5 leading-relaxed">
                    If you lose your Parent Control Password, you will not be able to bypass local device locks. Make sure you memorize it.
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)} 
                  className="flex-1 py-3 bg-white/2 hover:bg-white/5 border border-white/5 text-white font-bold text-xs tracking-wider uppercase rounded-xl cursor-pointer active:scale-95 transition-all"
                >
                  Review Again
                </button>
                <button 
                  onClick={confirmRegistration} 
                  disabled={submitting} 
                  className="flex-1 py-3 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-black text-xs tracking-wider uppercase rounded-xl cursor-pointer shadow-[0_0_20px_rgba(147,51,234,0.35)] active:scale-95 transition-all disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Confirm & Create'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main card */}
      <motion.div 
        initial={{ y: 15, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-[480px] px-6 py-10 bg-white/5 border border-white/5 rounded-3xl shadow-[0_16px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl flex flex-col"
      >
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 mb-4 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
            <Shield size={26} className="text-cyan-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-wide">Create Account</h2>
          <p className="text-slate-400 text-xs mt-1 font-semibold">Start protecting your child's digital life</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-xl mb-6 text-center font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Full Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Full Name</label>
            <div className="relative">
              <User size={16} className="absolute top-3.5 left-4 text-slate-500" />
              <input 
                type="text" 
                name="fullName" 
                required 
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="John Doe" 
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">Email Address</label>
            <div className="relative">
              <Mail size={16} className="absolute top-3.5 left-4 text-slate-500" />
              <input 
                type="email" 
                name="email" 
                required 
                onChange={handleChange}
                className="w-full pl-11 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                placeholder="parent@example.com" 
              />
            </div>
          </div>

          {/* Password row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Login Password', key: 'pass', name: 'password' },
              { label: 'Confirm Password', key: 'confirm', name: 'confirmPassword' },
            ].map(({ label, key, name }) => (
              <div key={name} className="flex flex-col gap-1.5">
                <label className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wide">{label}</label>
                <div className="relative">
                  <Lock size={16} className="absolute top-3.5 left-4 text-slate-500" />
                  <input 
                    type={show[key] ? 'text' : 'password'} 
                    name={name} 
                    required 
                    onChange={handleChange}
                    className="w-full pl-11 pr-10 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all"
                    placeholder="••••••••" 
                  />
                  <div 
                    onClick={() => toggleShow(key)} 
                    className="absolute right-3 top-3.5 cursor-pointer text-slate-500 hover:text-white transition-colors"
                  >
                    {show[key] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Parent Control Password Card */}
          <div className="mt-2 p-4 bg-purple-950/20 border border-purple-500/10 rounded-2xl flex flex-col gap-3">
            <div>
              <label className="text-[11px] font-black text-purple-400 uppercase tracking-wide">Parent Control Password</label>
              <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed font-semibold">
                Required separately to unlock the child device's screen and override local restrictions.
              </p>
            </div>
            <div className="relative">
              <Key size={16} className="absolute top-3.5 left-4 text-purple-400" />
              <input 
                type={show.parent ? 'text' : 'password'} 
                name="parentControlPassword" 
                required 
                onChange={handleChange}
                className="w-full pl-11 pr-10 py-3 bg-black/40 border border-purple-500/20 rounded-xl text-white text-xs outline-none focus:border-purple-500/40 focus:ring-1 focus:ring-purple-500/20 transition-all"
                placeholder="Secure Override PIN/Password" 
              />
              <div 
                onClick={() => toggleShow('parent')} 
                className="absolute right-3 top-3.5 cursor-pointer text-slate-500 hover:text-white transition-colors"
              >
                {show.parent ? <EyeOff size={16} /> : <Eye size={16} />}
              </div>
            </div>
          </div>

          <button 
            type="submit"
            className="w-full mt-4 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-xl text-white font-extrabold text-xs tracking-wider uppercase cursor-pointer shadow-[0_0_20px_rgba(147,51,234,0.3)] active:scale-95 transition-all"
          >
            Create Account
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
          Already registered?{' '}
          <Link to="/login" className="text-purple-400 font-bold hover:underline">Sign In here</Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Signup;
