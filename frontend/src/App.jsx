import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';

// Pages
import Dashboard from './pages/Dashboard';
import WatchHistory from './pages/WatchHistory';
import Analytics from './pages/Analytics';
import Controls from './pages/Controls';
import Reports from './pages/Reports';

// Public/Auth Pages
import Landing from './pages/public/Landing';
import Login from './pages/public/Login';
import Signup from './pages/public/Signup';
import ChildSetup from './pages/public/ChildSetup';
import ChildPairing from './pages/public/ChildPairing';

const AppLayout = () => {
  const location = useLocation();
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
      <Sidebar />
      <div className="main-content">
        <Navbar />
        <main className="page-content">
          <React.Suspense fallback={<div>Loading...</div>}>
            <Routes location={location} key={location.pathname}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/history" element={<WatchHistory />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/controls" element={<Controls />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="*" element={<Navigate to="/dashboard" />} />
            </Routes>
          </React.Suspense>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/child-setup" element={<ChildSetup />} />
        <Route path="/child-pairing" element={<ChildPairing />} />
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
