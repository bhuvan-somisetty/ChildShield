// Bridge between the native Android agent (android-agent/) and the backend.
// The native layer is the ONLY thing that can actually enforce (lock apps,
// detect packages, block uninstall). This module just relays native detections
// onto the child socket, and pushes parent policy down to native.
//
// In a plain browser (no native host) there is NO real enforcement — we do not
// fake app-locking or uninstall protection. The only browser-feasible signal is
// a coarse VPN/proxy hint, which we report honestly as low-confidence.

export const hasNative = () => typeof window !== 'undefined' && !!window.AlphaGuardNative;

// Map native event names → backend `enforce:*` socket events.
const NATIVE_TO_BACKEND = (socket) => (event, data) => {
  const d = typeof data === 'string' ? safeParse(data) : (data || {});
  switch (event) {
    case 'package:installed': socket.emit('enforce:install', { app: d.app, category: d.category }); break;
    case 'package:removed': socket.emit('enforce:uninstall', { app: d.app }); break;
    case 'security:alert': socket.emit('enforce:security', d); break;
    case 'tamper:alert': socket.emit('enforce:tamper', d); break;
    case 'screentime:locked': socket.emit('enforce:screentime', d); break;
    case 'screentime:limit_reached': socket.emit('enforce:screentime', { reason: 'screen_time' }); break;
    case 'location:update': socket.emit('location:update', d); break;
    case 'applock:request': socket.emit('enforce:security', { kind: 'app_access_request', detail: `Access requested: ${d.package || ''}`, risk: 'low' }); break;
    default: break;
  }
};
const safeParse = (s) => { try { return JSON.parse(s); } catch { return {}; } };

// Wire the native→web event sink. Called by the child app once its socket is up.
export const attachEnforcement = (socket) => {
  if (typeof window === 'undefined') return;
  window.AlphaGuard = window.AlphaGuard || {};
  window.AlphaGuard.onNativeEvent = NATIVE_TO_BACKEND(socket);
  // Best-effort browser detection (honest: low confidence, native is authoritative).
  browserVpnHint().then((hint) => { if (hint) socket.emit('enforce:security', { kind: 'vpn', detail: 'Possible VPN/proxy (browser heuristic)', risk: 'low' }); });
};

// Hand the backend session (URL + child token) to the native agent so its
// package-install receiver can POST directly even when this WebView is closed.
export const provisionNative = (baseUrl, token) => { if (hasNative() && baseUrl && token) { try { window.AlphaGuardNative.setSession(baseUrl, token); } catch { /* noop */ } } };

// Push parent policy (locked apps, screen limit, protection) down to native.
export const pushPolicy = (policy) => { if (hasNative()) { try { window.AlphaGuardNative.setPolicy(JSON.stringify(policy)); } catch { /* noop */ } } };

// Coarse, low-confidence VPN hint available to a browser: a large mismatch
// between the device timezone and the locale region can suggest tunnelling.
// (Reliable detection requires the native NetworkCapabilities check.)
const browserVpnHint = async () => {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const region = (navigator.language || '').split('-')[1] || '';
    // Intentionally conservative — only the native layer raises real VPN alerts.
    return false && tz && region; // disabled by default to avoid false positives
  } catch { return false; }
};
