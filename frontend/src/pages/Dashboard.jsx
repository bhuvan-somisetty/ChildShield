import React from 'react';
import { Clock, Smartphone, User, Wifi, WifiOff } from 'lucide-react';
import { useLivePolling } from '../hooks/useLivePolling';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { activeChild } = useAuth();
  const data = useLivePolling('/api/dashboard');

  if (!activeChild) {
    return (
      <div className="glass-card" style={{ padding: '40px 24px', textAlign: 'center', marginTop: '40px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>Welcome to ChildShield</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '16px' }}>Please connect a child device to begin monitoring.</p>
      </div>
    );
  }

  if (!data) return <div style={{ padding: '24px', color: '#fff' }}>Loading Data...</div>;

  return (
    <div className="animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '80px' }}>
      
      {/* Device Connection Status */}
      <div className="glass-card" style={{ padding: '16px 24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <User size={20} color={data.isPaired ? "var(--accent-cyan)" : "var(--text-muted)"} />
          <span style={{ fontSize: '16px', color: '#fff', fontWeight: '600' }}>
            {data.isPaired ? `Child device (${data.childName}) paired to ${data.parentName}` : "No child device connected"}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {data.isPaired ? (
            <><Wifi size={16} color="var(--accent-green)" /><span style={{ color: 'var(--accent-green)', fontWeight: 'bold', fontSize: '12px' }}>CONNECTED</span></>
          ) : (
            <><WifiOff size={16} color="var(--text-muted)" /><span style={{ color: 'var(--text-muted)', fontWeight: 'bold', fontSize: '12px' }}>UNLINKED</span></>
          )}
        </div>
      </div>

      {!data.isPaired ? (
        <div className="glass-card flex-center" style={{ padding: '60px 24px', flexDirection: 'column', gap: '16px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', color: '#fff' }}>No Active Connection</h2>
          <p style={{ color: 'var(--text-muted)' }}>Generate a QR code from the Controls tab to pair your child's phone.</p>
        </div>
      ) : (
        <>
          <h2 style={{ fontSize: '28px', fontWeight: '800', marginBottom: '24px' }}>Dashboard</h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '24px' }}>
            <div className="glass-card" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--text-muted)' }}>
                <Clock size={18} /> <span style={{ fontWeight: 'bold' }}>Total Screen Time Today</span>
              </div>
              <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--accent-cyan)' }}>{data.todayScreenTime}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            {/* Top Apps List */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Smartphone size={18} color="var(--accent-purple)" /> App Usage List
              </h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.topApps && data.topApps.length > 0 ? data.topApps.map((app, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{app.name}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{app.time}</span>
                  </li>
                )) : <li style={{ color: 'var(--text-muted)' }}>No app usage data found today.</li>}
              </ul>
            </div>

            {/* Category Breakdown */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>Category Breakdown</h3>
              <ul style={{ listStyleType: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {data.categoryDistribution && data.categoryDistribution.length > 0 ? data.categoryDistribution.map((cat, i) => (
                  <li key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', borderLeft: `4px solid ${cat.color}` }}>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>{cat.name}</span>
                    <span style={{ color: cat.color }}>{cat.value} mins</span>
                  </li>
                )) : <li style={{ color: 'var(--text-muted)' }}>No category data found.</li>}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
