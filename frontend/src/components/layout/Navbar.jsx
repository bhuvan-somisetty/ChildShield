import React, { useState } from 'react';
import { Bell, User, LogOut, Settings, HelpCircle, ChevronDown, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLivePolling } from '../../hooks/useLivePolling';
import ProfileSettingsModal from './ProfileSettingsModal';

const Navbar = () => {
  const { user, logout, activeChild, childrenList, setActiveChild, isDemoMode, setIsDemoMode } = useAuth();
  const notifications = useLivePolling('/api/notifications') || [];
  
  const [profileOpen, setProfileOpen] = useState(false);
  const [childSelectOpen, setChildSelectOpen] = useState(false);
  const [notiOpen, setNotiOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header style={{
      height: 'var(--navbar-height)', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 32px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'transparent', backdropFilter: 'blur(10px)', zIndex: 50, position: 'relative'
    }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: 'var(--text-primary)' }}>Overview</h1>
        
        {/* Child Selector */}
        {childrenList.length > 0 && (
          <div style={{ position: 'relative' }}>
            <div onClick={() => setChildSelectOpen(!childSelectOpen)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'rgba(0, 240, 255, 0.1)', border: '1px solid var(--accent-cyan)', borderRadius: '16px', cursor: 'pointer', color: 'var(--accent-cyan)', fontWeight: '600', transition: 'all 0.2s', boxShadow: 'var(--shadow-neon-cyan)' }}>
              Viewing: {activeChild?.name} <ChevronDown size={16} />
            </div>
            {childSelectOpen && (
              <div style={{ position: 'absolute', top: '120%', left: 0, background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', zIndex: 100, width: '200px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
                {childrenList.map(child => (
                  <div key={child.id} onClick={() => { setActiveChild(child); setChildSelectOpen(false); }} style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', background: activeChild?.id === child.id ? 'rgba(255,255,255,0.05)' : 'transparent', color: activeChild?.id === child.id ? 'var(--accent-cyan)' : '#fff', transition: 'background 0.2s' }}>
                    {child.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
        
        {/* DEMO MODE TOGGLE */}
        <div 
          onClick={() => setIsDemoMode(!isDemoMode)}
          style={{ 
            display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
            padding: '8px 16px', borderRadius: '20px', transition: 'all 0.3s',
            background: isDemoMode ? 'rgba(176, 38, 255, 0.2)' : 'rgba(255,255,255,0.05)',
            border: isDemoMode ? '1px solid var(--accent-purple)' : '1px solid rgba(255,255,255,0.1)',
            boxShadow: isDemoMode ? '0 0 15px rgba(176, 38, 255, 0.4)' : 'none'
          }}
        >
          <Zap size={16} color={isDemoMode ? 'var(--accent-purple)' : 'var(--text-muted)'} fill={isDemoMode ? 'var(--accent-purple)' : 'none'} />
          <span style={{ fontSize: '12px', fontWeight: 'bold', color: isDemoMode ? 'var(--accent-purple)' : 'var(--text-secondary)' }}>
            DEMO SIMULATION {isDemoMode ? 'ON' : 'OFF'}
          </span>
        </div>

        {/* Dynamic Notifications */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setNotiOpen(!notiOpen)} style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s' }}>
            <Bell size={20} color="var(--text-primary)" />
          </div>
          {unreadCount > 0 && (
            <div style={{ position: 'absolute', top: '-4px', right: '-4px', width: '18px', height: '18px', backgroundColor: 'var(--accent-red)', borderRadius: '50%', border: '2px solid var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold', color: '#fff', boxShadow: 'var(--shadow-neon-red)', animation: 'pulse 1s infinite' }}>
              {unreadCount}
            </div>
          )}
          
          {notiOpen && (
            <div className="animate-fade-in" style={{ position: 'absolute', top: '120%', right: 0, width: '320px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '16px', zIndex: 100, boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}>
               <h3 style={{ fontSize: '16px', marginBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '12px' }}>Live Alerts</h3>
               <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                 {notifications.length === 0 ? <div style={{color:'var(--text-muted)', fontSize:'13px', padding:'12px'}}>No active alerts.</div> : null}
                 {notifications.map(n => (
                   <div key={n.id} style={{
                     padding: '12px', borderRadius: '8px', fontSize: '13px',
                     background: n.severity === 'critical' ? 'rgba(239,68,68,0.1)' : n.severity === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.02)',
                     borderLeft: `3px solid ${n.severity === 'critical' ? 'var(--accent-red)' : n.severity === 'warning' ? '#f59e0b' : 'var(--accent-cyan)'}`
                   }}>
                     <div style={{ marginBottom: '4px', fontWeight: '500', color: '#fff' }}>{n.message}</div>
                     <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(n.time).toLocaleTimeString()}</div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>

        {/* Profile */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setProfileOpen(!profileOpen)} style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', background: 'rgba(255,255,255,0.02)', padding: '6px 16px 6px 6px', borderRadius: '30px', border: '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(45deg, var(--accent-blue), var(--accent-purple))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} color="#fff" />
            </div>
            <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>{user?.fullName || 'Parent'}</div>
            <ChevronDown size={16} color="var(--text-muted)" />
          </div>
          
          {profileOpen && (
            <div className="animate-fade-in" style={{ position: 'absolute', top: '120%', right: 0, width: '220px', background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px', zIndex: 100, boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}>
              <div style={{ padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: '8px' }}>
                <div style={{ fontWeight: '600', fontSize: '14px' }}>{user?.email}</div>
                <div style={{ fontSize: '12px', color: 'var(--accent-cyan)' }}>SaaS Pro Plan</div>
              </div>
              <div 
                onClick={() => { setShowSettings(true); setProfileOpen(false); }} 
                style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff', fontSize: '14px', marginTop: '4px', transition: 'background 0.2s' }}
              >
                <Settings size={16} /> Account Settings
              </div>
              <div onClick={logout} style={{ padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-red)', fontSize: '14px', marginTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', transition: 'background 0.2s' }}>
                <LogOut size={16} /> Sign Out
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showSettings && <ProfileSettingsModal onClose={() => setShowSettings(false)} />}
    </header>
  );
};

export default Navbar;
