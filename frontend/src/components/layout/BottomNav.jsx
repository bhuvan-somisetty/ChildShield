import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, MapPin, Shield, User } from 'lucide-react';

const navItems = [
  { name: 'Controls', path: '/controls',  Icon: Shield },
  { name: 'Activity', path: '/history',   Icon: History },
  { name: 'Location', path: '/location',  Icon: MapPin },
  { name: 'Home',     path: '/dashboard', Icon: LayoutDashboard },
  { name: 'Profile',  path: '/account-settings', Icon: User },
];

const BottomNav = () => (
  <nav className="bottom-nav" aria-label="Bottom navigation">
    {navItems.map(({ name, path, Icon }) => (
      <NavLink
        key={name}
        to={path}
        style={({ isActive }) => ({
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '3px',
          textDecoration: 'none',
          color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)',
          fontSize: '10px',
          fontWeight: isActive ? '700' : '500',
          transition: 'color 0.2s',
          position: 'relative',
          padding: '8px 10px',
          minWidth: '48px',
          flex: 1,
          justifyContent: 'center',
        })}
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <div style={{
                position: 'absolute',
                top: '0px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '28px',
                height: '3px',
                borderRadius: '0 0 3px 3px',
                background: 'var(--accent-cyan)',
                boxShadow: '0 2px 10px rgba(0,240,255,0.5)',
              }} />
            )}
            <Icon size={21} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className="bottom-nav-label" style={{
              fontSize: '10px',
              fontWeight: isActive ? '700' : '500',
              letterSpacing: '0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
            }}>
              {name}
            </span>
          </>
        )}
      </NavLink>
    ))}
  </nav>
);

export default BottomNav;
