import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Monitor, MonitorOff, Download, Wifi, WifiOff, Loader, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';

const ScreenView = () => {
  const { activeChild } = useAuth();
  const childId = activeChild?.id;
  const { connected, peerConnected, remoteStream, connectSocket, sendOffer, sendCommand, disconnect } = useWebRTC(childId, 'parent');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [viewing, setViewing] = useState(false);

  useEffect(() => {
    if (videoRef.current && remoteStream) {
      videoRef.current.srcObject = remoteStream;
      setViewing(true);
    }
  }, [remoteStream]);

  const handleStart = useCallback(async () => {
    connectSocket();
    setTimeout(() => {
      sendCommand('request-screen');
      sendOffer('screen');
    }, 1000);
  }, [connectSocket, sendOffer, sendCommand]);

  const handleStop = useCallback(() => {
    setViewing(false);
    disconnect();
  }, [disconnect]);

  const handleScreenshot = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const link = document.createElement('a');
    link.download = `childshield-screen-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!childId) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#475569' }}>
      <p>No child device selected. Go to Controls to pair a device first.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>🖥️ Screen View</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>View {activeChild?.name}'s screen in real time</p>
      </div>

      {/* Info box */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '14px 18px', background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: '14px', marginBottom: '20px' }}>
        <Monitor size={18} color="#8b5cf6" style={{ marginTop: '1px', flexShrink: 0 }} />
        <div>
          <span style={{ fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
            When you start screen viewing, the child device will receive a system prompt asking to share their screen. This is a platform requirement and cannot be bypassed.
          </span>
        </div>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: viewing ? 'rgba(139,92,246,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${viewing ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '14px', marginBottom: '20px' }}>
        {viewing ? <Wifi size={18} color="#8b5cf6" /> : <WifiOff size={18} color="#475569" />}
        <span style={{ fontSize: '14px', fontWeight: '600', color: viewing ? '#8b5cf6' : '#475569' }}>
          {viewing ? 'Screen Active — Viewing Live' : connected ? 'Waiting for child to accept...' : 'Screen View Inactive'}
        </span>
        <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: viewing ? '#8b5cf6' : '#334155', boxShadow: viewing ? '0 0 8px #8b5cf6' : 'none', animation: viewing ? 'pulse-dot 2s infinite' : 'none' }} />
      </div>

      {/* Screen display */}
      <div style={{ position: 'relative', background: '#000', borderRadius: '20px', overflow: 'hidden', aspectRatio: '16/9', marginBottom: '20px', border: '1px solid rgba(255,255,255,0.06)' }}>
        {viewing ? (
          <video ref={videoRef} autoPlay playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', minHeight: '300px' }}>
            <Monitor size={48} color="#334155" />
            <span style={{ color: '#475569', fontSize: '14px' }}>Child screen will appear here</span>
          </div>
        )}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {!viewing ? (
          <button onClick={handleStart} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 28px', background: '#8b5cf6', border: 'none', borderRadius: '14px', color: '#fff', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(139,92,246,0.3)' }}>
            {connected ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Monitor size={18} />}
            {connected ? 'Connecting...' : 'View Child Screen'}
          </button>
        ) : (
          <>
            <button onClick={handleStop} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', color: '#ef4444', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              <MonitorOff size={16} /> Stop Viewing
            </button>
            <button onClick={handleScreenshot} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 20px', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: '14px', color: '#8b5cf6', fontWeight: '700', fontSize: '14px', cursor: 'pointer' }}>
              <Camera size={16} /> Take Screenshot
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ScreenView;
