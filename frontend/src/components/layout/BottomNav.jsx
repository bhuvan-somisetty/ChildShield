import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, MapPin, Shield, User } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { name: 'Controls', path: '/controls',  icon: Shield },
    { name: 'Activity', path: '/history',   icon: History },
    { name: 'Location', path: '/location',  icon: MapPin },
    { name: 'Home',     path: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile',  path: '/account-settings', icon: User }
  ];

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-around',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
      backdropFilter: 'blur(20px)',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)'
    }}>
      {navItems.map(({ name, path, icon: Icon }) => (
        <NavLink
          key={name}
          to={path}
          style={({ isActive }) => ({
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
            textDecoration: 'none',
            color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontSize: '10px', fontWeight: isActive ? '700' : '500',
            transition: 'all 0.2s',
            position: 'relative',
            padding: '6px 12px'
          })}
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <div style={{
                  position: 'absolute', top: '-1px', width: '24px', height: '3px',
                  borderRadius: '0 0 3px 3px', background: 'var(--accent-cyan)',
                  boxShadow: '0 2px 8px rgba(0,240,255,0.4)'
                }} />
              )}
              <Icon size={22} />
              <span>{name}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
