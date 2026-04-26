import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { user, loading, token } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', flexDirection: 'column', gap: '16px'
      }}>
        <div style={{
          width: '44px', height: '44px',
          border: '3px solid rgba(0, 240, 255, 0.15)',
          borderTopColor: 'var(--accent-cyan)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Loading session…</span>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Not logged in → login page
  if (!user || !token) return <Navigate to="/login" replace />;

  // Logged in but hasn't set control password yet → block and redirect
  if (user.needsPasswordSetup) return <Navigate to="/setup-password" replace />;

  return children;
};

export default ProtectedRoute;
