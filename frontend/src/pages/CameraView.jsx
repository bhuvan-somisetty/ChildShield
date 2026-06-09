import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, CameraOff, SwitchCamera, Flashlight, Download, Wifi, WifiOff, Loader2, Mic, MicOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { Card } from '../components/ui';

const Toggle = ({ active, onChange, disabled, color = '#06b6d4' }) => (
  <button
    onClick={() => { if (!disabled) onChange(!active); }}
    disabled={disabled}
    className="ag-tap relative w-[52px] h-[30px] rounded-full p-[3px] flex-shrink-0 border transition-colors duration-200 disabled:opacity-40"
    style={{ background: active ? color : 'rgba(255,255,255,0.07)', borderColor: active ? color : 'rgba(255,255,255,0.1)', boxShadow: active && !disabled ? `0 0 14px ${color}55` : 'none' }}
  >
    <span className="block w-6 h-6 rounded-full bg-white shadow-md transition-transform duration-200" style={{ transform: active ? 'translateX(22px)' : 'translateX(0)' }} />
  </button>
);

const ControlRow = ({ icon: Icon, title, description, control }) => (
  <Card className="p-4 flex items-center justify-between">
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-11 h-11 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center flex-shrink-0">
        <Icon size={20} className="text-cyan-400" />
      </div>
      <div className="min-w-0">
        <div className="text-[14px] font-bold text-white">{title}</div>
        <div className="text-[12px] text-slate-500 truncate">{description}</div>
      </div>
    </div>
    {control}
  </Card>
);

const StatusBar = ({ active, label, color }) => (
  <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border mb-5"
    style={{ background: active ? `${color}10` : 'rgba(255,255,255,0.03)', borderColor: active ? `${color}33` : 'rgba(255,255,255,0.06)' }}>
    {active ? <Wifi size={18} style={{ color }} /> : <WifiOff size={18} className="text-slate-500" />}
    <span className="text-[14px] font-bold" style={{ color: active ? color : '#64748b' }}>{label}</span>
    <span className="ml-auto w-2.5 h-2.5 rounded-full" style={{ background: active ? color : '#334155', boxShadow: active ? `0 0 10px ${color}` : 'none' }} />
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

  useEffect(() => {
    if (videoRef.current && remoteStream) { videoRef.current.srcObject = remoteStream; setStreaming(true); }
  }, [remoteStream]);

  const handleStart = useCallback(async () => {
    if (!childId) { alert('No child device paired. Please pair a device from Controls first.'); return; }
    connectSocket();
    setFacingMode('user'); setAudioEnabled(false); setFlashEnabled(false);
    const checkConnection = setInterval(() => {
      if (connected && peerConnected) { clearInterval(checkConnection); sendOffer('camera'); }
    }, 500);
    setTimeout(() => { clearInterval(checkConnection); if (!streaming) sendOffer('camera'); }, 5000);
  }, [connectSocket, sendOffer, childId, connected, peerConnected, streaming]);

  const handleStop = useCallback(() => { setStreaming(false); disconnect(); }, [disconnect]);
  const handleToggleCamera = (useBack) => { const next = useBack ? 'environment' : 'user'; setFacingMode(next); sendCommand('switch-camera', { facingMode: next }); };
  const handleToggleAudio = (enabled) => { setAudioEnabled(enabled); sendCommand('toggle-audio', { enabled }); };
  const handleToggleFlash = (enabled) => { setFlashEnabled(enabled); sendCommand('toggle-flash', { enabled }); };
  const handleScreenshot = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const link = document.createElement('a');
    link.download = `alphaguard-camera-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!childId) return (
    <div className="flex items-center justify-center h-[60vh] text-slate-500 text-[14px] text-center px-6">
      No child device selected. Pair a device from Controls first.
    </div>
  );

  return (
    <div className="w-full max-w-[640px] mx-auto ag-rise">
      <div className="mb-5 px-1">
        <h1 className="text-[22px] font-black text-white tracking-tight flex items-center gap-2.5">
          <Camera size={24} className="text-cyan-400" /> Remote Camera
        </h1>
        <p className="text-[13px] text-slate-500 font-semibold mt-1">Live camera feed from {activeChild?.name}’s device</p>
      </div>

      <StatusBar active={streaming} color="#10b981"
        label={streaming ? 'Camera active — live feed' : peerConnected ? 'Connecting stream…' : connected ? 'Waiting for child device…' : 'Camera inactive'} />

      <div className="relative bg-black rounded-[22px] overflow-hidden aspect-video mb-6 border border-white/[0.06]">
        {streaming ? (
          <video ref={videoRef} autoPlay playsInline muted={false} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 min-h-[280px]">
            <Camera size={44} className="text-slate-700" />
            <span className="text-slate-500 text-[13px]">Camera feed will appear here</span>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex justify-center mb-4">
        {!streaming ? (
          <button onClick={handleStart} className="ag-tap flex items-center gap-2 px-8 min-h-[54px] bg-emerald-500 rounded-full text-white font-black text-[15px] shadow-[0_8px_30px_rgba(16,185,129,0.3)]">
            {connected ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
            {connected ? 'Connecting…' : 'Start Camera Stream'}
          </button>
        ) : (
          <button onClick={handleStop} className="ag-tap flex items-center gap-2 px-10 min-h-[54px] bg-rose-500/15 border border-rose-500/30 rounded-full text-rose-400 font-black text-[15px]">
            <CameraOff size={18} /> Stop Viewing
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3">
        <ControlRow icon={SwitchCamera} title="Camera Direction" description={facingMode === 'user' ? 'Front camera' : 'Back camera'}
          control={<Toggle active={facingMode === 'environment'} disabled={!streaming} onChange={handleToggleCamera} />} />
        <ControlRow icon={audioEnabled ? Mic : MicOff} title="Microphone" description={audioEnabled ? 'Listening to audio' : 'Audio muted'}
          control={<Toggle active={audioEnabled} disabled={!streaming} onChange={handleToggleAudio} color="#f59e0b" />} />
        <ControlRow icon={Flashlight} title="Flashlight" description={flashEnabled ? 'Flashlight on' : 'Flashlight off'}
          control={<Toggle active={flashEnabled} disabled={!streaming} onChange={handleToggleFlash} color="#f59e0b" />} />
        <ControlRow icon={Camera} title="Screen Capture" description="Snapshot the current feed"
          control={
            <button disabled={!streaming} onClick={handleScreenshot}
              className="ag-tap flex items-center gap-2 py-2.5 px-4 bg-purple-500/15 border border-purple-500/30 rounded-xl text-purple-400 font-bold text-[12.5px] disabled:opacity-40">
              <Download size={15} /> Capture
            </button>
          } />
      </div>
    </div>
  );
};

export default CameraView;
