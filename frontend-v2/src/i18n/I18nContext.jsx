import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TRANSLATIONS } from './translations';
import { LANG_BY_CODE, isRTL, detectSystemLang } from './languages';

const I18nContext = createContext(null);
export const useI18n = () => useContext(I18nContext);
// Convenience hook returning just the translator.
export const useT = () => useContext(I18nContext).t;

const LS_LANG = 'ag_lang';        // selected language code (or 'system')
const LS_RECENT = 'ag_lang_recent'; // recently-used codes

const readRecent = () => { try { return JSON.parse(localStorage.getItem(LS_RECENT) || '[]'); } catch { return []; } };

// Apply <html lang/dir> so the whole document reflows for RTL languages.
const applyDocument = (code) => {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = code;
  document.documentElement.dir = isRTL(code) ? 'rtl' : 'ltr';
};

export const I18nProvider = ({ children }) => {
  const [pref, setPref] = useState(() => localStorage.getItem(LS_LANG) || 'system'); // 'system' or a code
  const [recent, setRecent] = useState(readRecent);

  // Resolve the effective language code (system default resolves to the OS locale).
  const lang = pref === 'system' ? detectSystemLang() : (LANG_BY_CODE[pref] ? pref : 'en');

  useEffect(() => { applyDocument(lang); }, [lang]);

  const setLang = useCallback((code) => {
    // `code` may be 'system' or a real language code.
    localStorage.setItem(LS_LANG, code);
    setPref(code);
    if (code !== 'system') {
      setRecent((prev) => {
        const next = [code, ...prev.filter((c) => c !== code)].slice(0, 5);
        localStorage.setItem(LS_RECENT, JSON.stringify(next));
        return next;
      });
    }
  }, []);

  const t = useCallback((key, fallback) => {
    const table = TRANSLATIONS[lang];
    if (table && table[key] != null) return table[key];
    if (TRANSLATIONS.en[key] != null) return TRANSLATIONS.en[key];
    return fallback != null ? fallback : key;
  }, [lang]);

  const value = {
    lang,                 // effective code
    pref,                 // 'system' or code (what the user picked)
    isSystem: pref === 'system',
    rtl: isRTL(lang),
    recent,               // recently used codes
    setLang,
    t,
  };
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
