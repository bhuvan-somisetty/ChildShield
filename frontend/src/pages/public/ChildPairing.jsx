import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, CheckCircle, Loader } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const ChildPairing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { childId, pairingCode, childName } = location.state || {};
  
  const [isPaired, setIsPaired] = useState(false);
  const [livePairingCode, setLivePairingCode] = useState(pairingCode);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!childId) {
      navigate('/child-setup');
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/device/status/${childId}`);
        const data = await res.json();
        if (res.ok && data.success && data.connected) {
          setIsPaired(true);
          clearInterval(interval);
        }
      } catch (err) {
        console.log('Polling error:', err.message);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [childId, navigate]);

  if (isPaired) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '40px', textAlign: 'center' }}>
          <CheckCircle size={64} color="#10b981" style={{ marginBottom: '20px' }} />
          <h2 style={{ color: '#10b981', fontSize: '28px', fontWeight: 'bold', marginBottom: '12px' }}>Successfully Linked!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: '1.6' }}>
            This device represents {childName}'s supervised session. In a fully native environment, this is where the permanent lock-screen overlay would activate.
          </p>
        </div>
      </div>
    );
  }

  const handleRefreshCode = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`/api/device/refresh-code/${childId}`, { method: 'PUT' });
      const data = await res.json();
      if(data.success) {
        setLivePairingCode(data.pairingCode);
      }
    } catch (err) {
      console.log('Refresh err', err);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '40px', textAlign: 'center' }}>
        <div style={{ width: '80px', height: '80px', borderRadius: '40px', backgroundColor: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px auto', border: '1px solid rgba(0, 240, 255, 0.4)' }}>
          <Smartphone color="#00f0ff" size={40} />
        </div>
        
        <h2 style={{ color: '#fff', fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Ready to Connect</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '30px' }}>
          Open the Parent App, navigate to Controls, and enter the 6-digit sync code below.
        </p>

        <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '16px', display: 'inline-block', border: '2px solid rgba(0,240,255,0.4)', marginBottom: '30px' }}>
           <QRCodeSVG value={JSON.stringify({ code: livePairingCode })} size={180} fgColor="#000000" bgColor="#ffffff" />
        </div>

        <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '16px' }}>— OR ENTER CODE —</p>
        
        <div style={{ backgroundColor: 'rgba(176, 38, 255, 0.05)', padding: '16px 32px', borderRadius: '16px', border: '1px solid rgba(176, 38, 255, 0.3)', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: '#b026ff', fontSize: '36px', fontWeight: '900', letterSpacing: '8px', textShadow: '0 0 10px rgba(176, 38, 255, 0.4)' }}>
            {livePairingCode || '------'}
          </h2>
        </div>

        <button 
          onClick={handleRefreshCode}
          disabled={refreshing}
          style={{ padding: '12px 24px', background: 'rgba(176,38,255,0.1)', color: '#b026ff', border: '1px solid #b026ff', borderRadius: '12px', fontWeight: 'bold', cursor: refreshing ? 'not-allowed' : 'pointer', marginBottom: '32px', opacity: refreshing ? 0.5 : 1 }}
        >
          {refreshing ? 'Generating...' : 'Generate New Code'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
          <Loader size={16} color="#b026ff" style={{ animation: 'spin 2s linear infinite' }} />
          <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Waiting for parent...</span>
        </div>
      </div>
    </div>
  );
};

export default ChildPairing;
