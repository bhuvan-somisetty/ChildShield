import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, PieChart, Shield, FileText, Activity } from 'lucide-react';
import classNames from 'classnames';

const Sidebar = () => {
  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Watch History', icon: History, path: '/history' },
    { name: 'Analytics', icon: PieChart, path: '/analytics' },
    { name: 'Controls', icon: Shield, path: '/controls' },
    { name: 'Reports', icon: FileText, path: '/reports' },
  ];

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      height: '100%',
      backgroundColor: 'var(--bg-secondary)',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      display: 'flex',
      flexDirection: 'column',
      padding: '24px 16px',
      zIndex: 10
    }}>
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '40px', padding: '0 12px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
          display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '12px',
          boxShadow: 'var(--shadow-neon-cyan)'
        }}>
          <Activity size={18} color="#fff" />
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: '700', letterSpacing: '-0.5px' }}>
          Child<span className="text-glow-cyan" style={{ color: 'var(--accent-cyan)' }}>Shield</span>
        </h2>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', padding: '12px 16px', borderRadius: 'var(--radius-md)',
              textDecoration: 'none', color: isActive ? '#fff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(0, 240, 255, 0.1)' : 'transparent',
              borderLeft: isActive ? '3px solid var(--accent-cyan)' : '3px solid transparent',
              transition: 'all 0.2s', fontWeight: isActive ? '600' : '500',
              boxShadow: isActive ? 'inset 20px 0 20px -20px rgba(0, 240, 255, 0.3)' : 'none'
            })}
          >
            <item.icon size={20} style={{ marginRight: '16px', color: 'inherit' }} />
            {item.name}
          </NavLink>
        ))}
      </div>
      
      {/* Mini Status Card at bottom */}
      <div className="glass-card" style={{ padding: '16px', marginTop: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)' }}></div>
          <span style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '600' }}>System Online</span>
        </div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          Syncing mock intelligence
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
