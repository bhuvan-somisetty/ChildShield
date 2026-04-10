import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Smartphone } from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      {/* Background Ambience */}
      <div style={{ position: 'absolute', top: '10%', left: '10%', width: '400px', height: '400px', background: 'var(--accent-purple)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }}></div>
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'var(--accent-cyan)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }}></div>

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '40px', position: 'relative', zIndex: 1 }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(0, 240, 255, 0.1)', marginBottom: '16px', border: '1px solid rgba(0, 240, 255, 0.3)' }}>
            <ShieldCheck size={40} color="var(--accent-cyan)" />
          </div>
          <h2 style={{ fontSize: '32px', fontWeight: '700', color: '#fff' }}>Choose Mode</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '16px' }}>Continue as Parent or Child</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '30px' }}>
          {/* Parent Mode Button */}
          <button 
            onClick={() => navigate('/login')}
            style={{
              display: 'flex', alignItems: 'center', background: 'rgba(30, 30, 45, 0.6)',
              padding: '20px', borderRadius: '16px', border: '1px solid rgba(0, 240, 255, 0.3)',
              cursor: 'pointer', color: '#fff', textAlign: 'left', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 240, 255, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 30, 45, 0.6)'}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '28px', backgroundColor: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
              <User color="#00f0ff" size={28} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>Parent Mode</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Login to monitor & manage devices</p>
            </div>
          </button>

          {/* Child Mode Button */}
          <button 
            onClick={() => navigate('/child-setup')}
            style={{
              display: 'flex', alignItems: 'center', background: 'rgba(30, 30, 45, 0.6)',
              padding: '20px', borderRadius: '16px', border: '1px solid rgba(176, 38, 255, 0.3)',
              cursor: 'pointer', color: '#fff', textAlign: 'left', transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(176, 38, 255, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(30, 30, 45, 0.6)'}
          >
            <div style={{ width: '56px', height: '56px', borderRadius: '28px', backgroundColor: 'rgba(176, 38, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px' }}>
              <Smartphone color="#b026ff" size={28} />
            </div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', fontWeight: '600' }}>Child Mode</h3>
              <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px' }}>Set up supervision on this device</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Landing;
