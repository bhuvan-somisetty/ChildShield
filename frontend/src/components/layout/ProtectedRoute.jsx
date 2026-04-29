import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ShieldCheck } from 'lucide-react';

const ProtectedRoute = ({ children }) => {
  const { user, loading, token } = useAuth();

  if (loading) {
    return (
      <div style={{
        height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', flexDirection: 'column', gap: '20px'
      }}>
        {/* Premium Shield Animation */}
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(16,185,129,0.1))',
          border: '2px solid var(--accent-primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(37,99,235,0.35)',
          animation: 'shieldPulse 2s ease-in-out infinite'
        }}>
          <ShieldCheck size={36} color="var(--accent-primary)" />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ color: '#fff', fontWeight: '700', fontSize: '15px', marginBottom: '6px' }}>Securing your session...</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Waking AlphaGuard AI... please wait</p>
        </div>
        <style>{`
          @keyframes shieldPulse {
            0%, 100% { box-shadow: 0 0 20px rgba(37,99,235,0.3); transform: scale(1); }
            50% { box-shadow: 0 0 50px rgba(37,99,235,0.6); transform: scale(1.05); }
          }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Not logged in -> login page
  if (!user || !token) return <Navigate to="/login" replace />;

  // Logged in but hasn't set control password yet -> block and redirect
  if (user.needsPasswordSetup) return <Navigate to="/setup-password" replace />;

  return children;
};

export default ProtectedRoute;
