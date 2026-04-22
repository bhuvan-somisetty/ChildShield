import React, { useState, useEffect } from 'react';
import { MapPin, Bell, Camera, Mic, Loader2 } from 'lucide-react';

const PermissionRequest = ({ onComplete }) => {
  const [permission, setPermission] = useState(null);
  const [checking, setChecking] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    const checked = localStorage.getItem('cs_permission_requested');
    if (checked) {
      setChecking(false);
      setPermission('dismissed');
      onComplete?.();
    } else {
      setChecking(false);
    }
  }, [onComplete]);

  const requestPermissions = async () => {
    setRequesting(true);
    
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          () => localStorage.setItem('cs_location_permitted', 'true'),
          () => localStorage.setItem('cs_location_permitted', 'false')
        );
      }

      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        localStorage.setItem('cs_notification_permitted', result === 'granted' ? 'true' : 'false');
      }
      
      localStorage.setItem('cs_permission_requested', 'true');
      setPermission('granted');
      onComplete?.();
    } catch (e) {
      localStorage.setItem('cs_permission_requested', 'true');
      setPermission('dismissed');
      onComplete?.();
    }
    
    setRequesting(false);
  };

  const skipPermissions = () => {
    localStorage.setItem('cs_permission_requested', 'true');
    setPermission('dismissed');
    onComplete?.();
  };

  if (checking || permission) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(0, 240, 255, 0.2)', padding: '20px',
      zIndex: 9999, animation: 'slideUp 0.3s ease-out'
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0, 240, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} color="#00f0ff" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Enable Permissions</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>For a better experience</div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px', color: '#94a3b8' }}>
            <MapPin size={14} /> Location
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', fontSize: '12px', color: '#94a3b8' }}>
            <Bell size={14} /> Notifications
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={skipPermissions} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
            Skip
          </button>
          <button onClick={requestPermissions} disabled={requesting} style={{ padding: '10px 24px', background: '#00f0ff', border: 'none', borderRadius: '10px', color: '#0f172a', fontSize: '13px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            {requesting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {requesting ? 'Enabling...' : 'Enable All'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionRequest;