import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useChild } from '../context/ChildContext';
import { useRealtime } from '../context/RealtimeContext';
import { useI18n } from '../i18n/I18nContext';
import { PARENT } from '../data/childDemo';
import { SpeechToText, speak, cancelSpeech, detectLang, supportsSTT, supportsTTS } from './speech';
import { greeting, respond, sosAnnouncement } from './conversation';

/**
 * VoiceAIProvider — VoiceSessionManager + VoiceStateMachine + ConversationEngine
 * glue. States: idle → listening → thinking → speaking → (continuous) listening.
 * Real STT/TTS via the Web Speech API; falls back gracefully where unavailable.
 */
const VoiceAIContext = createContext(null);
export const useVoiceAI = () => useContext(VoiceAIContext);

const K_HIST = 'ag_voice_history';
const loadHist = () => { try { return JSON.parse(localStorage.getItem(K_HIST) || '[]'); } catch { return []; } };

let _mid = 1;

export const VoiceAIProvider = ({ children }) => {
  const navigate = useNavigate();
  const { child, setting } = useChild();
  const { getTelemetry, pendingCount } = useRealtime();
  const { lang } = useI18n();

  const [state, setState] = useState('idle'); // idle | listening | thinking | speaking | error
  const [level, setLevel] = useState(0);
  const [interim, setInterim] = useState('');
  const [messages, setMessages] = useState(loadHist);
  const [activeLang, setActiveLang] = useState(lang);
  const [continuous, setContinuous] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [speakerOn, setSpeakerOn] = useState(true);
  const [emergency, setEmergency] = useState(false);

  // Mutable mirrors for use inside async callbacks.
  const refs = useRef({});
  refs.current = { child, setting, activeLang, continuous, micOn, speakerOn };

  const sttRef = useRef(null);
  const meter = useRef({ raf: 0, stream: null, ac: null, sim: 0 });

  useEffect(() => { localStorage.setItem(K_HIST, JSON.stringify(messages.slice(-100))); }, [messages]);
  useEffect(() => setActiveLang(lang), [lang]);

  const push = (role, text, code) => setMessages((m) => [...m, { id: _mid++, role, text, code, at: Date.now() }]);

  /* ── Audio metering ──────────────────────────────────────────────────── */
  const stopMeter = useCallback(() => {
    const m = meter.current;
    if (m.raf) cancelAnimationFrame(m.raf);
    if (m.sim) clearInterval(m.sim);
    if (m.stream) m.stream.getTracks().forEach((t) => t.stop());
    if (m.ac && m.ac.state !== 'closed') m.ac.close().catch(() => {});
    meter.current = { raf: 0, stream: null, ac: null, sim: 0 };
    setLevel(0);
  }, []);

  const startMicMeter = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AC = window.AudioContext || window.webkitAudioContext;
      const ac = new AC();
      const src = ac.createMediaStreamSource(stream);
      const an = ac.createAnalyser(); an.fftSize = 256; src.connect(an);
      const data = new Uint8Array(an.frequencyBinCount);
      meter.current.stream = stream; meter.current.ac = ac;
      const loop = () => {
        an.getByteTimeDomainData(data);
        let sum = 0; for (let i = 0; i < data.length; i++) { const v = (data[i] - 128) / 128; sum += v * v; }
        setLevel(Math.min(1, Math.sqrt(sum / data.length) * 3.2));
        meter.current.raf = requestAnimationFrame(loop);
      };
      loop();
    } catch { /* no mic — orb still breathes from its own idle animation */ }
  }, []);

  // Simulated amplitude while DISHA speaks (TTS output isn't analysable).
  const startSpeakMeter = useCallback(() => {
    meter.current.sim = setInterval(() => setLevel(0.35 + Math.random() * 0.5), 110);
  }, []);

  /* ── Speaking ────────────────────────────────────────────────────────── */
  const startListening = useCallback(() => {
    if (!refs.current.micOn) { setState('idle'); return; }
    setInterim('');
    setState('listening');
    startMicMeter();
    const stt = sttRef.current;
    if (stt && stt.supported) { stt.setLang(refs.current.activeLang); stt.start(); }
  }, [startMicMeter]);

  const speakOut = useCallback((text, code, { thenListen = true } = {}) => {
    push('assistant', text, code);
    setState('speaking');
    if (!refs.current.speakerOn) { // muted speaker — skip TTS, advance flow
      setTimeout(() => { stopMeter(); thenListen && refs.current.continuous ? startListening() : setState('idle'); }, 600);
      return;
    }
    startSpeakMeter();
    speak(text, {
      code,
      onEnd: () => { stopMeter(); if (thenListen && refs.current.continuous && refs.current.micOn) startListening(); else setState('idle'); },
    });
  }, [startSpeakMeter, stopMeter, startListening]);

  /* ── Understanding ───────────────────────────────────────────────────── */
  const handleTranscript = useCallback((text) => {
    if (!text) return;
    push('user', text, refs.current.activeLang);
    setInterim('');
    stopMeter();
    setState('thinking');
    const replyLang = detectLang(text) || refs.current.activeLang;
    setActiveLang(replyLang);
    setTimeout(() => {
      const c = refs.current.child;
      const reply = respond(text, { child: c, telemetry: getTelemetry(c.id), setting: refs.current.setting, pendingCount: pendingCount(c.id), code: replyLang, parentName: PARENT.name });
      speakOut(reply.text, replyLang);
      if (reply.action) {
        setTimeout(() => {
          if (reply.action.type === 'navigate') navigate(reply.action.to);
          else if (reply.action.type === 'call' && reply.action.phone) window.location.href = `tel:${reply.action.phone}`;
        }, 1400);
      }
    }, 900);
  }, [getTelemetry, pendingCount, navigate, speakOut, stopMeter]);

  /* ── STT wiring ──────────────────────────────────────────────────────── */
  useEffect(() => {
    const stt = new SpeechToText();
    stt.onPartial = (t) => setInterim(t);
    stt.onFinal = (t) => handleTranscript(t);
    stt.onEnd = () => { /* recognition stopped; flow continues via onFinal */ };
    stt.onError = () => { stopMeter(); };
    sttRef.current = stt;
    return () => { try { stt.stop(); } catch {} cancelSpeech(); };
  }, [handleTranscript, stopMeter]);

  /* ── Public controls ─────────────────────────────────────────────────── */
  const begin = useCallback(() => {
    setEmergency(false);
    const code = refs.current.activeLang;
    speakOut(greeting(PARENT.name, code), code); // greeting → (continuous) listen
  }, [speakOut]);

  const stopAll = useCallback(() => {
    const stt = sttRef.current; if (stt) stt.stop();
    cancelSpeech(); stopMeter(); setInterim(''); setState('idle');
  }, [stopMeter]);

  const toggleListen = useCallback(() => {
    if (state === 'listening') { sttRef.current && sttRef.current.stop(); stopMeter(); setState('idle'); }
    else startListening();
  }, [state, startListening, stopMeter]);

  const announceSOS = useCallback(() => {
    setEmergency(true);
    const c = refs.current.child;
    const text = sosAnnouncement(c, getTelemetry(c.id));
    push('assistant', text, 'en');
    setState('speaking'); startSpeakMeter();
    speak(text, { code: 'en', onEnd: () => { stopMeter(); setState('idle'); } });
  }, [getTelemetry, startSpeakMeter, stopMeter]);

  const clearHistory = useCallback(() => setMessages([]), []);
  const deleteMessage = useCallback((id) => setMessages((m) => m.filter((x) => x.id !== id)), []);

  useEffect(() => () => stopAll(), []); // cleanup on unmount

  const value = {
    state, level, interim, messages, activeLang, continuous, micOn, speakerOn, emergency,
    setContinuous, setMicOn, setSpeakerOn, setActiveLang,
    begin, stopAll, toggleListen, announceSOS, clearHistory, deleteMessage,
    supported: { stt: supportsSTT(), tts: supportsTTS() },
  };
  return <VoiceAIContext.Provider value={value}>{children}</VoiceAIContext.Provider>;
};
