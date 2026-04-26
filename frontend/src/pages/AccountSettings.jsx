import React, { useState } from 'react';
import {
  User, Shield, Lock, Key, Eye, EyeOff, Bell, Globe,
  HelpCircle, MessageCircle, Palette, LogOut, ChevronRight,
  ShieldCheck, ArrowLeft, Smartphone, CheckCircle, AlertCircle,
  Info, ExternalLink, Mail, Save, Moon, Sun, Monitor, ToggleLeft, ToggleRight,
  BookOpen, Video, Wifi, MapPin, Clock, Zap, Star, Send, Phone, ChevronDown, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// ─── Shared helpers ──────────────────────────────────────────────────────────
const Row = ({ icon: Icon, iconColor, iconBg, label, desc, right, onClick, danger, badge }) => (
  <button onClick={onClick} style={{
    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px',
    background: 'transparent', border: 'none', width: '100%', textAlign: 'left',
    borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: onClick ? 'pointer' : 'default',
    transition: 'background 0.2s'
  }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
  >
    <div style={{ width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0, background: danger ? 'rgba(239,68,68,0.1)' : (iconBg || 'rgba(255,255,255,0.06)'), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Icon size={18} color={danger ? '#ef4444' : (iconColor || '#64748b')} />
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '15px', fontWeight: '600', color: danger ? '#ef4444' : '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
        {label}
        {badge && <span style={{ fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '10px', background: 'rgba(0,240,255,0.15)', color: '#00f0ff', border: '1px solid rgba(0,240,255,0.2)' }}>{badge}</span>}
      </div>
      {desc && <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{desc}</div>}
    </div>
    {right && <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>{right}</span>}
    {onClick && !right && <ChevronRight size={16} color={danger ? '#ef4444' : '#334155'} />}
  </button>
);

const Card = ({ title, children }) => (
  <div style={{ marginBottom: '28px' }}>
    {title && <div style={{ fontSize: '11px', fontWeight: '700', color: '#475569', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '10px', paddingLeft: '2px' }}>{title}</div>}
    <div style={{ background: 'rgba(255,255,255,0.02)', borderRadius: '18px', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>{children}</div>
  </div>
);

const SubHeader = ({ title, desc, onBack }) => (
  <div style={{ marginBottom: '32px' }}>
    <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '13px', marginBottom: '20px', padding: 0, transition: 'color 0.2s' }}
      onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
      onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
    >
      <ArrowLeft size={15} /> Back to Settings
    </button>
    <h2 style={{ fontSize: '26px', fontWeight: '900', color: '#fff', marginBottom: '6px', letterSpacing: '-0.5px' }}>{title}</h2>
    {desc && <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.6 }}>{desc}</p>}
    <div style={{ height: '1px', background: 'linear-gradient(90deg, rgba(0,240,255,0.3), transparent)', marginTop: '20px' }} />
  </div>
);

const Alert = ({ type, msg }) => {
  if (!msg) return null;
  const cfg = {
    error:   { bg: 'rgba(239,68,68,0.08)',   color: '#ef4444', border: 'rgba(239,68,68,0.2)',   Icon: AlertCircle },
    success: { bg: 'rgba(16,185,129,0.08)',  color: '#10b981', border: 'rgba(16,185,129,0.2)', Icon: CheckCircle },
    info:    { bg: 'rgba(0,240,255,0.08)',   color: '#00f0ff', border: 'rgba(0,240,255,0.2)',   Icon: Info },
  }[type] || {};
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '14px 16px', borderRadius: '12px', fontSize: '14px', marginBottom: '20px', background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}>
      <cfg.Icon size={16} /> {msg}
    </div>
  );
};

const PremiumInput = ({ label, icon: Icon, iconColor, type = 'text', placeholder, value, onChange, right, hint }) => (
  <div>
    {label && <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px', letterSpacing: '0.03em' }}>{label}</label>}
    <div style={{ position: 'relative' }}>
      <Icon size={17} color={iconColor || '#475569'} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} autoComplete="new-password"
        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px 48px 14px 46px', borderRadius: '12px', color: '#fff', fontSize: '15px', outline: 'none', transition: 'all 0.2s', letterSpacing: type === 'password' ? '3px' : 'normal' }}
        onFocus={e => { e.target.style.borderColor = 'rgba(0,240,255,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(0,240,255,0.08)'; }}
        onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none'; }}
      />
      {right && <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>{right}</div>}
    </div>
    {hint && <p style={{ fontSize: '12px', color: '#475569', marginTop: '5px' }}>{hint}</p>}
  </div>
);

const EyeBtn = ({ show, toggle }) => (
  <button onClick={toggle} style={{ background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer', padding: 0, display: 'flex' }}
    onMouseEnter={e => e.currentTarget.style.color = '#94a3b8'}
    onMouseLeave={e => e.currentTarget.style.color = '#475569'}
  >
    {show ? <EyeOff size={18} /> : <Eye size={18} />}
  </button>
);

const PrimaryBtn = ({ label, loading, onClick, disabled, color = '#00f0ff' }) => (
  <button onClick={onClick} disabled={loading || disabled} style={{
    background: color === '#00f0ff' ? 'linear-gradient(135deg, #00f0ff, #0099cc)' : `linear-gradient(135deg, ${color}, ${color}aa)`,
    color: color === '#00f0ff' ? '#000' : '#fff',
    border: 'none', padding: '14px 32px', borderRadius: '12px',
    fontWeight: '700', fontSize: '15px', cursor: loading ? 'default' : 'pointer',
    opacity: loading ? 0.7 : 1, transition: 'all 0.2s',
    boxShadow: `0 4px 20px ${color}33`
  }}>
    {loading ? '⏳ Saving…' : label}
  </button>
);

// ─── PASSWORD VIEW ───────────────────────────────────────────────────────────
const PasswordView = ({ user, token, onBack }) => {
  const [tab, setTab]         = useState('change'); // 'change' | 'otp' | 'verify' | 'reset'
  const [oldPass, setOldPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [conf,    setConf]    = useState('');
  const [otp,     setOtp]     = useState('');
  const [show,    setShow]    = useState({ old: false, new: false, conf: false });
  const [err,     setErr]     = useState('');
  const [ok,      setOk]      = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // OTP Countdown Timer
  React.useEffect(() => {
    let timer;
    if (countdown > 0 && (tab === 'verify' || tab === 'otp')) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown, tab]);

  const strength = newPass.length === 0 ? 0 : newPass.length < 6 ? 1 : newPass.length < 10 ? 2 : /[A-Z]/.test(newPass) && /[0-9]/.test(newPass) ? 4 : 3;
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength];
  const strengthColor = ['', '#ef4444', '#f59e0b', '#3b82f6', '#10b981'][strength];

  const doChange = async () => {
    if (!oldPass || !newPass || !conf) return setErr('All fields are required.');
    if (newPass !== conf) return setErr('New passwords do not match.');
    if (newPass.length < 6) return setErr('Password must be at least 6 characters.');
    setErr(''); setOk(''); setLoading(true);
    try {
      const r = await fetch('/api/auth/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ oldPassword: oldPass, newPassword: newPass }) });
      const d = await r.json();
      if (r.ok && d.success) { setOk('Password updated successfully! ✓'); setOldPass(''); setNewPass(''); setConf(''); }
      else setErr(d.error || 'Failed to update password.');
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: '560px' }}>
      <SubHeader title="Password & Security" desc="Keep your account safe with a strong, unique password." onBack={onBack} />

      {/* Mode tabs */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '28px', background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '4px' }}>
        {[['change', 'Change Password'], ['otp', 'Reset via OTP']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setErr(''); setOk(''); }}
            style={{ flex: 1, padding: '10px', borderRadius: '9px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '13px', transition: 'all 0.2s', background: tab === key || (tab === 'verify' && key === 'otp') ? 'rgba(0,240,255,0.15)' : 'transparent', color: tab === key || (tab === 'verify' && key === 'otp') ? '#00f0ff' : '#64748b' }}>
            {label}
          </button>
        ))}
      </div>

      <Alert type="error" msg={err} />
      <Alert type="success" msg={ok} />

      {tab === 'change' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Decorative card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px 20px', background: 'rgba(176,38,255,0.06)', border: '1px solid rgba(176,38,255,0.15)', borderRadius: '14px', marginBottom: '4px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'rgba(176,38,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={22} color="#b026ff" />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>Secure Password Change</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>You'll need your current password to set a new one</div>
            </div>
          </div>

          <PremiumInput label="Current Password" icon={Key} iconColor="#64748b" type={show.old ? 'text' : 'password'} placeholder="Enter current password" value={oldPass} onChange={e => setOldPass(e.target.value)}
            right={<EyeBtn show={show.old} toggle={() => setShow(s => ({ ...s, old: !s.old }))} />} />

          <div>
            <PremiumInput label="New Password" icon={Lock} iconColor="#00f0ff" type={show.new ? 'text' : 'password'} placeholder="Min. 8 characters" value={newPass} onChange={e => setNewPass(e.target.value)}
              right={<EyeBtn show={show.new} toggle={() => setShow(s => ({ ...s, new: !s.new }))} />} />
            {newPass.length > 0 && (
              <div style={{ marginTop: '8px' }}>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '5px' }}>
                  {[1,2,3,4].map(i => <div key={i} style={{ flex: 1, height: '4px', borderRadius: '4px', background: i <= strength ? strengthColor : 'rgba(255,255,255,0.08)', transition: 'all 0.3s' }} />)}
                </div>
                <span style={{ fontSize: '12px', color: strengthColor, fontWeight: '600' }}>{strengthLabel}</span>
              </div>
            )}
          </div>

          <PremiumInput label="Confirm New Password" icon={Lock} iconColor="#00f0ff" type={show.conf ? 'text' : 'password'} placeholder="Repeat new password" value={conf} onChange={e => setConf(e.target.value)}
            right={<EyeBtn show={show.conf} toggle={() => setShow(s => ({ ...s, conf: !s.conf }))} />}
            hint={conf && newPass !== conf ? '⚠ Passwords do not match' : conf && newPass === conf ? '✓ Passwords match' : ''} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
            <button onClick={() => { setTab('otp'); setErr(''); setOk(''); }} style={{ background: 'transparent', border: 'none', color: '#b026ff', fontSize: '14px', cursor: 'pointer', padding: 0, textDecoration: 'underline' }}>Forgot current password?</button>
            <PrimaryBtn label="Update Password" loading={loading} onClick={doChange} />
          </div>
        </div>
      )}

      {tab === 'otp' && (
        <div>
          <div style={{ padding: '24px', background: 'rgba(176,38,255,0.06)', border: '1px dashed rgba(176,38,255,0.3)', borderRadius: '16px', textAlign: 'center', marginBottom: '20px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(176,38,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
              <Mail size={26} color="#b026ff" />
            </div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>Forgot your password?</div>
            <div style={{ fontSize: '14px', color: '#94a3b8', lineHeight: 1.7 }}>
              We'll send a 6-digit verification code to<br />
              <strong style={{ color: '#fff' }}>{user?.email}</strong>
            </div>
          </div>
          <PrimaryBtn label="📨 Send OTP to Email" loading={loading} color="#b026ff" onClick={async () => {
            setLoading(true); setErr(''); setOk('');
            try {
              const res = await fetch('/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ email: user?.email })
              });
              const data = await res.json();
              if (res.ok && data.success) {
                setTab('verify'); 
                if (data.mockOtp) {
                  setOk(`Email bypassed! Your OTP is: ${data.mockOtp}`);
                } else {
                  setOk('OTP sent! Check your email.'); 
                }
                setCountdown(30);
              } else {
                setErr(data.error || 'Failed to send OTP');
              }
            } catch (error) {
              setErr('Network error: ' + error.message);
            }
            setLoading(false);
          }} />
        </div>
      )}

      {tab === 'verify' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ textAlign: 'center', padding: '16px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', fontSize: '14px', color: '#10b981' }}>
            ✓ OTP sent to <strong>{user?.email}</strong>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#94a3b8', marginBottom: '8px' }}>Enter 6-digit OTP</label>
            <input maxLength={6} value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="• • • • • •"
              style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(176,38,255,0.4)', padding: '20px', borderRadius: '14px', color: '#fff', fontSize: '28px', letterSpacing: '16px', textAlign: 'center', outline: 'none', fontWeight: '800' }}
              onFocus={e => { e.target.style.borderColor = '#b026ff'; e.target.style.boxShadow = '0 0 0 3px rgba(176,38,255,0.15)'; }}
              onBlur={e => { e.target.style.borderColor = 'rgba(176,38,255,0.4)'; e.target.style.boxShadow = 'none'; }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button 
                onClick={async () => {
                    setLoading(true); setErr(''); setOk('');
                    try {
                      const res = await fetch('/api/auth/send-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ email: user?.email })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        if (data.mockOtp) {
                           setOk(`Email bypassed! Your OTP is: ${data.mockOtp}`);
                        } else {
                           setOk('OTP resent!');
                        }
                        setCountdown(30);
                      } else {
                        const data = await res.json();
                        setErr(data.error || 'Failed to resend OTP');
                      }
                    } catch (e) { setErr(e.message); }
                    setLoading(false);
                }} 
                disabled={loading || countdown > 0}
                style={{ 
                    flex: 1, padding: '13px', background: 'rgba(176,38,255,0.08)', 
                    border: '1px solid rgba(176,38,255,0.2)', borderRadius: '12px', 
                    color: countdown > 0 ? '#475569' : '#b026ff', fontWeight: '600', 
                    cursor: countdown > 0 ? 'not-allowed' : 'pointer', fontSize: '14px',
                    transition: 'all 0.2s'
                }}>
                {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </button>
            <button onClick={async () => {
                if (!otp || otp.length !== 6) return setErr('Please enter 6-digit OTP.'); 
                setLoading(true); setErr('');
                try {
                  const r = await fetch('/api/auth/verify-otp', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user?.email, otp })
                  });
                  const d = await r.json();
                  if (r.ok && d.success) {
                    setErr(''); setTab('reset');
                  } else {
                    setErr(d.error || 'Invalid OTP');
                  }
                } catch(e) { setErr(e.message); }
                setLoading(false);
            }} 
            disabled={loading}
            style={{ flex: 2, padding: '13px', background: 'linear-gradient(135deg, #b026ff, #7c3aed)', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: '700', cursor: 'pointer', fontSize: '14px', opacity: loading ? 0.7 : 1 }}>
              {loading ? 'Verifying...' : 'Verify OTP →'}
            </button>
          </div>
        </div>
      )}

      {tab === 'reset' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', fontSize: '14px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={16} /> Identity verified! Now set your new password.
          </div>
          <PremiumInput label="New Password" icon={Lock} iconColor="#b026ff" type={show.new ? 'text' : 'password'} placeholder="Min. 8 characters" value={newPass} onChange={e => setNewPass(e.target.value)} right={<EyeBtn show={show.new} toggle={() => setShow(s => ({ ...s, new: !s.new }))} />} />
          <PremiumInput label="Confirm Password" icon={Lock} iconColor="#b026ff" type={show.conf ? 'text' : 'password'} placeholder="Repeat new password" value={conf} onChange={e => setConf(e.target.value)} right={<EyeBtn show={show.conf} toggle={() => setShow(s => ({ ...s, conf: !s.conf }))} />} />
          <PrimaryBtn label="🔐 Reset & Save Password" loading={loading} color="#b026ff" onClick={async () => {
            if (newPass !== conf) return setErr('Passwords do not match');
            setLoading(true); setErr(''); setOk('');
            try {
              const r = await fetch('/api/auth/reset-password-otp', { 
                  method: 'POST', 
                  headers: { 'Content-Type': 'application/json' }, // the backend handles email/otp in body
                  body: JSON.stringify({ email: user?.email, otp, newPassword: newPass }) 
              });
              const d = await r.json();
              if (r.ok && d.success) { 
                  setOk('Password reset successfully!'); 
                  setTimeout(() => { setTab('change'); setOtp(''); setNewPass(''); setConf(''); }, 2000); 
              }
              else setErr(d.error || 'Reset failed. Check OTP.');
            } catch (e) { setErr(e.message); }
            setLoading(false);
          }} />
        </div>
      )}
    </div>
  );
};

const ProfileView = ({ user, token, onBack }) => {
  const { updateUser } = useAuth();
  const [name, setName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [ok, setOk] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  return (
    <div style={{ maxWidth: '560px' }}>
      <SubHeader title="Manage Profile" desc="Update your account name and display information." onBack={onBack} />
      {err && <Alert type="error" msg={err} />}
      {ok && <Alert type="success" msg={ok} />}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '16px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, #052659, #1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: '900', color: '#C1E8FF', border: '2px solid rgba(0,240,255,0.3)', boxShadow: '0 0 20px rgba(0,240,255,0.15)', flexShrink: 0 }}>
            {name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P'}
          </div>
          <div>
            <div style={{ fontSize: '16px', fontWeight: '700', color: '#fff' }}>{name || 'Parent Account'}</div>
            <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Parent Account</div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', marginTop: '6px', padding: '3px 10px', borderRadius: '12px', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.2)' }}>
              <ShieldCheck size={11} color="#00f0ff" />
              <span style={{ fontSize: '11px', color: '#00f0ff', fontWeight: '700' }}>Protected</span>
            </div>
          </div>
        </div>

        <PremiumInput label="Full Name" icon={User} iconColor="#3b82f6" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} />
        <PremiumInput label="Email Address" icon={Mail} iconColor="#06b6d4" type="email" placeholder="parent@example.com" value={email} onChange={e => setEmail(e.target.value)}
          hint="Changing email may require verification." />

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <PrimaryBtn label="Save Changes" loading={loading} onClick={async () => {
            if (!name || !email) return setErr("Name and email are required.");
            setLoading(true); setErr(''); setOk('');
            try {
              const res = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ fullName: name, email })
              });
              
              const contentType = res.headers.get("content-type");
              if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Server disconnected. Please start the backend database server.");
              }

              const data = await res.json();
              if (res.ok && data.success) {
                updateUser(data.user);
                setOk('Profile updated successfully!');
              } else {
                setErr(data.error || 'Failed to update profile.');
                setName(user?.fullName || ''); // Revert on failure
                setEmail(user?.email || '');
              }
            } catch (error) {
              setErr(error.message);
            }
            setLoading(false);
          }} />
        </div>
      </div>
    </div>
  );
};

// ─── NOTIFICATIONS VIEW ──────────────────────────────────────────────────────
const NotificationsView = ({ onBack }) => {
  const [prefs, setPrefs] = useState({ screenTime: true, appBlocked: true, weeklyReport: true, liveAlerts: true, devicePaired: false });
  const [ok, setOk] = useState('');

  const Toggle = ({ id }) => (
    <button onClick={() => setPrefs(p => ({ ...p, [id]: !p[id] }))} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: prefs[id] ? '#00f0ff' : '#334155', transition: 'color 0.2s' }}>
      {prefs[id] ? <ToggleRight size={34} /> : <ToggleLeft size={34} />}
    </button>
  );

  const items = [
    { id: 'screenTime',   label: 'Screen Time Alerts',    desc: 'Notify when daily limit is reached' },
    { id: 'appBlocked',   label: 'App Blocked Events',    desc: 'When a blocked app is accessed' },
    { id: 'liveAlerts',   label: 'Real-time Alerts',      desc: 'Instant push notifications' },
    { id: 'weeklyReport', label: 'Weekly Summary Report', desc: 'Every Monday morning digest' },
    { id: 'devicePaired', label: 'New Device Linked',     desc: 'When a new child device is paired' },
  ];

  return (
    <div style={{ maxWidth: '560px' }}>
      <SubHeader title="Notifications" desc="Choose which alerts and updates you'd like to receive." onBack={onBack} />
      {ok && <Alert type="success" msg={ok} />}
      <Card title="Alert Preferences">
        {items.map(item => (
          <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
            <div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>{item.label}</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>{item.desc}</div>
            </div>
            <Toggle id={item.id} />
          </div>
        ))}
      </Card>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <PrimaryBtn label="Save Preferences" onClick={() => setOk('Notification preferences saved!')} />
      </div>
    </div>
  );
};

// ─── LANGUAGE VIEW ───────────────────────────────────────────────────────────
const LanguageView = ({ onBack, currentLang, onLangChange }) => {
  const [search, setSearch] = useState('');

  // Comprehensive list of languages supported globally
  const allLangs = [
    ['af', 'Afrikaans'], ['sq', 'Albanian'], ['am', 'Amharic'], ['ar', 'Arabic'], ['hy', 'Armenian'],
    ['az', 'Azerbaijani'], ['eu', 'Basque'], ['be', 'Belarusian'], ['bn', 'Bengali'], ['bs', 'Bosnian'],
    ['bg', 'Bulgarian'], ['ca', 'Catalan'], ['ceb', 'Cebuano'], ['ny', 'Chichewa'], ['zh-CN', 'Chinese (Simplified)'],
    ['zh-TW', 'Chinese (Traditional)'], ['co', 'Corsican'], ['hr', 'Croatian'], ['cs', 'Czech'], ['da', 'Danish'],
    ['nl', 'Dutch'], ['en', 'English'], ['eo', 'Esperanto'], ['et', 'Estonian'], ['tl', 'Filipino'],
    ['fi', 'Finnish'], ['fr', 'French'], ['fy', 'Frisian'], ['gl', 'Galician'], ['ka', 'Georgian'],
    ['de', 'German'], ['el', 'Greek'], ['gu', 'Gujarati'], ['ht', 'Haitian Creole'], ['ha', 'Hausa'],
    ['haw', 'Hawaiian'], ['iw', 'Hebrew'], ['hi', 'Hindi'], ['hmn', 'Hmong'], ['hu', 'Hungarian'],
    ['is', 'Icelandic'], ['ig', 'Igbo'], ['id', 'Indonesian'], ['ga', 'Irish'], ['it', 'Italian'],
    ['ja', 'Japanese'], ['jw', 'Javanese'], ['kn', 'Kannada'], ['kk', 'Kazakh'], ['km', 'Khmer'],
    ['ko', 'Korean'], ['ku', 'Kurdish (Kurmanji)'], ['ky', 'Kyrgyz'], ['lo', 'Lao'], ['la', 'Latin'],
    ['lv', 'Latvian'], ['lt', 'Lithuanian'], ['lb', 'Luxembourgish'], ['mk', 'Macedonian'], ['mg', 'Malagasy'],
    ['ms', 'Malay'], ['ml', 'Malayalam'], ['mt', 'Maltese'], ['mi', 'Maori'], ['mr', 'Marathi'],
    ['mn', 'Mongolian'], ['my', 'Myanmar (Burmese)'], ['ne', 'Nepali'], ['no', 'Norwegian'], ['ps', 'Pashto'],
    ['fa', 'Persian'], ['pl', 'Polish'], ['pt', 'Portuguese'], ['pa', 'Punjabi'], ['ro', 'Romanian'],
    ['ru', 'Russian'], ['sm', 'Samoan'], ['gd', 'Scots Gaelic'], ['sr', 'Serbian'], ['st', 'Sesotho'],
    ['sn', 'Shona'], ['sd', 'Sindhi'], ['si', 'Sinhala'], ['sk', 'Slovak'], ['sl', 'Slovenian'],
    ['so', 'Somali'], ['es', 'Spanish'], ['su', 'Sundanese'], ['sw', 'Swahili'], ['sv', 'Swedish'],
    ['tg', 'Tajik'], ['ta', 'Tamil'], ['te', 'Telugu'], ['th', 'Thai'], ['tr', 'Turkish'],
    ['uk', 'Ukrainian'], ['ur', 'Urdu'], ['uz', 'Uzbek'], ['vi', 'Vietnamese'], ['cy', 'Welsh'],
    ['xh', 'Xhosa'], ['yi', 'Yiddish'], ['yo', 'Yoruba'], ['zu', 'Zulu']
  ].sort((a, b) => a[1].localeCompare(b[1]));

  const filtered = allLangs.filter(l => l[1].toLowerCase().includes(search.toLowerCase()));

  const handleSelect = (code) => {
    onLangChange(code);
    const select = document.querySelector('.goog-te-combo');
    if (select) {
      select.value = code;
      select.dispatchEvent(new Event('change'));
    }
  };

  return (
    <div className="notranslate" style={{ maxWidth: '560px' }}>
      <SubHeader title="Platform Language" desc="Select from over 100+ global languages." onBack={onBack} />
      
      <div style={{ marginBottom: '20px' }}>
        <input 
          type="text" 
          placeholder="🔍 Search for a language..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '14px 20px', borderRadius: '12px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,240,255,0.2)', color: '#fff', fontSize: '15px', outline: 'none' }}
        />
      </div>

      <Card title={`Available Languages (${filtered.length})`}>
        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>No languages found.</div>
          ) : (
            filtered.map(([code, name]) => (
              <button key={code} onClick={() => handleSelect(code)} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '15px 20px', background: currentLang === code ? 'rgba(0,240,255,0.06)' : 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.04)', width: '100%', cursor: 'pointer', transition: 'background 0.2s' }}>
                <span style={{ fontSize: '20px', fill: '#00f0ff' }}><Globe size={18} color={currentLang === code ? '#00f0ff' : '#475569'} /></span>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: currentLang === code ? '#00f0ff' : '#fff' }}>{name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Language Code: {code.toUpperCase()}</div>
                </div>
                {currentLang === code && <CheckCircle size={18} color="#00f0ff" />}
              </button>
            ))
          )}
        </div>
      </Card>
    </div>
  );
};

// ─── APPEARANCE VIEW ─────────────────────────────────────────────────────────
const AppearanceView = ({ onBack }) => {
  const [theme, setTheme] = useState(() => localStorage.getItem('cs_theme') || 'dark');

  const applyTheme = (id) => {
    setTheme(id);
    localStorage.setItem('cs_theme', id);
    document.documentElement.setAttribute('data-theme', id);
  };

  // Apply saved theme on mount
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  const themes = [
    { id: 'dark',   icon: Moon,    label: 'Dark Mode',   desc: 'Easy on the eyes at night', color: '#8b5cf6' },
    { id: 'light',  icon: Sun,     label: 'Light Mode',  desc: 'Clean and bright interface', color: '#f59e0b' },
    { id: 'system', icon: Monitor, label: 'System',      desc: 'Follow device preference',  color: '#06b6d4' },
  ];
  return (
    <div style={{ maxWidth: '560px' }}>
      <SubHeader title="Theme & Appearance" desc="Customize how ChildShield AI looks on your device." onBack={onBack} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {themes.map(({ id, icon: Icon, label, desc, color }) => (
          <button key={id} onClick={() => applyTheme(id)} style={{
            display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px',
            background: theme === id ? `rgba(${color === '#8b5cf6' ? '139,92,246' : color === '#f59e0b' ? '245,158,11' : '6,182,212'},0.08)` : 'rgba(255,255,255,0.02)',
            border: `1px solid ${theme === id ? color + '40' : 'rgba(255,255,255,0.06)'}`,
            borderRadius: '16px', cursor: 'pointer', width: '100%', transition: 'all 0.2s',
            boxShadow: theme === id ? `0 0 20px ${color}15` : 'none'
          }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={22} color={color} />
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>{label}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>{desc}</div>
            </div>
            <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: `2px solid ${theme === id ? color : 'rgba(255,255,255,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
              {theme === id && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color }} />}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

// ─── CONNECTED DEVICES VIEW ──────────────────────────────────────────────────
const DevicesView = ({ onBack }) => {
  const { childrenList } = useAuth();
  const navigate = useNavigate();
  return (
    <div style={{ maxWidth: '560px' }}>
      <SubHeader title="Connected Devices" desc="Child devices paired to your parent account." onBack={onBack} />
      {childrenList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.08)', borderRadius: '18px' }}>
          <Smartphone size={40} color="#334155" style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '16px', fontWeight: '600', color: '#64748b', marginBottom: '8px' }}>No devices linked yet</div>
          <div style={{ fontSize: '13px', color: '#334155', marginBottom: '20px' }}>Pair a child device from the Controls page</div>
          <button onClick={() => navigate('/controls')} style={{ padding: '12px 24px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.3)', borderRadius: '12px', color: '#00f0ff', fontWeight: '600', cursor: 'pointer', fontSize: '14px' }}>Go to Controls →</button>
        </div>
      ) : (
        <Card title={`Paired Devices (${childrenList.length})`}>
          {childrenList.map((child, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px 20px', borderBottom: i < childrenList.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Smartphone size={20} color="#10b981" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '15px', fontWeight: '600', color: '#fff' }}>{child.name}</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Paired device</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '4px 10px', borderRadius: '10px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: '600' }}>Connected</span>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
};

// ─── HELP VIEW (Full Help Center) ────────────────────────────────────────────
const HelpView = ({ onBack }) => {
  const [openFaq, setOpenFaq] = useState(null);
  const [search, setSearch] = useState('');

  const categories = [
    {
      icon: Zap, color: '#f59e0b', label: 'Getting Started',
      faqs: [
        { q: 'How do I create a parent account?', a: 'Open ChildShield AI and tap "Sign Up". Enter your full name, email, and create a strong password plus a secret Parent Control PIN. This PIN is used to lock/unlock child devices.' },
        { q: 'How do I pair a child device?', a: 'Go to Controls → tap "+ Add Device". A 6-digit pairing code appears. On the child device, open the app in Child Mode, enter the child name and select gender — a QR code will appear. Enter that code on the parent side to link.' },
        { q: 'How many child devices can I add?', a: 'You can link multiple child devices to a single parent account. Each child profile is tracked independently with its own settings, limits, and history.' },
        { q: 'Can I use ChildShield AI on a web browser?', a: 'Yes! The web version is fully functional. The production app will be available on both web and native Android/iOS.' },
      ]
    },
    {
      icon: Clock, color: '#00f0ff', label: 'Screen Time & Controls',
      faqs: [
        { q: 'How do I set a daily screen time limit?', a: 'Go to Controls → select your child → use the "Daily Limit" slider to set a maximum hours cap. When the child hits the limit, the device is automatically paused.' },
        { q: 'How does Night Mode restriction work?', a: 'Enable "Night Restriction" in Controls. This blocks the child device between 9:00 PM and 7:00 AM automatically every day. You can toggle it on/off anytime.' },
        { q: 'Can I pause or lock the device remotely?', a: 'Yes. In Controls → select the child → tap "Pause Session" or "Lock Device". The screen is immediately blocked with a message. You can unlock remotely anytime.' },
        { q: 'What is a Session Timer?', a: 'A session timer lets you grant timed access — e.g. 30 minutes of usage. When the timer ends, the device auto-pauses. Perfect for homework breaks.' },
      ]
    },
    {
      icon: Shield, color: '#b026ff', label: 'Face Guard & Monitoring',
      faqs: [
        { q: 'What is Face Guard?', a: 'Face Guard uses the child device\'s front camera to verify who is using the device. If an unauthorized face is detected, the device is paused or locked automatically.' },
        { q: 'How do I enroll my child\'s face?', a: 'Go to Controls → select child → "Face Guard" section → "Enroll Face". The child must look at the camera while two clear face photos are captured. These are stored locally and never uploaded.' },
        { q: 'What happens if no face is detected?', a: 'If no face is detected after the configured timeout (default 30s), the action you set triggers: Alert, Pause, or Lock. This prevents children from leaving the device unattended.' },
        { q: 'Can I view browsing and app history?', a: 'Yes. Go to "Watch History" in the sidebar to see a full timeline of all URLs visited and apps opened on the child device, grouped by day and app.' },
      ]
    },
    {
      icon: MapPin, color: '#10b981', label: 'Location Tracking',
      faqs: [
        { q: 'How do I enable GPS tracking for my child?', a: 'Go to the "Location" page in the sidebar → Enable "GPS Target" toggle. On the child device, the browser will ask for location permission — the child must tap Allow.' },
        { q: 'Does tracking work when the phone screen is off?', a: 'On the web version, location tracking requires the browser tab to be open and active. Full background tracking requires the native Android/iOS app, which is on the roadmap.' },
        { q: 'How often is location updated?', a: 'The child device streams GPS using the browser\'s watchPosition API (updates every 5–15 seconds). The parent dashboard auto-refreshes every 15 seconds.' },
        { q: 'Can I see where my child has been today?', a: 'Yes! On the Location page, switch to the "Route History" tab to see a timestamped trail of every GPS point recorded in the last 24 hours, including speed and battery.' },
      ]
    },
    {
      icon: ShieldCheck, color: '#3b82f6', label: 'Security & Account',
      faqs: [
        { q: 'What is the Parent Control Password?', a: 'This is separate from your login password. It\'s required to disconnect a child device, override session locks, and modify critical security settings.' },
        { q: 'How do I change my Parent Control Password?', a: 'Go to Account Settings → "Password & Security". First verify your login via OTP sent to email, then you can change the Parent Control Password.' },
        { q: 'Can the child log out by themselves?', a: 'No. The child cannot logout or disconnect without entering the Parent Control Password. Any attempt instantly sends an alert to the parent dashboard.' },
        { q: 'Is my data encrypted?', a: 'Yes. All data is transmitted over HTTPS/TLS. Passwords are hashed using bcrypt. Face images are stored locally on the child device and never uploaded to any server.' },
      ]
    },
    {
      icon: Wifi, color: '#ef4444', label: 'Troubleshooting',
      faqs: [
        { q: 'The child device shows "Offline" — what do I do?', a: 'Check: (1) Is the backend server running? (2) Is the child on the same network? (3) Has the pairing been broken? Try re-pairing via Controls.' },
        { q: 'GPS / Location not showing on the map?', a: 'Make sure: (1) GPS tracking is enabled by parent. (2) The child allowed location permission in the browser. (3) On Chrome Android — Location must be set to "Allow" in Site Settings.' },
        { q: 'OTP email not arriving for password reset?', a: 'Check your spam/junk folder first. Make sure you\'ve generated a 16-character "App Password" and entered it in backend/.env as SMTP_PASSWORD. Standard Gmail passwords won\'t work.' },
        { q: 'Face detection not working?', a: 'Make sure: (1) Camera permission is allowed. (2) Lighting is adequate. (3) Face is fully visible. (4) You have enrolled at least one face. Re-enroll if needed from Controls → Face Guard.' },
      ]
    },
  ];

  const allFaqs = categories.flatMap((c, ci) => c.faqs.map((f, fi) => ({ ...f, cat: c.label, id: `${ci}-${fi}` })));
  const filtered = search.trim() ? allFaqs.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())) : null;

  return (
    <div style={{ maxWidth: '640px' }}>
      <SubHeader title="Help & Support" desc="Everything you need to know about ChildShield AI." onBack={onBack} />

      {/* Search bar */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <HelpCircle size={17} color="#475569" style={{ position: 'absolute', top: '14px', left: '16px' }} />
        <input type="text" placeholder="Search help articles..." value={search} onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px 13px 44px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: '#fff', fontSize: '14px', outline: 'none' }}
        />
      </div>

      {/* Search results */}
      {filtered && (
        <Card title={`${filtered.length} result${filtered.length !== 1 ? 's' : ''} for "${search}"`}>
          {filtered.length === 0 && <div style={{ padding: '24px', color: '#64748b', textAlign: 'center' }}>No articles found. Try different keywords.</div>}
          {filtered.map((f) => (
            <div key={f.id} style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: '700', marginBottom: '6px', letterSpacing: '0.06em' }}>{f.cat.toUpperCase()}</div>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '6px' }}>{f.q}</div>
              <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
        </Card>
      )}

      {!filtered && (
        <>
          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
            {[
              { icon: BookOpen, label: 'Getting Started', color: '#f59e0b' },
              { icon: Video, label: 'Video Guides', color: '#ef4444' },
              { icon: ExternalLink, label: 'Documentation', color: '#3b82f6' },
            ].map(({ icon: Icon, label, color }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '16px', textAlign: 'center', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
              >
                <Icon size={22} color={color} style={{ marginBottom: '8px' }} />
                <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '600' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Expandable FAQ categories */}
          {categories.map((cat, ci) => (
            <div key={ci} style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: 'rgba(255,255,255,0.04)', borderRadius: '14px 14px 0 0', border: '1px solid rgba(255,255,255,0.07)', borderBottom: 'none' }}>
                <cat.icon size={18} color={cat.color} />
                <span style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{cat.label}</span>
                <span style={{ marginLeft: 'auto', fontSize: '11px', color: '#475569' }}>{cat.faqs.length} articles</span>
              </div>
              <div style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
                {cat.faqs.map((faq, fi) => {
                  const key = `${ci}-${fi}`;
                  const isOpen = openFaq === key;
                  return (
                    <div key={fi}>
                      <div onClick={() => setOpenFaq(isOpen ? null : key)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', cursor: 'pointer', borderBottom: fi < cat.faqs.length - 1 || isOpen ? '1px solid rgba(255,255,255,0.04)' : 'none', background: isOpen ? 'rgba(255,255,255,0.04)' : 'transparent', transition: 'background 0.2s' }}
                        onMouseOver={e => { if (!isOpen) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                        onMouseOut={e => { if (!isOpen) e.currentTarget.style.background = 'transparent'; }}
                      >
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#fff', paddingRight: '12px' }}>{faq.q}</span>
                        <ChevronDown size={16} color="#475569" style={{ flexShrink: 0, transform: isOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                      </div>
                      {isOpen && (
                        <div style={{ padding: '14px 18px 18px', background: 'rgba(0,240,255,0.02)', borderTop: '1px solid rgba(0,240,255,0.08)' }}>
                          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.75 }}>{faq.a}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* App version */}
          <div style={{ padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px', display: 'flex', alignItems: 'center', gap: '14px', marginTop: '8px' }}>
            <ShieldCheck size={20} color="var(--accent-cyan)" />
            <div>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#fff' }}>ChildShield AI · v1.0.0</div>
              <div style={{ fontSize: '12px', color: '#475569' }}>Family Safety Platform · Free & Open Source</div>
            </div>
            <div style={{ marginLeft: 'auto', fontSize: '11px', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: '20px', border: '1px solid rgba(16,185,129,0.2)' }}>Up to date</div>
          </div>
        </>
      )}
    </div>
  );
};

// ─── CONTACT VIEW ─────────────────────────────────────────────────────────────
const ContactView = ({ onBack }) => {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSending(true);
    setTimeout(() => { setSending(false); setSent(true); }, 1200);
  };

  return (
    <div style={{ maxWidth: '580px' }}>
      <SubHeader title="Contact Us" desc="Get in touch with the ChildShield team." onBack={onBack} />

      {/* Contact channels */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '28px' }}>
        {[
          { icon: Mail, label: 'Email Support', value: 'support@childshield.ai', color: '#3b82f6', bg: 'rgba(59,130,246,0.08)', href: 'mailto:support@childshield.ai', desc: 'Reply within 24 hours' },
          { icon: MessageCircle, label: 'Live Chat', value: 'Chat with us online', color: '#10b981', bg: 'rgba(16,185,129,0.08)', href: '#', desc: 'Available 9AM – 9PM IST' },
          { icon: Github, label: 'Report a Bug', value: 'GitHub Issues', color: '#94a3b8', bg: 'rgba(148,163,184,0.08)', href: '#', desc: 'Open source project' },
        ].map(({ icon: Icon, label, value, color, bg, href, desc }) => (
          <a key={label} href={href} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '18px 20px', background: bg, border: `1px solid ${color}30`, borderRadius: '16px', textDecoration: 'none', color: '#fff', transition: 'all 0.2s' }}
            onMouseOver={e => e.currentTarget.style.background = bg.replace('0.08', '0.14')}
            onMouseOut={e => e.currentTarget.style.background = bg}
          >
            <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${color}30`, flexShrink: 0 }}>
              <Icon size={20} color={color} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff' }}>{label}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{desc}</div>
            </div>
            <div style={{ fontSize: '13px', color, fontWeight: '600' }}>{value}</div>
            <ExternalLink size={14} color="#334155" />
          </a>
        ))}
      </div>

      {/* Message form */}
      {sent ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '20px' }}>
          <CheckCircle size={48} color="#10b981" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#fff', fontSize: '20px', margin: '0 0 8px' }}>Message Sent!</h3>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '14px' }}>Thanks for reaching out. We'll get back to you within 24 hours.</p>
          <button onClick={() => { setSent(false); setSubject(''); setMessage(''); }} style={{ marginTop: '20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '10px 24px', borderRadius: '10px', color: '#94a3b8', cursor: 'pointer', fontSize: '13px' }}>Send Another</button>
        </div>
      ) : (
        <form onSubmit={handleSend}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '20px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={16} color="var(--accent-cyan)" /> Send a Message
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', letterSpacing: '0.06em', marginBottom: '8px', display: 'block' }}>TOPIC</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[['general','💬 General'],['bug','🐛 Bug Report'],['feature','✨ Feature Request'],['billing','💳 Billing'],['privacy','🔒 Privacy']].map(([c, label]) => (
                  <button key={c} type="button" onClick={() => setCategory(c)}
                    style={{ padding: '6px 14px', borderRadius: '20px', border: `1px solid ${category===c ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`, background: category===c ? 'rgba(0,240,255,0.12)' : 'transparent', color: category===c ? 'var(--accent-cyan)' : '#64748b', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', letterSpacing: '0.06em', marginBottom: '8px', display: 'block' }}>SUBJECT</label>
              <input type="text" value={subject} onChange={e => setSubject(e.target.value)} placeholder="Brief description of your issue" required
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', color: '#475569', fontWeight: '700', letterSpacing: '0.06em', marginBottom: '8px', display: 'block' }}>MESSAGE</label>
              <textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Describe your issue or question in detail..." rows={4} required
                style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', color: '#fff', fontSize: '14px', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }} />
            </div>
            <button type="submit" disabled={sending || !subject.trim() || !message.trim()}
              style={{ padding: '14px', background: sending || !subject.trim() || !message.trim() ? 'rgba(0,240,255,0.2)' : 'var(--accent-cyan)', border: 'none', borderRadius: '12px', color: '#0f172a', fontWeight: '700', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
              <Send size={16} />{sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      )}

      {/* Follow us */}
      <div style={{ marginTop: '20px', padding: '16px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '14px' }}>
        <div style={{ fontSize: '12px', color: '#475569', fontWeight: '700', letterSpacing: '0.06em', marginBottom: '12px' }}>COMMUNITY</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {[['Twitter / X', Twitter, '#1d9bf0'],['GitHub', Github, '#94a3b8'],['Rate the App', Star, '#f59e0b']].map(([label, Icon, color]) => (
            <button key={label} style={{ flex: 1, padding: '10px 8px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px', color, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: '600', transition: 'all 0.2s' }}
              onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <Icon size={18} />{label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── PRIVACY POLICY VIEW ─────────────────────────────────────────────────────
const PrivacyView = ({ onBack }) => (
  <div style={{ maxWidth: '600px' }}>
    <SubHeader title="Privacy Policy" desc="How ChildShield AI handles your data." onBack={onBack} />
    {[['Data Collection', 'We collect only what is necessary: your account email, child device usage data, and app activity logs. No personal browsing content is ever stored.'],
      ['Data Usage', 'All data is used exclusively to provide parental monitoring features. We never sell or share data with third parties.'],
      ['Data Security', 'All data is encrypted in transit (TLS) and at rest. Passwords are hashed using bcrypt with salting.'],
      ['Your Rights', 'You can request to delete your account and all associated data at any time by contacting support@childshield.ai.'],
    ].map(([title, text]) => (
      <div key={title} style={{ marginBottom: '16px', padding: '18px 20px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '14px' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '8px' }}>{title}</div>
        <div style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.7 }}>{text}</div>
      </div>
    ))}
  </div>
);

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────
const AccountSettings = () => {
  const { user, token, logout } = useAuth();
  const [view, setView] = useState('main');
  const [langCode, setLangCode] = useState(() => localStorage.getItem('cs_lang') || 'en');

  const handleLangChange = (code) => {
    localStorage.setItem('cs_lang', code);
    setLangCode(code);
    setView('main');
  }

  const initials = name => name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

  const views = {
    password:    <PasswordView    user={user} token={token}  onBack={() => setView('main')} />,
    profile:     <ProfileView     user={user} token={token}  onBack={() => setView('main')} />,
    notifs:      <NotificationsView                          onBack={() => setView('main')} />,
    language:    <LanguageView                               onBack={() => setView('main')} currentLang={langCode} onLangChange={handleLangChange} />,
    appearance:  <AppearanceView                             onBack={() => setView('main')} />,
    devices:     <DevicesView                                onBack={() => setView('main')} />,
    help:        <HelpView                                   onBack={() => setView('main')} />,
    contact:     <ContactView                                onBack={() => setView('main')} />,
    privacy:     <PrivacyView                                onBack={() => setView('main')} />,
  };

  if (view !== 'main') return <div style={{ padding: '32px' }}>{views[view]}</div>;

  return (
    <div style={{ padding: '32px', maxWidth: '680px' }}>
      {/* Profile hero card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '36px', padding: '24px', background: 'linear-gradient(135deg, rgba(5,38,89,0.6), rgba(30,64,175,0.3))', borderRadius: '20px', border: '1px solid rgba(0,240,255,0.15)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)' }}>
        <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #052659, #1e40af)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '900', color: '#C1E8FF', border: '2px solid rgba(0,240,255,0.3)', boxShadow: '0 0 24px rgba(0,240,255,0.2)', flexShrink: 0 }}>
          {initials(user?.fullName)}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>{user?.fullName || 'Parent Account'}</div>
          <div style={{ fontSize: '14px', color: '#64748b', marginTop: '3px' }}>{user?.email}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: '20px', background: 'rgba(0,240,255,0.1)', border: '1px solid rgba(0,240,255,0.25)' }}>
          <ShieldCheck size={13} color="#00f0ff" />
          <span style={{ fontSize: '12px', color: '#00f0ff', fontWeight: '700' }}>Protected</span>
        </div>
      </div>

      {/* Sections */}
      <Card title="Account">
        <Row icon={User}  iconColor="#3b82f6" iconBg="rgba(59,130,246,0.1)"  label="Manage Profile"     desc="Update your name and email"           onClick={() => setView('profile')} />
        <Row icon={Key}   iconColor="#b026ff" iconBg="rgba(176,38,255,0.1)"  label="Password & Security" desc="Change your login password"           onClick={() => setView('password')} />
        <Row icon={Bell}  iconColor="#f59e0b" iconBg="rgba(245,158,11,0.1)"  label="Notifications"       desc="Manage alerts and push notifications" onClick={() => setView('notifs')} />
        <Row icon={Globe} iconColor="#06b6d4" iconBg="rgba(6,182,212,0.1)"   label="Language"            right={langCode.toUpperCase()}                            onClick={() => setView('language')} />
      </Card>

      <Card title="Preferences">
        <Row icon={Palette}    iconColor="#8b5cf6" iconBg="rgba(139,92,246,0.1)"  label="Theme / Appearance"  right={(localStorage.getItem('cs_theme')||'dark').charAt(0).toUpperCase()+(localStorage.getItem('cs_theme')||'dark').slice(1)}  onClick={() => setView('appearance')} />
        <Row icon={Smartphone} iconColor="#10b981" iconBg="rgba(16,185,129,0.1)"  label="Connected Devices"   desc="Manage paired child devices" onClick={() => setView('devices')} />
        <Row icon={Shield}     iconColor="#00f0ff" iconBg="rgba(0,240,255,0.08)"  label="Privacy Policy"                                 onClick={() => setView('privacy')} />
      </Card>

      <Card title="Account Linking">
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '13px', color: '#475569', marginBottom: '14px' }}>Link a social account for faster sign-in</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={() => window.location.href = '/auth/google'}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', cursor: 'pointer', width: '100%', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '500' }}>Link Google Account</span>
              <ChevronRight size={14} color="#334155" style={{ marginLeft: 'auto' }} />
            </button>
            <button onClick={() => window.location.href = '/auth/facebook'}
              style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '13px 16px', background: 'rgba(24,119,242,0.06)', border: '1px solid rgba(24,119,242,0.2)', borderRadius: '12px', cursor: 'pointer', width: '100%', transition: 'all 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(24,119,242,0.12)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(24,119,242,0.06)'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#1877F2"/><path fill="white" d="M16.67 15.5l.44-2.85h-2.73v-1.85c0-.78.38-1.54 1.6-1.54h1.24V6.8s-1.12-.19-2.2-.19c-2.24 0-3.71 1.36-3.71 3.82v2.22H8.89V15.5h2.42V22.8c.49.07.98.11 1.49.11s1-.04 1.49-.11V15.5h2.38z"/></svg>
              <span style={{ fontSize: '14px', color: '#cbd5e1', fontWeight: '500' }}>Link Facebook Account</span>
              <ChevronRight size={14} color="#334155" style={{ marginLeft: 'auto' }} />
            </button>
          </div>
        </div>
      </Card>

      <Card title="Support">
        <Row icon={HelpCircle}    iconColor="#06b6d4" iconBg="rgba(6,182,212,0.1)"  label="Help & Support" desc="FAQs, guides & troubleshooting"  onClick={() => setView('help')} />
        <Row icon={MessageCircle} iconColor="#3b82f6" iconBg="rgba(59,130,246,0.1)" label="Contact Us"     desc="Email, chat & send feedback"        onClick={() => setView('contact')} />
      </Card>

      <Card title="Danger Zone">
        <Row icon={LogOut} label="Sign Out" desc="Log out of your parent account" danger
          onClick={() => { if (window.confirm('Sign out of ChildShield AI?')) logout(); }}
        />
        <Row icon={Trash2} label="Delete Account" desc="Permanently wipe all data and unpair devices" danger
          onClick={async () => { 
            if (window.confirm('WARNING: This will permanently delete your account, wipe all tracking data, and unpair all child devices. This action cannot be undone. Type "DELETE" to confirm?')) {
              try {
                const res = await fetch('/api/auth/me', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                if(res.ok) { alert('Account deleted successfully.'); logout(); }
                else { alert('Failed to delete account.'); }
              } catch(e) { alert('Network error. Could not delete.'); }
            }
          }}
        />
      </Card>

      <div style={{ textAlign: 'center', fontSize: '12px', color: '#1e293b', paddingBottom: '16px' }}>ChildShield AI · Family Safety Platform · v1.0.0</div>
    </div>
  );
};

export default AccountSettings;
