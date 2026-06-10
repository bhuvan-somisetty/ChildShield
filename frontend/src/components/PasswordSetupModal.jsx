import React, { useState } from 'react';
import { Lock, ShieldCheck, Eye, EyeOff, AlertTriangle } from 'lucide-react';

const PasswordSetupModal = ({ onComplete }) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (password.length < 4) {
      setError('Password must be at least 4 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('cs_token');
      const res = await fetch('/api/auth/set-control-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ parentControlPassword: password })
      });
      const data = await res.json();
      if (data.success) {
        onComplete();
      } else {
        setError(data.error || 'Failed to set password');
      }
    } catch {
      setError('Network error. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
    }}>
      <div style={{ position: 'fixed', top: '15%', left: '20%', width: '400px', height: '400px', background: '#2563eb', filter: 'blur(160px)', opacity: 0.08, borderRadius: '50%' }} />
      
      <div className="animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '40px 32px', position: 'relative', zIndex: 1, background: '#12121c', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '28px', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: '0 12px 48px rgba(0,0,0,0.4)' }}>
        {/* Icon */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(37,99,235,0.3)' }}>
            <ShieldCheck size={40} color="#2563eb" />
          </div>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>
          Set Parent Control Password
        </h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px' }}>
          Since you signed in with Google, you need to set a <strong style={{ color: '#2563eb' }}>Parent Control Password</strong>. 
          This is used to protect critical actions like child device logout, app unlocking, and security overrides.
        </p>

        {/* Warning */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px 16px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '12px', marginBottom: '20px' }}>
          <AlertTriangle size={16} color="#f59e0b" style={{ marginTop: '2px', flexShrink: 0 }} />
          <span style={{ fontSize: '12px', color: '#f59e0b', lineHeight: 1.6 }}>
            Remember this password! Without it, children cannot log out and you cannot unlock apps. This is separate from your Google password.
          </span>
        </div>

        {/* Password fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
          <div style={{ position: 'relative' }}>
            <Lock size={16} color="#475569" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Enter control password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 44px 14px 40px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
            <button onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer' }}>
              {showPass ? <EyeOff size={16} color="#475569" /> : <Eye size={16} color="#475569" />}
            </button>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={16} color="#475569" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="Confirm control password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 14px 14px 40px', background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '14px', outline: 'none' }}
            />
          </div>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#ef4444', fontSize: '13px', textAlign: 'center', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !password || !confirm}
          style={{ width: '100%', padding: '16px', background: '#2563eb', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: '700', fontSize: '16px', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow: '0 4px 20px rgba(37,99,235,0.3)' }}
        >
          {loading ? 'Setting Password...' : 'Set Control Password'}
        </button>
      </div>
    </div>
  );
};

export default PasswordSetupModal;
