import React, { useState, useRef, useEffect } from 'react';
import { Lock, Smartphone, Moon, ShieldAlert, Eye, EyeOff, Clock, Camera, Wifi, CheckCircle } from 'lucide-react';
import FaceRegistration from '../components/FaceRegistration';
import LockScreen from '../components/LockScreen';
import { useAuth } from '../context/AuthContext';
import jsQR from 'jsqr';
import Webcam from 'react-webcam';

// Custom Animated Toggle
const Toggle = ({ active, onChange, danger = false }) => {
  const accent = danger ? 'var(--accent-red)' : 'var(--accent-cyan)';
  return (
    <div 
      onClick={() => onChange(!active)}
      style={{
        width: '56px', height: '32px', borderRadius: '16px',
        backgroundColor: active ? (danger ? 'rgba(239, 68, 68, 0.4)' : 'rgba(0, 240, 255, 0.4)') : 'rgba(255, 255, 255, 0.1)',
        position: 'relative', cursor: 'pointer', transition: 'all 0.3s',
        border: `1px solid ${active ? accent : 'rgba(255,255,255,0.05)'}`,
        boxShadow: active ? `0 0 10px rgba(${danger?'239, 68, 68':'0, 240, 255'}, 0.3)` : 'none'
      }}
    >
      <div style={{
        position: 'absolute', top: '2px', left: active ? '26px' : '2px',
        width: '26px', height: '26px', borderRadius: '50%',
        backgroundColor: '#fff', transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: active ? `0 0 10px ${accent}` : '0 2px 5px rgba(0,0,0,0.2)'
      }}></div>
    </div>
  );
};

const Controls = () => {
  const { user, activeChild, setActiveChild, token } = useAuth();
  const [deviceLock, setDeviceLock] = useState(false); // Global lock sim
  const [parentInputCode, setParentInputCode] = useState('');
  const [linkError, setLinkError] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [scanMode, setScanMode] = useState(false);
  const [showUnpair, setShowUnpair] = useState(false);
  const [unpairPass, setUnpairPass] = useState('');
  const [showUnpairPass, setShowUnpairPass] = useState(false);
  const [unpairError, setUnpairError] = useState('');
  const [isUnpairing, setIsUnpairing] = useState(false);
  const webcamRef = useRef(null);

  useEffect(() => {
    if (!scanMode) return;
    const interval = setInterval(() => {
      if (webcamRef.current && webcamRef.current.video && webcamRef.current.video.readyState === 4) {
        const video = webcamRef.current.video;
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: "attemptBoth" });
        if (code) {
          try {
            const parsed = JSON.parse(code.data);
            if (parsed.code) {
               setParentInputCode(parsed.code);
               setScanMode(false);
            }
          } catch(e) { }
        }
      }
    }, 500);
    return () => clearInterval(interval);
  }, [scanMode]);

  const handleLinkDevice = async () => {
    if(parentInputCode.length !== 6) return setLinkError('Code must be 6 digits');
    setIsLinking(true);
    setLinkError('');
    try {
      const res = await fetch('/api/device/confirm-pairing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: parentInputCode })
      });
      const data = await res.json();
      if(res.ok && data.success) {
        window.location.reload(); 
      } else {
        setLinkError(data.error || `Failed to link device (Status: ${res.status}, Body: ${JSON.stringify(data)})`);
      }
    } catch(err) { setLinkError(`Fetch error: ${err.message}`); }
    setIsLinking(false);
  };

  const renderLinkingInterface = () => (
    <div className="glass-panel" style={{ padding: '32px', textAlign: 'left', width: '100%' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#fff' }}>Link New Device</h3>
      {linkError && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{linkError}</div>}
      
      <div style={{ display: 'flex', gap: '12px' }}>
        <input 
          type="text" 
          placeholder="Enter 6-digit code" 
          value={parentInputCode}
          onChange={(e) => setParentInputCode(e.target.value)}
          maxLength={6}
          disabled={isLinking}
          style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(176, 38, 255, 0.3)', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '18px', letterSpacing: '4px', textAlign: 'center', outline: 'none' }} 
        />
        <button 
          onClick={handleLinkDevice}
          disabled={isLinking}
          style={{ padding: '0 24px', background: 'var(--accent-purple)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: isLinking ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isLinking ? 0.7 : 1 }}
        >
          {isLinking ? 'Linking...' : 'Connect'}
        </button>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold' }}>— OR —</p>
        {!scanMode ? (
          <button 
            onClick={() => setScanMode(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 24px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Camera size={20} /> Scan QR Code via Desktop Camera
          </button>
        ) : (
          <div className="animate-fade-in" style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--accent-cyan)' }}>
            <Webcam ref={webcamRef} audio={false} videoConstraints={{ facingMode: 'user' }} style={{ width: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '40px solid rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
              <div style={{ width: '100%', height: '100%', border: '2px dashed #00f0ff' }}></div>
            </div>
            <button onClick={() => setScanMode(false)} style={{ position: 'absolute', bottom: '10px', left: '50%', transform: 'translateX(-50%)', background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '12px', cursor: 'pointer', fontWeight: 'bold' }}>Cancel Scanner</button>
          </div>
        )}
      </div>
    </div>
  );

  if(!activeChild) {
    return (
      <div className="animate-fade-in" style={{ padding: '40px', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        <ShieldAlert size={64} color="var(--accent-purple)" style={{ marginBottom: '24px' }} />
        <h2 style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '16px' }}>No Active Devices</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '32px', lineHeight: '1.6' }}>
          You do not have any child devices linked to this account yet. Open the Child Shield app on your child's device, select "Child Mode", and find the Sync Code.
        </p>
        {renderLinkingInterface()}
      </div>
    );
  }

  const handleUnpair = async () => {
    if (!unpairPass) return setUnpairError('Password required');
    setIsUnpairing(true);
    setUnpairError('');
    try {
      const res = await fetch(`/api/device/unpair/${activeChild.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: unpairPass })
      });
      const data = await res.json();
      if(res.ok && data.success) {
        window.location.reload(); 
      } else {
        setUnpairError(data.error || 'Failed to unpair');
      }
    } catch(err) { setUnpairError(err.message); }
    setIsUnpairing(false);
  };

  const generateCode = async () => {
    try {
      const res = await fetch(`/api/device/generate-code/${activeChild.id}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPairingCode(data.code);
        setActiveChild({...activeChild, pairingCode: data.code, isPaired: false});
      }
    } catch(err) { console.error(err); }
  };

  const toggleControl = async (key, forceVal) => {
    // Optimistic update
    const newValue = forceVal !== undefined ? forceVal : !activeChild[key];
    setActiveChild({...activeChild, [key]: newValue});
    
    fetch(`/api/children/${activeChild.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ [key]: newValue })
    }).catch(console.error);
  };

  const setDailyLimit = async (val) => {
    setActiveChild({...activeChild, dailyLimitHours: parseFloat(val)});
    fetch(`/api/children/${activeChild.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ dailyLimitHours: parseFloat(val) })
    }).catch(console.error);
  };

  return (
    <>
      {deviceLock && <LockScreen onUnlock={() => setDeviceLock(false)} />}
      
      {showUnpair && (
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(5px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center' }}>
            <ShieldAlert size={48} color="var(--accent-red)" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '20px', color: 'var(--accent-red)', marginBottom: '8px' }}>Disconnect Device</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>This will sever the connection to {activeChild.name}'s device. Enter Parent Password to confirm.</p>
            {unpairError && <div style={{ color: '#ef4444', marginBottom: '16px', fontSize: '13px' }}>{unpairError}</div>}
            
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input type={showUnpairPass ? "text" : "password"} value={unpairPass} onChange={e=>setUnpairPass(e.target.value)} placeholder="Parent Password" style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.3)', padding: '12px 40px 12px 12px', borderRadius: '8px', color: '#fff', outline: 'none' }} />
              <div 
                onClick={() => setShowUnpairPass(!showUnpairPass)} 
                style={{ position: 'absolute', right: '12px', top: '12px', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                {showUnpairPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
               <button onClick={() => setShowUnpair(false)} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}>Cancel</button>
               <button onClick={handleUnpair} disabled={isUnpairing} style={{ flex: 1, padding: '12px', background: 'var(--accent-red)', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '8px', cursor: 'pointer' }}>{isUnpairing ? 'Disconnecting...' : 'Disconnect'}</button>
            </div>
          </div>
        </div>
      )}
      
      <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '800' }}>Active Supervision: {activeChild.name}</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
              Connected to Parent Account: <span style={{ color: 'var(--accent-purple)', fontWeight: 'bold' }}>{user?.fullName || 'Parent'}</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(0, 240, 255, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
            <Wifi size={14} color="var(--accent-cyan)" />
            <span style={{ fontSize: '11px', color: 'var(--accent-cyan)', fontWeight: 'bold', letterSpacing: '0.05em' }}>LIVE LINK ACTIVE</span>
          </div>
        </div>

        <div className="responsive-grid">
          
          {/* SECTOR 1: Device Pairing */}
          <div className="glass-card" style={{ padding: '24px', position: 'relative' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Smartphone size={20} color="var(--accent-cyan)" /> 1. Device Pairing
            </h3>
            
            {activeChild.isPaired ? (
              <>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px', lineHeight: 1.5 }}>
                  This device is securely mapped to your Parent Dashboard. Real-time controls and policies are actively enforcing bounds.
                </p>
                <div style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center', border: '1px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                     <CheckCircle color="var(--accent-green)" size={32} />
                     <div style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Device Successfully Linked</div>
                     <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Status: Active heartbeat via secure socket channel</div>
                  </div>
                </div>
                <button 
                  onClick={() => setShowUnpair(true)} 
                  style={{ width: '100%', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--accent-red)', border: '1px dashed var(--accent-red)', borderRadius: '8px', marginTop: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
                  Disconnect Device
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: '13px', color: 'var(--accent-yellow)', marginBottom: '20px', lineHeight: 1.5 }}>
                  Connection lost or device unpaired. Please re-link to restore controls.
                </p>
                {renderLinkingInterface()}
              </>
            )}
          </div>

          {/* SECTOR 2: Session & Time Control */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Clock size={20} color="var(--accent-cyan)" /> 2. Session Rules
            </h3>
            
            <div style={{ marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <span style={{ fontSize: '14px', fontWeight: '500' }}>Daily Time Limit</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: '700' }}>{activeChild.dailyLimitHours || 5} Hours</span>
              </div>
              <input 
                type="range" min="0.5" max="12" step="0.5" 
                value={activeChild.dailyLimitHours || 5} onChange={(e) => setDailyLimit(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }} 
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>Set total usage allowed per 24-hour cycle.</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Moon size={16}/> Night Restriction</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Automatic lock after 9:00 PM</div>
              </div>
              <Toggle active={activeChild.nightRestriction} onChange={() => toggleControl('nightRestriction')} />
            </div>
          </div>

          {/* SECTOR 3: Instant Enforcement */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Lock size={20} color="var(--accent-red)" /> 3. Instant Enforcement
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>Manually override the device state. This takes effect within 5 seconds.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button 
                onClick={() => toggleControl('deviceState', 'locked')}
                disabled={!activeChild.isPaired}
                style={{ padding: '14px', background: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)', borderRadius: '8px', cursor: activeChild.isPaired ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '13px', opacity: activeChild.isPaired ? 1 : 0.5 }}
              >
                 LOCK NOW
              </button>
              <button 
                onClick={() => toggleControl('deviceState', 'paused')}
                disabled={!activeChild.isPaired}
                style={{ padding: '14px', background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-yellow)', border: '1px solid var(--accent-yellow)', borderRadius: '8px', cursor: activeChild.isPaired ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '13px', opacity: activeChild.isPaired ? 1 : 0.5 }}
              >
                 PAUSE SESSION
              </button>
            </div>
            
            <button 
              onClick={() => toggleControl('deviceState', 'active')}
              disabled={!activeChild.isPaired}
              style={{ width: '100%', marginTop: '12px', padding: '14px', background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)', borderRadius: '8px', cursor: activeChild.isPaired ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '13px', opacity: activeChild.isPaired ? 1 : 0.5 }}
            >
               RESUME / UNLOCK
            </button>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>Helper: Use "Resume" to clear any active lockouts.</p>
          </div>

          {/* SECTOR 4: Security Filters */}
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldAlert size={20} color="var(--accent-purple)" /> 4. Safety Toggles
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <div style={{ fontWeight: '600' }}>Safe Browsing Mode</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Blocks age-restricted search results</div>
              </div>
              <Toggle active={activeChild.safeMode} onChange={() => toggleControl('safeMode')} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={16}/> Face Guard Active</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Ensures only {activeChild.name} uses the device</div>
              </div>
              <Toggle active={activeChild.facePresenceEnabled} onChange={() => toggleControl('facePresenceEnabled')} />
            </div>
            
            <div style={{ padding: '12px', background: 'rgba(176, 38, 255, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)', marginTop: '8px' }}>
               <p style={{ fontSize: '12px', color: 'var(--accent-purple)', fontWeight: '500' }}>AI Supervision active for {activeChild.name}</p>
            </div>
          </div>

        </div>

        {/* Face Registration Module embedded */}
        <div style={{ marginTop: '32px' }}>
           <FaceRegistration />
        </div>

      </div>

    </>
  );
};

export default Controls;
