// SpeechToTextService + TextToSpeechService — thin wrappers over the Web Speech
// API with graceful fallbacks. A backend (Whisper / cloud TTS) can replace these
// without changing the VoiceAIProvider contract.

// App language code → BCP-47 locale for recognition + synthesis.
const LOCALE = {
  en: 'en-US', hi: 'hi-IN', te: 'te-IN', ta: 'ta-IN', kn: 'kn-IN', ml: 'ml-IN', mr: 'mr-IN',
  bn: 'bn-IN', gu: 'gu-IN', pa: 'pa-IN', or: 'or-IN', ur: 'ur-PK', ar: 'ar-SA', es: 'es-ES',
  fr: 'fr-FR', de: 'de-DE', it: 'it-IT', pt: 'pt-BR', nl: 'nl-NL', ru: 'ru-RU', tr: 'tr-TR',
  zh: 'zh-CN', 'zh-TW': 'zh-TW', ja: 'ja-JP', ko: 'ko-KR', th: 'th-TH', vi: 'vi-VN',
  id: 'id-ID', ms: 'ms-MY', sv: 'sv-SE', no: 'nb-NO', da: 'da-DK', fi: 'fi-FI', pl: 'pl-PL',
  uk: 'uk-UA', el: 'el-GR', he: 'he-IL', ro: 'ro-RO', hu: 'hu-HU', cs: 'cs-CZ', sk: 'sk-SK',
  fil: 'fil-PH', sw: 'sw-KE', fa: 'fa-IR',
};
export const toLocale = (code) => LOCALE[code] || 'en-US';

export const supportsSTT = () => typeof window !== 'undefined' && !!(window.SpeechRecognition || window.webkitSpeechRecognition);
export const supportsTTS = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

// Detect the script of a transcript so DISHA can reply in the same language even
// when recognition was configured for a different one.
export const detectLang = (text = '') => {
  if (/[ఀ-౿]/.test(text)) return 'te';   // Telugu
  if (/[஀-௿]/.test(text)) return 'ta';   // Tamil
  if (/[ಀ-೿]/.test(text)) return 'kn';   // Kannada
  if (/[ഀ-ൿ]/.test(text)) return 'ml';   // Malayalam
  if (/[ঀ-৿]/.test(text)) return 'bn';   // Bengali
  if (/[઀-૿]/.test(text)) return 'gu';   // Gujarati
  if (/[਀-੿]/.test(text)) return 'pa';   // Gurmukhi
  if (/[ऀ-ॿ]/.test(text)) return 'hi';   // Devanagari (Hindi/Marathi)
  if (/[؀-ۿ]/.test(text)) return 'ar';   // Arabic
  if (/[぀-ヿ]/.test(text)) return 'ja';   // Japanese kana
  if (/[一-鿿]/.test(text)) return 'zh';   // CJK
  if (/[가-힯]/.test(text)) return 'ko';   // Hangul
  return null;
};

let _voices = [];
const refreshVoices = () => { if (supportsTTS()) _voices = window.speechSynthesis.getVoices() || []; };
if (supportsTTS()) {
  refreshVoices();
  window.speechSynthesis.onvoiceschanged = refreshVoices;
}

// Prefer a warm, female voice for the locale.
const FEMALE_HINTS = ['female', 'samantha', 'victoria', 'karen', 'tessa', 'fiona', 'moira', 'google', 'zira', 'aria', 'jenny', 'neerja', 'swara', 'sara', 'amelie', 'anna', 'paulina'];
export const pickVoice = (code) => {
  if (!_voices.length) refreshVoices();
  const loc = toLocale(code);
  const lang2 = loc.split('-')[0];
  const byLoc = _voices.filter((v) => v.lang === loc);
  const byLang = _voices.filter((v) => v.lang && v.lang.startsWith(lang2));
  const pool = byLoc.length ? byLoc : byLang.length ? byLang : _voices;
  const female = pool.find((v) => FEMALE_HINTS.some((h) => v.name.toLowerCase().includes(h)));
  return female || pool[0] || null;
};

// TextToSpeechService.speak — returns a stop() handle.
export const speak = (text, { code = 'en', onStart, onEnd, onBoundary } = {}) => {
  if (!supportsTTS() || !text) { onStart && onStart(); onEnd && setTimeout(onEnd, 400); return () => {}; }
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = toLocale(code);
  const v = pickVoice(code); if (v) u.voice = v;
  u.rate = 1; u.pitch = 1.06; u.volume = 1;
  u.onstart = () => onStart && onStart();
  u.onend = () => onEnd && onEnd();
  u.onboundary = (e) => onBoundary && onBoundary(e);
  synth.speak(u);
  return () => synth.cancel();
};
export const cancelSpeech = () => { if (supportsTTS()) window.speechSynthesis.cancel(); };

// SpeechToTextService — wraps webkitSpeechRecognition.
export class SpeechToText {
  constructor() {
    const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
    this.rec = SR ? new SR() : null;
    if (this.rec) { this.rec.continuous = false; this.rec.interimResults = true; this.rec.maxAlternatives = 1; }
    this.onPartial = null; this.onFinal = null; this.onEnd = null; this.onError = null;
    if (this.rec) {
      this.rec.onresult = (e) => {
        let interim = '', final = '';
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const t = e.results[i][0].transcript;
          if (e.results[i].isFinal) final += t; else interim += t;
        }
        if (interim && this.onPartial) this.onPartial(interim);
        if (final && this.onFinal) this.onFinal(final.trim());
      };
      this.rec.onend = () => this.onEnd && this.onEnd();
      this.rec.onerror = (e) => this.onError && this.onError(e.error);
    }
  }
  setLang(code) { if (this.rec) this.rec.lang = toLocale(code); }
  start() { if (this.rec) { try { this.rec.start(); } catch { /* already started */ } } }
  stop() { if (this.rec) { try { this.rec.stop(); } catch { /* noop */ } } }
  get supported() { return !!this.rec; }
}
