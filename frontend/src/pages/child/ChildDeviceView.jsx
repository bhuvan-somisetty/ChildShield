import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Clock } from 'lucide-react';
import SessionLockOverlay from './SessionLockOverlay';
import { speak } from '../../hooks/VoiceAssistant';

const ChildDeviceView = () => {
  const [session, setSession] = useState(JSON.parse(localStorage.getItem('child_session')));
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();
  
  const voiceRefs = useRef({
    tenMin: false,
    fiveMin: false,
    oneMin: false,
    locked: false
  });

  useEffect(() => {
    if (!session) {
      navigate('/child/setup');
      return;
    }

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/device/status/${session.childId}`);
        const data = await res.json();
        if (data.success) {
          setStatus(data.status);
          checkVoiceTriggers(data.status);
        }
      } catch (err) {
        console.error('Child device sync error', err);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000); // 3-second sync
    return () => clearInterval(interval);
  }, [session, navigate]);

  const checkVoiceTriggers = (currentStatus) => {
    if (!currentStatus.voiceEnabled) return;
    
    // Voice simulation triggers (mock logic based on state changes)
    if (currentStatus.deviceState === 'locked' && !voiceRefs.current.locked) {
      speak("Session has been locked. Time limit reached.");
      voiceRefs.current.locked = true;
    } else if (currentStatus.deviceState === 'active') {
      voiceRefs.current.locked = false; // Reset if unlocked
    }
  };

  const handleUnpair = () => {
    localStorage.removeItem('child_session');
    navigate('/child/setup');
  };

  if (!status) return <div style={{ padding: '24px', color: '#fff' }}>Syncing with parent...</div>;

  if (status.deviceState === 'locked') {
    return <SessionLockOverlay reason={status.lockReason} />;
  }

  return (
    <div style={{ height: '100dvh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-green)' }}>
          <ShieldCheck size={20} /> <span style={{ fontWeight: '600' }}>Supervised Session</span>
        </div>
        <button onClick={handleUnpair} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <LogOut size={20} />
        </button>
      </div>

      <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Hello, {status.name}</h1>
          <p style={{ color: 'var(--text-muted)' }}>This device is currently linked and protected by ChildShield AI.</p>
        </div>

        <div className="glass-panel" style={{ padding: '32px', width: '100%', maxWidth: '340px', textAlign: 'center' }}>
           <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
             <Clock size={30} color="var(--accent-cyan)" />
           </div>
           
           <div style={{ fontSize: '13px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Active Time Limit</div>
           <div style={{ fontSize: '36px', fontWeight: '800', color: '#fff', marginBottom: '16px' }}>{status.dailyLimitHours} <span style={{ fontSize: '16px', color: 'var(--text-muted)', fontWeight: '500' }}>hrs</span></div>

           <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
             Status: <span style={{ color: status.deviceState === 'paused' ? 'var(--accent-yellow)' : 'var(--accent-green)', fontWeight: 'bold' }}>
               {status.deviceState.toUpperCase()}
             </span>
             {status.deviceState === 'paused' && <div style={{ fontSize: '12px', color: 'var(--accent-yellow)', marginTop: '4px' }}>Session paused by parent.</div>}
           </div>
        </div>

        {status.safeMode && (
          <div style={{ marginTop: '24px', padding: '12px 20px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '30px', color: 'var(--accent-green)', fontSize: '13px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent-green)', boxShadow: '0 0 10px var(--accent-green)' }}></div> Safe Browsing Enforced
          </div>
        )}
      </div>
    </div>
  );
};

export default ChildDeviceView;
