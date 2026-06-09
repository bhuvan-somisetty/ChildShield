/**
 * OAuthCallback.jsx
 * ALWAYS routes: Google Login → Password Setup → Controls
 * Never goes to dashboard directly (unless PIN already set).
 */
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Shield, AlertCircle, Loader2 } from 'lucide-react';
import { Screen } from '../../components/ui';

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
        localStorage.removeItem('child_session');
        localStorage.removeItem('cs_active_child');
        loginWithToken(token, user);
        if (user.needsPasswordSetup) navigate('/setup-password', { replace: true });
        else navigate('/controls', { replace: true });
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
    <Screen ambient="brand" align="center" scroll={false}>
      <div className="flex flex-col items-center text-center gap-5">
        {error ? (
          <>
            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center">
              <AlertCircle size={30} className="text-rose-400" />
            </div>
            <div className="text-rose-300 text-[15px] font-bold max-w-[320px]">{error}</div>
            <div className="text-slate-500 text-[13px]">Redirecting to login…</div>
          </>
        ) : (
          <>
            <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-blue-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(37,99,235,0.3)]">
              <Shield size={34} className="text-cyan-400" />
              <Loader2 size={84} className="absolute text-blue-500/30 animate-spin" />
            </div>
            <div className="text-white text-[17px] font-extrabold">Signing you in…</div>
            <div className="text-slate-500 text-[13px]">Securing your AlphaGuard session</div>
          </>
        )}
      </div>
    </Screen>
  );
};

export default OAuthCallback;
