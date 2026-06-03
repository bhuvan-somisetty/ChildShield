import React, { useState } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, Info, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  requirePin = false,
  isDestructive = false,
}) => {
  const { token } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requirePin) {
      if (!pin) {
        setError('Parent Control PIN/Password is required.');
        return;
      }
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/auth/verify-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ parentControlPassword: pin })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setError('');
          onConfirm();
          setPin('');
        } else {
          setError(data.error || 'Incorrect Parent Control Password/PIN.');
        }
      } catch (err) {
        setError('Failed to connect to server.');
      } finally {
        setLoading(false);
      }
    } else {
      onConfirm();
    }
  };

  const accentColor = isDestructive ? '#ef4444' : '#2563eb';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(12px)',
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
    }}>
      <div style={{
        background: 'rgba(15, 23, 42, 0.95)',
        border: `1px solid ${isDestructive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`,
        padding: '32px 28px',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        boxShadow: `0 20px 50px rgba(${isDestructive ? '239, 68, 68' : '37, 99, 235'}, 0.15)`,
        boxSizing: 'border-box',
        backdropFilter: 'blur(20px)',
      }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: isDestructive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(37, 99, 235, 0.1)',
          border: `2px solid ${isDestructive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(37, 99, 235, 0.3)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
        }}>
          {isDestructive ? (
            <AlertTriangle size={28} color="#ef4444" />
          ) : (
            <Info size={28} color="#2563eb" />
          )}
        </div>

        <h3 style={{
          color: '#fff',
          fontSize: '20px',
          fontWeight: '800',
          marginBottom: '8px',
          letterSpacing: '-0.3px',
        }}>{title}</h3>

        <p style={{
          color: '#94a3b8',
          fontSize: '14px',
          lineHeight: '1.6',
          marginBottom: requirePin ? '16px' : '28px',
        }}>{message}</p>

        {requirePin && (
          <div style={{ marginBottom: '24px', textAlign: 'left' }}>
            <label style={{
              display: 'block',
              fontSize: '12px',
              fontWeight: '600',
              color: '#94a3b8',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>Parent PIN / Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} color="#475569" style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
              }} />
              <input
                type="password"
                placeholder="Enter parent control PIN/password"
                value={pin}
                onChange={e => {
                  setPin(e.target.value);
                  setError('');
                }}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  padding: '12px 16px 12px 40px',
                  borderRadius: '10px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                }}
              />
            </div>
            {error && (
              <div style={{
                color: '#ef4444',
                fontSize: '12px',
                marginTop: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                padding: '6px 10px',
                borderRadius: '6px',
                border: '1px solid rgba(239, 68, 68, 0.15)',
              }}>{error}</div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => {
              setPin('');
              setError('');
              onClose();
            }}
            disabled={loading}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              padding: '12px',
              borderRadius: '10px',
              color: '#cbd5e1',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            style={{
              flex: 1,
              background: accentColor,
              border: 'none',
              padding: '12px',
              borderRadius: '10px',
              color: '#fff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '14px',
              transition: 'opacity 0.2s',
              opacity: loading ? 0.7 : 1,
              boxShadow: `0 4px 12px ${accentColor}33`,
            }}
          >
            {loading ? 'Verifying...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
