import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Shield, User, Lock, Mail, Key, Eye, EyeOff } from 'lucide-react';

const Signup = () => {
  const { register, user } = useAuth();
  const [formData, setFormData] = useState({ fullName: '', email: '', password: '', confirmPassword: '', parentControlPassword: '' });
  const [showParentPass, setShowParentPass] = useState(false);
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/dashboard" />;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if(formData.password !== formData.confirmPassword) return setError("Passwords do not match");
    if(!formData.parentControlPassword) return setError("Parent Control Password is required");
    setError('');
    setShowConfirmModal(true); // Open confirmation modal instead of instant submit
  };

  const confirmRegistration = async () => {
    try {
      await register(formData);
    } catch (err) {
      setError(err.message);
      setShowConfirmModal(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '40px 20px' }}>
      
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', width: '100%', maxWidth: '440px', textAlign: 'center' }}>
            <Shield size={48} color="var(--accent-purple)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '8px' }}>Confirm Your Details</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Please double-check the information below before finalizing.</p>
            
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '12px', textAlign: 'left', marginBottom: '24px', border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Full Name</span>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{formData.fullName}</div>
              </div>
              <div style={{ marginBottom: '12px' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Email Address</span>
                <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{formData.email}</div>
              </div>
              <div style={{ padding: '8px', background: 'rgba(176, 38, 255, 0.1)', borderLeft: '3px solid var(--accent-purple)', borderRadius: '4px' }}>
                <span style={{ fontSize: '12px', color: 'var(--accent-purple)', fontWeight: 'bold' }}>Important Warning:</span>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>If you lose your Parent Control Password, you will not be able to bypass local device locks. Please ensure you have memorized it.</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
               <button onClick={() => setShowConfirmModal(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}>Review Again</button>
               <button onClick={confirmRegistration} style={{ flex: 1, padding: '12px', background: 'var(--accent-purple)', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer', boxShadow: 'var(--shadow-neon-purple)' }}>Confirm & Create</button>
            </div>
          </div>
        </div>
      )}

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
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
                <input 
                  type={showLoginPass ? "text" : "password"} 
                  name="password" required onChange={handleChange} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 40px 12px 40px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} 
                  placeholder="••••••••" 
                />
                <div onClick={() => setShowLoginPass(!showLoginPass)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showLoginPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--text-secondary)' }}>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
                <input 
                  type={showConfirmPass ? "text" : "password"} 
                  name="confirmPassword" required onChange={handleChange} 
                  style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', padding: '12px 40px 12px 40px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} 
                  placeholder="••••••••" 
                />
                <div onClick={() => setShowConfirmPass(!showConfirmPass)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>
                  {showConfirmPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '8px', padding: '16px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>
            <label style={{ display: 'block', fontSize: '13px', marginBottom: '8px', color: 'var(--accent-purple)', fontWeight: '600' }}>Parent Control Password</label>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>This separate password is required to unlock the child device lock screen and override restrictions.</p>
            <div style={{ position: 'relative' }}>
              <Key size={16} color="var(--accent-purple)" style={{ position: 'absolute', top: '14px', left: '16px' }} />
              <input 
                type={showParentPass ? "text" : "password"} 
                name="parentControlPassword" 
                required onChange={handleChange} 
                style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(176, 38, 255, 0.3)', padding: '12px 44px 12px 44px', borderRadius: '8px', color: '#fff', fontSize: '14px', outline: 'none' }} 
                placeholder="Secure Override PIN/Password" 
              />
              <div 
                onClick={() => setShowParentPass(!showParentPass)} 
                style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showParentPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
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
