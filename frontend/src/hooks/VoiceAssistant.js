export const speak = (text) => {
  if (!('speechSynthesis' in window)) return;
  const utterance = new SpeechSynthesisUtterance(text);
  
  // Try to find a human-sounding female voice for premium feel
  const voices = window.speechSynthesis.getVoices();
  const preferredVoice = voices.find(v => v.name.includes('Google US English') || v.name.includes('Samantha') || v.name.includes('Victoria') || v.name.includes('Female'));
  
  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }
  
  utterance.pitch = 1.0;
  utterance.rate = 0.95; // Slightly slower for clear, calm enunciation
  utterance.volume = 1;

  window.speechSynthesis.cancel(); // Clear any ongoing speech
  window.speechSynthesis.speak(utterance);
};
