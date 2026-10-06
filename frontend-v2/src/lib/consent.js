// Client-side cache of the policy version the parent has accepted. Lets the
// ConsentGate render the dashboard instantly for returning users while it
// revalidates against the server in the background. The server remains the
// source of truth — this only avoids a blocking fetch on every app load.
const CONSENT_KEY = 'ag_consent_v';

export const markConsentCached = (version) => { try { if (version) localStorage.setItem(CONSENT_KEY, version); } catch { /* ignore */ } };
export const cachedConsentVersion = () => { try { return localStorage.getItem(CONSENT_KEY) || ''; } catch { return ''; } };
export const clearConsentCache = () => { try { localStorage.removeItem(CONSENT_KEY); } catch { /* ignore */ } };
