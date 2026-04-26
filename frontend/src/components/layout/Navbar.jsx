import React, { useState } from 'react';
import { Bell, User, LogOut, Settings, ChevronDown, Zap, ShieldCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
  const { user, logout, activeChild, childrenList, setActiveChild, isDemoMode, setIsDemoMode, token } = useAuth();
  const notifications = useLivePolling('/api/notifications') || [];
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [childSelectOpen, setChildSelectOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);

  // Logout modal state — step: 'password' | 'confirm'
  const [logoutStep, setLogoutStep] = useState('password');
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const [logoutPin, setLogoutPin] = useState('');
  const [logoutErr, setLogoutErr] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const openLogout = () => {
    setLogoutModalOpen(true);
    setLogoutStep('password');
    setLogoutPin('');
    setLogoutErr('');
    setProfileOpen(false);
  };

  const closeLogout = () => {
    setLogoutModalOpen(false);
    setLogoutStep('password');
    setLogoutPin('');
    setLogoutErr('');
  };

  const handleVerifyPassword = async () => {
    if (!logoutPin) return setLogoutErr('Password required');
    setLogoutLoading(true);
    setLogoutErr('');
    try {
      const tok = token || localStorage.getItem('cs_token');
      const r = await fetch('/api/auth/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tok}` },
        body: JSON.stringify({ parentControlPassword: logoutPin })
      });
      const d = await r.json();
      if (r.ok && d.success) {
        setLogoutStep('confirm'); // move to confirmation step
      } else {
        setLogoutErr(d.error || 'Incorrect password.');
      }
    } catch (e) {
      setLogoutErr('Could not connect to server. Please try again.');
    }
    setLogoutLoading(false);
  };

  const handleConfirmLogout = async () => {
    try {
      const tok = token || localStorage.getItem('cs_token');
      await fetch('/api/auth/me', { method: 'DELETE', headers: { 'Authorization': `Bearer ${tok}` } });
    } catch (e) {
      // ignore
    }
    closeLogout();
    logout();
    navigate('/login');
  };

  return (
    <>
      <header style={{
        height: 'var(--navbar-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', borderBottom: '1px solid rgba(255,255,255,0.05)',
      backgroundColor: 'transparent', backdropFilter: 'blur(10px)', zIndex: 50, position: 'relative'
    }}>
      {/* Left — title + child selector */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Overview</h1>

        {childrenList.length > 0 && (
          <div style={{ position: 'relative' }}>
            <div onClick={() => setChildSelectOpen(!childSelectOpen)}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(0,240,255,0.1)', border: '1px solid var(--accent-cyan)', borderRadius: '16px', cursor: 'pointer', color: 'var(--accent-cyan)', fontWeight: '600', transition: 'all 0.2s', boxShadow: 'var(--shadow-neon-cyan)' }}>
              Viewing: {activeChild?.name} <ChevronDown size={16} />
            </div>
            {childSelectOpen && (
              <div style={{ position: 'absolute', top: '120%', left: 0, background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', zIndex: 100, width: '200px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                {childrenList.map(child => (
                  <div key={child.id} onClick={() => { setActiveChild(child); setChildSelectOpen(false); }}
                    style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: activeChild?.id === child.id ? 'rgba(255,255,255,0.05)' : 'transparent', color: activeChild?.id === child.id ? 'var(--accent-cyan)' : '#fff', transition: 'background 0.2s' }}>
                    {child.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right — demo toggle, notifications, profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>

        {/* Demo mode toggle */}
        <div onClick={() => setIsDemoMode(!isDemoMode)} style={{
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
          padding: '8px 16px', borderRadius: '20px', transition: 'all 0.3s',
          background: isDemoMode ? 'rgba(176,38,255,0.2)' : 'rgba(255,255,255,0.05)',
          border: isDemoMode ? '1px solid var(--accent-purple)' : '1px solid rgba(255,255,255,0.1)',
          boxShadow: isDemoMode ? '0 0 15px rgba(176,38,255,0.4)' : 'none'
        }}>
          <Zap size={16} color={isDemoMode ? 'var(--accent-purple)' : 'var(--text-muted)'} fill={isDemoMode ? 'var(--accent-purple)' : 'none'} />
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: isDemoMode ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>
            DEMO {isDemoMode ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* Notifications */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setNotiOpen(!notiOpen)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Bell size={20} color="var(--text-primary)" />
          </div>
          {unreadCount > 0 && (
            <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', backgroundColor: 'var(--accent-red)', borderRadius: '50%', border: '2px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: '#fff' }}>
              {unreadCount}
            </div>
          )}
          {notiOpen && (
            <div style={{ position: 'absolute', top: '120%', right: 0, width: '320px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
              <h3 style={{ fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>Live Alerts</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications.length === 0 && <div style={{ color: 'var(--text-muted)', fontSize: '13px', padding: '12px' }}>No active alerts.</div>}
                {notifications.map(n => (
                  <div key={n.id} style={{ padding: '12px', borderRadius: '8px', fontSize: '13px', background: n.severity === 'critical' ? 'rgba(239,68,68,0.1)' : n.severity === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)', borderLeft: `3px solid ${n.severity === 'critical' ? 'var(--accent-red)' : n.severity === 'warning' ? '#f59e0b' : 'var(--accent-cyan)'}` }}>
                    <div style={{ fontWeight: '500', color: '#fff', marginBottom: '4px' }}>{n.message}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(n.time).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setProfileOpen(!profileOpen)} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)', padding: '6px 14px 6px 6px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.06)', transition: 'all 0.2s' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="#fff" />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.fullName || 'Parent'}</span>
            <ChevronDown size={15} color="var(--text-muted)" />
          </div>

          {profileOpen && (
            <div style={{ position: 'absolute', top: '120%', right: 0, width: '220px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '8px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.6)' }}>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '6px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px', color: '#fff' }}>{user?.fullName}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{user?.email}</div>
              </div>
              <div
                onClick={() => { navigate('/account-settings'); setProfileOpen(false); }}
                style={{ padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: '#fff', fontSize: '14px', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Settings size={16} color="var(--text-muted)" /> Account Settings
              </div>
              <div
                onClick={openLogout}
                style={{ padding: '10px 14px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-red)', fontSize: '14px', marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <LogOut size={16} /> Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
      </header>

      {/* ── Logout Modal ───────────────────────────────────────────────────────── */}
      {logoutModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div style={{ background: '#0f172a', border: '1px solid rgba(239,68,68,0.4)', padding: '32px 28px', borderRadius: '20px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 10px 40px rgba(239,68,68,0.2)', boxSizing: 'border-box' }}>

            {/* STEP 1: Enter password */}
            {logoutStep === 'password' && (
              <>
                <LogOut size={44} color="#ef4444" style={{ marginBottom: '14px' }} />
                <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Sign Out</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
                  Enter your Parent Control Password to sign out.
                </p>

                {logoutErr && (
                  <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '10px 14px', borderRadius: '8px', fontSize: '13px', marginBottom: '14px', border: '1px solid rgba(239,68,68,0.2)' }}>
                    {logoutErr}
                  </div>
                )}

                <input
                  type="password"
                  value={logoutPin}
                  onChange={e => setLogoutPin(e.target.value)}
                  placeholder="Parent Control Password"
                  autoFocus
                  style={{ width: '100%', padding: '14px', background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#fff', fontSize: '15px', marginBottom: '20px', textAlign: 'center', outline: 'none', boxSizing: 'border-box' }}
                  onKeyDown={e => { if (e.key === 'Enter') handleVerifyPassword(); }}
                />

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={closeLogout}
                    style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px' }}>
                    Cancel
                  </button>
                  <button onClick={handleVerifyPassword} disabled={logoutLoading}
                    style={{ flex: 2, background: '#ef4444', border: 'none', padding: '12px', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: logoutLoading ? 'not-allowed' : 'pointer', fontSize: '14px', opacity: logoutLoading ? 0.7 : 1 }}>
                    {logoutLoading ? 'Verifying...' : 'Verify & Continue'}
                  </button>
                </div>
              </>
            )}

            {/* STEP 2: Confirmation */}
            {logoutStep === 'confirm' && (
              <>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <AlertTriangle size={32} color="#ef4444" />
                </div>
                <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Before you continue</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>
                  Do you want to download a session report before signing out?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => {
                      const reportData = `ChildShield Report\n\nParent: ${user?.fullName}\nChild: ${activeChild?.name || 'All'}\nDate: ${new Date().toLocaleString()}\n\nNote: Detailed analytics available in the dashboard.`;
                      const blob = new Blob([reportData], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `ChildShield_Report_${new Date().getTime()}.txt`;
                      a.click();
                      setLogoutStep('downloaded');
                    }}
                    style={{ background: 'var(--accent-blue)', border: 'none', padding: '14px', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    Download Report
                  </button>
                  <button onClick={handleConfirmLogout}
                    style={{ background: '#ef4444', border: 'none', padding: '14px', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    Continue Without Download
                  </button>
                  <button onClick={closeLogout}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px' }}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: Post Download Confirmation */}
            {logoutStep === 'downloaded' && (
              <>
                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '2px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <ShieldCheck size={32} color="#10b981" />
                </div>
                <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>Report downloaded.</h3>
                <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>
                  Continue to logout?
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={closeLogout}
                    style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px' }}>
                    Cancel
                  </button>
                  <button onClick={handleConfirmLogout}
                    style={{ flex: 2, background: '#ef4444', border: 'none', padding: '12px', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    Logout
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;



