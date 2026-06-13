// Google Sign-In — authorization-code popup flow via Google Identity Services.
// Opens the real Google account-selection popup, hands the one-time code to the
// backend (which verifies it with the client secret) and persists the app token.
// Nothing here trusts the client: the backend is the sole identity authority.
import { api, setToken } from './agClient';

const GIS_SRC = 'https://accounts.google.com/gsi/client';
let gisPromise = null;
let cachedConfig = null;

const loadGis = () => {
  if (typeof window !== 'undefined' && window.google?.accounts?.oauth2) return Promise.resolve();
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = GIS_SRC; s.async = true; s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { gisPromise = null; reject(new Error('Failed to load Google Sign-In')); };
    document.head.appendChild(s);
  });
  return gisPromise;
};

// Whether Google sign-in is configured (client id present on the backend).
export const googleConfig = async () => {
  if (cachedConfig) return cachedConfig;
  cachedConfig = await api.googleConfig().catch(() => ({ enabled: false, clientId: '' }));
  return cachedConfig;
};

// Opens the popup, exchanges the code via the backend, persists the token.
// Resolves { token, parent, needsPin, created }. Rejects with:
//   'google_not_configured' | 'popup_closed' | 'access_denied' | <server error>
export async function signInWithGoogle() {
  const cfg = await googleConfig();
  if (!cfg.enabled || !cfg.clientId) throw new Error('google_not_configured');
  await loadGis();

  const code = await new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initCodeClient({
      client_id: cfg.clientId,
      scope: 'openid email profile',
      ux_mode: 'popup',
      select_account: true, // always show the account chooser
      callback: (resp) => {
        if (resp && resp.code) resolve(resp.code);
        else reject(new Error(resp?.error || 'access_denied'));
      },
      error_callback: (err) => reject(new Error(err?.type === 'popup_closed' ? 'popup_closed' : (err?.type || 'access_denied'))),
    });
    client.requestCode();
  });

  const result = await api.googleAuth(code); // backend verifies + issues app JWT
  if (result.token) setToken(result.token);
  return result;
}
