import React from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

const SessionLockOverlay = ({ reason }) => {
  return (
    <div className="lock-overlay">
      <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', opacity: 0.1 }}>
        <ShieldAlert size={300} color="var(--accent-red)" />
      </div>
      
      <div className="animate-slide-up" style={{ textAlign: 'center', zIndex: 10, padding: '24px' }}>
        <div style={{ width: '100px', height: '100px', background: 'rgba(239, 68, 68, 0.15)', borderRadius: '50%', border: '2px solid var(--accent-red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px', boxShadow: 'var(--shadow-neon-red)', animation: 'glow-pulse-red 2s infinite' }}>
          <Lock size={48} color="var(--accent-red)" />
        </div>
        
        <h1 style={{ fontSize: '42px', fontWeight: '800', letterSpacing: '-0.02em', color: '#fff', marginBottom: '16px' }} className="text-glow-red">
          SESSION LOCKED
        </h1>
        
        <p style={{ fontSize: '18px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto 40px', lineHeight: 1.5 }}>
          {reason || 'This device has been locked by the supervised parental control system.'}
        </p>

        <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', display: 'inline-block' }}>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Required Action</span>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#fff', marginTop: '4px' }}>
            Only a Parent Control Password can unlock this session.
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionLockOverlay;
