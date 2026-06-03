import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, Loader, RefreshCw, CheckCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const ChildPairing = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { childId, pairingCode, childName } = location.state || {};

  const [livePairingCode, setLivePairingCode] = useState(pairingCode);
  const [refreshing, setRefreshing] = useState(false);
  const [pairingDetected, setPairingDetected] = useState(false);
  const [error, setError] = useState('');
  const isMountedRef = useRef(true);

  // Redirect to setup if no state available
  useEffect(() => {
    if (!childId) {
      navigate('/child-setup');
    }
  }, [childId, navigate]);

  // Poll backend every 3s to detect when parent has confirmed pairing
  useEffect(() => {
    if (!childId) return;
    isMountedRef.current = true;

    const poll = async () => {
      try {
        const res = await fetch(`/api/device/status/${childId}`);
        const data = await res.json();

        if (!isMountedRef.current) return;

        if (res.ok && data.success && data.connected === true) {
          // Pairing confirmed by parent - store full session including parent identity
          setPairingDetected(true);
          localStorage.setItem('child_session', JSON.stringify({
            childId,
            childName: data.childName || childName,
            parentName: data.parentName || 'Parent',
            parentId: data.status?.parentId || null,
            pairedAt: new Date().toISOString()
          }));

          // Short delay so the user can see the ✅ "Connected!" flash
          setTimeout(() => {
            if (isMountedRef.current) navigate('/child/permissions', { replace: true });
          }, 1500);
        }
      } catch (err) {
        console.log('Polling error:', err.message);
      }
    };

    const interval = setInterval(poll, 3000);
    poll(); // immediate first check
    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
    };
  }, [childId, navigate, childName]);

  const handleRefreshCode = async () => {
    if (!childId || refreshing) return;
    setRefreshing(true);
    setError('');
    try {
      const res = await fetch(`/api/device/refresh-code/${childId}`, { method: 'PUT' });
      const data = await res.json();
      if (data.success) {
        setLivePairingCode(data.pairingCode);
      } else {
        setError(data.error || 'Failed to refresh code.');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  if (!childId) return null; // redirecting

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px' }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '500px', background: 'rgba(37,99,235, 0.06)', filter: 'blur(120px)', borderRadius: '50%', pointerEvents: 'none' }} />

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '40px 32px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        {/* Icon */}
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(37,99,235, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(37,99,235, 0.3)', boxShadow: '0 0 30px rgba(37,99,235,0.1)' }}>
          <Smartphone color="#2563eb" size={38} />
        </div>

        <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>Ready to Connect</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>
          Open the <strong style={{ color: '#2563eb' }}>Parent App → Controls</strong> and enter<br />the 6-digit sync code below.
        </p>

        {/* Error message */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '10px 16px', borderRadius: '8px', fontSize: '13px', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {/* QR Code */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '16px', display: 'inline-block', border: '2px solid rgba(37,99,235,0.3)', marginBottom: '24px' }}>
          <QRCodeSVG value={JSON.stringify({ code: livePairingCode })} size={170} fgColor="#000000" bgColor="#ffffff" />
        </div>

        <p style={{ color: '#64748b', fontSize: '11px', fontWeight: '700', letterSpacing: '2px', marginBottom: '16px' }}>— OR ENTER CODE —</p>

        {/* Pairing code display */}
        <div style={{ backgroundColor: 'rgba(37,99,235, 0.06)', padding: '16px 28px', borderRadius: '16px', border: '1px solid rgba(37,99,235, 0.25)', marginBottom: '16px' }}>
          <h2 style={{ margin: 0, color: '#2563eb', fontSize: '40px', fontWeight: '900', letterSpacing: '10px', textShadow: '0 0 20px rgba(37,99,235, 0.5)', fontFamily: 'monospace' }}>
            {livePairingCode || '------'}
          </h2>
        </div>

        {/* Generate New Code button */}
        <button
          id="refresh-code-btn"
          onClick={handleRefreshCode}
          disabled={refreshing || pairingDetected}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            width: '100%', padding: '12px 20px',
            background: 'rgba(37,99,235,0.08)',
            color: refreshing ? 'var(--text-muted)' : '#2563eb',
            border: '1px solid rgba(37,99,235,0.3)',
            borderRadius: '12px', fontWeight: '700', fontSize: '14px',
            cursor: refreshing || pairingDetected ? 'not-allowed' : 'pointer',
            marginBottom: '24px',
            opacity: refreshing || pairingDetected ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
          {refreshing ? 'Generating...' : 'Generate New Code'}
        </button>

        {/* Status line */}
        {pairingDetected ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', borderRadius: '20px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: 'var(--accent-green)', fontWeight: '700', fontSize: '14px' }}>
            <CheckCircle size={18} />
            Connected! Opening device view...
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px 20px', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <Loader size={16} color="#2563eb" style={{ animation: 'spin 2s linear infinite' }} />
            <span style={{ color: '#94a3b8', fontSize: '13px', fontWeight: '600' }}>Waiting for parent to approve...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildPairing;
