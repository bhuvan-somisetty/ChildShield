import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link, useSearchParams } from 'react-router-dom';
import { Shield, Lock, Mail, Eye, EyeOff } from 'lucide-react';

const BACKEND = '';
// /auth/* is unprotected — bypasses api.js global auth middleware
const oauthRedirect = (provider) => { window.location.href = `${BACKEND}/auth/${provider}`; };

const Login = () => {
  const { login, user, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Read ?error= from OAuth redirect-back
  const oauthErrorMap = {
    facebook_not_configured: '⚠️ Facebook login needs setup — add your FACEBOOK_APP_ID to backend/.env',
    twitter_not_configured:  '⚠️ X (Twitter) login needs setup — add your TWITTER_CONSUMER_KEY to backend/.env',
    facebook_failed: 'Facebook login failed. Check your App ID & redirect URI in Facebook Developers.',
    twitter_failed:  'X (Twitter) login failed. Check your API Key & callback URL in Twitter Developer Portal.',
    google_failed:   'Google login failed. Check your Client ID & redirect URI in Google Cloud Console.',
    oauth_failed:    'Social login failed. Please try again or use email login.',
  };
  const urlError    = searchParams.get('error');
  const initialErr  = urlError ? (oauthErrorMap[urlError] || `Login error: ${urlError}`) : '';
  const [error, setError] = useState(initialErr);

  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/dashboard" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError('');
    try { await login(email, password); }
    catch (err) { setError(err.message || 'Login failed. Please try again.'); }
    finally { setSubmitting(false); }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      {/* Original ambience blobs */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'var(--accent-purple)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'var(--accent-cyan)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }} />

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '40px', position: 'relative', zIndex: 1 }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', marginBottom: '16px', boxShadow: 'var(--shadow-neon-cyan)' }}>
            <Shield size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Log in to your parent dashboard</p>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        {/* Form — autoComplete="off" + hidden decoys stop browser from pre-filling saved passwords */}
        <form onSubmit={handleSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Hidden honeypot inputs — tricks Chrome/Edge into filling these instead */}
          <input type="text"     style={{ display: 'none' }} autoComplete="username"         tabIndex="-1" readOnly />
          <input type="password" style={{ display: 'none' }} autoComplete="current-password" tabIndex="-1" readOnly />

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                autoComplete="off"
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px 12px 44px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                placeholder="parent@example.com" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
              <input type={showPass ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                autoComplete="new-password"
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 40px 12px 44px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }}
                placeholder="••••••••" />
              <div onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          <button type="submit" disabled={submitting}
            style={{ background: 'var(--accent-cyan)', color: '#000', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', fontSize: '16px', marginTop: '8px', cursor: 'pointer', boxShadow: 'var(--shadow-neon-cyan)', transition: 'all 0.2s', opacity: submitting ? 0.7 : 1 }}>
            {submitting ? 'Signing in…' : 'Sign In'}
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
          Don't have an account?{' '}
          <Link to="/signup" style={{ color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: '600' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
