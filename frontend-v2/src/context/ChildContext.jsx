import React, { createContext, useContext, useState, useMemo } from 'react';
import { CHILDREN } from '../data/childDemo';

const ChildContext = createContext(null);
export const useChild = () => useContext(ChildContext);

// Per-child, backend-ready settings (single source of truth, persisted locally).
const APP_LIMITS = { YouTube: 60, Instagram: 45, TikTok: 30, Snapchat: 30, Facebook: 30, Games: 60, Chrome: 90, 'Khan Academy': 0, Roblox: 45 };
const defaultSettings = (c) => ({
  screenLimit: c.screenTime.limit, // daily limit (minutes)
  weeklyLimits: [180, 180, 180, 180, 240, 300, 300], // Mon–Sun (minutes)
  appLimits: { ...APP_LIMITS },    // per-app minutes (0 = unlimited)
  // Locked apps are the single source of truth for "Apps Restricted" everywhere.
  lockedApps: c.id === 'liam' ? ['TikTok', 'Snapchat', 'Games'] : c.id === 'noah' ? ['Instagram', 'Chrome'] : c.id === 'emma' ? ['TikTok'] : [],
  eduApps: ['Khan Academy'],       // educational exceptions
  nightApps: c.id === 'liam' ? ['Games', 'TikTok'] : ['Games'], // per-app night restriction
  extensions: [],                  // [{ id, mins }] grants today — individually removable
  unlockForToday: false,           // overrides the daily limit until midnight
  educationExceptions: true,
  night: { on: true, start: '22:00', end: '06:00', games: true, social: true, ent: true, edu: false, emergency: true },
});

const loadSettings = () => {
  const saved = JSON.parse(localStorage.getItem('ag_settings') || '{}');
  const init = {};
  CHILDREN.forEach((c) => {
    const d = defaultSettings(c); const s = saved[c.id] || {};
    init[c.id] = { ...d, ...s, night: { ...d.night, ...(s.night || {}) }, appLimits: { ...d.appLimits, ...(s.appLimits || {}) } };
  });
  return init;
};

// Effective daily limit + remaining, accounting for extensions and unlock-for-today.
export const effLimit = (s) => (s.unlockForToday ? Infinity : s.screenLimit + s.extensions.reduce((t, e) => t + e.mins, 0));
export const extMins = (s) => s.extensions.reduce((t, e) => t + e.mins, 0);

export const ChildProvider = ({ children }) => {
  const [list, setList] = useState(CHILDREN);
  const _preset = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('child') : null;
  const [activeId, setActiveId] = useState(CHILDREN.find((c) => c.id === _preset)?.id || CHILDREN[0].id);
  const [settings, setSettings] = useState(loadSettings);

  const updateSettings = (id, patch) => setSettings((prev) => {
    const merged = { ...prev[id], ...patch };
    if (patch.night) merged.night = { ...prev[id].night, ...patch.night };
    const next = { ...prev, [id]: merged };
    localStorage.setItem('ag_settings', JSON.stringify(next));
    return next;
  });

  const value = useMemo(() => {
    const child = list.find((c) => c.id === activeId) || list[0];
    return {
      list, child, activeId, setActiveId,
      addChild: (c) => setList((prev) => [...prev, c]),
      settings,                                   // full map
      setting: settings[child.id],                // active child's settings
      updateSettings,                             // (id, patch)
      updateSetting: (patch) => updateSettings(child.id, patch), // active child
    };
  }, [list, activeId, settings]);

  return <ChildContext.Provider value={value}>{children}</ChildContext.Provider>;
};
