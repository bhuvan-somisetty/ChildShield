import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Wifi, WifiOff, Loader, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';

const AudioListener = () => {
  const { activeChild } = useAuth();
  const childId = activeChild?.id;
  const { connected, peerConnected, remoteStream, connectSocket, sendOffer, disconnect } = useWebRTC(childId, 'parent');

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [duration, setDuration] = useState(0);

  // Attach remote stream
  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      setListening(true);

      // Audio visualizer
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const source = ctx.createMediaStreamSource(remoteStream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        drawVisualizer();
      } catch {}
    }
  }, [remoteStream]);

  // Duration counter
  useEffect(() => {
    if (!listening) { setDuration(0); return; }
    const iv = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(iv);
  }, [listening]);

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    const bufLen = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufLen);
    const W = canvas.width;
    const H = canvas.height;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);
      ctx.fillStyle = 'rgba(15,15,23,0.3)';
      ctx.fillRect(0, 0, W, H);
      const barW = (W / bufLen) * 2.5;
      let x = 0;
      for (let i = 0; i < bufLen; i++) {
        const barH = (dataArray[i] / 255) * H;
        const hue = (i / bufLen) * 180 + 160;
        ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
        ctx.fillRect(x, H - barH, barW, barH);
        x += barW + 1;
      }
    };
    draw();
  };

  const formatDur = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const handleStart = useCallback(async () => {
    connectSocket();
    setTimeout(() => sendOffer('audio'), 1000);
  }, [connectSocket, sendOffer]);

  const handleStop = useCallback(() => {
    setListening(false);
    if (animRef.current) cancelAnimationFrame(animRef.current);
    disconnect();
  }, [disconnect]);

  if (!childId) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#475569' }}>
      <p>No child device selected. Go to Controls to pair a device first.</p>
    </div>
  );

  return (
    <div style={{ maxWidth: '700px', margin: '0 auto' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>🎤 Audio Listener</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Listen to ambient audio from {activeChild?.name}'s device</p>
      </div>

      {/* Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 18px', background: listening ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)', border: `1px solid ${listening ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: '14px', marginBottom: '20px' }}>
        {listening ? <Volume2 size={18} color="#f59e0b" /> : <MicOff size={18} color="#475569" />}
        <span style={{ fontSize: '14px', fontWeight: '600', color: listening ? '#f59e0b' : '#475569' }}>
          {listening ? `Listening — ${formatDur(duration)}` : connected ? 'Waiting for child device...' : 'Audio Inactive'}
        </span>
        <div style={{ marginLeft: 'auto', width: '8px', height: '8px', borderRadius: '50%', background: listening ? '#f59e0b' : '#334155', boxShadow: listening ? '0 0 8px #f59e0b' : 'none', animation: listening ? 'pulse-dot 2s infinite' : 'none' }} />
      </div>

      {/* Visualizer */}
      <div style={{ background: '#0f0f17', borderRadius: '20px', overflow: 'hidden', marginBottom: '24px', border: '1px solid rgba(255,255,255,0.06)', padding: '20px' }}>
        <canvas ref={canvasRef} width={600} height={200} style={{ width: '100%', height: '200px', borderRadius: '12px', display: 'block' }} />
        <audio ref={audioRef} autoPlay style={{ display: 'none' }} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
        {!listening ? (
          <button onClick={handleStart} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: '#f59e0b', border: 'none', borderRadius: '14px', color: '#0f172a', fontWeight: '700', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 20px rgba(245,158,11,0.3)' }}>
            {connected ? <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Mic size={18} />}
            {connected ? 'Connecting...' : 'Start Listening'}
          </button>
        ) : (
          <button onClick={handleStop} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '16px 32px', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '14px', color: '#ef4444', fontWeight: '700', fontSize: '15px', cursor: 'pointer' }}>
            <MicOff size={18} /> Stop Listening
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioListener;
