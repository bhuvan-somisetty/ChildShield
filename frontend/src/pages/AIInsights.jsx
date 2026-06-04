import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLivePolling } from '../hooks/useLivePolling';
import { Brain, Sparkles, Mic, BarChart2, CheckCircle2, AlertCircle, Volume2, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';

const chartData = [
  { time: '4:00', usage: 10 },
  { time: '4:20', usage: 15 },
  { time: '4:40', usage: 35 },
  { time: '5:00', usage: 45 },
  { time: '5:20', usage: 50 },
  { time: '5:40', usage: 20 },
];

const AIInsights = () => {
  const { activeChild, token } = useAuth();
  const childId = activeChild?.id;

  const [chatLog, setChatLog] = useState({
    user: "Summarize Lily's day, please.",
    ai: "Examining geofence logs... Lily arrived at School Zone at 8:30 AM and departed at 3:20 PM. No safety breaches. Behavioral data analysis follows..."
  });
  
  const [orbState, setOrbState] = useState('idle'); // 'idle' | 'listening' | 'speaking'
  const [reportData, setReportData] = useState(null);
  const [queryInput, setQueryInput] = useState('');
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  // Poll report details for safety score
  useEffect(() => {
    if (!childId) return;
    fetch(`/api/reports/full?childId=${childId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    .then(r => r.json())
    .then(d => {
      if (d.success) setReportData(d.data);
    })
    .catch(() => {});
  }, [childId, token]);

  // Setup speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onstart = () => {
        setOrbState('listening');
      };

      recognitionRef.current.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        if (text) {
          setChatLog(prev => ({ ...prev, user: text, ai: "Analyzing your request..." }));
          setOrbState('speaking');
          
          // Send query to AI backend
          try {
            const res = await fetch('/api/ai/chat', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ message: text, role: 'parent' })
            });
            const data = await res.json();
            if (data.success) {
              setChatLog(prev => ({ ...prev, ai: data.reply }));
              // Speak out response if supported and not muted
              if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(data.reply);
                utterance.onend = () => setOrbState('idle');
                window.speechSynthesis.speak(utterance);
              } else {
                setTimeout(() => setOrbState('idle'), 3000);
              }
            } else {
              setChatLog(prev => ({ ...prev, ai: "Sorry, I had trouble processing that query." }));
              setOrbState('idle');
            }
          } catch {
            setChatLog(prev => ({ ...prev, ai: "Network connection error." }));
            setOrbState('idle');
          }
        }
      };

      recognitionRef.current.onerror = () => {
        setOrbState('idle');
      };

      recognitionRef.current.onend = () => {
        if (orbState === 'listening') setOrbState('idle');
      };
    }
  }, [token, orbState]);

  const toggleMicInput = () => {
    if (orbState === 'listening') {
      recognitionRef.current?.stop();
    } else {
      window.speechSynthesis.cancel();
      setOrbState('listening');
      recognitionRef.current?.start();
    }
  };

  if (!childId) {
    return (
      <div className="glass-card max-w-[600px] mx-auto mt-16 p-10 text-center border border-white/5">
        <Brain size={48} className="text-slate-500 mx-auto mb-4" />
        <p className="text-white text-lg font-bold">No child profile selected</p>
        <p className="text-slate-400 text-sm mt-2">Connect a device to activate the AI Parenting Assistant.</p>
      </div>
    );
  }

  const safetyScore = reportData?.riskScore ? Math.max(30, 100 - reportData.riskScore) : 92;
  const childName = activeChild?.name || 'Lily';

  return (
    <div className="flex flex-col gap-4 px-3 pb-24 pt-4 max-w-[640px] mx-auto animate-fade-in relative min-h-screen">
      
      {/* Dynamic Header */}
      <div className="text-center mb-1">
        <h2 className="text-base font-black text-white">AI Parenting Assistant</h2>
        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span>Active Assistant for: {childName} Online</span>
        </div>
      </div>

      {/* Top Dialogue Cards matching Screen 3 layout */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-md flex flex-col gap-3 shadow-lg">
        <div className="text-xs">
          <span className="text-cyan-400 font-extrabold mr-1.5">User:</span>
          <span className="text-slate-300 font-medium">{chatLog.user}</span>
        </div>
        <div className="border-t border-white/5 pt-3 text-xs leading-relaxed">
          <span className="text-indigo-400 font-extrabold mr-1.5">AI Assistant:</span>
          <span className="text-slate-300 font-medium">{chatLog.ai}</span>
        </div>
      </div>

      {/* Pulsing AI Glassmorphic Assistant Orb (Middle Stage) */}
      <div className="relative flex flex-col items-center justify-center py-6">
        
        {/* Swirling Waves background */}
        <div className="absolute w-80 h-80 rounded-full bg-gradient-to-tr from-cyan-500/10 via-purple-500/10 to-transparent blur-3xl pointer-events-none" />

        {/* The Spherical Glass Orb */}
        <div 
          onClick={toggleMicInput}
          className={`relative w-44 h-44 rounded-full border-2 border-white/10 bg-gradient-to-tr from-[#141525]/80 via-cyan-500/10 to-purple-500/20 shadow-[0_0_40px_rgba(6,182,212,0.15)] flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 overflow-hidden ${orbState === 'listening' ? 'shadow-[0_0_50px_rgba(239,68,68,0.4)] border-red-500/30' : orbState === 'speaking' ? 'shadow-[0_0_50px_rgba(139,92,246,0.4)] border-purple-500/30' : ''}`}
        >
          {/* Internal Swirling Waveforms using styled SVGs */}
          <div className="absolute inset-2 rounded-full border border-white/5 flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 100 100" className="w-full h-full opacity-60">
              <path 
                d="M0,50 Q25,30 50,50 T100,50" 
                fill="none" 
                stroke="#22d3ee" 
                strokeWidth="1.5"
                className={`transform origin-center ${orbState === 'listening' ? 'animate-[spin_4s_linear_infinite]' : orbState === 'speaking' ? 'animate-[spin_1s_linear_infinite]' : 'animate-[spin_12s_linear_infinite]'}`}
              />
              <path 
                d="M0,50 Q25,70 50,50 T100,50" 
                fill="none" 
                stroke="#a855f7" 
                strokeWidth="1.5"
                className={`transform origin-center ${orbState === 'listening' ? 'animate-[spin_6s_linear_infinite_reverse]' : orbState === 'speaking' ? 'animate-[spin_1.5s_linear_infinite_reverse]' : 'animate-[spin_18s_linear_infinite_reverse]'}`}
              />
            </svg>
          </div>

          {/* Central Orb Content */}
          <div className="relative z-10 flex flex-col items-center gap-1.5">
            <div className="w-12 h-12 rounded-full bg-slate-950/70 border border-white/10 flex items-center justify-center shadow-lg">
              <Brain size={20} className={orbState === 'listening' ? 'text-red-500 animate-pulse' : orbState === 'speaking' ? 'text-purple-400' : 'text-cyan-400'} />
            </div>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">
              {orbState === 'listening' ? 'Listening' : orbState === 'speaking' ? 'Speaking' : 'System Ready'}
            </span>
          </div>

          {/* Glowing Filter Overlay */}
          <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-40 mix-blend-color-dodge" />
        </div>

        {/* Waveform EQ Spectrum Visualizer beneath the Orb */}
        <div className="flex items-center gap-1 h-6 mt-4 w-40 justify-center">
          {[1, 2, 3, 4, 5, 6, 7, 8].map(bar => {
            const h = orbState === 'speaking' ? [12, 22, 16, 26, 10, 20, 14, 18][bar - 1] : orbState === 'listening' ? [8, 14, 10, 18, 12, 16, 8, 10][bar - 1] : 4;
            return (
              <div 
                key={bar} 
                className={`w-0.5 rounded-full transition-all duration-300 ${orbState === 'listening' ? 'bg-red-400' : orbState === 'speaking' ? 'bg-purple-400' : 'bg-cyan-500'}`} 
                style={{ height: `${h}px` }} 
              />
            );
          })}
        </div>
      </div>

      {/* Grid Row: Behavioral cards */}
      <div className="grid grid-cols-2 gap-4">
        
        {/* Card 1: Behavioral Insight */}
        <div className="glass-card p-4 border border-white/5 backdrop-blur-md flex flex-col justify-between shadow-lg">
          <div>
            <h4 className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider mb-1">Behavioral Insight</h4>
            <p className="text-[9.5px] text-slate-400 leading-snug">
              {childName}'s Screen Time: Unusual uptick in app usage after school (4:00-5:30 PM).
            </p>
          </div>
          {/* Recharts Area Curve Preview */}
          <div className="h-14 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, bottom: 0, left: -10, right: 0 }}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="usage" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill="url(#cyanGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card 2: Daily AI Report Card */}
        <div className="glass-card p-4 border border-white/5 backdrop-blur-md flex flex-col shadow-lg text-xs justify-between">
          <div>
            <h4 className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider mb-2">Daily AI Report Card</h4>
            <div className="text-xl font-black text-white mb-2">{safetyScore}/100</div>
            <div className="flex flex-col gap-1 text-[9.5px] text-slate-400 font-semibold">
              <div className="flex items-center justify-between">
                <span>Focus:</span>
                <span className="text-cyan-400">Spanning</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Routine:</span>
                <span className="text-indigo-400">Monanion</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Safety:</span>
                <span className="text-emerald-400">Rerommendant</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Parenting Recommendation */}
        <div className="glass-card p-4 border border-white/5 backdrop-blur-md flex flex-col gap-1 shadow-lg text-xs col-span-1">
          <h4 className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider">Parenting Recommendation</h4>
          <p className="text-[9.5px] text-slate-300 leading-snug mt-1">
            <span className="font-extrabold text-cyan-400">Recommended:</span> Organize a 'Family Board Game' hour for connection after dinner.
          </p>
        </div>

        {/* Card 4: Smart Suggestion */}
        <div className="glass-card p-4 border border-white/5 backdrop-blur-md flex flex-col gap-1 shadow-lg text-xs col-span-1 cursor-pointer hover:border-white/10">
          <h4 className="text-[11px] font-extrabold text-cyan-400 uppercase tracking-wider">Smart Suggestion</h4>
          <p className="text-[9.5px] text-slate-300 leading-snug mt-1">
            Enable 'Homework Focus Mode' during specified hours. <span className="text-cyan-400 font-bold block mt-1">(Tap to schedule)</span>
          </p>
        </div>

      </div>

      {/* Floating HOLD TO SPEAK Microphone Button */}
      <div className="mt-4 flex flex-col items-center z-[20]">
        <button 
          onMouseDown={toggleMicInput}
          onTouchStart={toggleMicInput}
          className={`px-8 py-3.5 bg-gradient-to-r from-cyan-600 via-blue-500 to-indigo-600 rounded-full text-white font-extrabold text-xs tracking-widest uppercase cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all ${orbState === 'listening' ? 'from-red-600 to-rose-600 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : ''}`}
        >
          <Mic size={14} className={orbState === 'listening' ? 'animate-bounce' : ''} />
          <span>{orbState === 'listening' ? 'Listening...' : 'Hold to Speak'}</span>
        </button>
      </div>

    </div>
  );
};

export default AIInsights;
