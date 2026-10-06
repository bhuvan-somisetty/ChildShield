import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { api } from '../lib/agClient';
import { cachedConsentVersion, markConsentCached, clearConsentCache } from '../lib/consent';

// Wraps the parent dashboard. Enforces that the signed-in parent has accepted the
// CURRENT legal policy version before using the app — and, crucially, re-routes
// them to the consent screen if we later publish a new version (re-acceptance).
//
// Returning users (with a cached accepted version) see the dashboard immediately
// while we revalidate in the background; if the server reports their acceptance
// is stale, we redirect to /consent and return here afterwards.
const ConsentGate = ({ children }) => {
  const location = useLocation();
  const [status, setStatus] = useState(cachedConsentVersion() ? 'ok' : 'checking');
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await api.consentStatus();
        if (!active) return;
        if (s.current) { markConsentCached(s.requiredVersion); setStatus('ok'); }
        else { clearConsentCache(); setStale(true); }
      } catch {
        // Network failure / server cold-start: don't lock the user out — the
        // server still independently gates every data mutation by auth.
        if (active) setStatus('ok');
      }
    })();
    return () => { active = false; };
  }, [location.pathname]);

  if (stale) return <Navigate to={`/consent?next=${encodeURIComponent(location.pathname)}`} replace />;
  if (status === 'checking') {
    return (
      <div className="ag-min-h-screen w-full flex items-center justify-center" style={{ background: 'var(--ag-bg)' }}>
        <Loader2 size={26} className="text-cyan-400 animate-spin" />
      </div>
    );
  }
  return children;
};

export default ConsentGate;
