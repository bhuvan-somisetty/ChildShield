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
import PasswordSetupModal from './components/PasswordSetupModal';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import WatchHistory from './pages/WatchHistory';
import Analytics from './pages/Analytics';
import Controls from './pages/Controls';
import Reports from './pages/Reports';
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
import ChildSetup from './pages/public/ChildSetup';
import ChildPairing from './pages/public/ChildPairing';
import PairingSetup from './pages/child/PairingSetup';
import ChildDeviceView from './pages/child/ChildDeviceView';
import ChildPermissionWizard from './pages/child/ChildPermissionWizard';

// ─── useIsMobile hook ──────────────────────────────────────────────────────────
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
  const { user, updateUser } = useAuth();
  const [isLoader, setIsLoader] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoader(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (isLoader) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{
          width: '50px', height: '50px', border: '3px solid rgba(0, 240, 255, 0.2)', 
          borderTopColor: 'var(--accent-cyan)', borderRadius: '50%', animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    )
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
          <React.Suspense fallback={<div>Loading...</div>}>
            <Routes location={location} key={location.pathname}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<WatchHistory />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/controls" element={<Controls />} />
              <Route path="/reports" element={<Reports />} />
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

      {/* Floating AI Assistant */}
      <AIAssistant />

      {/* Password setup modal for Google OAuth users */}
      {user?.needsPasswordSetup && (
        <PasswordSetupModal onComplete={() => updateUser({ needsPasswordSetup: false })} />
      )}
    </div>
  );
};

function App() {
  // Apply saved theme on app boot
  useEffect(() => {
    const saved = localStorage.getItem('cs_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/role-selection" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/auth/callback" element={<OAuthCallback />} />
        <Route path="/child-setup" element={<ChildSetup />} />
        <Route path="/child-pairing" element={<ChildPairing />} />
        <Route path="/child/setup" element={<PairingSetup />} />
        <Route path="/child/permissions" element={<ChildPermissionWizard />} />
        <Route path="/child/device" element={<ChildDeviceView />} />
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
