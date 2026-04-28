import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, PieChart, Shield, FileText, Brain, Settings, MapPin, Camera, Mic, Monitor, ShieldCheck } from 'lucide-react';

const Sidebar = () => {
  const mainNav = [
    { name: 'Controls',        icon: Shield,          path: '/controls' },
    { name: 'Dashboard',       icon: LayoutDashboard, path: '/dashboard' },
    { name: 'AI Insights',     icon: Brain,           path: '/ai-insights', gold: true },
    { name: 'Watch History',   icon: History,         path: '/history' },
    { name: 'Analytics',       icon: PieChart,        path: '/analytics' },
    { name: 'Reports',         icon: FileText,        path: '/reports' },
    { name: 'Location',        icon: MapPin,          path: '/location' },
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
      style={({ isActive }) => ({
        display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: 'var(--radius-md)',
        textDecoration: 'none', color: isActive ? (item.gold ? '#c9a84c' : '#fff') : 'var(--text-secondary)',
        background: isActive ? (item.gold ? 'rgba(201,168,76,0.1)' : 'rgba(0, 240, 255, 0.08)') : 'transparent',
        borderLeft: isActive ? `3px solid ${item.gold ? '#c9a84c' : 'var(--accent-cyan)'}` : '3px solid transparent',
        transition: 'all 0.2s', fontWeight: isActive ? '700' : '500',
        boxShadow: isActive && item.gold ? 'inset 20px 0 20px -20px rgba(201,168,76,0.2)' : 'none'
      })}
    >
      <item.icon size={20} style={{ marginRight: '16px', color: 'inherit' }} />
      {item.name}
      {item.gold && (
        <span style={{
          marginLeft: 'auto', fontSize: '9px', fontWeight: '800', letterSpacing: '0.4px',
          color: '#c9a84c', background: 'rgba(201,168,76,0.15)',
          border: '1px solid rgba(201,168,76,0.3)', borderRadius: '6px',
          padding: '2px 6px'
        }}>AI</span>
      )}
    </NavLink>
  );

  return (
    <aside style={{
      width: 'var(--sidebar-width)', height: '100%',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex', flexDirection: 'column',
      padding: '24px 16px', zIndex: 10,
      overflowY: 'auto', overflowX: 'hidden'
    }}>
      {/* Brand Logo — AlphaGuard AI */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', padding: '0 12px' }}>
        <div style={{
          width: '36px', height: '36px', borderRadius: '10px',
          background: 'linear-gradient(135deg, rgba(201,168,76,0.2), rgba(239,68,68,0.15))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px',
          border: '1px solid rgba(201,168,76,0.3)',
          boxShadow: '0 0 16px rgba(201,168,76,0.2)'
        }}>
          <ShieldCheck size={20} color="#c9a84c" />
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: '900', letterSpacing: '-0.3px', lineHeight: 1 }}>
            Alpha<span style={{ color: '#c9a84c' }}>Guard</span>
          </h2>
          <div style={{ fontSize: '9px', color: 'rgba(201,168,76,0.6)', fontWeight: '700', letterSpacing: '1px', marginTop: '2px' }}>
            AI PARENTING
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {mainNav.map(renderLink)}

        {/* Monitoring section */}
        <div style={{ margin: '16px 0 8px', padding: '0 16px' }}>
          <span style={{ fontSize: '10px', color: '#334155', fontWeight: '700', letterSpacing: '0.12em' }}>MONITORING</span>
        </div>
        {monitoringNav.map(renderLink)}

        {/* Settings at bottom of nav */}
        <div style={{ marginTop: 'auto', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <button
            onClick={() => window.dispatchEvent(new Event('open-ai-assistant'))}
            style={{
              display: 'flex', alignItems: 'center', padding: '12px 16px',
              borderRadius: 'var(--radius-md)', background: 'transparent', border: 'none',
              color: 'var(--text-secondary)', cursor: 'pointer', fontWeight: '500', width: '100%', transition: 'all 0.2s'
            }}
            onMouseOver={e => e.currentTarget.style.color = '#c9a84c'}
            onMouseOut={e => e.currentTarget.style.color = 'var(--text-secondary)'}
          >
            <span style={{ marginRight: '16px' }}>✨</span>
            Voice Assistant
          </button>
          {renderLink({ name: 'Account Settings', icon: Settings, path: '/account-settings' })}
        </div>
      </div>
      
      {/* Mini Status Card */}
      <div className="glass-card" style={{ padding: '14px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#c9a84c', boxShadow: '0 0 8px #c9a84c' }}></div>
          <span style={{ fontSize: '13px', color: '#fff', fontWeight: '700' }}>AlphaGuard Active</span>
        </div>
        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>AI monitoring online</div>
      </div>
    </aside>
  );
};

export default Sidebar;
