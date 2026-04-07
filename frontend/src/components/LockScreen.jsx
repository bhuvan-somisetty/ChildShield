import React, { useState } from 'react';
import { Lock, ShieldAlert, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const LockScreen = ({ onUnlock }) => {
  const { token, activeChild } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-parent-lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if(data.success) {
        onUnlock();
      } else {
        setError(data.error || 'Invalid password');
      }
    } catch(err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999,
      background: 'rgba(15, 15, 23, 0.95)', backdropFilter: 'blur(20px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.5s ease-out'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '400px', width: '100%', padding: '40px' }}>
        <div style={{ 
          width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px',
          boxShadow: '0 0 30px rgba(239, 68, 68, 0.3)', border: '2px solid rgba(239, 68, 68, 0.5)',
          animation: 'pulse 2s infinite'
        }}>
          <Lock size={40} color="var(--accent-red)" />
        </div>
        
        <h1 style={{ fontSize: '32px', marginBottom: '8px', color: 'var(--accent-red)' }}>Device Locked</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px', fontSize: '16px' }}>
          {activeChild?.name}'s daily screen limit has been reached, or the device was remotely locked.
        </p>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>{error}</div>}

        <form onSubmit={handleUnlock}>
          <div style={{ position: 'relative', marginBottom: '24px' }}>
            <Key size={20} color="var(--text-muted)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
            <input 
              type="password" required value={password} onChange={e => setPassword(e.target.value)}
              placeholder="Parent Control Password"
              style={{
                width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(176, 38, 255, 0.4)',
                padding: '14px 16px 14px 48px', borderRadius: '12px', color: '#fff', fontSize: '16px', outline: 'none',
                boxShadow: 'inset 0 0 10px rgba(176, 38, 255, 0.1)'
              }}
            />
          </div>
          
          <button type="submit" disabled={loading} style={{
            width: '100%', background: 'var(--accent-purple)', color: '#fff', border: 'none',
            padding: '16px', borderRadius: '12px', fontSize: '16px', fontWeight: '600', cursor: 'pointer',
            boxShadow: '0 0 20px rgba(176, 38, 255, 0.4)', transition: 'all 0.3s'
          }}>
            {loading ? 'Verifying...' : 'Unlock Device Session'}
          </button>
        </form>

        <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '14px' }}>
          <ShieldAlert size={16} /> Restricted Mode Active
        </div>

        <style>{`
          @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 30px rgba(239, 68, 68, 0.3); }
            50% { transform: scale(1.05); box-shadow: 0 0 50px rgba(239, 68, 68, 0.5); }
            100% { transform: scale(1); box-shadow: 0 0 30px rgba(239, 68, 68, 0.3); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default LockScreen;
