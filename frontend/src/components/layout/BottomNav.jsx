import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Activity, BarChart2, Shield, User } from 'lucide-react';

const BottomNav = () => {
  const navItems = [
    { name: 'Home', path: '/', icon: <LayoutDashboard size={22} /> },
    { name: 'Activity', path: '/history', icon: <Activity size={22} /> },
    { name: 'Analytics', path: '/analytics', icon: <BarChart2 size={22} /> },
    { name: 'Controls', path: '/controls', icon: <Shield size={22} /> },
    { name: 'Reports', path: '/reports', icon: <User size={22} /> }
  ];

  return (
    <nav className="bottom-nav">
      {navItems.map((item) => (
        <NavLink 
          key={item.name} 
          to={item.path} 
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          {item.icon}
          <span>{item.name}</span>
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
