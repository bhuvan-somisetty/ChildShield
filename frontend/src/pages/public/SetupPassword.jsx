/**
 * SetupPassword.jsx
 * Standalone page shown after every new Google/OAuth login.
 * Forces user to set a Parent Control Password before accessing the app.
 * On success â†’ navigates to /controls.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
    if (user && !user.needsPasswordSetup) {
      navigate('/controls', { replace: true });
    }
    if (!user && !token && !localStorage.getItem('cs_token')) {
      navigate('/login', { replace: true });
    }
  }, [user, token, navigate]);

  const strength = password.length === 0 ? 0
    : password.length < 5 ? 1
    : password.length < 8 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
    : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][strength];

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
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', padding: '20px', position: 'relative', overflow: 'hidden'
    }}>
      {/* Ambient blobs */}
      <div style={{ position: 'fixed', top: '10%', left: '5%', width: '350px', height: '350px', background: '#2563eb', filter: 'blur(140px)', opacity: 0.1, borderRadius: '50%', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '10%', right: '5%', width: '350px', height: '350px', background: '#2563eb', filter: 'blur(140px)', opacity: 0.08, borderRadius: '50%', pointerEvents: 'none' }} />

      <div className="glass-panel animate-fade-in" style={{
        width: '100%', maxWidth: '460px', padding: '40px 32px',
        position: 'relative', zIndex: 1
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '50%',
            background: 'rgba(37,99,235,0.12)', border: '2px solid rgba(37,99,235,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
            boxShadow: '0 0 30px rgba(37,99,235,0.2)'
          }}>
            <ShieldCheck size={40} color="#2563eb" />
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '10px', letterSpacing: '-0.5px' }}>
            Set Your Control Password
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.7, maxWidth: '340px', margin: '0 auto' }}>
            This <strong style={{ color: '#2563eb' }}>Parent Control Password</strong> protects critical actions â€” child device logout, app unlocking, and security overrides. It is separate from your Google password.
          </p>
        </div>

        {/* Warning */}
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px',
          background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)',
          borderRadius: '12px', marginBottom: '24px'
        }}>
          <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: '1px', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#f59e0b', lineHeight: 1.6 }}>
            Remember this password! Children cannot log out without it and you cannot unlock apps without it.
          </span>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
          {/* Password */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Control Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#475569" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Min. 4 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && document.getElementById('confirm-input')?.focus()}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 44px 14px 42px',
                  background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(37,99,235,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength meter */}
            {password.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '4px' }}>
                  {[1,2,3,4].map(i => (
                    <div key={i} style={{ flex: 1, height: '3px', borderRadius: '3px', background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)', transition: 'all 0.3s' }} />
                  ))}
                </div>
                <span style={{ fontSize: '11px', color: strengthColor, fontWeight: '600' }}>{strengthLabel}</span>
              </div>
            )}
          </div>

          {/* Confirm */}
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Confirm Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#475569" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                id="confirm-input"
                type={showConfirm ? 'text' : 'password'}
                placeholder="Repeat your password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '14px 44px 14px 42px',
                  background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', color: 'var(--text-primary)', fontSize: '15px', outline: 'none',
                  transition: 'border-color 0.2s'
                }}
                onFocus={e => e.target.style.borderColor = 'rgba(37,99,235,0.5)'}
                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
              />
              <button onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569' }}>
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Match indicator */}
            {confirm.length > 0 && (
              <div style={{ marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: password === confirm ? '#10b981' : '#ef4444' }}>
                {password === confirm ? <CheckCircle size={12} /> : null}
                {password === confirm ? 'Passwords match' : 'Passwords do not match'}
              </div>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !password || !confirm}
          style={{
            width: '100%', padding: '16px',
            background: loading || !password || !confirm
              ? 'rgba(37,99,235,0.3)'
              : 'linear-gradient(135deg, #2563eb, #7c3aed)',
            border: 'none', borderRadius: '14px', color: '#fff',
            fontWeight: '700', fontSize: '16px',
            cursor: loading || !password || !confirm ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: (!loading && password && confirm) ? '0 4px 20px rgba(37,99,235,0.35)' : 'none'
          }}
        >
          {loading ? 'Setting Password...' : 'Set Control Password & Continue â†’'}
        </button>
      </div>
    </div>
  );
};

export default SetupPassword;
