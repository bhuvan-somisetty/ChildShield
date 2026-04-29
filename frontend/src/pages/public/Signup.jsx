import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link, useNavigate } from 'react-router-dom';
import { Shield, User, Lock, Mail, Key, Eye, EyeOff, Loader2 } from 'lucide-react';

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
    try { await register(formData); }
    catch (err) { setError(err.message); setShowConfirmModal(false); }
    finally { setSubmitting(false); }
  };

  const socialNotice = (name) => alert(`${name} OAuth requires credentials setup. See src/hooks/useSocialAuth.js`);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '40px 20px' }}>

      {/* Ambience blobs */}
      <div style={{ position: 'absolute', top: '-10%', left: '50%', width: '600px', height: '600px', background: 'var(--accent-purple)', filter: 'blur(200px)', opacity: 0.15, borderRadius: '50%', transform: 'translateX(-50%)' }} />

      {/* â”€â”€ Confirm modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', width: '100%', maxWidth: '440px', textAlign: 'center' }}>
            <Shield size={48} color="var(--accent-purple)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Confirm Your Details</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Please double-check the information below before finalizing.</p>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              {[['Full Name', formData.fullName], ['Email Address', formData.email]].map(([label, val]) => (
                <div key={label} style={{ marginBottom: '12px' }}>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{label}</span>
                  <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{val}</div>
                </div>
              ))}
              <div style={{ padding: '8px', background: 'rgba(37,99,235,0.1)', borderLeft: '3px solid var(--accent-purple)', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-purple)', fontWeight: 'bold' }}>Important Warning:</span>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>If you lose your Parent Control Password, you will not be able to bypass local device locks. Please ensure you have memorized it.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setShowConfirmModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Review Again</button>
              <button onClick={confirmRegistration} disabled={submitting} style={{ flex: 1, padding: '12px', background: 'var(--accent-purple)', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: 'var(--shadow-neon-purple)', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Creatingâ€¦' : 'Confirm & Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* â”€â”€ Main card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '40px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Shield size={40} color="var(--accent-cyan)" style={{ marginBottom: '16px', filter: 'drop-shadow(0 0 10px rgba(37,99,235,0.5))' }} />
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Start protecting your child's digital life</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Full Name */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
              <input type="text" name="fullName" required onChange={handleChange}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px 12px 44px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                placeholder="John Doe" />
            </div>
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
              <input type="email" name="email" required onChange={handleChange}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px 12px 44px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                placeholder="parent@example.com" />
            </div>
          </div>

          {/* Password row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { label: 'Login Password',    key: 'pass',    name: 'password' },
              { label: 'Confirm Password',  key: 'confirm', name: 'confirmPassword' },
            ].map(({ label, key, name }) => (
              <div key={name}>
                <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>{label}</label>
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
                  <input type={show[key] ? 'text' : 'password'} name={name} required onChange={handleChange}
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 40px 12px 40px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" />
                  <div onClick={() => toggleShow(key)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    {show[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Parent Control Password */}
          <div style={{ marginTop: '8px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--accent-purple)', fontWeight: '600' }}>Parent Control Password</label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>This separate password is required to unlock the child device lock screen and override restrictions.</p>
            <div style={{ position: 'relative' }}>
              <Key size={16} color="var(--accent-purple)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
              <input type={show.parent ? 'text' : 'password'} name="parentControlPassword" required onChange={handleChange}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(37,99,235,0.3)', padding: '12px 44px 12px 44px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                placeholder="Secure Override PIN/Password" />
              <div onClick={() => toggleShow('parent')} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {show.parent ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          <button type="submit"
            style={{ background: 'var(--accent-purple)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', fontSize: '16px', marginTop: '16px', cursor: 'pointer', boxShadow: 'var(--shadow-neon-purple)', transition: 'all 0.2s' }}>
            Create Account
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '24px 0 16px' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '500' }}>or continue with</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
        </div>

        {/* Social buttons with real brand SVG logos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>

          {/* Google */}
          <button onClick={() => oauthRedirect('google')}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '11px 16px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', width: '100%', color: '#fff', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Facebook */}
          <button onClick={() => oauthRedirect('facebook')}
            style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '11px 16px', borderRadius: '10px', background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.25)', cursor: 'pointer', width: '100%', color: '#fff', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(24,119,242,0.16)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(24,119,242,0.08)'}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="12" fill="#1877F2"/>
              <path fill="white" d="M16.67 15.5l.44-2.85h-2.73v-1.85c0-.78.38-1.54 1.6-1.54h1.24V6.8s-1.12-.19-2.2-.19c-2.24 0-3.71 1.36-3.71 3.82v2.22H8.89V15.5h2.42V22.8c.49.07.98.11 1.49.11s1-.04 1.49-.11V15.5h2.38z"/>
            </svg>
            Continue with Facebook
          </button>

        </div>

        <p style={{ textAlign: 'center', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already registered?{' '}
          <Link to="/login" style={{ color: 'var(--accent-purple)', textDecoration: 'none', fontWeight: '600' }}>Sign In here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
