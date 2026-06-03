import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Lock, Smartphone, Moon, ShieldAlert, Eye, EyeOff, Clock, Camera, Wifi, CheckCircle, LockKeyhole, Unlock, AppWindow } from 'lucide-react';
import FaceRegistration from '../components/FaceRegistration';
import LockScreen from '../components/LockScreen';
import { useAuth } from '../context/AuthContext';
import jsQR from 'jsqr';
import Webcam from 'react-webcam';
import ConfirmationModal from '../components/layout/ConfirmationModal';

// Custom Animated Toggle
const Toggle = ({ active, onChange, danger = false }) => {
  const accent = danger ? 'var(--accent-red)' : 'var(--accent-cyan)';
  return (
    <div 
      onClick={() => onChange(!active)}
      style={{
        width: '56px', height: '32px', borderRadius: '16px',
        backgroundColor: active ? (danger ? 'rgba(239, 68, 68, 0.4)' : 'rgba(37,99,235, 0.4)') : 'rgba(255, 255, 255, 0.1)',
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
  const { user, activeChild, setActiveChild, childrenList, fetchChildren, token } = useAuth();
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
  const [unpairStep, setUnpairStep] = useState('password');
  const [enforcingState, setEnforcingState] = useState(null);
  const [enforceMsg, setEnforceMsg] = useState('');
  const [showLockConfirm, setShowLockConfirm] = useState(false);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const webcamRef = useRef(null);

  // Live-poll activeChild every 5s so isPaired/deviceState stay fresh
  const refreshActiveChild = useCallback(async () => {
    if (!token || !activeChild?.id) return;
    try {
      const res = await fetch(`/api/children/${activeChild.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.child) setActiveChild(data.child);
    } catch {}
  }, [token, activeChild?.id, setActiveChild]);

  useEffect(() => {
    refreshActiveChild();
    const iv = setInterval(refreshActiveChild, 5000);
    return () => clearInterval(iv);
  }, [refreshActiveChild]);

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
        // ✅ Refresh children list WITHOUT reloading the page (reload wipes auth state)
        await fetchChildren(token);
        // If the newly paired child is returned, set it as active immediately
        if (data.child) setActiveChild(data.child);
        setParentInputCode('');
        setLinkError('');
      } else {
        setLinkError(data.error || `Failed to link device (Status: ${res.status}, Body: ${JSON.stringify(data)})`);
      }
    } catch(err) { setLinkError(`Fetch error: ${err.message}`); }
    setIsLinking(false);
  };

  const handleUnpair = async () => {
    setIsUnpairing(true);
    setUnpairError('');
    try {
      const res = await fetch(`/api/device/unpair/${activeChild.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ password: unpairPass })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowUnpair(false);
        setUnpairStep('password');
        setUnpairPass('');
        // Refresh children list to remove the unpaired child
        await fetchChildren(token);
        setActiveChild(null);
      } else {
        setUnpairError(data.error || 'Failed to unpair device');
      }
    } catch(err) {
      setUnpairError('Network error. Could not unpair.');
    }
    setIsUnpairing(false);
  };

  const renderLinkingInterface = () => (
    <div className="glass-panel" style={{ padding: '32px', textAlign: 'left', width: '100%' }}>
      <h3 style={{ fontSize: '18px', marginBottom: '16px', color: '#fff' }}>Link New Device</h3>
      {linkError && <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--accent-red)', color: 'var(--accent-red)', padding: '12px', borderRadius: '8px', marginBottom: '16px', fontSize: '14px' }}>{linkError}</div>}
      
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <input 
          type="text" 
          placeholder="Enter 6-digit code" 
          value={parentInputCode}
          onChange={(e) => setParentInputCode(e.target.value)}
          maxLength={6}
          disabled={isLinking}
          style={{ flex: '1 1 120px', minWidth: '120px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(37,99,235, 0.3)', padding: '16px', borderRadius: '12px', color: '#fff', fontSize: '18px', letterSpacing: '4px', textAlign: 'center', outline: 'none' }} 
        />
        <button 
          onClick={handleLinkDevice}
          disabled={isLinking}
          style={{ flexShrink: 0, padding: '14px 24px', background: 'var(--accent-purple)', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: isLinking ? 'not-allowed' : 'pointer', transition: 'all 0.2s', opacity: isLinking ? 0.7 : 1 }}
        >
          {isLinking ? 'Linking...' : 'Connect'}
        </button>
      </div>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ color: '#64748b', marginBottom: '16px', fontSize: '14px', fontWeight: 'bold' }}>— OR —</p>
        {!scanMode ? (
          <button 
            onClick={() => setScanMode(true)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '14px 24px', background: 'rgba(37,99,235, 0.1)', color: 'var(--accent-cyan)', border: '1px solid var(--accent-cyan)', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <Camera size={20} /> Scan QR Code via Desktop Camera
          </button>
        ) : (
          <div className="animate-fade-in" style={{ position: 'relative', width: '100%', maxWidth: '300px', margin: '0 auto', borderRadius: '16px', overflow: 'hidden', border: '2px solid var(--accent-cyan)' }}>
            <Webcam ref={webcamRef} audio={false} videoConstraints={{ facingMode: 'user' }} style={{ width: '100%', display: 'block' }} />
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, border: '40px solid rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
              <div style={{ width: '100%', height: '100%', border: '2px dashed #2563eb' }}></div>
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


  const generateCode = async () => {
    try {
      const res = await fetch(`/api/device/refresh-code/${activeChild.id}`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setActiveChild({...activeChild, pairingCode: data.pairingCode });
      }
    } catch(err) { console.error(err); }
  };

  const toggleControl = async (key, forceVal) => {
    if (key === 'deviceState') {
      const actionMap = { locked: 'lock', paused: 'pause', active: 'resume' };
      const action = actionMap[forceVal] || 'resume';
      const labelMap = { lock: 'Locking...', pause: 'Pausing...', resume: 'Resuming...' };
      setEnforcingState(action);
      setEnforceMsg(labelMap[action]);
      try {
        const res = await fetch(`/api/device/control/${activeChild.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ action, reason: action === 'lock' ? 'Locked by parent' : action === 'pause' ? 'Paused by parent' : null })
        });
        const data = await res.json();
        if (data.success) {
          setActiveChild({ ...activeChild, deviceState: forceVal });
          setEnforceMsg(action === 'lock' ? 'Device Locked!' : action === 'pause' ? 'Session Paused!' : 'Session Resumed!');
        } else {
          setEnforceMsg('Error: ' + (data.error || 'Command failed'));
        }
      } catch (err) {
        setEnforceMsg('Network error: ' + err.message);
      }
      setTimeout(() => { setEnforcingState(null); setEnforceMsg(''); }, 2500);
      return;
    }
    const newValue = forceVal !== undefined ? forceVal : !activeChild[key];
    setActiveChild({ ...activeChild, [key]: newValue });
    try {
      await fetch(`/api/children/${activeChild.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ [key]: newValue })
      });
    } catch (err) { console.error('Toggle failed:', err); }
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
        <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(5px)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center', padding: '20px' }}>
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', width: '100%', maxWidth: '400px', textAlign: 'center', boxSizing: 'border-box' }}>
            
            {/* STEP 1: Enter password */}
            {(!unpairStep || unpairStep === 'password') && (
              <>
                <ShieldAlert size={48} color="var(--accent-red)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '20px', color: 'var(--accent-red)', marginBottom: '8px' }}>Disconnect Device</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>This will sever the connection to {activeChild.name}'s device. Enter Parent Password to confirm.</p>
                {unpairError && <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', marginBottom: '16px', fontSize: '13px', padding: '10px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.2)' }}>{unpairError}</div>}
                
                <div style={{ position: 'relative', marginBottom: '16px' }}>
                  <input 
                    type={showUnpairPass ? "text" : "password"} 
                    value={unpairPass} 
                    onChange={e=>setUnpairPass(e.target.value)} 
                    placeholder="Parent Password" 
                    autoFocus
                    style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(239,68,68,0.3)', padding: '14px 40px 14px 14px', borderRadius: '10px', color: '#fff', outline: 'none', boxSizing: 'border-box', textAlign: 'center' }} 
                    onKeyDown={async e => {
                      if (e.key === 'Enter') {
                        if (!unpairPass) return setUnpairError('Password required');
                        setIsUnpairing(true); setUnpairError('');
                        try {
                          const r = await fetch('/api/auth/verify-parent-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ password: unpairPass }) });
                          const d = await r.json();
                          if (r.ok && d.success) { setUnpairStep('confirm'); } else { setUnpairError(d.error || 'Incorrect password.'); }
                        } catch(err) { setUnpairError('Connection failed.'); }
                        setIsUnpairing(false);
                      }
                    }}
                  />
                  <div 
                    onClick={() => setShowUnpairPass(!showUnpairPass)} 
                    style={{ position: 'absolute', right: '14px', top: '14px', cursor: 'pointer', color: 'var(--text-muted)' }}
                  >
                    {showUnpairPass ? <EyeOff size={18} /> : <Eye size={18} />}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                   <button onClick={() => {setShowUnpair(false); setUnpairStep('password'); setUnpairPass(''); setUnpairError('');}} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
                   <button onClick={async () => {
                        if (!unpairPass) return setUnpairError('Password required');
                        setIsUnpairing(true); setUnpairError('');
                        try {
                          const r = await fetch('/api/auth/verify-parent-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ password: unpairPass }) });
                          const d = await r.json();
                          if (r.ok && d.success) { setUnpairStep('confirm'); } else { setUnpairError(d.error || 'Incorrect password.'); }
                        } catch(err) { setUnpairError('Connection failed.'); }
                        setIsUnpairing(false);
                   }} disabled={isUnpairing} style={{ flex: 1, padding: '12px', background: 'var(--accent-red)', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer' }}>{isUnpairing ? 'Verifying...' : 'Verify'}</button>
                </div>
              </>
            )}

            {/* STEP 2: Confirmation */}
            {unpairStep === 'confirm' && (
              <>
                <ShieldAlert size={40} color="var(--accent-red)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '8px', fontWeight: '800' }}>Before you continue</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
                  You may lose access to this child's data. Do you want to download a report before continuing?
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <button onClick={() => {
                      const reportData = `AlphaGuard Report\n\nParent: ${user?.fullName}\nChild: ${activeChild?.name}\nDate: ${new Date().toLocaleString()}\n\nNote: Detailed analytics available in the dashboard.`;
                      const blob = new Blob([reportData], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `AlphaGuard_Device_Report_${new Date().getTime()}.txt`;
                      a.click();
                      setUnpairStep('downloaded');
                    }}
                    style={{ background: 'var(--accent-blue)', border: 'none', padding: '14px', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    Download Report
                  </button>
                  <button onClick={handleUnpair}
                    style={{ background: 'var(--accent-red)', border: 'none', padding: '14px', borderRadius: '10px', color: '#fff', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>
                    Continue Without Download
                  </button>
                  <button onClick={() => {setShowUnpair(false); setUnpairStep('password'); setUnpairPass(''); setUnpairError('');}}
                    style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', padding: '12px', borderRadius: '10px', color: '#cbd5e1', cursor: 'pointer', fontSize: '14px' }}>
                    Cancel
                  </button>
                </div>
              </>
            )}

            {/* STEP 3: Post Download */}
            {unpairStep === 'downloaded' && (
              <>
                <CheckCircle size={40} color="var(--accent-green)" style={{ margin: '0 auto 16px' }} />
                <h3 style={{ fontSize: '20px', color: '#fff', marginBottom: '8px', fontWeight: '800' }}>Report downloaded.</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
                  Continue to disconnect device?
                </p>
                <div style={{ display: 'flex', gap: '12px' }}>
                   <button onClick={() => {setShowUnpair(false); setUnpairStep('password'); setUnpairPass(''); setUnpairError('');}} style={{ flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '10px', cursor: 'pointer' }}>Cancel</button>
                   <button onClick={handleUnpair} disabled={isUnpairing} style={{ flex: 1, padding: '12px', background: 'var(--accent-red)', border: 'none', color: '#fff', fontWeight: 'bold', borderRadius: '10px', cursor: 'pointer' }}>{isUnpairing ? 'Disconnecting...' : 'Disconnect'}</button>
                </div>
              </>
            )}

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
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'rgba(37,99,235, 0.1)', padding: '6px 12px', borderRadius: '20px', border: '1px solid rgba(37,99,235, 0.2)' }}>
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

            {enforceMsg && (
              <div style={{
                padding: '10px 16px', borderRadius: '10px', marginBottom: '16px',
                textAlign: 'center', fontWeight: '700', fontSize: '14px',
                background: enforceMsg.startsWith('Error') || enforceMsg.startsWith('Network') ? 'rgba(239,68,68,0.12)' : 'rgba(16,185,129,0.1)',
                color: enforceMsg.startsWith('Error') || enforceMsg.startsWith('Network') ? 'var(--accent-red)' : 'var(--accent-green)',
                border: '1px solid currentColor'
              }}>
                {enforceMsg}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                onClick={() => setShowLockConfirm(true)}
                disabled={!activeChild.isPaired || !!enforcingState}
                style={{ padding: '14px', background: 'rgba(239,68,68,0.15)', color: 'var(--accent-red)', border: '1px solid var(--accent-red)', borderRadius: '8px', cursor: activeChild.isPaired && !enforcingState ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '13px', opacity: activeChild.isPaired ? 1 : 0.4, transition: 'all 0.2s' }}
              >
                {enforcingState === 'lock' ? 'Locking...' : 'LOCK NOW'}
              </button>
              <button
                onClick={() => toggleControl('deviceState', 'paused')}
                disabled={!activeChild.isPaired || !!enforcingState}
                style={{ padding: '14px', background: 'rgba(245,158,11,0.15)', color: 'var(--accent-yellow)', border: '1px solid var(--accent-yellow)', borderRadius: '8px', cursor: activeChild.isPaired && !enforcingState ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '13px', opacity: activeChild.isPaired ? 1 : 0.4, transition: 'all 0.2s' }}
              >
                {enforcingState === 'pause' ? 'Pausing...' : 'PAUSE SESSION'}
              </button>
            </div>

            <button
              onClick={() => setShowUnlockConfirm(true)}
              disabled={!activeChild.isPaired || !!enforcingState}
              style={{ width: '100%', marginTop: '12px', padding: '14px', background: 'rgba(16,185,129,0.15)', color: 'var(--accent-green)', border: '1px solid var(--accent-green)', borderRadius: '8px', cursor: activeChild.isPaired && !enforcingState ? 'pointer' : 'not-allowed', fontWeight: '700', fontSize: '13px', opacity: activeChild.isPaired ? 1 : 0.4, transition: 'all 0.2s' }}
            >
              {enforcingState === 'resume' ? 'Resuming...' : 'RESUME / UNLOCK'}
            </button>

            {!activeChild.isPaired && (
              <p style={{ fontSize: '12px', color: 'var(--accent-yellow)', marginTop: '12px', textAlign: 'center' }}>
                Device not paired — pair a child device to enable controls.
              </p>
            )}
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '10px', textAlign: 'center' }}>Use "Resume" to clear any active lockouts.</p>
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
            
            <div style={{ padding: '12px', background: 'rgba(37,99,235, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--accent-purple)', marginTop: '8px' }}>
               <p style={{ fontSize: '12px', color: 'var(--accent-purple)', fontWeight: '500' }}>AI Supervision active for {activeChild.name}</p>
            </div>
          </div>

        </div>

        {/* Face Registration Module embedded */}
        <div style={{ marginTop: '32px' }}>
           <FaceRegistration />
        </div>

        {/* App Manager */}
        {user?.subscriptionPlan === 'premium' ? (
          <AppManager childId={activeChild?.id} token={token} childName={activeChild?.name} />
        ) : (
          <div style={{ marginTop: '32px' }} className="glass-card">
            <div style={{ padding: '32px', textAlign: 'center' }}>
              <AppWindow size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
              <h3 style={{ fontSize: '20px', fontWeight: '800', marginBottom: '8px' }}>App Management Locked</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px' }}>
                Upgrade to Premium to track specific app usage and instantly lock individual apps on your child's device.
              </p>
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/auth/upgrade-plan', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                    const d = await res.json();
                    if (d.success) window.location.reload();
                  } catch (e) {}
                }}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #ef4444)',
                  color: '#fff', border: 'none', padding: '12px 24px', borderRadius: '20px',
                  fontWeight: 'bold', cursor: 'pointer'
                }}>
                Upgrade to Premium
              </button>
            </div>
          </div>
        )}

      </div>

      <ConfirmationModal
        isOpen={showLockConfirm}
        onClose={() => setShowLockConfirm(false)}
        onConfirm={() => {
          setShowLockConfirm(false);
          toggleControl('deviceState', 'locked');
        }}
        title="Lock Device"
        message={`Are you sure you want to instantly lock ${activeChild?.name || 'the child'}'s device?`}
        confirmText="Lock Device"
        cancelText="Cancel"
        isDestructive={true}
      />

      <ConfirmationModal
        isOpen={showUnlockConfirm}
        onClose={() => setShowUnlockConfirm(false)}
        onConfirm={() => {
          setShowUnlockConfirm(false);
          toggleControl('deviceState', 'active');
        }}
        title="Unlock Device"
        message={`Are you sure you want to unlock/resume ${activeChild?.name || 'the child'}'s device?`}
        confirmText="Unlock"
        cancelText="Cancel"
      />
    </>
  );
};

// App Manager Component
const INSTALLED_APPS = [
  { name: 'YouTube', icon: '📺', category: 'Entertainment', avgTime: '2h 15m', color: '#ef4444' },
  { name: 'Instagram', icon: '📸', category: 'Social', avgTime: '1h 30m', color: '#e91e8c' },
  { name: 'WhatsApp', icon: '💬', category: 'Messaging', avgTime: '45m', color: '#10b981' },
  { name: 'TikTok', icon: '🎵', category: 'Entertainment', avgTime: '1h 45m', color: '#000' },
  { name: 'Snapchat', icon: '👻', category: 'Social', avgTime: '50m', color: '#f59e0b' },
  { name: 'Chrome', icon: '🌐', category: 'Browser', avgTime: '1h 10m', color: '#3b82f6' },
  { name: 'Roblox', icon: '🎮', category: 'Gaming', avgTime: '2h 00m', color: '#8b5cf6' },
  { name: 'Spotify', icon: '🎧', category: 'Music', avgTime: '30m', color: '#10b981' },
  { name: 'Telegram', icon: '✈️', category: 'Messaging', avgTime: '25m', color: '#0891b2' },
  { name: 'Gallery', icon: '🖼️', category: 'System', avgTime: '15m', color: '#6366f1' },
];

const AppManager = ({ childId, token, childName }) => {
  const [lockedApps, setLockedApps] = useState([]);
  const [loading, setLoading] = useState({});

  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchLocked = useCallback(async () => {
    if (!childId || !token) return;
    try {
      const res = await fetch(`/api/device/locked-apps/${childId}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (data.success) setLockedApps(data.lockedApps || []);
    } catch {}
  }, [childId, token]);

  useEffect(() => { fetchLocked(); }, [fetchLocked]);

  const handleLock = async (appName) => {
    setLoading(l => ({ ...l, [appName]: true }));
    try {
      await fetch('/api/device/lock-app', { method: 'POST', headers, body: JSON.stringify({ childId, appName }) });
      await fetchLocked();
    } catch {}
    setLoading(l => ({ ...l, [appName]: false }));
  };

  const handleUnlock = async (appName) => {
    setLoading(l => ({ ...l, [appName]: true }));
    try {
      await fetch('/api/device/unlock-app', { method: 'POST', headers, body: JSON.stringify({ childId, appName }) });
      await fetchLocked();
    } catch {}
    setLoading(l => ({ ...l, [appName]: false }));
  };

  const getLockedInfo = (appName) => lockedApps.find(a => a.appName === appName);

  const getRemainingTime = (lockedAt) => {
    const end = new Date(lockedAt).getTime() + 24 * 60 * 60 * 1000;
    const remaining = end - Date.now();
    if (remaining <= 0) return 'Expired';
    const h = Math.floor(remaining / 3600000);
    const m = Math.floor((remaining % 3600000) / 60000);
    return `${h}h ${m}m left`;
  };

  if (!childId) return null;

  const renderApp = (app, isLocked) => {
    const lockInfo = getLockedInfo(app.name);
    return (
      <div key={app.name} style={{
        display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px',
        background: isLocked ? 'rgba(239,68,68,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${isLocked ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)'}`,
        borderRadius: '14px', transition: 'all 0.2s'
      }}>
        {/* App icon */}
        <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: `${app.color}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', flexShrink: 0, border: `1px solid ${app.color}25` }}>
          {app.icon}
        </div>

        {/* App info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>{app.name}</span>
            {isLocked && <span style={{ fontSize: '10px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '2px 8px', borderRadius: '10px', fontWeight: '700' }}>LOCKED</span>}
          </div>
          <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px' }}>
            <span>{app.category}</span>
            <span>📊 {app.avgTime}/day</span>
            {isLocked && <span style={{ color: '#f59e0b' }}>⏱️ {getRemainingTime(lockInfo.lockedAt)}</span>}
          </div>
        </div>

        {/* Lock/Unlock button */}
        <button
          onClick={() => isLocked ? handleUnlock(app.name) : handleLock(app.name)}
          disabled={loading[app.name]}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px', border: 'none', cursor: 'pointer',
            fontWeight: '700', fontSize: '12px',
            background: isLocked ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            color: isLocked ? '#10b981' : '#ef4444',
            opacity: loading[app.name] ? 0.5 : 1,
            transition: 'all 0.2s'
          }}
        >
          {isLocked ? <><Unlock size={14} /> Unlock</> : <><LockKeyhole size={14} /> Lock</>}
        </button>
      </div>
    );
  };

  const lockedAppsList = INSTALLED_APPS.filter(app => !!getLockedInfo(app.name));
  const unlockedAppsList = INSTALLED_APPS.filter(app => !getLockedInfo(app.name));

  return (
    <div style={{ marginTop: '32px' }}>
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AppWindow size={20} color="var(--accent-purple)" /> App Manager
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px', marginBottom: '20px' }}>
          See what apps {childName} is using and lock specific apps. Locked apps auto-unlock after 24 hours.
        </p>

        {lockedAppsList.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ fontSize: '12px', color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <LockKeyhole size={14} /> Locked Apps
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lockedAppsList.map(app => renderApp(app, true))}
            </div>
          </div>
        )}

        <div>
          <h4 style={{ fontSize: '12px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>
            Available Apps
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {unlockedAppsList.map(app => renderApp(app, false))}
          </div>
        </div>

        <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(245,158,11,0.05)', borderRadius: '10px', borderLeft: '3px solid #f59e0b' }}>
          <p style={{ fontSize: '12px', color: '#f59e0b', fontWeight: '500' }}>
            🔒 Locked apps require the parent control password to unlock on the child device, or auto-unlock after 24 hours.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Controls;
