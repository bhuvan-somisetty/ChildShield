import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Camera, Mic, Bell, Monitor, Battery, CheckCircle, XCircle, ChevronRight, ShieldCheck, Loader } from 'lucide-react';

const PERMISSIONS = [
  {
    id: 'location', icon: MapPin, color: '#10b981',
    title: 'Location Access',
    desc: 'Allows your parent to see where you are in real time. This keeps you safe and helps them know your whereabouts.',
    request: async () => {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(true),
          (err) => resolve(false),
          { enableHighAccuracy: true, timeout: 10000 }
        );
      });
    }
  },
  {
    id: 'camera', icon: Camera, color: '#3b82f6',
    title: 'Camera Access',
    desc: 'Allows your parent to remotely view the camera when needed. This helps verify your safety.',
    request: async () => {
      try { 
        const s = await navigator.mediaDevices.getUserMedia({ video: true }); 
        s.getTracks().forEach(t => t.stop()); 
        return true; 
      } catch (err) { 
        return false; 
      }
    }
  },
  {
    id: 'microphone', icon: Mic, color: '#f59e0b',
    title: 'Microphone Access',
    desc: 'Allows your parent to listen to surroundings when needed. Used only for safety purposes.',
    request: async () => {
      try { 
        const s = await navigator.mediaDevices.getUserMedia({ audio: true }); 
        s.getTracks().forEach(t => t.stop()); 
        return true; 
      } catch (err) { 
        return false; 
      }
    }
  },
  {
    id: 'notifications', icon: Bell, color: '#ef4444',
    title: 'Notifications',
    desc: 'Allows the app to show important alerts such as screen time limits, pauses, and lock notifications.',
    request: async () => {
      if (!('Notification' in window)) return false;
      const result = await Notification.requestPermission();
      return result === 'granted';
    }
  },
  {
    id: 'screen', icon: Monitor, color: '#8b5cf6',
    title: 'Screen Sharing',
    desc: 'When your parent requests a screen view, the system will ask you to approve sharing. This cannot be done silently — you\'ll always see a prompt.',
    request: null // Info-only step — system prompt appears on-demand
  },
  {
    id: 'battery', icon: Battery, color: '#06b6d4',
    title: 'Battery Optimization',
    desc: 'For background tracking to work reliably, disable battery optimization for this app in your device settings. This prevents the system from stopping location updates.',
    request: null // Info/guidance only
  }
];

const ChildPermissionWizard = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [statuses, setStatuses] = useState({}); // { location: 'granted'|'denied'|'info' }
  const [requesting, setRequesting] = useState(false);

  const perm = PERMISSIONS[step];
  const isLast = step === PERMISSIONS.length - 1;
  const isComplete = step >= PERMISSIONS.length;
  const status = statuses[perm?.id];

  // Check initial permission state so we don't repeatedly ask if already granted
  useEffect(() => {
    if (!perm) return;
    const checkInitial = async () => {
      if (perm.id === 'location' && navigator.permissions) {
        try {
          const res = await navigator.permissions.query({ name: 'geolocation' });
          if (res.state === 'granted') setStatuses(s => ({ ...s, location: 'granted' }));
          if (res.state === 'denied') setStatuses(s => ({ ...s, location: 'denied' }));
        } catch (e) {}
      } else if (perm.id === 'notifications' && 'Notification' in window) {
        if (Notification.permission === 'granted') setStatuses(s => ({ ...s, notifications: 'granted' }));
        if (Notification.permission === 'denied') setStatuses(s => ({ ...s, notifications: 'denied' }));
      }
    };
    checkInitial();
  }, [perm]);

  const handleRequest = useCallback(async () => {
    if (!perm?.request) {
      setStatuses(s => ({ ...s, [perm.id]: 'info' }));
      return;
    }
    setRequesting(true);
    try {
      const granted = await perm.request();
      setStatuses(prev => ({ ...prev, [perm.id]: granted ? 'granted' : 'denied' }));
    } catch (err) {
      setStatuses(prev => ({ ...prev, [perm.id]: 'denied' }));
    } finally {
      setRequesting(false);
    }
  }, [perm]);

  const handleTryAgain = async () => {
    if (perm.id === 'location' && navigator.permissions) {
      setRequesting(true);
      try {
        const res = await navigator.permissions.query({ name: 'geolocation' });
        if (res.state === 'prompt') {
          setRequesting(false);
          handleRequest(); // trigger getCurrentPosition to show popup
        } else if (res.state === 'granted') {
          setStatuses(s => ({ ...s, location: 'granted' }));
          setRequesting(false);
        } else if (res.state === 'denied') {
          setStatuses(s => ({ ...s, location: 'denied' }));
          setRequesting(false);
        }
      } catch (e) {
        setRequesting(false);
        handleRequest();
      }
    } else {
      handleRequest();
    }
  };

  const handleNext = () => {
    if (isLast) {
      setStep(PERMISSIONS.length); // go to summary
    } else {
      setStep(step + 1);
    }
  };

  const handleFinish = () => {
    localStorage.setItem('cs_permissions_done', 'true');
    navigate('/child/device', { replace: true });
  };

  // Summary screen
  if (isComplete) {
    const allGranted = PERMISSIONS.every(p => statuses[p.id] === 'granted' || statuses[p.id] === 'info');

    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px' }}>
        <div style={{ position: 'fixed', top: '15%', left: '20%', width: '400px', height: '400px', background: '#10b981', filter: 'blur(160px)', opacity: 0.08, borderRadius: '50%' }} />
        <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '40px 32px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2px solid rgba(16,185,129,0.3)' }}>
            <ShieldCheck size={40} color="#10b981" />
          </div>
          <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: '800', marginBottom: '8px' }}>Setup Complete!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '28px' }}>Your device is now ready for monitoring.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '32px', textAlign: 'left' }}>
            {PERMISSIONS.map((p, i) => {
              const s = statuses[p.id];
              const granted = s === 'granted' || s === 'info';
              return (
                <div 
                  key={p.id} 
                  onClick={() => { if (!granted) setStep(i); }}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
                    background: granted ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', 
                    borderRadius: '10px', 
                    border: `1px solid ${granted ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                    cursor: granted ? 'default' : 'pointer',
                    transition: 'all 0.2s',
                    opacity: granted ? 1 : 0.85
                  }}
                  onMouseOver={(e) => { if(!granted) e.currentTarget.style.opacity = 1; }}
                  onMouseOut={(e) => { if(!granted) e.currentTarget.style.opacity = 0.85; }}
                  title={!granted ? 'Click to retry this permission' : ''}
                >
                  <p.icon size={18} color={p.color} />
                  <span style={{ flex: 1, fontSize: '14px', color: '#fff', fontWeight: '600' }}>
                    {p.title}
                    {!granted && <span style={{ display: 'block', fontSize: '11px', color: '#ef4444', marginTop: '2px', fontWeight: 'bold' }}>Click to Retry</span>}
                  </span>
                  {granted ? <CheckCircle size={18} color="#10b981" /> : <XCircle size={18} color="#ef4444" />}
                </div>
              );
            })}
          </div>

          <button onClick={handleFinish} disabled={!allGranted} style={{ width: '100%', padding: '16px', background: allGranted ? '#10b981' : '#475569', border: 'none', borderRadius: '14px', color: allGranted ? '#fff' : '#94a3b8', fontWeight: '700', fontSize: '16px', cursor: allGranted ? 'pointer' : 'not-allowed', boxShadow: allGranted ? '0 4px 20px rgba(16,185,129,0.3)' : 'none', transition: 'all 0.2s' }}>
            {allGranted ? 'Continue to Device View' : 'Must Allow All Permissions'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)', padding: '24px' }}>
      <div style={{ position: 'fixed', top: '10%', right: '10%', width: '400px', height: '400px', background: perm.color, filter: 'blur(160px)', opacity: 0.08, borderRadius: '50%', transition: 'all 0.5s' }} />

      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '460px', padding: '40px 32px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <span style={{ fontSize: '12px', color: '#475569', fontWeight: '700', letterSpacing: '0.1em' }}>STEP {step + 1} OF {PERMISSIONS.length}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {PERMISSIONS.map((_, i) => (
              <div key={i} style={{ width: i <= step ? '20px' : '8px', height: '4px', borderRadius: '2px', background: i <= step ? perm.color : 'rgba(255,255,255,0.08)', transition: 'all 0.3s' }} />
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: `${perm.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${perm.color}30` }}>
            <perm.icon size={40} color={perm.color} />
          </div>
        </div>

        <h2 style={{ textAlign: 'center', fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px' }}>{perm.title}</h2>
        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '14px', lineHeight: 1.7, marginBottom: '28px' }}>{perm.desc}</p>

        {status && (
          <div style={{ textAlign: 'center', marginBottom: '20px' }}>
            {status === 'granted' || status === 'info' ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '20px', color: '#10b981', fontWeight: '700', fontSize: '13px' }}>
                <CheckCircle size={16} /> {status === 'info' ? 'Acknowledged' : 'Granted'}
              </span>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 18px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '20px', color: '#ef4444', fontWeight: '700', fontSize: '13px' }}>
                  <XCircle size={16} /> Not Granted
                </span>
                <span style={{ fontSize: '12px', color: '#ef4444', maxWidth: '320px', lineHeight: '1.5' }}>
                  {perm.id === 'location' 
                    ? 'Location permission is blocked. Please allow Location from browser Site Settings and reload the page.'
                    : `Permission is blocked. Please allow ${perm.title} from browser settings and reload.`}
                </span>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {perm.request ? (
            status === 'denied' ? (
              <button onClick={handleTryAgain} disabled={requesting}
                style={{ width: '100%', padding: '16px', background: 'rgba(239,68,68,0.15)', border: `1px solid rgba(239,68,68,0.4)`, borderRadius: '14px', color: '#ef4444', fontWeight: '700', fontSize: '15px', cursor: requesting ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', transition: 'all 0.2s' }}>
                {requesting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Checking...</> : 'Try Again'}
              </button>
            ) : (
              <button onClick={handleRequest} disabled={requesting || status === 'granted'}
                style={{ width: '100%', padding: '16px', background: status === 'granted' ? 'rgba(16,185,129,0.15)' : perm.color, border: 'none', borderRadius: '14px', color: status === 'granted' ? '#10b981' : '#0f172a', fontWeight: '700', fontSize: '15px', cursor: requesting || status === 'granted' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: status === 'granted' ? 'none' : `0 4px 20px ${perm.color}40`, transition: 'all 0.2s' }}>
                {requesting ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Requesting...</> :
                 status === 'granted' ? <><CheckCircle size={16} /> Permission Granted</> :
                 'Allow Permission'}
              </button>
            )
          ) : (
            <button onClick={() => { setStatuses(s => ({ ...s, [perm.id]: 'info' })); }}
              disabled={status === 'info'}
              style={{ width: '100%', padding: '16px', background: status === 'info' ? 'rgba(16,185,129,0.15)' : perm.color, border: 'none', borderRadius: '14px', color: status === 'info' ? '#10b981' : '#0f172a', fontWeight: '700', fontSize: '15px', cursor: status === 'info' ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {status === 'info' ? <><CheckCircle size={16} /> Understood</> : 'I Understand'}
            </button>
          )}

          <button onClick={handleNext} disabled={status !== 'granted' && status !== 'info'}
            style={{ width: '100%', padding: '14px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', color: (status === 'granted' || status === 'info') ? '#94a3b8' : 'rgba(148,163,184,0.3)', fontWeight: '600', fontSize: '14px', cursor: (status === 'granted' || status === 'info') ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            {isLast ? 'Finish Setup' : 'Next'} <ChevronRight size={16} />
          </button>
          
          {(status === 'denied' || status === undefined) && (
            <div style={{ textAlign: 'center', fontSize: '12px', color: '#ef4444', marginTop: '4px', fontWeight: '600' }}>
              ⚠️ You must allow this permission to continue.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChildPermissionWizard;

