// ────────────────────────────────────────────────────────────────────────────
// VoiceAssistant.js — Web Speech API wrapper for ChildShield AI
// Handles the async voice-loading race condition and Chrome cancel() bug.
// ────────────────────────────────────────────────────────────────────────────

let _voicesLoaded = false;
let _preferredVoice = null;

// ─── Volume control (0.0 – 1.0, persisted in localStorage) ──────────────────
export const getVolume = () => {
  const v = parseFloat(localStorage.getItem('samantha_volume'));
  return isNaN(v) ? 1.0 : Math.min(1, Math.max(0, v));
};

export const setVolume = (v) => {
  const clamped = Math.min(1, Math.max(0, v));
  localStorage.setItem('samantha_volume', String(clamped));
  window.dispatchEvent(new CustomEvent('samantha-volume-changed', { detail: clamped }));
};

// Pre-load voices as soon as the browser is ready (avoids empty array bug)
const _loadVoices = () => {
  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return; // not ready yet

  _voicesLoaded = true;
  _preferredVoice =
    voices.find(v => v.name.includes('Google US English')) ||
    voices.find(v => v.name.includes('Samantha')) ||
    voices.find(v => v.name.includes('Victoria')) ||
    voices.find(v => /female/i.test(v.name)) ||
    voices.find(v => v.lang === 'en-US') ||
    voices[0]; // ultimate fallback
};

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  // Chrome fires this event; Firefox has voices immediately
  window.speechSynthesis.onvoiceschanged = _loadVoices;
  _loadVoices(); // also try right away for Firefox / Safari
}

/**
 * Speak text aloud using the Web Speech API.
 * Safe to call even if voices haven't loaded yet — will retry once.
 */
export const speak = (text) => {
  if (localStorage.getItem('samantha_muted') === 'true') return;
  if (!('speechSynthesis' in window) || !text) return;

  const _doSpeak = () => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.pitch = 1.05;
    utterance.rate = 0.92;   // calm, clear delivery
    utterance.volume = getVolume();

    if (_preferredVoice) {
      utterance.voice = _preferredVoice;
    }

    // Chrome bug: calling speak() immediately after cancel() in the same tick
    // causes silence. Use a 50ms delay to let the synthesis queue clear.
    window.speechSynthesis.cancel();
    setTimeout(() => window.speechSynthesis.speak(utterance), 50);
  };

  if (_voicesLoaded) {
    _doSpeak();
  } else {
    // Voices not loaded yet — wait for the event then speak
    const onReady = () => {
      _loadVoices();
      _doSpeak();
      window.speechSynthesis.onvoiceschanged = null;
    };
    window.speechSynthesis.onvoiceschanged = onReady;
    // Fallback: if event never fires (e.g. Firefox already loaded), speak directly
    setTimeout(() => {
      if (!_voicesLoaded) _doSpeak();
    }, 300);
  }
};

// ────────────────────────────────────────────────────────────────────────────
// Pre-defined announcements for ChildShield events
// ────────────────────────────────────────────────────────────────────────────
export const VoiceEvents = {
  SESSION_LOCKED:  () => speak("Your session has been locked. Please ask a parent to unlock the device."),
  SESSION_PAUSED:  () => speak("Your session has been paused by your parent."),
  SESSION_RESUMED: () => speak("Welcome back! Your session has been resumed."),
  TIME_WARNING_10: () => speak("You have 10 minutes of screen time remaining today."),
  TIME_WARNING_5:  () => speak("Warning. Only 5 minutes of screen time left."),
  TIME_WARNING_1:  () => speak("Device will lock in 1 minute. Please save your work."),
  DEVICE_LINKED:   () => speak("This device is now connected and protected by ChildShield A.I."),
};

