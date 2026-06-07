import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Sparkles, Mic, BarChart2, AlertTriangle, ShieldCheck, Send, Activity, Heart, Eye } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, Tooltip } from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

const trendChartData = [
  { time: '08:00', load: 10 },
  { time: '10:00', load: 20 },
  { time: '12:00', load: 45 },
  { time: '14:00', load: 15 },
  { time: '16:00', load: 55 },
  { time: '18:00', load: 30 },
];

const AIInsights = () => {
  const { activeChild, token } = useAuth();
  const childId = activeChild?.id;

  const [chatLog, setChatLog] = useState([
    { role: 'assistant', text: "Alpha AI online. Systems synchronized. How can I help you supervise today?" }
  ]);
  
  const [orbState, setOrbState] = useState('idle'); // 'idle' | 'listening' | 'speaking'
  const [queryInput, setQueryInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll chat logs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatLog]);

  // Setup Speech Recognition
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
          handleChatSubmit(null, text);
        }
      };

      recognitionRef.current.onerror = () => {
        setOrbState('idle');
      };

      recognitionRef.current.onend = () => {
        setOrbState('idle');
      };
    }
  }, [token]);

  const toggleMicInput = () => {
    if (orbState === 'listening') {
      recognitionRef.current?.stop();
    } else {
      window.speechSynthesis.cancel();
      setOrbState('listening');
      recognitionRef.current?.start();
    }
  };

  const handleChatSubmit = async (e, customText = null) => {
    if (e) e.preventDefault();
    const query = customText || queryInput;
    if (!query.trim() || submitting) return;

    setSubmitting(true);
    setQueryInput('');
    setChatLog(prev => [...prev, { role: 'user', text: query }]);
    setOrbState('speaking');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: query, role: 'parent' })
      });
      const data = await res.json();
      if (data.success) {
        setChatLog(prev => [...prev, { role: 'assistant', text: data.reply }]);
        
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.reply);
          utterance.onend = () => setOrbState('idle');
          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => setOrbState('idle'), 2000);
        }
      } else {
        setChatLog(prev => [...prev, { role: 'assistant', text: "Sorry, I had trouble processing that query." }]);
        setOrbState('idle');
      }
    } catch {
      setChatLog(prev => [...prev, { role: 'assistant', text: "Network connection error." }]);
      setOrbState('idle');
    } finally {
      setSubmitting(false);
    }
  };

  if (!childId) {
    return (
      <div className="glass-card max-w-[600px] mx-auto mt-16 p-10 text-center border border-white/5 shadow-2xl font-sans">
        <Brain size={48} className="text-slate-500 mx-auto mb-4" />
        <p className="text-white text-lg font-bold">No active child profile</p>
        <p className="text-slate-400 text-sm mt-2">Connect a device to activate the Alpha AI Command Center.</p>
      </div>
    );
  }

  const childName = activeChild?.name || 'Device';

  return (
    <div className="flex flex-col gap-5 px-3 pb-28 pt-4 w-full max-w-[960px] mx-auto animate-fade-in relative min-h-screen font-sans">
      
      {/* Header Title */}
      <div className="text-center mb-1">
        <h2 className="text-base font-black text-white uppercase tracking-wider">Alpha AI Command Center</h2>
        <div className="flex items-center justify-center gap-1 text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <span>Active Parenting Telemetry: {childName}</span>
        </div>
      </div>

      {/* Grid: Orb centerpiece & recommendations */}
      <div className="grid grid-cols-1 sm:grid-cols-[1.2fr_1fr] gap-4 items-stretch">
        
        {/* Left Column: Glassmorphic Orb centerpiece */}
        <div className="glass-card p-5 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] flex flex-col items-center justify-center relative overflow-hidden shadow-lg">
          <div className="absolute inset-0 bg-[radial-gradient(circle,rgba(79,70,229,0.06)_0%,transparent_70%)] pointer-events-none" />
          
          <div 
            onClick={toggleMicInput}
            className={`relative w-28 h-28 rounded-full border border-white/10 bg-gradient-to-tr from-[#0b0c14] via-indigo-600/10 to-cyan-500/10 shadow-[0_0_24px_rgba(6,182,212,0.15)] flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300 ${orbState === 'listening' ? 'shadow-[0_0_36px_rgba(239,68,68,0.3)] border-red-500/30' : orbState === 'speaking' ? 'shadow-[0_0_36px_rgba(139,92,246,0.3)] border-purple-500/30' : ''}`}
          >
            <div className="absolute inset-1.5 rounded-full border border-white/5 flex items-center justify-center overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full opacity-60">
                <path 
                  d="M0,50 Q25,30 50,50 T100,50" 
                  fill="none" 
                  stroke={orbState === 'listening' ? '#ef4444' : '#06b6d4'} 
                  strokeWidth="2"
                  className={`transform origin-center ${orbState === 'listening' ? 'animate-[spin_2s_linear_infinite]' : 'animate-[spin_8s_linear_infinite]'}`}
                />
                <path 
                  d="M0,50 Q25,70 50,50 T100,50" 
                  fill="none" 
                  stroke={orbState === 'speaking' ? '#a855f7' : '#6366f1'} 
                  strokeWidth="2"
                  className={`transform origin-center ${orbState === 'speaking' ? 'animate-[spin_1.5s_linear_infinite_reverse]' : 'animate-[spin_12s_linear_infinite_reverse]'}`}
                />
              </svg>
            </div>
            <Brain size={22} className={orbState === 'listening' ? 'text-red-500 animate-pulse z-10' : orbState === 'speaking' ? 'text-purple-400 z-10' : 'text-cyan-400 z-10'} />
          </div>

          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-4">
            {orbState === 'listening' ? 'Listening...' : orbState === 'speaking' ? 'Synthesizing...' : 'AI Core Active'}
          </span>
        </div>

        {/* Right Column: Family Health Metrics */}
        <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] flex flex-col justify-between shadow-lg">
          <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Health Metrics</div>
          <div className="flex flex-col gap-2">
            {[
              { label: 'Safety Index', val: '98%', color: 'text-emerald-400' },
              { label: 'Focus Score', val: '86%', color: 'text-cyan-400' },
              { label: 'Screen Budget', val: 'Active', color: 'text-indigo-400' },
              { label: 'Anomaly Alert', val: 'None', color: 'text-slate-400' }
            ].map(m => (
              <div key={m.label} className="flex items-center justify-between border-b border-white/[0.02] pb-1">
                <span className="text-[10px] text-slate-400 font-semibold">{m.label}</span>
                <span className={`text-[10px] font-black ${m.color}`}>{m.val}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Screen Time & Safety Trends Charts */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Behavioral Insights Chart */}
        <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] flex flex-col justify-between shadow-lg">
          <div>
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Usage Load</h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              Downtime is active. Screen limit overrides enabled.
            </p>
          </div>
          <div className="h-16 w-full mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 0, bottom: 0, left: -10, right: 0 }}>
                <defs>
                  <linearGradient id="purpleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="load" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#purpleGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Detection & Warnings */}
        <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] flex flex-col justify-between shadow-lg">
          <div>
            <h4 className="text-[10px] font-black text-slate-500 tracking-widest uppercase mb-1">Risk Detection</h4>
            <p className="text-[10px] text-slate-400 font-semibold leading-relaxed">
              No anomalies found in local background telemetry scans.
            </p>
          </div>
          <div className="flex items-center gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl mt-3">
            <ShieldCheck size={14} className="text-emerald-400" />
            <span className="text-[9px] font-black text-emerald-400 uppercase tracking-wider">Device Secure</span>
          </div>
        </div>

      </div>

      {/* Parenting Recommendations Deck */}
      <div className="glass-card p-4.5 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] flex flex-col gap-1.5 shadow-lg">
        <h4 className="text-[10px] font-black text-slate-500 tracking-widest uppercase">Parenting Recommendations</h4>
        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-xs mt-1 leading-relaxed text-slate-300 font-semibold">
          <span className="text-cyan-400 font-extrabold block mb-0.5">Focus Mode suggestion:</span>
          Telemetry suggests setting a 45m bedtime lockout buffer to improve sleep latency indices.
        </div>
      </div>

      {/* Chat Interface Console */}
      <div className="glass-card p-4 border border-white/5 backdrop-blur-xl rounded-[24px] bg-white/[0.02] flex-1 flex flex-col min-h-[200px] max-h-[300px]">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 border-b border-white/5 pb-2 flex items-center justify-between">
          <span>AI Chat Assistant</span>
          <Activity size={12} className="text-cyan-400" />
        </div>
        
        {/* Chat Logs */}
        <div className="flex-1 overflow-y-auto flex flex-col gap-3.5 pr-1 mb-3 text-[11px] font-semibold leading-relaxed">
          {chatLog.map((chat, idx) => (
            <div key={idx} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`max-w-[85%] p-3 rounded-2xl ${
                chat.role === 'user' 
                  ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white rounded-tr-none' 
                  : 'bg-white/5 border border-white/5 text-slate-200 rounded-tl-none'
              }`}>
                {chat.text}
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <div className="flex-1 relative bg-[#0b0c14] border border-white/5 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
            <input 
              type="text"
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              placeholder="Ask anything about safety limits..."
              className="w-full bg-transparent border-none text-white text-xs outline-none font-semibold placeholder-slate-600"
            />
            <button 
              type="button" 
              onClick={toggleMicInput}
              className={`text-slate-500 hover:text-white transition-colors cursor-pointer ${orbState === 'listening' ? 'text-red-500 animate-pulse' : ''}`}
            >
              <Mic size={14} />
            </button>
          </div>
          <button 
            type="submit"
            className="p-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl shadow-lg active:scale-95 transition-transform cursor-pointer"
          >
            <Send size={14} />
          </button>
        </form>
      </div>

    </div>
  );
};

export default AIInsights;
