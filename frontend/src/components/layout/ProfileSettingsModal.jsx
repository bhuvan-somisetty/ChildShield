import React, { useState } from 'react';
import {
  User, Shield, Lock, Key, Mail, Eye, EyeOff,
  Bell, Moon, Palette, Globe, HelpCircle, MessageCircle,
  LogOut, ChevronRight, ShieldCheck, ArrowLeft, Smartphone, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// ─── Reusable Components ─────────────────────────────────────────────────────

const SettingRow = ({ icon: Icon, iconColor = '#64748b', iconBg = 'rgba(255,255,255,0.06)', label, desc, right, onClick, danger }) => (
  <button
    onClick={onClick}
    style={{
      display: 'flex', alignItems: 'center', gap: '14px',
      padding: '14px 20px', background: 'transparent', border: 'none',
      width: '100%', cursor: onClick ? 'pointer' : 'default', textAlign: 'left',
      borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.2s'
    }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
      background: danger ? 'rgba(239,68,68,0.1)' : iconBg,
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <Icon size={17} color={danger ? '#ef4444' : iconColor} />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '14px', fontWeight: '500', color: danger ? '#ef4444' : '#fff' }}>{label}</div>
      {desc && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{desc}</div>}
    </div>
    {right && <span style={{ fontSize: '12px', color: '#475569', fontWeight: '500' }}>{right}</span>}
    {onClick && !right && <ChevronRight size={15} color={danger ? '#ef4444' : '#334155'} />}
  </button>
);

const SectionCard = ({ title, children }) => (
  <div style={{ marginBottom: '20px' }}>
    {title && (
      <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '8px', paddingLeft: '4px' }}>
        {title}
      </div>
    )}
    <div style={{
      background: 'rgba(255,255,255,0.02)', borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden'
    }}>
      {children}
    </div>
  </div>
);

const InputField = ({ icon: Icon, iconColor, placeholder, value, onChange, type = 'text', right }) => (
  <div style={{ position: 'relative' }}>
    <Icon size={16} color={iconColor || '#64748b'} style={{ position: 'absolute', top: '14px', left: '14px' }} />
    <input
      type={type} placeholder={placeholder} value={value} onChange={onChange}
      autoComplete="new-password"
      style={{
        width: '100%', boxSizing: 'border-box',
        background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)',
        padding: '12px 44px', borderRadius: '10px', color: '#fff',
        fontSize: '14px', outline: 'none', transition: 'border-color 0.2s'
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(37,99,235,0.4)'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
    />
    {right}
  </div>
);

const Alert = ({ type, msg }) => {
  if (!msg) return null;
  const isErr = type === 'error';
  return (
    <div style={{
      padding: '10px 14px', borderRadius: '10px', fontSize: '13px', marginBottom: '14px',
      background: isErr ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
      color: isErr ? '#ef4444' : '#10b981',
      border: `1px solid ${isErr ? 'rgba(239,68,68,0.25)' : 'rgba(16,185,129,0.25)'}`
    }}>{msg}</div>
  );
};

// ─── Password Change View ────────────────────────────────────────────────────
const PasswordView = ({ user, token, onBack }) => {
  const [view, setView] = useState('change');
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (newPass !== confirmPass) return setError('New passwords do not match!');
    if (!oldPass || !newPass) return setError('All fields required');
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess('Password updated successfully!');
        setOldPass(''); setNewPass(''); setConfirmPass('');
      } else { setError(data.error || 'Failed to update'); }
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const handleSendOTP = async () => {
    setLoading(true);
    setTimeout(() => { setView('otp-verify'); setSuccess('OTP sent to ' + user?.email); setLoading(false); }, 1000);
  };

  const handleVerifyOTP = () => {
    if (otpCode !== '123456') return setError('Invalid verification code.');
    setError(''); setView('otp-reset');
  };

  const handleResetPassword = async () => {
    if (newPass !== confirmPass) return setError('Passwords do not match');
    setLoading(true); setError('');
    try {
      const res = await fetch('/api/auth/reset-password-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ otp: otpCode, newPassword: newPass })
      });
      const data = await res.json();
      if (res.ok && data.success) { setSuccess('Password reset successfully!'); setTimeout(onBack, 1800); }
      else setError(data.error || 'Reset failed');
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const EyeBtn = ({ show, toggle }) => (
    <div onClick={toggle} style={{ position: 'absolute', right: '12px', top: '14px', cursor: 'pointer', color: '#475569' }}>
      {show ? <EyeOff size={16} /> : <Eye size={16} />}
    </div>
  );

  return (
    <div>
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '13px', padding: '0 0 20px 0' }}>
        <ArrowLeft size={16} /> Back to profile
      </button>
      <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '4px' }}>
        {view === 'change' ? 'Change Password' : 'Reset via OTP'}
      </div>
      <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '20px' }}>
        {view === 'change' ? 'Enter your current password to set a new one.' : 'Verify your identity to reset your password.'}
      </div>
      <Alert type="error" msg={error} />
      <Alert type="success" msg={success} />

      {view === 'change' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}><InputField icon={Key} placeholder="Old Password" value={oldPass} onChange={e => setOldPass(e.target.value)} type={showOld ? 'text' : 'password'} right={<EyeBtn show={showOld} toggle={() => setShowOld(!showOld)} />} /></div>
          <div style={{ position: 'relative' }}><InputField icon={Lock} iconColor="#2563eb" placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)} type={showNew ? 'text' : 'password'} right={<EyeBtn show={showNew} toggle={() => setShowNew(!showNew)} />} /></div>
          <div style={{ position: 'relative' }}><InputField icon={Lock} iconColor="#2563eb" placeholder="Confirm New Password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} type={showConfirm ? 'text' : 'password'} right={<EyeBtn show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />} /></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <button onClick={() => { setView('otp'); setError(''); setSuccess(''); }} style={{ background: 'transparent', border: 'none', color: '#2563eb', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>Forgot Old Password?</button>
            <button onClick={handleChangePassword} disabled={loading} style={{ background: '#2563eb', color: '#000', border: 'none', padding: '11px 24px', borderRadius: '10px', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>{loading ? 'Saving...' : 'Update Password'}</button>
          </div>
        </div>
      )}

      {view === 'otp' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ border: '1px dashed rgba(37,99,235,0.4)', padding: '20px', borderRadius: '12px', background: 'rgba(37,99,235,0.05)', marginBottom: '20px', color: '#94a3b8', fontSize: '14px', lineHeight: 1.6 }}>
            A 6-digit code will be sent to <strong style={{ color: '#fff' }}>{user?.email}</strong>
          </div>
          <button onClick={handleSendOTP} disabled={loading} style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>{loading ? 'Sending...' : 'Send Verification OTP'}</button>
        </div>
      )}

      {view === 'otp-verify' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input placeholder="Enter 6-digit OTP" maxLength={6} value={otpCode} onChange={e => setOtpCode(e.target.value)}
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(37,99,235,0.4)', padding: '16px', borderRadius: '10px', color: '#fff', fontSize: '22px', letterSpacing: '10px', textAlign: 'center', outline: 'none' }} />
          <button onClick={handleVerifyOTP} disabled={loading} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>Verify OTP</button>
        </div>
      )}

      {view === 'otp-reset' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ position: 'relative' }}><InputField icon={Lock} iconColor="#2563eb" placeholder="New Password" value={newPass} onChange={e => setNewPass(e.target.value)} type={showNew ? 'text' : 'password'} right={<EyeBtn show={showNew} toggle={() => setShowNew(!showNew)} />} /></div>
          <div style={{ position: 'relative' }}><InputField icon={Lock} iconColor="#2563eb" placeholder="Confirm New Password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} type={showConfirm ? 'text' : 'password'} right={<EyeBtn show={showConfirm} toggle={() => setShowConfirm(!showConfirm)} />} /></div>
          <button onClick={handleResetPassword} disabled={loading} style={{ background: '#2563eb', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: '700', cursor: 'pointer', marginTop: '4px' }}>{loading ? 'Resetting...' : 'Reset & Save Password'}</button>
        </div>
      )}
    </div>
  );
};

// ─── Main Profile Side Panel ─────────────────────────────────────────────────
const ProfileSettingsModal = ({ onClose }) => {
  const { user, token, logout } = useAuth();
  const [view, setView] = useState('profile');

  const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

  return (
    <>
      {/* Backdrop "” light dimming only, dashboard stays visible on left */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.35)',
          zIndex: 9998, animation: 'fadeIn 0.2s ease'
        }}
      />

      {/* Right-half panel "” exactly 50% of screen width */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0,
        width: '50vw',
        background: 'linear-gradient(180deg, #0d1117 0%, #0a0f1a 100%)',
        borderLeft: '1px solid rgba(255,255,255,0.1)',
        boxShadow: '-24px 0 60px rgba(0,0,0,0.6)',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        animation: 'slideInRight 0.28s cubic-bezier(0.16,1,0.3,1)'
      }}>
        {/* ── Header bar ────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '12px',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0
        }}>
          <button
            onClick={view === 'password' ? () => setView('profile') : onClose}
            style={{
              width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: '#94a3b8', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s', flexShrink: 0
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <ArrowLeft size={17} />
          </button>
          <span style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>
            {view === 'password' ? 'Security' : 'Account Settings'}
          </span>
          <button
            onClick={onClose}
            style={{
              marginLeft: 'auto', width: '34px', height: '34px', borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              color: '#64748b', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Scrollable content ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 20px' }}>

          {view === 'password' ? (
            <PasswordView user={user} token={token} onBack={() => setView('profile')} />
          ) : (
            <>
              {/* Profile Hero */}
              <div style={{ textAlign: 'center', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: '24px' }}>
                <div style={{
                  width: '76px', height: '76px', borderRadius: '50%', margin: '0 auto 12px',
                  background: 'linear-gradient(135deg, #052659, #1e40af)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '26px', fontWeight: '900', color: '#C1E8FF',
                  border: '2px solid rgba(37,99,235,0.2)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
                }}>
                  {initials(user?.fullName)}
                </div>
                <div style={{ fontSize: '18px', fontWeight: '800', color: '#fff', marginBottom: '3px' }}>
                  {user?.fullName || 'Parent Account'}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '12px' }}>{user?.email}</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 14px', borderRadius: '20px', background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.2)' }}>
                  <ShieldCheck size={12} color="#2563eb" />
                  <span style={{ fontSize: '11px', color: '#2563eb', fontWeight: '700' }}>Protected Account</span>
                </div>
              </div>

              {/* Account */}
              <SectionCard title="Account">
                <SettingRow icon={User} iconColor="#3b82f6" iconBg="rgba(59,130,246,0.1)" label="Manage Profile" desc="Update your name and email" onClick={() => {}} />
                <SettingRow icon={Key} iconColor="#2563eb" iconBg="rgba(37,99,235,0.1)" label="Password & Security" desc="Change your login password" onClick={() => setView('password')} />
                <SettingRow icon={Bell} iconColor="#f59e0b" iconBg="rgba(245,158,11,0.1)" label="Notifications" desc="Manage alerts and push notifications" onClick={() => {}} />
                <SettingRow icon={Globe} iconColor="#06b6d4" iconBg="rgba(6,182,212,0.1)" label="Language" right="English" onClick={() => {}} />
              </SectionCard>

              {/* Preferences */}
              <SectionCard title="Preferences">
                <SettingRow icon={Palette} iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.1)" label="Theme / Appearance" right="Dark" onClick={() => {}} />
                <SettingRow icon={Smartphone} iconColor="#10b981" iconBg="rgba(16,185,129,0.1)" label="Connected Devices" desc="Manage paired child devices" onClick={() => { onClose(); }} />
                <SettingRow icon={Shield} iconColor="#2563eb" iconBg="rgba(37,99,235,0.08)" label="Privacy Policy" onClick={() => {}} />
              </SectionCard>

              {/* Account Linking "” Google + Facebook only (no Twitter, no Apple) */}
              <SectionCard title="Account Linking">
                <div style={{ padding: '14px 20px' }}>
                  <div style={{ fontSize: '12px', color: '#475569', marginBottom: '14px' }}>
                    Link a social account for faster sign-in next time
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Google */}
                    <button
                      onClick={() => window.location.href = '/auth/google'}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '500' }}>Link Google Account</span>
                      <ChevronRight size={14} color="#334155" style={{ marginLeft: 'auto' }} />
                    </button>
                    {/* Facebook */}
                    <button
                      onClick={() => window.location.href = '/auth/facebook'}
                      style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'rgba(24,119,242,0.06)', border: '1px solid rgba(24,119,242,0.2)', borderRadius: '12px', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(24,119,242,0.12)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(24,119,242,0.06)'}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="white" d="M16.67 15.5l.44-2.85h-2.73v-1.85c0-.78.38-1.54 1.6-1.54h1.24V6.8s-1.12-.19-2.2-.19c-2.24 0-3.71 1.36-3.71 3.82v2.22H8.89V15.5h2.42V22.8c.49.07.98.11 1.49.11s1-.04 1.49-.11V15.5h2.38z"/></svg>
                      <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '500' }}>Link Facebook Account</span>
                      <ChevronRight size={14} color="#334155" style={{ marginLeft: 'auto' }} />
                    </button>
                  </div>
                </div>
              </SectionCard>

              {/* Support */}
              <SectionCard title="Support">
                <SettingRow icon={HelpCircle} iconColor="#06b6d4" iconBg="rgba(6,182,212,0.1)" label="Help & Support" desc="Get help when you need it" onClick={() => {}} />
                <SettingRow icon={MessageCircle} iconColor="#3b82f6" iconBg="rgba(59,130,246,0.1)" label="Contact Us" desc="Send us a message" onClick={() => {}} />
              </SectionCard>

              {/* Sign Out */}
              <SectionCard>
                <SettingRow
                  icon={LogOut} label="Delete Account" desc="Permanently wipe all data and unpair devices"
                  danger onClick={() => { if (window.confirm('WARNING: Deleting your account will wipe all child data, logs, and settings permanently. This cannot be undone. Proceed?')) { 
                    fetch('/api/auth/me', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } }).then(() => { logout(); onClose(); });
                   } }}
                />
              </SectionCard>

              <div style={{ textAlign: 'center', fontSize: '11px', color: '#1e293b', paddingTop: '8px', paddingBottom: '8px' }}>
                AlphaGuard AI · Family Safety Platform · v1.0.0
              </div>
            </>
          )}
        </div>
      </div>

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ProfileSettingsModal;
