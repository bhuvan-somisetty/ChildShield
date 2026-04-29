import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, Send, Bot, StopCircle, VolumeX, Volume2, Sparkles, User, Brain } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getVolume, setVolume } from '../hooks/VoiceAssistant';

const QUICK_REPLIES = [
  'How do I limit screen time?',
  'Why is my child sad today?',
  'Explain late night usage',
  'How do I lock YouTube?',
];

const AIInsights = () => {
  const { activeChild, token } = useAuth();
  const [mode, setMode] = useState('chat'); // 'chat' or 'voice'
  
  // Chat state
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hello! I'm AlphaGuard AI. I analyze your child's data to help you parent better. You can ask me anything!" }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Voice state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('Tap the microphone to start speaking...');
  const [isMuted, setIsMuted] = useState(false);
  const [vol, setVol] = useState(() => getVolume());
  
  const synth = window.speechSynthesis;
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  useEffect(() => {
    // Setup Speech Recognition
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setVoiceText('Listening...');
      };

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        if (interimTranscript) setVoiceText(interimTranscript);
        if (finalTranscript) {
          setVoiceText(finalTranscript);
          handleVoiceQuery(finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event) => {
        setIsListening(false);
        setVoiceText('Could not hear you clearly. Tap to try again.');
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
    
    return () => {
      synth.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const speak = (text) => {
    if (isMuted) return;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = vol;
    utterance.pitch = 1.1;
    utterance.rate = 1.0;
    
    const voices = synth.getVoices();
    const premiumVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Female'));
    if (premiumVoice) utterance.voice = premiumVoice;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synth.speak(utterance);
  };

  const getSmartResponse = (query) => {
    const q = query.toLowerCase();
    let reply = "I can analyze your child's data. Try asking about their screen time or mood!";
    
    if (q.includes('late') || q.includes('night')) {
      reply = `Your child used their phone after 10PM for 2 sessions yesterday. This can affect their sleep quality. Consider setting a Bedtime Routine in the Controls tab to pause the device automatically at 9:30 PM.`;
    } else if (q.includes('sad') || q.includes('mood') || q.includes('down')) {
      reply = `Based on the latest mood check-in, your child felt 'Sad' after using Social Media for 2 hours. It might be helpful to talk to them about their online interactions today.`;
    } else if (q.includes('limit') || q.includes('screen time')) {
      reply = `Today's screen time is 4h 12m, which is 15% higher than their weekly average. You can set daily app limits in the Controls section to encourage healthier habits.`;
    } else if (q.includes('youtube') || q.includes('lock')) {
      reply = `To lock YouTube, go to Controls > App Manager, find YouTube, and tap the lock icon. I can also do this for you if you'd like to set a rule.`;
    } else if (q.includes('hello') || q.includes('hi')) {
      reply = `Hello! I am your AlphaGuard AI assistant. How can I help you support your child's digital wellbeing today?`;
    }

    return reply;
  };

  const handleSend = (text) => {
    const msg = text || input.trim();
    if (!msg) return;
    
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setInput('');
    setTyping(true);
    
    setTimeout(() => {
      const reply = getSmartResponse(msg);
      setMessages(m => [...m, { role: 'ai', text: reply }]);
      setTyping(false);
    }, 1000 + Math.random() * 500);
  };

  const handleVoiceQuery = (text) => {
    setVoiceText('Thinking...');
    setTimeout(() => {
      const reply = getSmartResponse(text);
      setVoiceText(reply);
      speak(reply);
    }, 1000);
  };

  const toggleMic = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      synth.cancel();
      setIsSpeaking(false);
      recognitionRef.current?.start();
    }
  };

  const stopVoice = () => {
    synth.cancel();
    setIsSpeaking(false);
    setVoiceText('Tap the microphone to start speaking...');
  };

  return (
    <div className="animate-fade-in" style={{ height: 'calc(100vh - 144px)', display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto' }}>
      {/* Top Toggle Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px', padding: '16px 0' }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '24px', padding: '4px' }}>
          <button 
            onClick={() => { setMode('chat'); synth.cancel(); }}
            style={{ 
              padding: '8px 24px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
              background: mode === 'chat' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'chat' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.3s'
            }}>
            💬 Chat with AI
          </button>
          <button 
            onClick={() => setMode('voice')}
            style={{ 
              padding: '8px 24px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
              background: mode === 'voice' ? 'var(--accent-primary)' : 'transparent',
              color: mode === 'voice' ? '#fff' : 'var(--text-muted)',
              transition: 'all 0.3s'
            }}>
            🎤 Speak with AI
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* VOICE MODE */}
        {mode === 'voice' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px', textAlign: 'center' }}>
            
            {/* AI Avatar / Status */}
            <div style={{ marginBottom: '40px', position: 'relative' }}>
              {isSpeaking && (
                <div style={{ position: 'absolute', top: '-20px', left: '-20px', right: '-20px', bottom: '-20px', borderRadius: '50%', background: 'var(--accent-primary)', opacity: 0.2, animation: 'pulse-dot 1.5s infinite' }} />
              )}
              <div style={{ width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(37,99,235,0.1)', border: '2px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2, position: 'relative' }}>
                <Brain size={48} color="var(--accent-primary)" />
              </div>
            </div>

            <p style={{ fontSize: '18px', color: '#fff', lineHeight: '1.6', minHeight: '80px', maxWidth: '400px' }}>
              {voiceText}
            </p>

            {/* Voice Controls */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginTop: '40px' }}>
              <button 
                onClick={() => setIsMuted(!isMuted)}
                style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: isMuted ? 'var(--accent-red)' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <button 
                onClick={toggleMic}
                style={{ 
                  width: '80px', height: '80px', borderRadius: '50%', 
                  background: isListening ? 'var(--accent-red)' : 'var(--accent-primary)', 
                  border: 'none', color: '#fff', cursor: 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: isListening ? '0 0 30px rgba(239,68,68,0.5)' : '0 0 30px rgba(37,99,235,0.4)',
                  transition: 'all 0.3s'
                }}>
                <Mic size={32} />
              </button>

              <button 
                onClick={stopVoice}
                disabled={!isSpeaking}
                style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: isSpeaking ? 'var(--accent-red)' : 'var(--text-muted)', cursor: isSpeaking ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StopCircle size={24} />
              </button>
            </div>
          </div>
        )}

        {/* CHAT MODE */}
        {mode === 'chat' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  {m.role === 'ai' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Brain size={16} color="var(--accent-primary)" />
                    </div>
                  )}
                  
                  <div style={{
                    maxWidth: '75%', padding: '14px 18px', 
                    borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                    background: m.role === 'user' ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
                    color: '#fff', fontSize: '15px', lineHeight: '1.5',
                    border: m.role === 'ai' ? '1px solid rgba(255,255,255,0.08)' : 'none'
                  }}>
                    {m.text}
                  </div>
                  
                  {m.role === 'user' && (
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <User size={16} color="#fff" />
                    </div>
                  )}
                </div>
              ))}
              
              {typing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(37,99,235,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Brain size={16} color="var(--accent-primary)" />
                  </div>
                  <div style={{ padding: '14px 18px', borderRadius: '20px', background: 'rgba(255,255,255,0.05)', display: 'flex', gap: '4px' }}>
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse-dot 1.5s infinite 0s' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse-dot 1.5s infinite 0.2s' }} />
                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse-dot 1.5s infinite 0.4s' }} />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompts */}
            {messages.length <= 2 && (
              <div style={{ padding: '0 24px 12px', display: 'flex', gap: '8px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {QUICK_REPLIES.map(q => (
                  <button key={q} onClick={() => handleSend(q)} style={{
                    padding: '8px 16px', background: 'rgba(37,99,235,0.1)', border: '1px solid rgba(37,99,235,0.3)', 
                    borderRadius: '20px', color: 'var(--accent-primary)', fontSize: '13px', fontWeight: '600', 
                    cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
                  }}>
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Box */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', gap: '12px', background: 'rgba(0,0,0,0.2)', borderRadius: '24px', padding: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
                <input 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  placeholder="Ask AlphaGuard AI about behavior, limits, or trends..."
                  style={{ flex: 1, background: 'transparent', border: 'none', color: '#fff', fontSize: '15px', padding: '10px 16px', outline: 'none' }}
                />
                <button 
                  onClick={() => handleSend()}
                  disabled={!input.trim() || typing}
                  style={{ 
                    width: '44px', height: '44px', borderRadius: '50%', border: 'none',
                    background: input.trim() && !typing ? 'var(--accent-primary)' : 'rgba(255,255,255,0.1)',
                    color: '#fff', cursor: input.trim() && !typing ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s'
                  }}>
                  <Send size={18} />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AIInsights;
