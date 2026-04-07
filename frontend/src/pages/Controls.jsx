import React, { useState } from 'react';
import { Lock, Smartphone, Moon, ShieldAlert, Eye, Clock } from 'lucide-react';
import FaceRegistration from '../components/FaceRegistration';
import LockScreen from '../components/LockScreen';
import { useAuth } from '../context/AuthContext';

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
  const { activeChild, setActiveChild, token } = useAuth();
  const [deviceLock, setDeviceLock] = useState(false); // Global lock sim
  const [pairingCode, setPairingCode] = useState(activeChild?.pairingCode || null);
  
  if(!activeChild) return <div style={{padding: '24px'}}>No child selected</div>;

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

  const toggleControl = async (key) => {
    // Optimistic update
    const newValue = !activeChild[key];
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
      
      <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600' }}>Parental Controls: {activeChild.name}</h2>
          <p style={{ color: 'var(--text-muted)' }}>Real-time configurations and device management.</p>
        </div>

        {/* Extreme Override Card */}
        <div className="glass-card" style={{ 
          padding: '32px', marginBottom: '32px', 
          background: deviceLock ? 'rgba(239, 68, 68, 0.05)' : 'rgba(30, 30, 45, 0.5)',
          border: deviceLock ? '1px solid rgba(239, 68, 68, 0.5)' : undefined,
          boxShadow: deviceLock ? '0 0 40px rgba(239, 68, 68, 0.1)' : undefined
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
               <div style={{ 
                 width: '64px', height: '64px', borderRadius: '50%', background: deviceLock ? 'var(--accent-red)' : 'rgba(255,255,255,0.05)',
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 boxShadow: deviceLock ? '0 0 20px rgba(239, 68, 68, 0.6)' : 'none',
                 transition: 'all 0.3s'
               }}>
                 <Lock size={32} color={deviceLock ? '#fff' : 'var(--text-muted)'} />
               </div>
               <div>
                 <h3 style={{ fontSize: '20px', color: deviceLock ? 'var(--accent-red)' : 'var(--text-primary)' }}>System Lockdown Mode</h3>
                 <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>Instantly lock this childs device. Overrides all other settings.</p>
               </div>
             </div>
             
             <button 
               onClick={() => setDeviceLock(true)}
               style={{ 
                 padding: '12px 32px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                 background: 'var(--accent-red)',
                 color: '#fff',
                 fontWeight: '600', fontSize: '16px', transition: 'all 0.3s',
                 boxShadow: '0 0 15px rgba(239,68,68,0.4)'
               }}
             >
               LOCK DEVICE NOW
             </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', alignItems: 'start' }}>
          
          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Smartphone size={20} color="var(--accent-cyan)" /> Device Pairing
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: 1.5 }}>
              Generate a unique 6-digit code to securely link the child's device for tracking and live mode overrides.
            </p>
            
            <div style={{ padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', textAlign: 'center', marginBottom: '16px' }}>
              {activeChild.isPaired ? (
                <div style={{ color: 'var(--accent-green)', fontWeight: 'bold' }}>Device Actively Linked</div>
              ) : pairingCode ? (
                 <>
                   <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>Sync Code</div>
                   <div style={{ fontSize: '28px', letterSpacing: '4px', fontWeight: '800', color: 'var(--accent-cyan)' }}>{pairingCode}</div>
                 </>
              ) : (
                <div style={{ color: 'var(--text-secondary)' }}>No device paired</div>
              )}
            </div>

            {!activeChild.isPaired && (
              <button 
                onClick={generateCode}
                style={{ width: '100%', padding: '10px', background: 'rgba(0, 240, 255, 0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(0, 240, 255, 0.3)', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }}
              >
                 Generate Code
              </button>
            )}
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={20} color="var(--accent-cyan)" /> Time Restrictions
            </h3>
            
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span>Daily Limit</span>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>{activeChild.dailyLimitHours || 5} Hours</span>
              </div>
              <input 
                type="range" min="1" max="12" step="0.5" 
                value={activeChild.dailyLimitHours || 5} onChange={(e) => setDailyLimit(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--accent-cyan)' }} 
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Moon size={16}/> Night Restriction</div>
              </div>
              <Toggle active={activeChild.nightRestriction} onChange={() => toggleControl('nightRestriction')} />
            </div>
          </div>

          <div className="glass-card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '18px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert size={20} color="var(--accent-purple)" /> Safety & Filters
            </h3>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
              <div>
                <div style={{ fontWeight: '600' }}>Safe Browsing Mode</div>
              </div>
              <Toggle active={activeChild.safeMode} onChange={() => toggleControl('safeMode')} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div>
                <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}><Eye size={16}/> Face Checks</div>
              </div>
              <Toggle active={activeChild.facePresenceEnabled} onChange={() => toggleControl('facePresenceEnabled')} />
            </div>
            
            <div style={{ padding: '12px', background: 'rgba(0, 240, 255, 0.05)', borderRadius: '8px', borderLeft: '3px solid var(--accent-cyan)', marginTop: '4px' }}>
               <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Settings affect target API instantly.</p>
            </div>
          </div>

        </div>

        {/* Face Registration Module embedded */}
        <FaceRegistration />

      </div>
    </>
  );
};

export default Controls;
