import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import BottomNav from './components/layout/BottomNav';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AIAssistant from './components/AIAssistant';
import EmergencyListener from './components/EmergencyListener';
import LogoutApprovalListener from './components/LogoutApprovalListener';
import PermissionRequest from './components/PermissionRequest';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import WatchHistory from './pages/WatchHistory';
import Analytics from './pages/Analytics';
import Controls from './pages/Controls';
import Reports from './pages/Reports';
import AIInsights from './pages/AIInsights';
import LocationTracker from './pages/LocationTracker';
import AccountSettings from './pages/AccountSettings';
import CameraView from './pages/CameraView';
import AudioListener from './pages/AudioListener';
import ScreenView from './pages/ScreenView';

// Public/Auth Pages
import Welcome from './pages/public/Welcome';
import Onboarding from './pages/public/Onboarding';
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import OAuthCallback from './pages/public/OAuthCallback';
import SetupPassword from './pages/public/SetupPassword';
import ChildSetup from './pages/public/ChildSetup';
import ChildPairing from './pages/public/ChildPairing';
import PairingSetup from './pages/child/PairingSetup';
import ChildDeviceView from './pages/child/ChildDeviceView';
import ChildPermissionWizard from './pages/child/ChildPermissionWizard';

// â”€â”€â”€ useIsMobile hook â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const useIsMobile = () => {
  const [mobile, setMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return mobile;
};

const AppLayout = () => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [isLoader, setIsLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoader(false), 600);
    return () => clearTimeout(timer);
  }, []);

  if (isLoader) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f', gap: '20px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(16,185,129,0.1))',
          border: '2px solid #2563eb',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 40px rgba(37,99,235,0.35)',
          animation: 'shieldBoot 2s ease-in-out infinite'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.35C17.25 22.15 21 17.25 21 12V7L12 2z"
              fill="rgba(37,99,235,0.9)" stroke="#2563eb" strokeWidth="1.5"/>
          </svg>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontSize: '15px', fontWeight: '700', marginBottom: '6px' }}>AlphaGuard AI</div>
          <div style={{ color: '#64748b', fontSize: '12px' }}>Securing your session...</div>
        </div>
        <style>{`@keyframes shieldBoot { 0%,100% { box-shadow: 0 0 20px rgba(37,99,235,0.3); transform: scale(1); } 50% { box-shadow: 0 0 50px rgba(37,99,235,0.6); transform: scale(1.06); } }`}</style>
      </div>
    );
  }

  return (
    <div className="app-container">
      <EmergencyListener />
      <LogoutApprovalListener />
      <PermissionRequest />
      {!isMobile && <Sidebar />}
      <div className="main-content">
        <Navbar />
        <main className="page-content" style={isMobile ? { paddingBottom: '80px' } : undefined}>
          <React.Suspense fallback={<div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loadingâ€¦</div>}>
            <Routes location={location} key={location.pathname}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<WatchHistory />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/controls" element={<Controls />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="/location" element={<LocationTracker />} />
              <Route path="/camera" element={<CameraView />} />
              <Route path="/audio" element={<AudioListener />} />
              <Route path="/screen" element={<ScreenView />} />
              <Route path="/account-settings" element={<AccountSettings />} />
              <Route path="*" element={<Navigate to="/controls" />} />
            </Routes>
          </React.Suspense>
        </main>
        {isMobile && <BottomNav />}
      </div>

    </div>
  );
};

function App() {
  // Apply saved theme on app boot
  useEffect(() => {
    const saved = localStorage.getItem('ag_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Welcome />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/role-selection" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/oauth-callback" element={<OAuthCallback />} />
        {/* Password setup â€” standalone page, requires JWT but no password yet */}
        <Route path="/setup-password" element={<SetupPassword />} />
        {/* Child device routes */}
        <Route path="/child-setup" element={<ChildSetup />} />
        <Route path="/child-pairing" element={<ChildPairing />} />
        <Route path="/child/setup" element={<PairingSetup />} />
        <Route path="/child/permissions" element={<ChildPermissionWizard />} />
        <Route path="/child/device" element={<ChildDeviceView />} />
        {/* Protected parent routes */}
        <Route path="/*" element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        } />
      </Routes>
    </AuthProvider>
  );
}

export default App;
