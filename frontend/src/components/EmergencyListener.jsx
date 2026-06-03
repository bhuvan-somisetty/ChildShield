import React, { useEffect, useState, useRef } from 'react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useAuth } from '../context/AuthContext';
import { AlertTriangle, MapPin, X, Navigation } from 'lucide-react';
import { speak } from '../hooks/VoiceAssistant';

const EmergencyListener = () => {
  const { activeChild } = useAuth();
  const { connectSocket } = useWebRTC(activeChild?.id, 'parent');
  const [sosEvent, setSosEvent] = useState(null);
  const [nearbyFacility, setNearbyFacility] = useState(null);
  
  // For the looping voice AI & Alarm
  const loopRef = useRef(null);
  const alarmRef = useRef(null);
  const loopCountRef = useRef(0);
  const snoozeTimerRef = useRef(null);

  useEffect(() => {
    if (sosEvent?.payload?.lat && sosEvent?.payload?.lon) {
      Promise.all([
        fetch(`/api/device/nearby-facilities?lat=${sosEvent.payload.lat}&lon=${sosEvent.payload.lon}&type=police`),
        fetch(`/api/device/nearby-facilities?lat=${sosEvent.payload.lat}&lon=${sosEvent.payload.lon}&type=hospital`)
      ])
        .then(([policeRes, hospitalRes]) => Promise.all([policeRes.json(), hospitalRes.json()]))
        .then(([policeData, hospitalData]) => {
          const facilities = [];
          if (policeData.success && policeData.facilities) {
            facilities.push(...policeData.facilities.slice(0, 2));
          }
          if (hospitalData.success && hospitalData.facilities) {
            facilities.push(...hospitalData.facilities.slice(0, 2));
          }
          if (facilities.length > 0) {
            facilities.sort((a, b) => a.distance - b.distance);
            setNearbyFacility(facilities);
          }
        }).catch(() => {});
    }
  }, [sosEvent?.payload?.lat, sosEvent?.payload?.lon]);

  useEffect(() => {
    if (!activeChild?.id) return;
    const socket = connectSocket();

    const handleCommand = ({ command, payload }) => {
      if (command === 'emergency') {
        const childName = activeChild.name || 'Your child';
        setSosEvent({ payload, childName, timestamp: new Date() });
        setNearbyFacility(null);
        
        const announce = () => {
          speak(`Dear Parent, do not worry. ${childName} has triggered an SOS emergency signal. I am identifying nearby police stations, hospitals, and safe zones in the area. Please check the dashboard immediately.`);
        };
        
        // Initial announce
        announce();
        
        // Setup Alarm Sound
        const playAlarm = () => {
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'square';
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.2);
            osc.frequency.setValueAtTime(880, ctx.currentTime + 0.4);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);  // audible alarm
            osc.start();
            osc.stop(ctx.currentTime + 0.6);
          } catch(e) {}
        };

        playAlarm();
        if (alarmRef.current) clearInterval(alarmRef.current);
        alarmRef.current = setInterval(playAlarm, 1500);

        // Loop voice every 30 seconds for 10 minutes (20 times max)
        loopCountRef.current = 0;
        if (loopRef.current) clearInterval(loopRef.current);
        loopRef.current = setInterval(() => {
          loopCountRef.current += 1;
          if (loopCountRef.current > 20) {
            clearInterval(loopRef.current);
          } else {
            announce();
          }
        }, 30000);
      }
    };

    socket.on('command', handleCommand);
    return () => {
      socket.off('command', handleCommand);
      if (loopRef.current) clearInterval(loopRef.current);
      if (alarmRef.current) clearInterval(alarmRef.current);
      if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
    };
  }, [activeChild, connectSocket]);

  const dismissAlert = () => {
    if (loopRef.current) clearInterval(loopRef.current);
    if (alarmRef.current) clearInterval(alarmRef.current);
    if (snoozeTimerRef.current) clearTimeout(snoozeTimerRef.current);
    setSosEvent(null);
  };

  const snoozeAlert = () => {
    if (alarmRef.current) clearInterval(alarmRef.current);
    if (loopRef.current) clearInterval(loopRef.current);
    // Re-trigger alert in 5 minutes
    snoozeTimerRef.current = setTimeout(() => {
      if (sosEvent) {
        window.speechSynthesis.cancel();
        setTimeout(() => window.speechSynthesis.speak(
          Object.assign(new SpeechSynthesisUtterance(`Reminder: ${sosEvent.childName} is still in an emergency.`), { volume: 0.9, rate: 0.92 })
        ), 50);
      }
    }, 5 * 60 * 1000);
  };

  if (!sosEvent) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(239, 68, 68, 0.5)', backdropFilter: 'blur(12px)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ 
        background: '#0f172a', border: '2px solid #ef4444', 
        padding: '30px', borderRadius: '24px', width: '100%', maxWidth: '440px', 
        textAlign: 'center', boxShadow: '0 0 100px rgba(239, 68, 68, 0.8)',
        animation: 'pulse-dot 1s infinite'
      }}>
        <div style={{ position: 'absolute', top: '16px', right: '16px', cursor: 'pointer', background: 'rgba(255,255,255,0.1)', padding: '6px', borderRadius: '50%' }} onClick={dismissAlert}>
          <X color="#fff" size={20} />
        </div>
        
        <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239,68,68,0.2)', border: '2px solid #ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 30px #ef4444' }}>
          <AlertTriangle size={48} color="#ef4444" />
        </div>
        
        <h2 style={{ color: '#fff', fontSize: '26px', fontWeight: '900', marginBottom: '8px', letterSpacing: '0.05em' }}>SOS EMERGENCY</h2>
        <p style={{ color: '#ef4444', fontSize: '15px', fontWeight: 'bold', marginBottom: '24px' }}>{sosEvent.childName} has triggered a distress signal!</p>
        
        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '16px', marginBottom: '24px', textAlign: 'left' }}>
          <div style={{ fontSize: '13px', color: '#cbd5e1', marginBottom: '16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', color: '#fff' }}>Time Triggered:</span>
            <span>{sosEvent.timestamp.toLocaleTimeString()}</span>
          </div>
          {sosEvent.payload?.lat ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#2563eb', fontSize: '14px', fontWeight: 'bold' }}>
                  <MapPin size={16} /> GPS Fix Acquired
                </div>
              </div>

              {nearbyFacility && nearbyFacility.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '700' }}>Nearest Safe Facilities</div>
                  {nearbyFacility.map((facility, idx) => (
                    <div key={idx} style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', padding: '12px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ color: '#60a5fa', fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>{facility.type} • {facility.distanceText}</div>
                        <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{facility.name}</div>
                      </div>
                      <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${facility.lat},${facility.lon}&travelmode=driving`, '_blank')} style={{ background: 'rgba(59,130,246,0.2)', border: 'none', color: '#60a5fa', padding: '8px', borderRadius: '8px', cursor: 'pointer' }}>
                        <Navigation size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${sosEvent.payload.lat},${sosEvent.payload.lon}&travelmode=driving`, '_blank')} style={{ width: '100%', padding: '14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '14px', fontWeight: '800', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 15px rgba(16,185,129,0.4)', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <Navigation size={20} /> Navigate To Child
              </button>
            </>
          ) : (
            <div style={{ fontSize: '14px', color: '#f59e0b', textAlign: 'center', padding: '20px 0' }}>
              {sosEvent.payload?.reason === 'denied' ? '⚠️ Child device denied location permission. Accurate GPS unavailable.' :
               sosEvent.payload?.reason === 'timeout' ? '⚠️ Child device GPS signal timed out.' :
               sosEvent.payload?.reason === 'unavailable' ? '⚠️ Child device location services are unavailable.' :
               'Waiting for live GPS coordinates... Check Location Tracker.'}
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
          <button onClick={snoozeAlert} style={{ flex: 1, padding: '12px', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: '12px', color: '#f59e0b', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            🔔 Remind in 5 min
          </button>
          <button onClick={dismissAlert} style={{ flex: 1, padding: '12px', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '12px', color: '#10b981', fontWeight: '700', fontSize: '13px', cursor: 'pointer' }}>
            ✅ OK, I've seen this
          </button>
        </div>
        <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '12px' }}>
          <div>🔊</div> Samantha AI is repeating broadcast. Mute AI to stop.
        </div>
      </div>
      <style>{`@keyframes pulse-dot { 0%,100%{transform:scale(1);} 50%{transform:scale(1.02);} }`}</style>
    </div>
  );
};

export default EmergencyListener;
