import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Sparkles, Mic, Brain, StopCircle, VolumeX, Volume2, User, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getVolume, setVolume } from '../hooks/VoiceAssistant';

const QUICK_REPLIES = [
  'How do I limit screen time?',
  'Why is my child sad today?',
  'Explain late night usage',
  'How do I lock YouTube?',
];

const AIAssistant = () => {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState('voice'); // 'chat' or 'voice'
  
  // Chat state
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm AlphaGuard AI. I analyze your child's data to help you parent better. You can ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Voice state
  const [voiceState, setVoiceState] = useState('idle'); // idle, listening, thinking, speaking
  const [voiceText, setVoiceText] = useState('Ask anything');
  const [isMuted, setIsMuted] = useState(false);
  const [vol, setVol] = useState(() => getVolume());
  
  const synth = window.speechSynthesis;
  const recognitionRef = useRef(null);

  // Draggable state
  const [pos, setPos] = useState({ x: window.innerWidth - 90, y: window.innerHeight - 140 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  useEffect(() => {
    // Sync mute state on mount
    setIsMuted(localStorage.getItem('samantha_muted') === 'true');
    const handleMuteToggle = () => setIsMuted(localStorage.getItem('samantha_muted') === 'true');
    const handleVolumeChanged = (e) => setVol(e.detail);
    window.addEventListener('samantha-mute-changed', handleMuteToggle);
    window.addEventListener('samantha-volume-changed', handleVolumeChanged);
    return () => {
      window.removeEventListener('samantha-mute-changed', handleMuteToggle);
      window.removeEventListener('samantha-volume-changed', handleVolumeChanged);
    };
  }, []);

  const toggleMute = () => {
    const newState = !isMuted;
    setIsMuted(newState);
    localStorage.setItem('samantha_muted', newState);
    if (newState) window.speechSynthesis.cancel();
    window.dispatchEvent(new Event('samantha-mute-changed'));
  };

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-ai-assistant', handleOpen);
    return () => window.removeEventListener('open-ai-assistant', handleOpen);
  }, []);

  useEffect(() => {
    if (open && mode === 'chat') {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, typing, open, mode]);

  useEffect(() => {
    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      let fullTranscript = '';
      let silenceTimer = null;

      recognitionRef.current.onstart = () => {
        setVoiceState('listening');
        setVoiceText('Listening...');
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let currentFinal = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            currentFinal += event.results[i][0].transcript + ' ';
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        if (currentFinal) fullTranscript += currentFinal;
        
        const displayTxt = (fullTranscript + interimTranscript).trim();
        if (displayTxt) setVoiceText(displayTxt);

        // Reset the silence timer on any speech
        if (silenceTimer) clearTimeout(silenceTimer);
        
        // Auto-submit after 2 seconds of silence
        if (fullTranscript.trim()) {
          silenceTimer = setTimeout(() => {
             recognitionRef.current.stop();
             handleVoiceQuery(fullTranscript.trim());
             fullTranscript = '';
          }, 2000);
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech Rec Error:", event.error);
        if (event.error === 'no-speech') {
          // ignore no-speech errors in continuous mode
          return; 
        }
        setVoiceState('idle');
        setVoiceText('Ask anything');
      };

      recognitionRef.current.onend = () => {
        if (silenceTimer) clearTimeout(silenceTimer);
        if (voiceState === 'listening') {
          setVoiceState('idle');
          if (!fullTranscript.trim()) {
            setVoiceText('Ask anything');
          }
        }
      };
    }
    
    return () => {
      synth.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [voiceState]);

  const speak = (text) => {
    if (isMuted) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = vol;
    utterance.pitch = 1.1;
    utterance.rate = 1.0;
    
    const voices = synth.getVoices();
    const premiumVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Female')) || voices[0];
    if (premiumVoice) utterance.voice = premiumVoice;

    utterance.onstart = () => setVoiceState('speaking');
    utterance.onend = () => {
      setVoiceState('idle');
      setVoiceText('Ask anything');
    };
    
    synth.speak(utterance);
  };

  const askBackend = async (query) => {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: query, role: 'parent' })
      });
      const data = await res.json();
      return data.success ? data.reply : "I couldn't process that right now.";
    } catch (err) {
      return "Network error. Please try again.";
    }
  };

  const handleSend = async (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setInput('');
    setTyping(true);
    
    const reply = await askBackend(msg);
    setMessages(m => [...m, { role: 'ai', text: reply }]);
    setTyping(false);
  };

  const handleVoiceQuery = async (text) => {
    setVoiceState('thinking');
    setVoiceText('Thinking...');
    
    const reply = await askBackend(text);
    
    setVoiceText(reply);
    speak(reply);
  };

  const toggleMic = async () => {
    if (voiceState === 'listening') {
      recognitionRef.current?.stop();
      setVoiceState('idle');
      setVoiceText('Ask anything');
    } else {
      synth.cancel();
      setVoiceState('listening');
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current?.start();
      } catch (err) {
        console.error("Mic access denied", err);
        setVoiceState('idle');
        setVoiceText('Mic access denied. Please allow it in browser settings.');
      }
    }
  };

  const stopVoice = () => {
    synth.cancel();
    setVoiceState('idle');
    setVoiceText('Ask anything');
  };

  // Drag handlers
  const onPointerDown = (e) => {
    if (open) return;
    setDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startPosX: pos.x, startPosY: pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPos({
      x: Math.max(0, Math.min(window.innerWidth - 70, dragRef.current.startPosX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 70, dragRef.current.startPosY + dy))
    });
  };
  const onPointerUp = (e) => {
    const dx = Math.abs(e.clientX - dragRef.current.startX);
    const dy = Math.abs(e.clientY - dragRef.current.startY);
    setDragging(false);
    if (dx < 5 && dy < 5) setOpen(true); // Only open if not dragged
  };

  const renderText = (text) => text.split('\n').map((line, i) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j} style={{ color: '#22d3ee' }}>{part.slice(2, -2)}</strong>
          : part
      )}
      {i < text.split('\n').length - 1 && <br />}
    </span>
  ));

  const isListening = voiceState === 'listening';
  const isThinking = voiceState === 'thinking';
  const isSpeaking = voiceState === 'speaking';

  let orbColor = 'var(--accent-primary)'; // idle
  if (isListening) orbColor = 'var(--accent-red)';
  if (isThinking) orbColor = '#22d3ee';
  if (isSpeaking) orbColor = '#8b5cf6';

  return (
    <>
      {/* Floating button */}
      {!open && (
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          style={{
            position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999,
            width: '60px', height: '60px', borderRadius: '50%',
            background: 'linear-gradient(135deg, #2563eb, #1e40af)',
            boxShadow: '0 8px 32px rgba(37,99,235,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: dragging ? 'grabbing' : 'pointer',
            border: '2px solid rgba(255,255,255,0.1)',
            touchAction: 'none'
          }}
        >
          <Sparkles size={28} color="#fff" />
          <div style={{ position: 'absolute', top: -4, right: -4, width: 14, height: 14, background: '#10b981', borderRadius: '50%', border: '2px solid #0f172a' }} />
        </div>
      )}

      {/* Floating Panel */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', width: '380px', height: '600px',
          maxWidth: 'calc(100vw - 48px)', maxHeight: 'calc(100vh - 48px)',
          background: mode === 'voice' ? '#07070a' : 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px', zIndex: 10000,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          overflow: 'hidden', animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          
          <style>{`
            @keyframes slideUp { from { opacity: 0; transform: translateY(40px) scale(0.95); } to { opacity: 1; transform: translateY(0) scale(1); } }
            @keyframes pulse-orb { 0% { transform: scale(1); box-shadow: 0 0 20px rgba(37,99,235,0.4); } 50% { transform: scale(1.05); box-shadow: 0 0 50px rgba(37,99,235,0.8); } 100% { transform: scale(1); box-shadow: 0 0 20px rgba(37,99,235,0.4); } }
            @keyframes rotate-ring { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            @keyframes rotate-ring-reverse { 0% { transform: rotate(360deg); } 100% { transform: rotate(0deg); } }
            @keyframes ripple-glow { 0% { box-shadow: 0 0 0 0px rgba(239, 68, 68, 0.5); } 100% { box-shadow: 0 0 0 40px rgba(239, 68, 68, 0); } }
            @keyframes ripple-pulse {
              0% { transform: scale(0.9); opacity: 0.8; }
              50% { transform: scale(1.15); opacity: 0.4; }
              100% { transform: scale(1.35); opacity: 0; }
            }
            @keyframes eq-bar {
              0% { height: 6px; }
              100% { height: 28px; }
            }
          `}</style>

          {/* Header */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'linear-gradient(135deg, rgba(37,99,235,0.2), rgba(239,68,68,0.15))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={16} color="#2563eb" />
              </div>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#fff', letterSpacing: '-0.3px' }}>AlphaGuard AI</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={toggleMute} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: isMuted ? 'var(--text-muted)' : '#fff' }}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>
              <button onClick={() => { setOpen(false); synth.cancel(); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                <X size={20} color="#64748b" />
              </button>
            </div>
          </div>

          {/* Top Toggle Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '16px 0' }}>
            <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '4px' }}>
              <button 
                onClick={() => { setMode('voice'); synth.cancel(); setVoiceState('idle'); setVoiceText('Ask anything'); }}
                style={{ 
                  padding: '6px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                  background: mode === 'voice' ? 'var(--accent-primary)' : 'transparent',
                  color: mode === 'voice' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.3s'
                }}>
                🎤 Speak
              </button>
              <button 
                onClick={() => { setMode('chat'); synth.cancel(); }}
                style={{ 
                  padding: '6px 20px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold',
                  background: mode === 'chat' ? 'var(--accent-primary)' : 'transparent',
                  color: mode === 'chat' ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.3s'
                }}>
                💬 Chat
              </button>
            </div>
          </div>

          {/* VOICE MODE */}
          {mode === 'voice' && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
              
              <div style={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '300px', height: '300px', borderRadius: '50%',
                background: `radial-gradient(circle, ${orbColor}25 0%, transparent 70%)`,
                pointerEvents: 'none', transition: 'all 0.5s ease', zIndex: 0
              }} />

              <div style={{ zIndex: 10, marginBottom: '40px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#fff', marginBottom: '8px', letterSpacing: '-0.5px' }}>Ask anything</h2>
                <p style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>Speak naturally. I'll answer.</p>
              </div>
              
              {/* Glowing Orb */}
              <div style={{ marginBottom: '40px', position: 'relative', zIndex: 10 }}>
                {isListening && (
                  <>
                    <div style={{ position: 'absolute', inset: -15, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', animation: 'ripple-pulse 2s infinite', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', inset: -30, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', animation: 'ripple-pulse 2s infinite 0.6s', pointerEvents: 'none' }} />
                  </>
                )}

                {isThinking && (
                  <>
                    <div style={{ position: 'absolute', inset: -15, borderRadius: '50%', border: '2px dashed #22d3ee', animation: 'rotate-ring 3s linear infinite', opacity: 0.7, pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', inset: -25, borderRadius: '50%', border: '2px dotted #8b5cf6', animation: 'rotate-ring-reverse 5s linear infinite', opacity: 0.5, pointerEvents: 'none' }} />
                  </>
                )}
                
                <div style={{
                  width: '120px', height: '120px', borderRadius: '50%',
                  background: `linear-gradient(135deg, ${orbColor}, #0a0a0f)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 0 30px ${orbColor}60, inset 0 0 20px rgba(0,0,0,0.5)`,
                  border: `2px solid ${orbColor}`,
                  animation: isSpeaking ? 'pulse-orb 1.5s infinite' : 'none',
                  transition: 'all 0.5s ease'
                }}>
                  {isThinking ? (
                    <Loader2 size={40} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
                  ) : isListening ? (
                    <Mic size={40} color="#fff" />
                  ) : (
                    <Sparkles size={40} color="#fff" />
                  )}
                </div>

                {/* Rotating Rings / Frequency EQ Bars */}
                {isSpeaking ? (
                  <div style={{ display: 'flex', gap: '4px', justifyContent: 'center', alignItems: 'center', height: '28px', marginTop: '20px' }}>
                    <div style={{ width: '3px', height: '10px', background: '#8b5cf6', borderRadius: '2px', animation: 'eq-bar 0.8s ease-in-out infinite alternate' }} />
                    <div style={{ width: '3px', height: '20px', background: '#8b5cf6', borderRadius: '2px', animation: 'eq-bar 0.5s ease-in-out infinite alternate 0.1s' }} />
                    <div style={{ width: '3px', height: '15px', background: '#8b5cf6', borderRadius: '2px', animation: 'eq-bar 0.7s ease-in-out infinite alternate 0.2s' }} />
                    <div style={{ width: '3px', height: '24px', background: '#8b5cf6', borderRadius: '2px', animation: 'eq-bar 0.6s ease-in-out infinite alternate 0.3s' }} />
                    <div style={{ width: '3px', height: '10px', background: '#8b5cf6', borderRadius: '2px', animation: 'eq-bar 0.9s ease-in-out infinite alternate 0.4s' }} />
                  </div>
                ) : null}
              </div>

              <p style={{ fontSize: '15px', color: '#fff', lineHeight: '1.6', minHeight: '60px', maxWidth: '300px', zIndex: 10 }}>
                {voiceText}
              </p>

              {/* Voice Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginTop: '20px', zIndex: 10 }}>
                <button 
                  onClick={toggleMic}
                  style={{ 
                    width: '64px', height: '64px', borderRadius: '50%', 
                    background: isListening ? 'var(--accent-red)' : 'var(--accent-primary)', 
                    border: 'none', color: '#fff', cursor: 'pointer', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: isListening ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 20px rgba(37,99,235,0.4)',
                    transition: 'all 0.3s'
                  }}>
                  <Mic size={28} />
                </button>

                <button 
                  onClick={stopVoice}
                  disabled={!isSpeaking && !isListening}
                  style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: (isSpeaking || isListening) ? 'var(--accent-red)' : 'var(--text-muted)', cursor: (isSpeaking || isListening) ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StopCircle size={24} />
                </button>
              </div>
            </div>
          )}

          {/* CHAT MODE */}
          {mode === 'chat' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    {m.role === 'ai' && (
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Sparkles size={14} color="var(--accent-primary)" />
                      </div>
                    )}
                    <div style={{
                      background: m.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                      color: '#fff', padding: '12px 16px',
                      borderRadius: m.role === 'user' ? '16px 16px 0 16px' : '16px 16px 16px 0',
                      fontSize: '14px', lineHeight: '1.5', maxWidth: '85%'
                    }}>
                      {renderText(m.text)}
                    </div>
                  </div>
                ))}
                
                {typing && (
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Sparkles size={14} color="var(--accent-primary)" />
                    </div>
                    <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '16px 16px 16px 0', display: 'flex', gap: '4px' }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b', animation: 'pulse 1.5s infinite' }} />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b', animation: 'pulse 1.5s infinite 0.2s' }} />
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#64748b', animation: 'pulse 1.5s infinite 0.4s' }} />
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {messages.length < 3 && (
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', padding: '0 20px 16px', scrollbarWidth: 'none' }}>
                  {QUICK_REPLIES.map(q => (
                    <button key={q} onClick={() => handleSend(q)} style={{ background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.2)', color: '#22d3ee', padding: '8px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap', cursor: 'pointer' }}>
                      {q}
                    </button>
                  ))}
                </div>
              )}

              <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSend()}
                    placeholder="Message AlphaGuard AI..."
                    style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', padding: '8px 12px', fontSize: '14px', outline: 'none' }}
                  />
                  <button
                    onClick={() => handleSend()}
                    disabled={!input.trim()}
                    style={{ width: '36px', height: '36px', borderRadius: '50%', background: input.trim() ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() ? 'pointer' : 'default', transition: 'all 0.2s' }}
                  >
                    <Send size={16} style={{ marginLeft: '2px' }} />
                  </button>
                </div>
              </div>
            </>
          )}

        </div>
      )}
    </>
  );
};

export default AIAssistant;
