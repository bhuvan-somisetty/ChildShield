import React, { useState } from 'react';
import { Lock, ShieldAlert, Key, Loader2, CheckCircle } from 'lucide-react';

const SessionLockOverlay = ({ reason, childId }) => {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    if (!password) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/device/unlock-device-child', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, parentPassword: password })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess(true);
        // The parent component (ChildDeviceView) should be polling and will see deviceState === 'active' soon
        // Or we can manually trigger a reload
        setTimeout(() => window.location.reload(), 1500);
      } else {
        setError(data.error || 'Incorrect password');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lock-overlay">
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', opacity: 0.1 }}>
        <ShieldAlert size={300} color="var(--accent-red)" />
      </div>
      
      <div className="animate-slide-up" style={{ textAlign: 'center', zIndex: 10, padding: '24px', width: '100%', maxWidth: '400px' }}>
        <div style={{ width: '100px', height: '100px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '50%', border: '2px solid var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: 'var(--shadow-neon-red)', animation: 'glow-pulse-red 2s infinite' }}>
          <Lock size={48} color="var(--accent-red)" />
        </div>
        
        <h1 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff', marginBottom: '16px' }} className="text-glow-red">
          SESSION LOCKED
        </h1>
        
        <p style={{ fontSize: '16px', color: 'var(--text-secondary)', margin: '0 auto 32px', lineHeight: 1.5 }}>
          {reason || 'This device has been locked by the supervised parental control system.'}
        </p>

        {success ? (
          <div style={{ padding: '24px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <CheckCircle size={32} color="#10b981" />
            <div style={{ color: '#10b981', fontWeight: '700', fontSize: '18px' }}>Device Unlocked!</div>
            <div style={{ color: '#94a3b8', fontSize: '14px' }}>Restoring session...</div>
          </div>
        ) : (
          <form onSubmit={handleUnlock} style={{ padding: '24px', background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ fontSize: '13px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px', fontWeight: '700' }}>
              Parent Override
            </div>
            
            {error && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', border: '1px solid rgba(239,68,68,0.2)' }}>{error}</div>}
            
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <Key size={18} color="#64748b" style={{ position: 'absolute', left: '16px', top: '14px' }} />
              <input 
                type="password" 
                placeholder="Parent Control Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '14px 16px 14px 44px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
            
            <button 
              type="submit" 
              disabled={!password || loading}
              style={{ width: '100%', padding: '14px', background: !password || loading ? 'rgba(255,255,255,0.1)' : '#ef4444', color: !password || loading ? '#94a3b8' : '#fff', border: 'none', borderRadius: '12px', fontWeight: '700', fontSize: '15px', cursor: !password || loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}
            >
              {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={18} />}
              {loading ? 'Verifying...' : 'Unlock Device'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SessionLockOverlay;
