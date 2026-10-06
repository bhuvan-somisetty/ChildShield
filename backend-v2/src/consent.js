// Legal consent + data-deletion requests.
//
// The server is the single source of truth for the *current* policy version that
// gates the app. A parent must have accepted the current version of the required
// documents (Terms, Privacy, Child-Safety) to use the dashboard; when we publish a
// new version, `consentStatus().current` flips to false for everyone until they
// re-accept — that is the re-acceptance mechanism the onboarding gate enforces.
//
// Each acceptance is stored as its own immutable row (version + timestamp + the
// documents accepted + request metadata), giving a complete audit trail.
import { Repo, now } from './db.js';

const consents = Repo('consents');
const deletions = Repo('deletionRequests');

// Bump this string (and the policy content / EFFECTIVE date) whenever the legal
// documents change materially — it forces every parent to re-accept. Kept in sync
// with the frontend's displayed EFFECTIVE date via GET /legal/version.
let POLICY_VERSION = '2026-06-13';
const POLICY_EFFECTIVE = 'Effective 13 June 2026 · Version 2.0.0';

// Documents a parent must accept to use the service. Slugs match the frontend
// legal routes (/legal/:slug and /app/settings/legal/:slug).
export const REQUIRED_DOCUMENTS = [
  { slug: 'terms', title: 'Terms of Service' },
  { slug: 'privacy', title: 'Privacy Policy' },
  { slug: 'child-safety', title: 'Child Safety Policy' },
];

export const currentVersion = () => POLICY_VERSION;
export const legalVersion = () => ({ version: POLICY_VERSION, effective: POLICY_EFFECTIVE, documents: REQUIRED_DOCUMENTS });

// Record a parent's acceptance of the CURRENT policy version. The version is
// stamped server-side so a client can never backdate or forge which version it
// accepted. `meta` carries audit context (ip, userAgent, acceptedDocs).
export const recordConsent = (parentId, meta = {}) => {
  const acceptedDocs = Array.isArray(meta.acceptedDocs) && meta.acceptedDocs.length
    ? meta.acceptedDocs
    : REQUIRED_DOCUMENTS.map((d) => d.slug);
  return consents.insert({
    parentId,
    version: POLICY_VERSION,
    at: now(),
    acceptedDocs,
    method: meta.method || 'onboarding',
    ip: meta.ip || null,
    userAgent: meta.userAgent || null,
  });
};

// Latest acceptance for a parent + whether it satisfies the current version.
export const consentStatus = (parentId) => {
  const rows = consents.filter((c) => c.parentId === parentId).sort((a, b) => (b.at || 0) - (a.at || 0));
  const latest = rows[0] || null;
  return {
    current: !!latest && latest.version === POLICY_VERSION,
    requiredVersion: POLICY_VERSION,
    acceptedVersion: latest ? latest.version : null,
    acceptedAt: latest ? latest.at : null,
    effective: POLICY_EFFECTIVE,
    documents: REQUIRED_DOCUMENTS,
  };
};

// Log a formal data-deletion / erasure request (GDPR Art.17 / CCPA / COPPA).
// Recorded as an auditable row with a 30-day fulfilment SLA. The row is written
// independently of account rows so it survives an immediate account erasure.
export const recordDeletionRequest = (parentId, meta = {}) => {
  const at = now();
  return deletions.insert({
    parentId,
    status: 'received',
    at,
    scope: meta.scope || 'account',
    reason: meta.reason || null,
    email: meta.email || null,
    ip: meta.ip || null,
    userAgent: meta.userAgent || null,
    slaDays: 30,
    purgeBy: at + 30 * 24 * 60 * 60 * 1000,
  });
};

export const listDeletionRequests = (parentId) => deletions.filter((d) => d.parentId === parentId).sort((a, b) => (b.at || 0) - (a.at || 0));

// Test seam — lets the suite simulate publishing a new policy version to prove
// the re-acceptance gate triggers. Not used in production.
export const _setPolicyVersion = (v) => { POLICY_VERSION = v; };
