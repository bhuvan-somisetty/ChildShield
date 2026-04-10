import React, { useState } from 'react';
import { User, Shield, Lock, Key, Mail, Eye, EyeOff, X, ArrowLeftCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ProfileSettingsModal = ({ onClose }) => {
  const { user, token } = useAuth();
  
  const [view, setView] = useState('main'); // 'main' | 'otp'
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Normal Password Flow
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // OTP Bypass Flow
  const [otpMode, setOtpMode] = useState('request'); // 'request' | 'verify'
  const [otpCode, setOtpCode] = useState('');

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) return setError('New passwords do not match!');
    if (!oldPass || !newPass) return setError('All fields required');
    setError(''); setSuccess(''); setIsLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass })
      });
      const data = await res.json();
      if(res.ok && data.success) {
        setSuccess('Password updated successfully!');
        setOldPass(''); setNewPass(''); setConfirmPass('');
      } else {
        setError(data.error || 'Failed to update');
      }
    } catch(err) { setError(err.message); }
    setIsLoading(false);
  };

  const handleSendOTP = async () => {
    // In production this triggers Twilio/SendGrid API
    setIsLoading(true);
    setTimeout(() => {
       setOtpMode('verify');
       setError('');
       setSuccess('A mock OTP has been dispatched to your registered phone/email. (Any 6 digit code works)');
       setIsLoading(false);
    }, 1000);
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) return setError('OTP must be 6 digits');
    if (newPass !== confirmPass) return setError('New passwords do not match');
    setError(''); setSuccess(''); setIsLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ otp: otpCode, newPassword: newPass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Security overridden. Password updated.');
        setTimeout(() => { setView('main'); setSuccess(''); }, 2000);
      } else setError(data.error);
    } catch(err) { setError(err.message); }
    setIsLoading(false);
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', padding: '32px', position: 'relative', backgroundColor: 'rgba(15, 15, 20, 0.98)', boxShadow: '0 0 50px rgba(0,0,0,0.8)' }}>
        
        <button onClick={onClose} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', zIndex: 10 }}>
          <X size={24} />
        </button>

        {view === 'main' ? (
          <>
            <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield color="var(--accent-cyan)" /> Account Settings
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>Manage your profile credentials.</p>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                 <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                   <User size={24} color="#fff" />
                 </div>
                 <div>
                   <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#fff' }}>{user?.fullName || 'Authorized Parent'}</div>
                   <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.email}</div>
                 </div>
              </div>
            </div>

            <h3 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Change Login Password</h3>
            
            {error && <div style={{ color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
            {success && <div style={{ color: 'var(--accent-green)', background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{success}</div>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
              <div style={{ position: 'relative' }}>
                <Key size={16} color="var(--text-muted)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
                <input type={showOld ? 'text' : 'password'} placeholder="Old Password" value={oldPass} onChange={e=>setOldPass(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 40px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                <div onClick={() => setShowOld(!showOld)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>{showOld ? <EyeOff size={16} /> : <Eye size={16} />}</div>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--accent-cyan)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
                <input type={showNew ? 'text' : 'password'} placeholder="New Password" value={newPass} onChange={e=>setNewPass(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.3)', padding: '10px 40px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                <div onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</div>
              </div>

              <div style={{ position: 'relative' }}>
                <Lock size={16} color="var(--accent-cyan)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
                <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm New Password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.3)', padding: '10px 40px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                <div onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  title="Go Back" 
                  onClick={onClose} 
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '44px', height: '44px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <ArrowLeftCircle size={24} />
                </button>
                <div onClick={() => { setView('otp'); setError(''); setSuccess(''); }} style={{ fontSize: '13px', color: 'var(--accent-purple)', cursor: 'pointer', textDecoration: 'underline' }}>
                  Forgot Old Password?
                </div>
              </div>
              <button disabled={isLoading} onClick={handleChangePassword} style={{ background: 'var(--accent-cyan)', color: '#000', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                {isLoading ? 'Saving...' : 'Update Password'}
              </button>
            </div>
          </>
        ) : (
          <div className="animate-fade-in">
             <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Mail color="var(--accent-purple)" /> Security Gateway
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '24px' }}>Verify your identity via 2-Factor Authentication.</p>

            {error && <div style={{ color: 'var(--accent-red)', background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}
            {success && <div style={{ color: 'var(--accent-green)', background: 'rgba(16, 185, 129, 0.1)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>{success}</div>}

            {otpMode === 'request' ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                 <div style={{ border: '1px dashed var(--accent-purple)', padding: '24px', borderRadius: '12px', background: 'rgba(176,38,255,0.05)', marginBottom: '24px' }}>
                   A 6-digit verification code will be dispatched to <strong>{user?.email}</strong>.
                 </div>
                 <button disabled={isLoading} onClick={handleSendOTP} style={{ width: '100%', background: 'var(--accent-purple)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                  {isLoading ? 'Dispatching Payload...' : 'Send Verification OTP'}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <input type="text" placeholder="Enter 6-Digit OTP" maxLength={6} value={otpCode} onChange={e=>setOtpCode(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid var(--accent-purple)', padding: '16px', borderRadius: '8px', color: '#fff', fontSize: '20px', letterSpacing: '8px', textAlign: 'center', outline: 'none' }} />
                
                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--accent-purple)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
                  <input type={showNew ? 'text' : 'password'} placeholder="New Application Password" value={newPass} onChange={e=>setNewPass(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(176,38,255,0.3)', padding: '12px 40px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                  <div onClick={() => setShowNew(!showNew)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>{showNew ? <EyeOff size={16} /> : <Eye size={16} />}</div>
                </div>

                <div style={{ position: 'relative' }}>
                  <Lock size={16} color="var(--accent-purple)" style={{ position: 'absolute', top: '12px', left: '16px' }} />
                  <input type={showConfirm ? 'text' : 'password'} placeholder="Confirm New Password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(176,38,255,0.3)', padding: '12px 40px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
                  <div onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}>{showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}</div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                  <button 
                    title="Go Back" 
                    onClick={() => { setView('main'); setOtpMode('request'); setError(''); setSuccess(''); }} 
                    style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', width: '48px', height: '48px', borderRadius: '50%', cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.background = 'var(--bg-primary)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <ArrowLeftCircle size={24} />
                  </button>
                  <button disabled={isLoading} onClick={handleVerifyOTP} style={{ flexGrow: 1, background: 'var(--accent-purple)', color: '#fff', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                    {isLoading ? 'Verifying...' : 'Bypass & Save Password'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default ProfileSettingsModal;
