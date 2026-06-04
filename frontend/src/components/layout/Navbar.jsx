import React, { useState, useEffect } from 'react';
import { Bell, User, LogOut, Settings, ChevronDown, Zap, ShieldCheck, AlertTriangle, Menu } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from './ConfirmationModal';

const Navbar = () => {
  const { user, logout, activeChild, childrenList, setActiveChild, isDemoMode, setIsDemoMode, token, accounts, switchAccount } = useAuth();
  const notifications = useLivePolling('/api/notifications') || [];
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [childSelectOpen, setChildSelectOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Logout modal state "” step: 'password' | 'confirm'
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
      let d;
      try {
        const text = await r.text();
        d = JSON.parse(text);
      } catch (e) {
        throw new Error('Server unavailable - please try again in a moment.');
      }
      if (r.ok && d.success) {
        setLogoutStep('confirm');
      } else if (r.status >= 500) {
        setLogoutErr('Server is waking up. Please try again in a few seconds.');
      } else {
        setLogoutErr(d.error || 'Incorrect password.');
      }
    } catch (e) {
      setLogoutErr('Could not connect to server. Please try again.');
    }
    setLogoutLoading(false);
  };

  const handleConfirmLogout = () => {
    closeLogout();
    logout();
    navigate('/login');
  };

  return (
    <>
      <header 
        className="fixed top-0 left-0 right-0 z-[30] h-16 bg-[#0b0b14]/75 backdrop-blur-xl border-b border-white/5 flex items-center justify-between px-4"
        style={{ boxSizing: 'border-box' }}
      >
        {/* Left Side: Brand Logo and Pulsing protection active indicator */}
        <div className="flex items-center gap-3 min-w-0">
          {isMobile && (
            <button 
              onClick={() => window.dispatchEvent(new Event('toggle-mobile-sidebar'))}
              className="p-1 text-slate-400 hover:text-white cursor-pointer mr-1"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              {/* Premium Shield Icon */}
              <div className="w-5 h-5 rounded bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center shadow-[0_0_8px_rgba(6,182,212,0.4)]">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z" fill="#fff" />
                </svg>
              </div>
              <span className="text-[15px] font-extrabold text-white tracking-tight">
                Alpha<span className="text-cyan-400">Guard</span> <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-1 rounded">AI</span>
              </span>
            </div>
            {/* Active Protection Badge */}
            <div className="flex items-center gap-1 mt-0.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
              </span>
              <span className="text-[8px] font-bold text-emerald-400 tracking-wider uppercase">
                Premium Protection Active
              </span>
            </div>
          </div>

          {/* Child Selector Dropdown */}
          {childrenList.length > 0 && (
            <div className="relative ml-2">
              <div 
                onClick={() => setChildSelectOpen(!childSelectOpen)}
                className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 border border-cyan-500/30 rounded-full cursor-pointer text-cyan-400 font-bold text-[11px] whitespace-nowrap overflow-hidden max-w-[120px]"
              >
                <span className="truncate">{activeChild?.name}</span>
                <ChevronDown size={11} className="flex-shrink-0" />
              </div>
              {childSelectOpen && (
                <div className="absolute top-[110%] left-0 bg-[#12121e]/95 border border-white/10 rounded-xl p-1 z-[250] min-w-[140px] shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md">
                  {childrenList.map(child => (
                    <div 
                      key={child.id} 
                      onClick={() => { setActiveChild(child); setChildSelectOpen(false); }}
                      className={`px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold ${activeChild?.id === child.id ? 'bg-cyan-500/15 text-cyan-400' : 'text-slate-300 hover:bg-white/5'}`}
                    >
                      {child.name}
                    </div>
                  ))}
                  <div 
                    onClick={() => { setActiveChild(null); setChildSelectOpen(false); navigate('/controls'); }}
                    className="px-3 py-2 rounded-lg cursor-pointer flex items-center gap-1.5 text-xs text-slate-400 hover:bg-white/5 mt-1 border-t border-white/5"
                  >
                    <span>+</span> Add Device
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Search, Bell Notification, and Profile Avatar */}
        <div className="flex items-center gap-3">
          
          {/* Search Trigger */}
          <button 
            onClick={() => navigate('/controls')}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 text-slate-300 hover:text-white cursor-pointer"
            aria-label="Search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </button>

          {/* Notifications Bell */}
          <div className="relative">
            <div 
              onClick={() => setNotiOpen(!notiOpen)} 
              className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5 cursor-pointer text-slate-300 hover:text-white"
            >
              <Bell size={15} />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full border-2 border-[#0b0b14] flex items-center justify-center text-[8px] font-extrabold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
            {notiOpen && (
              <div className="absolute top-[120%] right-0 w-72 bg-[#12121e]/95 border border-white/10 rounded-xl p-4 z-[250] shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-md">
                <h3 className="text-xs font-bold mb-3 border-b border-white/5 pb-2 text-white">Live Alerts</h3>
                <div className="max-h-60 overflow-y-auto flex flex-col gap-2">
                  {notifications.length === 0 && (
                    <div className="text-slate-400 text-xs py-3 text-center">No active alerts.</div>
                  )}
                  {notifications.map(n => (
                    <div 
                      key={n.id} 
                      className={`p-2.5 rounded-lg text-[11px] border-l-2 ${n.severity === 'critical' ? 'bg-red-500/10 border-red-500 text-red-200' : n.severity === 'warning' ? 'bg-amber-500/10 border-amber-500 text-amber-200' : 'bg-white/5 border-cyan-500 text-slate-300'}`}
                    >
                      <div className="font-semibold mb-1">{n.message}</div>
                      <div className="text-[9px] opacity-60">{new Date(n.time).toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Parent Avatar Dropdown */}
          <div className="relative">
            <div 
              onClick={() => {
                if (isMobile) {
                  window.dispatchEvent(new Event('toggle-mobile-sidebar'));
                } else {
                  setProfileOpen(!profileOpen);
                }
              }} 
              className="flex items-center gap-1.5 cursor-pointer bg-white/5 pl-1.5 pr-2.5 py-1.5 rounded-full border border-white/5 hover:border-white/10 transition-all duration-200"
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-[10px] font-bold text-white shadow-sm overflow-hidden">
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'P'}
              </div>
              <ChevronDown size={11} className="text-slate-400 flex-shrink-0" />
            </div>

            {profileOpen && !isMobile && (
              <div className="absolute top-[120%] right-0 w-52 bg-[#12121e]/95 border border-white/10 rounded-xl p-1 z-[250] shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md">
                <div className="px-3 py-2.5 border-b border-white/5 mb-1.5">
                  <div className="font-bold text-xs text-white truncate">{user?.fullName || 'Parent'}</div>
                  <div className="text-[10px] text-slate-400 truncate mt-0.5">{user?.email || ''}</div>
                </div>

                <div 
                  onClick={() => { navigate('/account-settings'); setProfileOpen(false); }}
                  className="px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-xs text-slate-300 hover:bg-white/5"
                >
                  <Settings size={13} className="text-slate-400" /> Account Settings
                </div>
                
                <div 
                  onClick={() => { setShowSignOutConfirm(true); setProfileOpen(false); }}
                  className="px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-xs text-slate-300 hover:bg-white/5"
                >
                  <LogOut size={13} className="text-slate-400" /> Sign Out
                </div>

                <div 
                  onClick={openLogout}
                  className="px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2 text-xs text-red-400 hover:bg-red-500/10 mt-1 border-t border-white/5"
                >
                  <AlertTriangle size={13} /> Delete Account
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
                <AlertTriangle size={44} color="#ef4444" style={{ marginBottom: '14px' }} />
                <h3 style={{ color: '#fff', fontSize: '20px', fontWeight: '800', marginBottom: '6px' }}>Delete Account</h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '20px', lineHeight: 1.5 }}>
                  Enter your Parent Control Password to authorize account deletion.
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
                  Do you want to download a session report before deleting your account?
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => {
                      const reportData = `AlphaGuard Report\n\nParent: ${user?.fullName}\nChild: ${activeChild?.name || 'All'}\nDate: ${new Date().toLocaleString()}\n\nNote: Detailed analytics available in the dashboard.`;
                      const blob = new Blob([reportData], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `AlphaGuard_Report_${new Date().getTime()}.txt`;
                      a.click();
                      setLogoutStep('downloaded');
                    }}
                    style={{ background: 'var(--accent-blue)', border: 'none', padding: '14px', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    Download Report
                  </button>
                  <button onClick={async () => {
                      try {
                        const tok = token || localStorage.getItem('cs_token');
                        await fetch('/api/auth/me', { method: 'DELETE', headers: { 'Authorization': `Bearer ${tok}` } });
                      } catch(e) {}
                      handleConfirmLogout();
                    }}
                    style={{ background: '#ef4444', border: 'none', padding: '14px', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    Skip & Delete Account
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
                  Continue to delete account?
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button onClick={closeLogout}
                    style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '10px', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px' }}>
                    Cancel
                  </button>
                  <button onClick={async () => {
                      try {
                        const tok = token || localStorage.getItem('cs_token');
                        await fetch('/api/auth/me', { method: 'DELETE', headers: { 'Authorization': `Bearer ${tok}` } });
                      } catch(e) {}
                      handleConfirmLogout();
                    }}
                    style={{ flex: 2, background: '#ef4444', border: 'none', padding: '12px', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    Delete Account
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={showSignOutConfirm}
        onClose={() => setShowSignOutConfirm(false)}
        onConfirm={() => {
          setShowSignOutConfirm(false);
          logout();
          navigate('/login');
        }}
        title="Sign Out"
        message="Are you sure you want to sign out of AlphaGuard AI?"
        confirmText="Sign Out"
        cancelText="Cancel"
      />
    </>
  );
};

export default Navbar;



