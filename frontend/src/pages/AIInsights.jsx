import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { Brain, Mic, ShieldCheck, Send, Activity, Sparkles, TrendingUp, AlertTriangle } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Card } from '../components/ui';

const trendChartData = [
  { time: '08:00', load: 10 }, { time: '10:00', load: 20 }, { time: '12:00', load: 45 },
  { time: '14:00', load: 15 }, { time: '16:00', load: 55 }, { time: '18:00', load: 30 },
];

const AIInsights = () => {
  const { activeChild, token } = useAuth();
  const childId = activeChild?.id;

  const [chatLog, setChatLog] = useState([
    { role: 'assistant', text: 'AlphaGuard AI is online. How can I help you keep your family safe today?' },
  ]);
  const [orbState, setOrbState] = useState('idle');
  const [queryInput, setQueryInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatLog]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onstart = () => setOrbState('listening');
      recognitionRef.current.onresult = async (event) => {
        const text = event.results[0][0].transcript;
        if (text) handleChatSubmit(null, text);
      };
      recognitionRef.current.onerror = () => setOrbState('idle');
      recognitionRef.current.onend = () => setOrbState('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setChatLog((prev) => [...prev, { role: 'user', text: query }]);
    setOrbState('speaking');

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: query, role: 'parent' }),
      });
      const data = await res.json();
      if (data.success) {
        setChatLog((prev) => [...prev, { role: 'assistant', text: data.reply }]);
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(data.reply);
          utterance.onend = () => setOrbState('idle');
          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => setOrbState('idle'), 2000);
        }
      } else {
        setChatLog((prev) => [...prev, { role: 'assistant', text: 'Sorry, I had trouble processing that query.' }]);
        setOrbState('idle');
      }
    } catch {
      setChatLog((prev) => [...prev, { role: 'assistant', text: 'Network connection error.' }]);
      setOrbState('idle');
    } finally {
      setSubmitting(false);
    }
  };

  if (!childId) {
    return (
      <div className="max-w-[520px] mx-auto mt-10 w-full">
        <Card tone="glass" className="p-8 text-center">
          <div className="w-16 h-16 rounded-3xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mx-auto mb-5">
            <Brain size={32} className="text-purple-400" />
          </div>
          <p className="text-white text-lg font-black">No active child profile</p>
          <p className="text-slate-400 text-[13px] mt-2">Connect a device to activate the AlphaGuard AI assistant.</p>
        </Card>
      </div>
    );
  }

  const childName = activeChild?.name || 'Device';
  const orbLabel = orbState === 'listening' ? 'Listening…' : orbState === 'speaking' ? 'Thinking…' : 'Tap to speak';

  return (
    <div className="flex flex-col gap-5 w-full max-w-[640px] mx-auto ag-rise">

      {/* Header */}
      <div className="flex items-center gap-2.5 px-1">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-cyan-400 p-[1.5px]">
          <div className="w-full h-full rounded-2xl bg-[#0a0a14] flex items-center justify-center">
            <Sparkles size={16} className="text-cyan-400" />
          </div>
        </div>
        <div>
          <h1 className="text-[17px] font-black text-white tracking-tight leading-none">AlphaGuard AI</h1>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold mt-1">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Monitoring {childName}
          </div>
        </div>
      </div>

      {/* Voice orb */}
      <Card tone="glass" className="p-7 flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(79,70,229,0.12)_0%,transparent_70%)] pointer-events-none" />
        <button
          onClick={toggleMicInput}
          className={`ag-tap relative w-36 h-36 rounded-full border bg-gradient-to-tr from-[#0b0c14] via-indigo-600/15 to-cyan-500/15 flex items-center justify-center transition-all duration-300 ${
            orbState === 'listening' ? 'border-rose-500/40 shadow-[0_0_50px_rgba(239,68,68,0.35)]'
              : orbState === 'speaking' ? 'border-purple-500/40 shadow-[0_0_50px_rgba(139,92,246,0.35)]'
              : 'border-white/10 shadow-[0_0_40px_rgba(6,182,212,0.18)]'
          }`}
        >
          {(orbState === 'listening' || orbState === 'speaking') && (
            <span className={`absolute inset-0 rounded-full animate-ping ${orbState === 'listening' ? 'bg-rose-500/10' : 'bg-purple-500/10'}`} />
          )}
          <svg viewBox="0 0 100 100" className="absolute inset-3 w-[calc(100%-24px)] h-[calc(100%-24px)] opacity-60">
            <path d="M0,50 Q25,30 50,50 T100,50" fill="none" stroke={orbState === 'listening' ? '#ef4444' : '#06b6d4'} strokeWidth="2"
              className={orbState === 'listening' ? 'animate-[spin_2s_linear_infinite]' : 'animate-[spin_8s_linear_infinite]'} style={{ transformOrigin: 'center' }} />
            <path d="M0,50 Q25,70 50,50 T100,50" fill="none" stroke={orbState === 'speaking' ? '#a855f7' : '#6366f1'} strokeWidth="2"
              className={orbState === 'speaking' ? 'animate-[spin_1.5s_linear_infinite_reverse]' : 'animate-[spin_12s_linear_infinite_reverse]'} style={{ transformOrigin: 'center' }} />
          </svg>
          <Brain size={30} className={`relative z-10 ${orbState === 'listening' ? 'text-rose-400 animate-pulse' : orbState === 'speaking' ? 'text-purple-400' : 'text-cyan-400'}`} />
        </button>
        <span className="text-[12px] font-bold text-slate-400 mt-5">{orbLabel}</span>
      </Card>

      {/* Family health metrics */}
      <div>
        <h3 className="text-[13px] font-black text-white mb-3 px-1">Family Health Metrics</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {[
            { label: 'Safety Index', val: '98%', color: '#10b981', icon: ShieldCheck },
            { label: 'Focus Score', val: '86%', color: '#06b6d4', icon: TrendingUp },
            { label: 'Screen Budget', val: 'Active', color: '#6366f1', icon: Activity },
            { label: 'Anomalies', val: 'None', color: '#94a3b8', icon: AlertTriangle },
          ].map((m) => (
            <Card key={m.label} className="p-4">
              <m.icon size={18} style={{ color: m.color }} />
              <div className="text-[20px] font-black text-white mt-2 leading-none">{m.val}</div>
              <div className="text-[11.5px] text-slate-500 font-semibold mt-1">{m.label}</div>
            </Card>
          ))}
        </div>
      </div>

      {/* Behavioral trend */}
      <div>
        <h3 className="text-[13px] font-black text-white mb-3 px-1">Behavioral Trend</h3>
        <Card tone="glass" className="p-5">
          <p className="text-[12.5px] text-slate-400 font-semibold mb-3">Usage is within healthy bounds. Downtime overrides are active.</p>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendChartData} margin={{ top: 4, bottom: 0, left: 0, right: 0 }}>
                <defs>
                  <linearGradient id="agArea" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="load" stroke="#6366f1" strokeWidth={2.5} fill="url(#agArea)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Recommendation */}
      <Card tone="glass" className="p-4 flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-400/30 flex items-center justify-center flex-shrink-0">
          <Sparkles size={17} className="text-cyan-400" />
        </div>
        <div>
          <div className="text-[13px] font-bold text-white">Focus Mode suggestion</div>
          <p className="text-[12.5px] text-slate-400 leading-relaxed mt-0.5">
            Add a 45-minute bedtime lockout buffer to improve sleep — telemetry shows late-night usage spikes.
          </p>
        </div>
      </Card>

      {/* Chat */}
      <div>
        <h3 className="text-[13px] font-black text-white mb-3 px-1">Ask AlphaGuard</h3>
        <Card tone="glass" className="p-4 flex flex-col min-h-[240px] max-h-[360px]">
          <div className="flex-1 overflow-y-auto ag-no-scrollbar flex flex-col gap-3 pr-1 mb-3 text-[13px] leading-relaxed">
            {chatLog.map((chat, idx) => (
              <div key={idx} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${
                  chat.role === 'user'
                    ? 'bg-gradient-to-tr from-indigo-600 to-blue-600 text-white rounded-br-md'
                    : 'bg-white/[0.05] border border-white/[0.06] text-slate-200 rounded-bl-md'
                }`}>
                  {chat.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 bg-[#0b0c14] border border-white/[0.08] rounded-2xl px-4 min-h-[50px]">
              <input
                type="text" value={queryInput} onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Ask about limits, safety, screen time…"
                className="w-full bg-transparent border-none text-white text-[15px] outline-none placeholder-slate-600"
              />
              <button type="button" onClick={toggleMicInput} className={`ag-tap p-1 ${orbState === 'listening' ? 'text-rose-500 animate-pulse' : 'text-slate-500 hover:text-white'}`}>
                <Mic size={18} />
              </button>
            </div>
            <button type="submit" className="ag-tap flex items-center justify-center w-[50px] min-h-[50px] bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-2xl">
              <Send size={18} />
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default AIInsights;
