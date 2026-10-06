import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, Check, ChevronRight, FileText, X, Loader2 } from 'lucide-react';
import { Screen, Button } from '../components/ui';
import { api, getToken } from '../lib/agClient';
import { EFFECTIVE, REQUIRED_CONSENT, legalDoc } from '../data/legal';
import { markConsentCached } from '../lib/consent';

// Onboarding legal consent screen (parent). Mandatory gate that records the
// parent's acceptance of the CURRENT policy version in PostgreSQL (via the
// backend, which stamps the version server-side). Satisfies COPPA verifiable
// parental consent + Play/App-Store consent requirements. Required policies are
// fully readable here (inline sheet) — no external navigation needed.
const Consent = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get('next') || '/app';

  const [loading, setLoading] = useState(true);
  const [already, setAlready] = useState(false);
  const [guardian, setGuardian] = useState(false);
  const [agree, setAgree] = useState(false);
  const [reading, setReading] = useState(null); // slug being read in the sheet
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // If the parent has already accepted the current version, don't force them to
  // re-consent — send them onward. (The gate only routes here when stale.)
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const s = await api.consentStatus();
        if (active && s.current) { markConsentCached(s.requiredVersion); setAlready(true); }
      } catch { /* show the form; acceptance still validates server-side */ }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  if (!getToken()) return <Navigate to="/login" replace />;
  if (already) return <Navigate to={next} replace />;

  const accept = async () => {
    if (!guardian || !agree || submitting) return;
    setSubmitting(true); setError('');
    try {
      const r = await api.acceptConsent(REQUIRED_CONSENT.map((d) => d.slug));
      markConsentCached(r.status?.requiredVersion);
      navigate(next, { replace: true });
    } catch {
      setError('Could not record your consent. Please check your connection and try again.');
      setSubmitting(false);
    }
  };

  const doc = reading ? legalDoc(reading) : null;

  const footer = (
    <Button iconRight={ChevronRight} loading={submitting} disabled={!guardian || !agree} onClick={accept}>
      Agree & Continue
    </Button>
  );

  return (
    <Screen align="start" glow="#06b6d4" footer={footer}>
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 size={26} className="text-cyan-400 animate-spin" /></div>
      ) : (
        <div className="w-full flex flex-col">
          <div className="flex flex-col items-center text-center mb-6 mt-2">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 240, damping: 18 }} className="relative mb-5">
              <div className="absolute -inset-3 rounded-3xl bg-cyan-500/20 blur-xl" />
              <div className="relative w-16 h-16 rounded-3xl bg-gradient-to-br from-cyan-500/30 to-blue-600/15 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.4)]">
                <ShieldCheck size={32} className="text-cyan-300" />
              </div>
            </motion.div>
            <h1 className="text-[24px] font-black text-white tracking-tight leading-tight max-w-[320px]">Before you continue</h1>
            <p className="text-slate-400 text-[14px] font-medium mt-3 max-w-[330px] leading-relaxed">
              AlphaGuard is operated by a parent or legal guardian for their own child. Please review and accept our policies to continue.
            </p>
            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-[0.12em] mt-3">{EFFECTIVE}</span>
          </div>

          {/* Readable policy rows */}
          <div className="flex flex-col gap-2.5 mb-5">
            {REQUIRED_CONSENT.map((d) => (
              <button key={d.slug} onClick={() => setReading(d.slug)} className="ag-tap w-full flex items-center gap-3.5 p-4 rounded-2xl border border-white/[0.07] bg-[#0b0c14] text-left hover:bg-white/[0.03]">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 flex items-center justify-center flex-shrink-0"><FileText size={17} className="text-cyan-400" /></div>
                <span className="flex-1 text-white font-bold text-[14px]">{d.label}</span>
                <span className="text-cyan-400 text-[12px] font-bold">Read</span>
                <ChevronRight size={16} className="text-slate-600" />
              </button>
            ))}
          </div>

          {/* Consent checkboxes */}
          <div className="flex flex-col gap-3">
            <CheckRow checked={guardian} onClick={() => setGuardian((v) => !v)}>
              I confirm I am the parent or legal guardian of every child I will monitor, and I am 18 or older.
            </CheckRow>
            <CheckRow checked={agree} onClick={() => setAgree((v) => !v)}>
              I have read and agree to the{' '}
              <Link onClick={() => setReading('terms')}>Terms of Service</Link>,{' '}
              <Link onClick={() => setReading('privacy')}>Privacy Policy</Link>, and{' '}
              <Link onClick={() => setReading('child-safety')}>Child Safety Policy</Link>.
            </CheckRow>
          </div>

          {error && <p className="text-rose-400 text-[12.5px] font-semibold text-center px-1 mt-4">{error}</p>}
          <p className="text-slate-500 text-[11.5px] font-medium text-center leading-relaxed mt-5 px-2">
            Your acceptance is recorded with the policy version and time. If our policies materially change, you’ll be asked to review and accept again.
          </p>
        </div>
      )}

      {/* Inline policy reader sheet */}
      {doc && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setReading(null)} />
          <div className="relative z-10 w-full max-w-[440px] bg-[#0b0c14] border border-white/10 rounded-t-[28px] flex flex-col" style={{ maxHeight: '82vh' }}>
            <div className="flex items-center gap-3 p-5 border-b border-white/[0.07]">
              <div className="flex-1 min-w-0"><p className="text-white font-black text-[16px] truncate">{doc.title}</p><p className="text-slate-500 text-[12px] font-semibold">{EFFECTIVE}</p></div>
              <button onClick={() => setReading(null)} aria-label="Close" className="ag-tap w-9 h-9 rounded-xl bg-white/[0.06] flex items-center justify-center text-slate-300"><X size={17} /></button>
            </div>
            <div className="overflow-y-auto ag-no-scrollbar p-5 flex flex-col gap-3" style={{ paddingBottom: 'calc(1.25rem + var(--ag-safe-bottom))' }}>
              {doc.blocks.map((b, i) => (
                <div key={i}>{b.h && <p className="text-white font-bold text-[13.5px] mb-1">{b.h}</p>}<p className="text-slate-400 text-[12.5px] font-medium leading-relaxed">{b.t}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Screen>
  );
};

const CheckRow = ({ checked, onClick, children }) => (
  <button onClick={onClick} className="ag-tap w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-colors" style={{ borderColor: checked ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.08)', background: checked ? 'rgba(6,182,212,0.06)' : '#0b0c14' }}>
    <span className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border ${checked ? 'bg-cyan-500 border-cyan-400' : 'border-white/20 bg-white/[0.03]'}`}>{checked && <Check size={13} className="text-white" strokeWidth={3} />}</span>
    <span className="flex-1 text-slate-300 text-[13px] font-semibold leading-relaxed">{children}</span>
  </button>
);
const Link = ({ onClick, children }) => (
  <span role="button" tabIndex={0} onClick={(e) => { e.stopPropagation(); onClick(); }} className="text-cyan-400 font-extrabold underline underline-offset-2">{children}</span>
);

export default Consent;
