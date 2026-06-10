import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, PieChart, Shield, FileText, Brain, Settings, MapPin, Camera, Mic, Monitor, ShieldCheck, X, AlertTriangle } from 'lucide-react';

const Sidebar = ({ isOpenMobile, onCloseMobile, isMobile }) => {
  const mainNav = [
    { name: 'Controls',        icon: Shield,          path: '/controls' },
    { name: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard' },
    { name: 'AI Insights',     icon: Brain,           path: '/ai-insights', gold: true },
    { name: 'Watch History',   icon: History,         path: '/history' },
    { name: 'Analytics',       icon: PieChart,        path: '/analytics' },
    { name: 'Reports',         icon: FileText,        path: '/reports' },
    { name: 'Location',        icon: MapPin,          path: '/location' },
    { name: 'Emergency Center', icon: AlertTriangle,   path: '/emergency' },
  ];

  const monitoringNav = [
    { name: 'Camera',          icon: Camera,          path: '/camera' },
    { name: 'Audio',           icon: Mic,             path: '/audio' },
    { name: 'Screen View',     icon: Monitor,         path: '/screen' },
  ];

  const renderLink = (item) => (
    <NavLink
      key={item.name}
      to={item.path}
      onClick={() => { if (isMobile && onCloseMobile) onCloseMobile(); }}
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: 'var(--radius-md)',
        textDecoration: 'none', color: isActive ? (item.gold ? '#2563eb' : '#fff') : 'var(--text-secondary)',
        background: isActive ? (item.gold ? 'rgba(37,99,235,0.1)' : 'rgba(37,99,235, 0.08)') : 'transparent',
        borderLeft: isActive ? `3px solid ${item.gold ? '#2563eb' : '#22d3ee'}` : '3px solid transparent',
        transition: 'all 0.2s', fontWeight: isActive ? '700' : '500',
        boxShadow: isActive && item.gold ? 'inset 20px 0 20px -20px rgba(37,99,235,0.2)' : 'none'
      })}
    >
      <item.icon size={20} style={{ marginRight: '16px', color: 'inherit' }} />
      {item.name}
      {item.gold && (
        <span style={{
          marginLeft: 'auto', fontSize: '9px', fontWeight: '800', letterSpacing: '0.4px',
          color: '#2563eb', background: 'rgba(37,99,235,0.15)',
          border: '1px solid rgba(37,99,235,0.3)', borderRadius: '6px',
          padding: '2px 6px'
        }}>AI</span>
      )}
    </NavLink>
  );

  return (
    <>
      {isMobile && isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            zIndex: 9999, transition: 'all 0.3s'
          }}
        />
      )}
      <aside style={{
        width: 'var(--sidebar-width)', height: '100%',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex', flexDirection: 'column',
        padding: '24px 16px', zIndex: 10000,
        overflowY: 'auto', overflowX: 'hidden',
        ...(isMobile ? {
          position: 'fixed',
          left: isOpenMobile ? '0' : '-260px',
          top: 0,
          bottom: 0,
          width: '260px',
          transition: 'left 0.3s ease-in-out',
        } : {})
      }}>
        {/* Brand Logo - AlphaGuard AI */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', padding: '0 12px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(239,68,68,0.15))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px',
            border: '1px solid rgba(37,99,235,0.3)',
            boxShadow: '0 0 16px rgba(37,99,235,0.2)'
          }}>
            <ShieldCheck size={20} color="#2563eb" />
          </div>
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '-0.3px', lineHeight: 1 }}>
              Alpha<span style={{ color: '#2563eb' }}>Guard</span>
            </h2>
            <div style={{ fontSize: '9px', color: 'rgba(37,99,235,0.6)', fontWeight: '700', letterSpacing: '1px', marginTop: '2px' }}>
              AI PARENTING
            </div>
          </div>
          {isMobile && (
            <button 
              onClick={onCloseMobile} 
              style={{ 
                marginLeft: 'auto', 
                background: 'transparent', 
                border: 'none', 
                color: 'var(--text-secondary)', 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px'
              }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {mainNav.map(renderLink)}

          {/* Monitoring section */}
          <div style={{ margin: '16px 0 8px', padding: '0 16px' }}>
            <span style={{ fontSize: '10px', color: '#475569', fontWeight: '700', letterSpacing: '0.12em' }}>MONITORING</span>
          </div>
          {monitoringNav.map(renderLink)}

          {/* Settings at bottom of nav */}
          <div style={{ marginTop: 'auto', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <button
              onClick={() => {
                window.dispatchEvent(new Event('open-ai-assistant'));
                if (isMobile && onCloseMobile) onCloseMobile();
              }}
              style={{
                display: 'flex', alignItems: 'center', padding: '12px 16px',
                borderRadius: 'var(--radius-md)', background: 'transparent', border: 'none',
                color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500', width: '100%', transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.color = '#2563eb'}
              onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              <span style={{ marginRight: '16px' }}>✨</span>
              Voice Assistant
            </button>
            {renderLink({ name: 'Account Settings', icon: Settings, path: '/account-settings' })}
          </div>
        </div>
        
        {/* Mini Status Card */}
        <div style={{ padding: '14px 16px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#2563eb', boxShadow: '0 0 8px #2563eb' }}></div>
            <span style={{ fontSize: '13px', color: '#fff', fontWeight: '700' }}>AlphaGuard Active</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI monitoring online</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
