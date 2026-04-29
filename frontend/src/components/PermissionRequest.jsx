import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Bell, Loader2 } from 'lucide-react';

/**
 * PermissionRequest
 * â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
 * Shows a one-time permission banner for Location + Notifications.
 * Fixes:
 *  - useEffect no longer depends on unstable `onComplete` reference
 *  - Permission status is re-checked from browser API (not just localStorage)
 *    so "Granted" state is always accurate
 *  - Banner will NEVER show again once the user interacts with it
 */
const PermissionRequest = ({ onComplete }) => {
  const [visible, setVisible]     = useState(false);
  const [requesting, setRequesting] = useState(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    // Already interacted with banner â€” never show again
    const dismissed = localStorage.getItem('cs_permission_requested');
    if (dismissed) {
      onCompleteRef.current?.();
      return;
    }

    // Check if permissions are already granted at browser level
    const checkPermissions = async () => {
      let locationGranted = false;
      let notifyGranted   = false;

      try {
        const geo = await navigator.permissions?.query({ name: 'geolocation' });
        locationGranted = geo?.state === 'granted';
      } catch {}

      try {
        notifyGranted = Notification?.permission === 'granted';
      } catch {}

      if (locationGranted && notifyGranted) {
        // Already have both â€” save and close
        localStorage.setItem('cs_permission_requested', 'true');
        localStorage.setItem('cs_location_permitted',     'true');
        localStorage.setItem('cs_notification_permitted', 'true');
        onCompleteRef.current?.();
        return;
      }

      // Show the banner
      setVisible(true);
    };

    checkPermissions();
  }, []); // â† intentionally empty â€” runs only on mount

  const requestPermissions = async () => {
    setRequesting(true);
    try {
      // Location
      if ('geolocation' in navigator) {
        await new Promise(resolve => {
          navigator.geolocation.getCurrentPosition(
            () => { localStorage.setItem('cs_location_permitted', 'true');  resolve(); },
            () => { localStorage.setItem('cs_location_permitted', 'false'); resolve(); },
            { timeout: 5000 }
          );
        });
      }

      // Notifications
      if ('Notification' in window) {
        const result = await Notification.requestPermission();
        localStorage.setItem('cs_notification_permitted', result === 'granted' ? 'true' : 'false');
      }
    } catch (e) {
      console.warn('[Permissions] Error requesting:', e.message);
    }

    localStorage.setItem('cs_permission_requested', 'true');
    setRequesting(false);
    setVisible(false);
    onCompleteRef.current?.();
  };

  const skipPermissions = () => {
    localStorage.setItem('cs_permission_requested', 'true');
    setVisible(false);
    onCompleteRef.current?.();
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'rgba(15, 23, 42, 0.97)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid rgba(37,99,235, 0.2)', padding: '20px',
      zIndex: 9999, animation: 'slideUp 0.3s ease-out',
    }}>
      <style>{`@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }`}</style>
      <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(37,99,235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <MapPin size={20} color="#2563eb" />
          </div>
          <div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#fff' }}>Enable Permissions</div>
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>For location tracking and alerts</div>
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
          <button
            onClick={skipPermissions}
            style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', color: '#94a3b8', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          >
            Skip
          </button>
          <button
            onClick={requestPermissions}
            disabled={requesting}
            style={{ padding: '10px 24px', background: '#2563eb', border: 'none', borderRadius: '10px', color: '#0f172a', fontSize: '13px', fontWeight: '700', cursor: requesting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px', opacity: requesting ? 0.8 : 1 }}
          >
            {requesting ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : null}
            {requesting ? 'Enabling...' : 'Enable All'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PermissionRequest;