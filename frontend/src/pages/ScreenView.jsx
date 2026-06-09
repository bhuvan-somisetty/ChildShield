import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Monitor, MonitorOff, Wifi, WifiOff, Loader2, Camera } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';

const ScreenView = () => {
  const { activeChild } = useAuth();
  const childId = activeChild?.id;
  const { connected, remoteStream, connectSocket, sendOffer, sendCommand, disconnect } = useWebRTC(childId, 'parent');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [viewing, setViewing] = useState(false);

  useEffect(() => {
    if (videoRef.current && remoteStream) { videoRef.current.srcObject = remoteStream; setViewing(true); }
  }, [remoteStream]);

  const handleStart = useCallback(async () => {
    connectSocket();
    setTimeout(() => { sendCommand('request-screen'); sendOffer('screen'); }, 1000);
  }, [connectSocket, sendOffer, sendCommand]);

  const handleStop = useCallback(() => { setViewing(false); disconnect(); }, [disconnect]);

  const handleScreenshot = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    canvas.getContext('2d').drawImage(videoRef.current, 0, 0);
    const link = document.createElement('a');
    link.download = `alphaguard-screen-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!childId) return (
    <div className="flex items-center justify-center h-[60vh] text-slate-500 text-[14px] text-center px-6">
      No child device selected. Pair a device from Controls first.
    </div>
  );

  return (
    <div className="w-full max-w-[760px] mx-auto ag-rise">
      <div className="mb-5 px-1">
        <h1 className="text-[22px] font-black text-white tracking-tight flex items-center gap-2.5">
          <Monitor size={24} className="text-purple-400" /> Screen View
        </h1>
        <p className="text-[13px] text-slate-500 font-semibold mt-1">View {activeChild?.name}’s screen in real time</p>
      </div>

      <div className="flex items-start gap-3 px-4 py-3.5 bg-purple-500/[0.06] border border-purple-500/20 rounded-2xl mb-5">
        <Monitor size={18} className="text-purple-400 mt-0.5 flex-shrink-0" />
        <span className="text-[12.5px] text-slate-400 leading-relaxed">
          The child device will show a system prompt asking to share their screen. This is a platform requirement and cannot be bypassed.
        </span>
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border mb-5"
        style={{ background: viewing ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)', borderColor: viewing ? 'rgba(139,92,246,0.25)' : 'rgba(255,255,255,0.06)' }}>
        {viewing ? <Wifi size={18} className="text-purple-400" /> : <WifiOff size={18} className="text-slate-500" />}
        <span className="text-[14px] font-bold" style={{ color: viewing ? '#8b5cf6' : '#64748b' }}>
          {viewing ? 'Screen active — viewing live' : connected ? 'Waiting for child to accept…' : 'Screen view inactive'}
        </span>
        <span className="ml-auto w-2.5 h-2.5 rounded-full" style={{ background: viewing ? '#8b5cf6' : '#334155', boxShadow: viewing ? '0 0 10px #8b5cf6' : 'none' }} />
      </div>

      <div className="relative bg-black rounded-[22px] overflow-hidden aspect-video mb-5 border border-white/[0.06]">
        {viewing ? (
          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 min-h-[280px]">
            <Monitor size={44} className="text-slate-700" />
            <span className="text-slate-500 text-[13px]">Child screen will appear here</span>
          </div>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      <div className="flex gap-3 justify-center flex-wrap">
        {!viewing ? (
          <button onClick={handleStart} className="ag-tap flex items-center gap-2 px-7 min-h-[54px] bg-purple-500 rounded-full text-white font-black text-[15px] shadow-[0_8px_30px_rgba(139,92,246,0.3)]">
            {connected ? <Loader2 size={20} className="animate-spin" /> : <Monitor size={20} />}
            {connected ? 'Connecting…' : 'View Child Screen'}
          </button>
        ) : (
          <>
            <button onClick={handleStop} className="ag-tap flex items-center gap-2 px-6 min-h-[54px] bg-rose-500/15 border border-rose-500/30 rounded-full text-rose-400 font-black text-[14px]">
              <MonitorOff size={16} /> Stop Viewing
            </button>
            <button onClick={handleScreenshot} className="ag-tap flex items-center gap-2 px-6 min-h-[54px] bg-purple-500/15 border border-purple-500/30 rounded-full text-purple-400 font-black text-[14px]">
              <Camera size={16} /> Screenshot
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default ScreenView;
