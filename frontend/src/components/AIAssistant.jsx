import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, Sparkles, Minimize2, Volume2, VolumeX } from 'lucide-react';
import { getVolume, setVolume } from '../hooks/VoiceAssistant';

const QUICK_REPLIES = [
  'How do I pair a child device?',
  'How to set screen time limits?',
  'How does location tracking work?',
  'What is Face Guard?',
  'How to lock an app?',
  'How does the camera feature work?',
];

// Simple local AI responses (no API needed)
const getAIResponse = (msg) => {
  const q = msg.toLowerCase();
  if (q.includes('pair') || q.includes('connect') || q.includes('link'))
    return "To pair a child device:\n1. On the child's phone, open ChildShield and select **Child Mode**\n2. Enter the child's name and gender\n3. A **6-digit code** and QR code will appear\n4. On your parent dashboard, go to **Controls** and enter the code\n5. The devices will sync automatically! ✅";
  if (q.includes('screen time') || q.includes('time limit') || q.includes('timer'))
    return "To set screen time limits:\n1. Go to **Controls** in your dashboard\n2. Find **Screen Time** section\n3. Set daily limit (e.g., 2 hours)\n4. You can also start a **countdown timer** for homework time\n5. The child will get warnings at 10, 5, and 1 minute before time's up ⏰";
  if (q.includes('location') || q.includes('track') || q.includes('gps'))
    return "Location tracking features:\n• **Live Location** — See where your child is right now on the map 📍\n• **Route History** — View where they've been throughout the day\n• **Safe Zones** — Set up Home, School, and custom zones with alerts\n• **Distance** — See how far your child is from you in real-time\n\nEnable tracking in **Controls → Location Tracking**";
  if (q.includes('face') || q.includes('guard'))
    return "Face Guard monitors who is using the child's device:\n• It uses the **front camera** to detect faces\n• If an **unknown face** is detected, it can alert, pause, or lock the device\n• You can enroll authorized faces in **Controls → Face Guard**\n• All face data stays **local** and is never uploaded 🔒";
  if (q.includes('lock') || q.includes('app'))
    return "To lock an app on the child's device:\n1. Go to **Controls** in your dashboard\n2. Find the **App Manager** section\n3. You'll see a list of apps the child uses\n4. Tap the **lock icon** next to any app\n5. The app will be locked for **24 hours** or until you manually unlock it 🔐";
  if (q.includes('camera'))
    return "The Camera feature lets you:\n• View the child's camera **live** via the Camera page 📷\n• **Switch** between front and back cameras\n• Toggle the **flashlight**\n• Take a **screenshot** of the camera feed\n\nAll streaming is peer-to-peer and encrypted!";
  if (q.includes('audio') || q.includes('listen') || q.includes('mic'))
    return "Audio Listening lets you hear the child's surroundings:\n• Go to the **Audio** page in the sidebar\n• Tap **Start Listening** to begin\n• You'll see a live **audio visualizer** 🎵\n• Tap **Stop** when done\n\nThis uses the microphone permission granted during child setup.";
  if (q.includes('screen') && (q.includes('shar') || q.includes('view')))
    return "Screen View lets you see the child's screen live:\n• Go to **Screen View** in the sidebar\n• Tap **View Child Screen**\n• The child will see a system prompt asking to share\n• Once approved, you'll see their screen in real-time 🖥️\n• You can take screenshots too!";
  if (q.includes('password') || q.includes('control'))
    return "The **Parent Control Password** is separate from your login password. It's used for:\n• Unlocking child device\n• Approving logout requests\n• Unlocking locked apps\n\nYou can change it in **Account Settings → Security**";
  if (q.includes('safe zone') || q.includes('geofence'))
    return "Safe Zones let you define trusted areas:\n1. Go to **Location → Safe Zones** tab\n2. Tap **Add Zone** and enter details\n3. Choose type: Home, School, Relative, or Custom\n4. Set radius: 100m, 200m, or 500m\n5. Get alerts when child enters/exits zones 🛡️";
  if (q.includes('hi') || q.includes('hello') || q.includes('hey'))
    return "Hello! 👋 I'm your ChildShield AI assistant. I can help you with:\n• Device pairing\n• Screen time & controls\n• Location tracking & safe zones\n• Camera, audio & screen features\n• Security settings\n\nJust ask me anything!";
  return "I can help you with ChildShield features! Try asking about:\n• **Pairing** a child device\n• Setting **screen time** limits\n• **Location** tracking & safe zones\n• **Camera**, **audio**, or **screen** viewing\n• **App locking** & security\n• **Face Guard** settings\n\nWhat would you like to know? 😊";
};

const AIAssistant = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: "Hi! 👋 I'm **Samantha**, your ChildShield AI assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Draggable state
  const [pos, setPos] = useState({ x: window.innerWidth - 90, y: window.innerHeight - 140 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, startPosX: 0, startPosY: 0 });

  // Mute logic
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolumeState] = useState(() => getVolume());

  useEffect(() => {
    // Sync mute state on mount
    setIsMuted(localStorage.getItem('samantha_muted') === 'true');
    
    // Listen for cross-tab or external mute toggles
    const handleMuteToggle = () => setIsMuted(localStorage.getItem('samantha_muted') === 'true');
    const handleVolumeChanged = (e) => setVolumeState(e.detail);
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
    // Let VoiceAssistant logic know if speech is happening it should stop
    if (newState) window.speechSynthesis.cancel();
    window.dispatchEvent(new Event('samantha-mute-changed'));
  };

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-ai-assistant', handleOpen);
    return () => window.removeEventListener('open-ai-assistant', handleOpen);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const handleSend = useCallback((text) => {
    const msg = text || input.trim();
    if (!msg) return;
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setMessages(m => [...m, { role: 'ai', text: getAIResponse(msg).replace(/Disha/g, 'Samantha') }]);
      setTyping(false);
    }, 800 + Math.random() * 500);
  }, [input]);

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

  // Render simple markdown bold
  const renderText = (text) => text.split('\n').map((line, i) => (
    <span key={i}>
      {line.split(/(\*\*[^*]+\*\*)/).map((part, j) =>
        part.startsWith('**') && part.endsWith('**')
          ? <strong key={j} style={{ color: 'var(--accent-cyan)' }}>{part.slice(2, -2)}</strong>
          : part
      )}
      {i < text.split('\n').length - 1 && <br />}
    </span>
  ));

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
            width: '64px', height: '64px', borderRadius: '50%',
            cursor: dragging ? 'grabbing' : 'grab',
            boxShadow: '0 4px 24px rgba(0,240,255,0.3), 0 0 60px rgba(176,38,255,0.15)',
            border: '2px solid rgba(0,240,255,0.4)',
            overflow: 'hidden', touchAction: 'none',
            animation: 'pulse-dot 3s infinite'
          }}
        >
          <img src="/disha.jpeg" alt="Samantha AI Assistant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px', zIndex: 9999,
          width: '380px', maxWidth: 'calc(100vw - 32px)', height: '520px', maxHeight: 'calc(100vh - 60px)',
          background: 'var(--bg-secondary)', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '24px', display: 'flex', flexDirection: 'column',
          boxShadow: '0 12px 48px rgba(0,0,0,0.5), 0 0 40px rgba(0,240,255,0.08)',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,240,255,0.03)' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', overflow: 'hidden', border: '2px solid rgba(0,240,255,0.3)', flexShrink: 0 }}>
              <img src="/disha.jpeg" alt="Samantha" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                Samantha <Sparkles size={14} color="#f59e0b" />
              </div>
              <div style={{ fontSize: '11px', color: '#10b981', fontWeight: '600' }}>● Online</div>
            </div>
            {/* MUTED TOGGLE */}
            <button onClick={toggleMute} style={{ background: isMuted ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)', border: '1px solid ' + (isMuted ? 'rgba(239,68,68,0.3)' : 'transparent'), borderRadius: '10px', padding: '6px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: isMuted ? '#ef4444' : '#fff', fontSize: '11px', fontWeight: 'bold' }}>
              {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              {isMuted ? 'Muted' : 'Voice'}
            </button>
            {/* VOLUME SLIDER — only visible when not muted */}
            {!isMuted && (
              <input
                type="range" min="0" max="1" step="0.05"
                value={volume}
                onChange={e => { const v = parseFloat(e.target.value); setVolumeState(v); setVolume(v); }}
                title={`Volume: ${Math.round(volume * 100)}%`}
                style={{ width: '64px', accentColor: 'var(--accent-cyan)', cursor: 'pointer' }}
              />
            )}
            <button onClick={() => setOpen(false)} style={{ background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '10px', padding: '8px', cursor: 'pointer', display: 'flex' }}>
              <Minimize2 size={16} color="#94a3b8" />
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%', padding: '12px 16px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: m.role === 'user' ? 'rgba(0,240,255,0.15)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${m.role === 'user' ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.06)'}`,
                  fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)'
                }}>
                  {renderText(m.text)}
                </div>
              </div>
            ))}
            {typing && (
              <div style={{ display: 'flex', gap: '4px', padding: '12px 16px', background: 'rgba(255,255,255,0.04)', borderRadius: '16px', width: 'fit-content' }}>
                {[0, 1, 2].map(i => (
                  <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-cyan)', animation: `pulse-dot 1.2s ease-in-out ${i * 0.15}s infinite` }} />
                ))}
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && (
            <div style={{ padding: '0 16px 8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUICK_REPLIES.slice(0, 3).map(q => (
                <button key={q} onClick={() => handleSend(q)} style={{ padding: '6px 12px', background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.15)', borderRadius: '20px', color: 'var(--accent-cyan)', fontSize: '11px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: '8px' }}>
            <input
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              style={{ flex: 1, padding: '10px 14px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#fff', fontSize: '13px', outline: 'none' }}
            />
            <button onClick={() => handleSend()} style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-cyan)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Send size={16} color="#0f172a" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;
