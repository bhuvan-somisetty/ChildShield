import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Shield, User, Lock, Mail, Key, Eye, EyeOff, Loader2, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BACKEND = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
  ? 'http://localhost:5000' 
  : 'https://childshield-1sd6.onrender.com';

const Signup = () => {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
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

  const handleNextStep = (e) => {
    e.preventDefault();
    setError('');
    
    if (step === 1) {
      if (!formData.fullName.trim() || !formData.email.trim()) {
        setError('Please fill in your name and email.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters.');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      setStep(3);
    }
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();
    if (!formData.parentControlPassword.trim()) {
      setError('Parent override password is required.');
      return;
    }
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

  if (isWakingServer) {
    return (
      <div className="min-h-screen w-full bg-[#030307] flex flex-col items-center justify-center gap-6 px-4 font-sans">
        <div className="relative w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shadow-[0_0_30px_rgba(79,70,229,0.25)] animate-pulse">
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
              className="mt-4 px-5 py-2 bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full text-white font-bold text-xs cursor-pointer shadow-lg"
            >
              Cancel & Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#030307] overflow-hidden flex items-center justify-center px-4 py-12 font-sans">
      
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-gradient-to-tr from-[#020308] to-[#0b0c14] pointer-events-none" />
      <div className="absolute top-[10%] left-[10%] w-[380px] h-[380px] rounded-full bg-indigo-600/10 filter blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-[10%] right-[10%] w-[380px] h-[380px] rounded-full bg-cyan-600/10 filter blur-[100px] pointer-events-none animate-pulse" />

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-[420px] p-6 bg-[#0b0c14] border border-white/10 rounded-[28px] shadow-2xl backdrop-blur-xl text-center flex flex-col"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 mx-auto mb-4">
                <Shield size={24} className="text-cyan-400" />
              </div>
              <h3 className="text-lg font-black text-white tracking-wide mb-1">Confirm Registration</h3>
              <p className="text-slate-500 text-xs mb-5 font-bold uppercase tracking-wider">Double-check your credentials</p>

              <div className="bg-white/[0.02] p-4 rounded-2xl text-left border border-white/5 mb-5 flex flex-col gap-3.5">
                <div>
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Full Name</span>
                  <div className="text-white font-extrabold text-xs mt-0.5">{formData.fullName}</div>
                </div>
                <div className="border-t border-white/5 pt-2.5">
                  <span className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Email Address</span>
                  <div className="text-white font-extrabold text-xs mt-0.5">{formData.email}</div>
                </div>
                <div className="bg-amber-500/10 border-l-4 border-amber-500 p-3 rounded-r-xl">
                  <span className="text-[10px] uppercase font-black text-amber-500 tracking-widest flex items-center gap-1.5">
                    <AlertTriangle size={12} /> Override Warning:
                  </span>
                  <div className="text-slate-300 text-[10px] mt-1 leading-normal font-semibold">
                    Ensure you memorize your Parent override password. It is required to approve device changes and bypass local child blocks.
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmModal(false)} 
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/5 text-white font-bold text-xs tracking-wider uppercase rounded-xl cursor-pointer"
                >
                  Review
                </button>
                <button 
                  onClick={confirmRegistration} 
                  disabled={submitting} 
                  className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black text-xs tracking-wider uppercase rounded-xl cursor-pointer shadow-lg disabled:opacity-75"
                >
                  {submitting ? 'Creating...' : 'Confirm'}
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
        className="relative z-10 w-full max-w-[440px] px-6 py-10 bg-white/5 border border-white/5 rounded-3xl shadow-[0_24px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl flex flex-col"
      >
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 mb-4">
            <Shield size={26} className="text-cyan-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight leading-none">Create Account</h2>
          <p className="text-slate-500 text-xs mt-1.5 font-bold uppercase tracking-wider">
            Step {step} of 3: {step === 1 ? 'Identity' : step === 2 ? 'Security' : 'Bypass PIN'}
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl mb-4 text-center font-bold">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form 
              key="step1"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleNextStep}
              className="flex flex-col gap-4"
            >
              <div className="bg-[#0b0c14] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 shadow-inner">
                <div className="p-4 flex flex-col gap-1 focus-within:bg-white/[0.01]">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Full Name</label>
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-slate-500" />
                    <input 
                      type="text" 
                      name="fullName" 
                      required 
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none text-white text-xs outline-none placeholder-slate-600 font-semibold py-1"
                      placeholder="Jane Doe" 
                    />
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-1 focus-within:bg-white/[0.01]">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email Address</label>
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-500" />
                    <input 
                      type="email" 
                      name="email" 
                      required 
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none text-white text-xs outline-none placeholder-slate-600 font-semibold py-1"
                      placeholder="parent@domain.com" 
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full mt-4 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full text-white font-black text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1 shadow-lg"
              >
                <span>Continue</span>
                <ChevronRight size={13} strokeWidth={3} />
              </button>
            </motion.form>
          )}

          {step === 2 && (
            <motion.form 
              key="step2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleNextStep}
              className="flex flex-col gap-4"
            >
              <div className="bg-[#0b0c14] border border-white/5 rounded-2xl overflow-hidden divide-y divide-white/5 shadow-inner">
                <div className="p-4 flex flex-col gap-1 focus-within:bg-white/[0.01]">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Create Password</label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Lock size={14} className="text-slate-500" />
                      <input 
                        type={show.pass ? 'text' : 'password'} 
                        name="password" 
                        required 
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full bg-transparent border-none text-white text-xs outline-none placeholder-slate-600 font-semibold py-1"
                        placeholder="••••••••••••" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => toggleShow('pass')} 
                      className="text-slate-500 hover:text-white cursor-pointer"
                    >
                      {show.pass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="p-4 flex flex-col gap-1 focus-within:bg-white/[0.01]">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Confirm Password</label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <Lock size={14} className="text-slate-500" />
                      <input 
                        type={show.confirm ? 'text' : 'password'} 
                        name="confirmPassword" 
                        required 
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        className="w-full bg-transparent border-none text-white text-xs outline-none placeholder-slate-600 font-semibold py-1"
                        placeholder="••••••••••••" 
                      />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => toggleShow('confirm')} 
                      className="text-slate-500 hover:text-white cursor-pointer"
                    >
                      {show.confirm ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-slate-300 font-bold text-xs cursor-pointer flex items-center justify-center hover:bg-white/10 active:scale-95"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 rounded-full text-white font-black text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1 shadow-lg"
                >
                  <span>Continue</span>
                  <ChevronRight size={13} strokeWidth={3} />
                </button>
              </div>
            </motion.form>
          )}

          {step === 3 && (
            <motion.form 
              key="step3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleSignupSubmit}
              className="flex flex-col gap-4"
            >
              <div className="bg-indigo-950/15 border border-indigo-500/10 p-4 rounded-2xl mb-2 flex flex-col gap-1.5">
                <span className="text-[10.5px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Key size={13} /> Parent Control Password
                </span>
                <p className="text-[9.5px] text-slate-400 leading-normal font-semibold">
                  This custom password is required to remotely approve device lock requests and modify child safe perimeters.
                </p>
              </div>

              <div className="bg-[#0b0c14] border border-white/5 rounded-2xl overflow-hidden shadow-inner p-4">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Override Password</label>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 flex-1">
                    <Key size={14} className="text-slate-500" />
                    <input 
                      type={show.parent ? 'text' : 'password'} 
                      name="parentControlPassword" 
                      required 
                      value={formData.parentControlPassword}
                      onChange={handleChange}
                      className="w-full bg-transparent border-none text-white text-xs outline-none placeholder-slate-600 font-semibold py-1"
                      placeholder="Secure override code" 
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => toggleShow('parent')} 
                    className="text-slate-500 hover:text-white cursor-pointer"
                  >
                    {show.parent ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-3.5 bg-white/5 border border-white/5 rounded-2xl text-slate-300 font-bold text-xs cursor-pointer flex items-center justify-center hover:bg-white/10 active:scale-95"
                >
                  <ChevronLeft size={16} />
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full text-white font-black text-xs tracking-wider uppercase cursor-pointer flex items-center justify-center gap-1 shadow-lg"
                >
                  <span>Create Account</span>
                  <ChevronRight size={13} strokeWidth={3} />
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Alternate login path */}
        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest">or register via</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>

        <button 
          onClick={() => oauthRedirect('google')}
          className="w-full flex items-center justify-center gap-3 py-3 bg-[#0b0c14] hover:bg-white/5 border border-white/5 rounded-2xl text-white text-xs font-black cursor-pointer transition-all duration-200"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Continue with Google</span>
        </button>

        <p className="text-center text-xs text-slate-400 mt-6 font-semibold">
          Already registered?{' '}
          <Link to="/login" className="text-indigo-400 font-extrabold hover:underline">Sign In here</Link>
        </p>

      </motion.div>
    </div>
  );
};

export default Signup;
