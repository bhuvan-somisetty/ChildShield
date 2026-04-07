import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Shield, Lock, Mail } from 'lucide-react';

const Login = () => {
  const { login, user, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (loading) return <div>Loading...</div>;
  if (user) return <Navigate to="/" />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      {/* Background Ambience */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'var(--accent-purple)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'var(--accent-cyan)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }}></div>

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '40px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))', marginBottom: '16px', boxShadow: 'var(--shadow-neon-cyan)' }}>
            <Shield size={32} color="#fff" />
          </div>
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Welcome Back</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Log in to your parent dashboard</p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px 12px 44px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} placeholder="parent@example.com" />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '14px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px 12px 44px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} placeholder="••••••••" />
            </div>
          </div>

          <button type="submit" style={{ background: 'var(--accent-cyan)', color: '#000', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', fontSize: '16px', marginTop: '8px', cursor: 'pointer', boxShadow: 'var(--shadow-neon-cyan)', transition: 'all 0.2s' }}>
            Sign In
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Don't have an account? <Link to="/signup" style={{ color: 'var(--accent-cyan)', textDecoration: 'none' }}>Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
