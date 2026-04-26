/**
 * OAuthCallback.jsx
 * ALWAYS routes: Google Login → Password Setup → Controls
 * Never goes to dashboard directly.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield } from 'lucide-react';

const OAuthCallback = () => {
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const userRaw = searchParams.get('user');
    const err = searchParams.get('error');

    if (err) {
      setError(`Social login failed: ${err.replace(/_/g, ' ')}`);
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (token && userRaw) {
      try {
        const user = JSON.parse(decodeURIComponent(userRaw));

        // Always wipe old session state on every new OAuth login
        localStorage.removeItem('child_session');
        localStorage.removeItem('cs_active_child');

        loginWithToken(token, user);

        // FLOW: Always go to password setup first. Setup page redirects to /controls.
        if (user.needsPasswordSetup) {
          navigate('/setup-password', { replace: true });
        } else {
          // Returning user with password already set
          navigate('/controls', { replace: true });
        }
      } catch {
        setError('Invalid login response. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    } else {
      setError('No token received. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      height: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-primary)', gap: '20px'
    }}>
      {error ? (
        <>
          <div style={{ color: 'var(--accent-red)', fontSize: '16px', textAlign: 'center', maxWidth: '360px' }}>
            ⚠️ {error}
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Redirecting to login…</div>
        </>
      ) : (
        <>
          <div style={{
            width: '64px', height: '64px', borderRadius: '18px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'pulse 1.2s ease-in-out infinite'
          }}>
            <Shield size={32} color="#fff" />
          </div>
          <div style={{ color: '#fff', fontSize: '18px', fontWeight: '700' }}>Signing you in…</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Please wait</div>
        </>
      )}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.85; }
        }
      `}</style>
    </div>
  );
};

export default OAuthCallback;
