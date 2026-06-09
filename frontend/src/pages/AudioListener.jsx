import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, Loader2, Volume2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useWebRTC } from '../hooks/useWebRTC';

const AudioListener = () => {
  const { activeChild } = useAuth();
  const childId = activeChild?.id;
  const { connected, remoteStream, connectSocket, sendOffer, disconnect } = useWebRTC(childId, 'parent');

  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const [listening, setListening] = useState(false);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (audioRef.current && remoteStream) {
      audioRef.current.srcObject = remoteStream;
      setListening(true);
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

  useEffect(() => {
    if (!listening) { setDuration(0); return; }
    const iv = setInterval(() => setDuration((d) => d + 1), 1000);
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
      ctx.fillStyle = 'rgba(11,12,20,0.35)';
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
  const handleStart = useCallback(async () => { connectSocket(); setTimeout(() => sendOffer('audio'), 1000); }, [connectSocket, sendOffer]);
  const handleStop = useCallback(() => { setListening(false); if (animRef.current) cancelAnimationFrame(animRef.current); disconnect(); }, [disconnect]);

  if (!childId) return (
    <div className="flex items-center justify-center h-[60vh] text-slate-500 text-[14px] text-center px-6">
      No child device selected. Pair a device from Controls first.
    </div>
  );

  return (
    <div className="w-full max-w-[640px] mx-auto ag-rise">
      <div className="mb-5 px-1">
        <h1 className="text-[22px] font-black text-white tracking-tight flex items-center gap-2.5">
          <Mic size={24} className="text-amber-400" /> Audio Listener
        </h1>
        <p className="text-[13px] text-slate-500 font-semibold mt-1">Listen to ambient audio from {activeChild?.name}’s device</p>
      </div>

      <div className="flex items-center gap-3 px-4 py-3.5 rounded-2xl border mb-5"
        style={{ background: listening ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)', borderColor: listening ? 'rgba(245,158,11,0.25)' : 'rgba(255,255,255,0.06)' }}>
        {listening ? <Volume2 size={18} className="text-amber-400" /> : <MicOff size={18} className="text-slate-500" />}
        <span className="text-[14px] font-bold" style={{ color: listening ? '#f59e0b' : '#64748b' }}>
          {listening ? `Listening — ${formatDur(duration)}` : connected ? 'Waiting for child device…' : 'Audio inactive'}
        </span>
        <span className="ml-auto w-2.5 h-2.5 rounded-full" style={{ background: listening ? '#f59e0b' : '#334155', boxShadow: listening ? '0 0 10px #f59e0b' : 'none' }} />
      </div>

      <div className="bg-[#0b0c14] rounded-[22px] overflow-hidden mb-6 border border-white/[0.06] p-5">
        <canvas ref={canvasRef} width={600} height={200} className="w-full h-[200px] rounded-2xl block" />
        <audio ref={audioRef} autoPlay className="hidden" />
      </div>

      <div className="flex justify-center">
        {!listening ? (
          <button onClick={handleStart} className="ag-tap flex items-center gap-2 px-8 min-h-[54px] bg-amber-500 rounded-full text-slate-950 font-black text-[15px] shadow-[0_8px_30px_rgba(245,158,11,0.3)]">
            {connected ? <Loader2 size={20} className="animate-spin" /> : <Mic size={20} />}
            {connected ? 'Connecting…' : 'Start Listening'}
          </button>
        ) : (
          <button onClick={handleStop} className="ag-tap flex items-center gap-2 px-8 min-h-[54px] bg-rose-500/15 border border-rose-500/30 rounded-full text-rose-400 font-black text-[15px]">
            <MicOff size={18} /> Stop Listening
          </button>
        )}
      </div>
    </div>
  );
};

export default AudioListener;
