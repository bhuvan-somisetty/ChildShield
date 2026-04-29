import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, SwitchCamera, Flashlight, Download, Wifi, WifiOff, Loader, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';

// Custom Animated Toggle matching Controls page
const Toggle = ({ active, onChange, disabled }) => {
  return (
    <div 
      onClick={() => { if (!disabled) onChange(!active); }}
      style={{
        width: '56px', height: '32px', borderRadius: '16px',
        backgroundColor: active ? 'rgba(37,99,235, 0.4)' : 'rgba(255, 255, 255, 0.1)',
        position: 'relative', cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
        border: `1px solid ${active ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)'}`,
        boxShadow: active && !disabled ? `0 0 10px rgba(37,99,235, 0.3)` : 'none',
        opacity: disabled ? 0.5 : 1
      }}
    >
      <div style={{
        position: 'absolute', top: '2px', left: active ? '26px' : '2px',
        width: '26px', height: '26px', borderRadius: '50%',
        backgroundColor: '#fff', transition: 'left 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        boxShadow: active && !disabled ? `0 0 10px var(--accent-cyan)` : '0 2px 5px rgba(0,0,0,0.2)'
      }}></div>
    </div>
  );
};

const ControlRow = ({ icon: Icon, title, description, control }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.06)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ width: '46px', height: '46px', borderRadius: '12px', background: 'rgba(37,99,235, 0.1)', border: '1px solid rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={22} color="var(--accent-cyan)" />
      </div>
      <div>
        <div style={{ fontWeight: '700', color: '#fff', fontSize: '15px', marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{description}</div>
      </div>
    </div>
    <div>{control}</div>
  </div>
);

const CameraView = () => {
  const { activeChild } = useAuth();
  const childId = activeChild?.id;
  const { connected, peerConnected, remoteStream, connectSocket, sendOffer, sendCommand, disconnect } = useWebRTC(childId, 'parent');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [facingMode, setFacingMode] = useState('user');
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  // Attach remote stream to video
  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
      setStreaming(true);
    }
  }, [remoteStream]);

  const handleStart = useCallback(async () => {
    if (!childId) {
      alert('No child device paired. Please pair a device from Controls first.');
      return;
    }
    connectSocket();
    setFacingMode('user');
    setAudioEnabled(false);
    setFlashEnabled(false);
    
    // Wait for socket connection then peer connection before sending offer
    const checkConnection = setInterval(() => {
      if (connected && peerConnected) {
        clearInterval(checkConnection);
        sendOffer('camera');
      }
    }, 500);
    
    // Fallback: send offer after 5 seconds anyway
    setTimeout(() => {
      clearInterval(checkConnection);
      if (!streaming) {
        sendOffer('camera');
      }
    }, 5000);
  }, [connectSocket, sendOffer, childId, connected, peerConnected, streaming]);

  const handleStop = useCallback(() => {
    setStreaming(false);
    disconnect();
  }, [disconnect]);

  const handleToggleCamera = (useBack) => {
    const next = useBack ? 'environment' : 'user';
    setFacingMode(next);
    sendCommand('switch-camera', { facingMode: next });
  };

  const handleToggleAudio = (enabled) => {
    setAudioEnabled(enabled);
    sendCommand('toggle-audio', { enabled });
  };

  const handleToggleFlash = (enabled) => {
    setFlashEnabled(enabled);
    sendCommand('toggle-flash', { enabled });
  };

  const handleScreenshot = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const link = document.createElement('a');
    link.download = `childshield-camera-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!childId) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#475569' }}>
      <p>No child device selected. Go to Controls to pair a device first.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '60px', padding: '0 16px' }}>
      <style>{`
        @media (max-width: 768px) {
          .camera-controls { flex-direction: column !important; }
          .camera-video { border-radius: 12px !important; }
        }
      `}</style>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>ðŸ“· Remote Camera</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>View live camera feed from {activeChild?.name}'s device</p>
      </div>

      {/* Status card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: streaming ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${streaming ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '14px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {streaming ? <Wifi size={18} color="#10b981" /> : <WifiOff size={18} color="#475569" />}
        <span style={{ fontSize: '14px', fontWeight: '600', color: streaming ? '#10b981' : '#475569' }}>
          {streaming ? 'Camera Active â€” Live Feed' : peerConnected ? 'Connecting stream...' : connected ? 'Waiting for child device...' : 'Camera Inactive'}
        </span>
        <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: streaming ? '#10b981' : '#334155', boxShadow: streaming ? '0 0 8px #10b981' : 'none', animation: streaming ? 'pulse-dot 2s infinite' : 'none' }} />
      </div>

      {/* Video display */}
      <div style={{ position: 'relative', background: '#000', borderRadius: '20px', overflow: 'hidden', aspectRatio: '16/9', marginBottom: '32px', border: '1px solid rgba(255,255,255,0.06)' }}>
        {streaming ? (
          <video ref={videoRef} autoPlay playsInline muted={false} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '300px' }}>
            <Camera size={48} color="#334155" />
            <span style={{ color: '#475569', fontSize: '14px' }}>Camera feed will appear here</span>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Controls Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          {!streaming ? (
            <button onClick={handleStart} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: '#10b981', border: 'none', borderRadius: '16px', color: '#fff', fontWeight: '700', fontSize: '16px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(16,185,129,0.3)' }}>
              {connected ? <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={20} />}
              {connected ? 'Connecting...' : 'Start Camera Stream'}
            </button>
          ) : (
            <button onClick={handleStop} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 40px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '14px', color: '#ef4444', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
              <CameraOff size={18} /> Stop Viewing
            </button>
          )}
        </div>

        <ControlRow 
          icon={SwitchCamera} 
          title="Camera Direction" 
          description={facingMode === 'user' ? "Front Camera Selected" : "Back Camera Selected"} 
          control={<Toggle active={facingMode === 'environment'} disabled={!streaming} onChange={(v) => handleToggleCamera(v)} />} 
        />

        <ControlRow 
          icon={audioEnabled ? Mic : MicOff} 
          title="Microphone Monitoring" 
          description={audioEnabled ? "Listening to child's audio" : "Audio muted"} 
          control={<Toggle active={audioEnabled} disabled={!streaming} onChange={handleToggleAudio} />} 
        />

        <ControlRow 
          icon={Flashlight} 
          title="Device Flashlight" 
          description={flashEnabled ? "Flashlight is ON" : "Flashlight is OFF"} 
          control={<Toggle active={flashEnabled} disabled={!streaming} onChange={handleToggleFlash} />} 
        />

        <ControlRow 
          icon={Camera} 
          title="Screen Capture" 
          description="Take a snapshot of current feed" 
          control={
            <button disabled={!streaming} onClick={handleScreenshot} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '10px', color: '#8b5cf6', fontWeight: '700', fontSize: '13px', cursor: streaming ? 'pointer' : 'not-allowed', opacity: streaming ? 1 : 0.5 }}>
              <Download size={16} /> Capture
            </button>
          } 
        />

      </div>
    </div>
  );
};

export default CameraView;
