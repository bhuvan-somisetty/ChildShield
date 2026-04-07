import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Shield, User, Lock, Mail, Key } from 'lucide-react';

const Signup = () => {
  const { register, user } = useAuth();
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '', parentControlPassword: '' });
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" />;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(formData.password !== formData.confirmPassword) return setError("Passwords do not match");
    if(!formData.parentControlPassword) return setError("Parent Control Password is required");
    try {
      await register(formData);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '40px 20px' }}>
      
      <div style={{ position: 'absolute', top: '-10%', left: '50%', width: '600px', height: '600px', background: 'var(--accent-purple)', filter: 'blur(200px)', opacity: 0.15, borderRadius: '50%', transform: 'translateX(-50%)' }}></div>

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '40px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Shield size={40} color="var(--accent-cyan)" style={{ marginBottom: '16px', filter: 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.5))' }} />
          <h2 style={{ fontSize: '28px', fontWeight: '700' }}>Create Account</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px' }}>Start protecting your child's digital life</p>
        </div>

        {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '24px', fontSize: '14px', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
              <input type="text" name="fullName" required onChange={handleChange} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px 12px 44px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} placeholder="John Doe" />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Email Address</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
              <input type="email" name="email" required onChange={handleChange} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px 12px 44px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} placeholder="parent@example.com" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Login Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
                <input type="password" name="password" required onChange={handleChange} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px 12px 40px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} placeholder="••••••••" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
                <input type="password" name="confirmPassword" required onChange={handleChange} style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 16px 12px 40px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} placeholder="••••••••" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: '8px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--accent-purple)', fontWeight: '600' }}>Parent Control Password</label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>This separate password is required to unlock the child device lock screen and override restrictions.</p>
            <div style={{ position: 'relative' }}>
              <Key size={16} color="var(--accent-purple)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
              <input type="password" name="parentControlPassword" required onChange={handleChange} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(176, 38, 255, 0.3)', padding: '12px 16px 12px 44px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} placeholder="Secure Override PIN/Password" />
            </div>
          </div>

          <button type="submit" style={{ background: 'var(--accent-purple)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: '600', fontSize: '16px', marginTop: '16px', cursor: 'pointer', boxShadow: 'var(--shadow-neon-purple)', transition: 'all 0.2s' }}>
            Create Account
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: 'var(--text-muted)' }}>
          Already registered? <Link to="/login" style={{ color: 'var(--accent-purple)', textDecoration: 'none' }}>Sign In here</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;
