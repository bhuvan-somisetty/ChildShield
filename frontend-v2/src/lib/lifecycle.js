// App lifecycle tracking (first install / onboarding / first login / updates).
// All state is local to the device; the server owns the *version* config only.
import { APP_VERSION } from './agClient';

const K_INSTALLED = 'ag_installed_at';     // first-ever launch timestamp
const K_ONBOARDED = 'ag_onboarded';        // intro/onboarding completed once
const K_FIRST_LOGIN = 'ag_first_login_at'; // first successful auth timestamp
const K_APP_VERSION = 'ag_app_version';    // last bundle version this device ran
const K_SEEN_WHATSNEW = 'ag_seen_whatsnew';// last version whose What's New was shown
const K_UPDATE_DISMISSED = 'ag_update_dismissed'; // optional-update version dismissed via "Later"

const get = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const set = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode / quota */ } };
const del = (k) => { try { localStorage.removeItem(k); } catch { /* ignore */ } };

/* ── First install ──────────────────────────────────────────────────────── */
// Records the first launch exactly once. Returns true if THIS call was the first.
export const markInstalled = () => {
  if (get(K_INSTALLED)) return false;
  set(K_INSTALLED, String(Date.now()));
  return true;
};
export const isFirstInstall = () => !get(K_INSTALLED);
export const installedAt = () => Number(get(K_INSTALLED)) || null;

/* ── Onboarding ─────────────────────────────────────────────────────────── */
export const isOnboarded = () => get(K_ONBOARDED) === '1';
export const markOnboarded = () => set(K_ONBOARDED, '1');
// Explicit user-initiated reset — the ONLY way onboarding shows again.
export const resetOnboarding = () => del(K_ONBOARDED);

/* ── First login ────────────────────────────────────────────────────────── */
export const markFirstLogin = () => { if (!get(K_FIRST_LOGIN)) set(K_FIRST_LOGIN, String(Date.now())); };
export const firstLoginAt = () => Number(get(K_FIRST_LOGIN)) || null;

/* ── Version / update tracking ──────────────────────────────────────────── */
// Numeric semver-ish compare: 1 if a>b, -1 if a<b, 0 if equal (matches backend).
export const compareVersions = (a, b) => {
  const pa = String(a || '0').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = String(b || '0').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
};

// Detects whether THIS launch is the first run on a newly-installed bundle (i.e.
// the user just updated the app). Records the current bundle version and returns
// the previous version when it changed, else null. First-ever run returns null
// (a brand-new user shouldn't be shown a "What's New" for an app they never had).
export const consumeVersionChange = () => {
  const last = get(K_APP_VERSION);
  if (last !== APP_VERSION) set(K_APP_VERSION, APP_VERSION);
  if (!last) return null;                 // first install → not an update
  return last !== APP_VERSION ? last : null;
};

// What's New is shown once per version after an update.
export const whatsNewSeen = (version) => get(K_SEEN_WHATSNEW) === String(version);
export const markWhatsNewSeen = (version) => set(K_SEEN_WHATSNEW, String(version));

// "Later" on an optional update suppresses the popup until a newer version ships.
export const updateDismissed = (version) => get(K_UPDATE_DISMISSED) === String(version);
export const dismissUpdate = (version) => set(K_UPDATE_DISMISSED, String(version));
