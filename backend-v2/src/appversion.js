// App lifecycle / update system — backend-managed version config.
//
// Stores the current released version + the minimum supported version. Clients
// call GET /app/version, compare their built-in version, and decide:
//   • client < minimumVersion  → MANDATORY update (dashboard blocked)
//   • client < currentVersion  → optional "Update Available" popup
//   • client ≥ currentVersion  → up to date
//
// Release notes ("What's New") are resolved from the existing `changelog` table
// by version — no duplication, integrating with that infrastructure.
import { Repo, now } from './db.js';

const config = Repo('appVersion');
const changelog = Repo('changelog');

// Default seed. Keep in sync with the frontend's built-in APP_VERSION so a fresh
// deployment reports "up to date" (no spurious update prompt) until an admin
// publishes a newer version.
const DEFAULT_VERSION = '2.1.0';
const SINGLETON_ID = 'current';

// Semantic-ish version compare: returns 1 if a>b, -1 if a<b, 0 if equal.
const parseV = (v) => String(v || '0').split('.').map((n) => parseInt(n, 10) || 0);
export const compareVersions = (a, b) => {
  const pa = parseV(a); const pb = parseV(b);
  for (let i = 0; i < Math.max(pa.length, pb.length); i += 1) {
    const d = (pa[i] || 0) - (pb[i] || 0);
    if (d !== 0) return d > 0 ? 1 : -1;
  }
  return 0;
};
const isValidVersion = (v) => /^\d+(\.\d+){0,3}$/.test(String(v || ''));

export const getConfig = () => {
  let c = config.byId(SINGLETON_ID);
  if (!c) c = config.insert({ id: SINGLETON_ID, version: DEFAULT_VERSION, minimumVersion: '0.0.0', updatedAt: now() });
  return c;
};

export const setConfig = ({ version, minimumVersion }) => {
  const patch = { updatedAt: now() };
  if (version != null) { if (!isValidVersion(version)) return { error: 'Invalid version' }; patch.version = String(version); }
  if (minimumVersion != null) { if (!isValidVersion(minimumVersion)) return { error: 'Invalid minimumVersion' }; patch.minimumVersion = String(minimumVersion); }
  getConfig(); // ensure the row exists
  return { config: config.update(SINGLETON_ID, patch) };
};

// Release notes for a version, pulled from the changelog (added/improved/fixed).
export const releaseNotesFor = (version) => {
  const entry = changelog.filter((c) => c.version === version).sort((a, b) => (b.at || 0) - (a.at || 0))[0];
  if (!entry) return null;
  return {
    version: entry.version,
    date: entry.date || null,
    added: entry.added || [],
    improved: entry.improved || [],
    fixed: entry.fixed || [],
  };
};

// Public payload. If the caller passes its own version (?version=), we also
// compute updateAvailable / mandatory server-side as a convenience; clients may
// compute the same from currentVersion/minimumVersion themselves.
export const versionInfo = (clientVersion) => {
  const c = getConfig();
  const info = {
    currentVersion: c.version,
    minimumVersion: c.minimumVersion || '0.0.0',
    releaseNotes: releaseNotesFor(c.version),
  };
  if (clientVersion && isValidVersion(clientVersion)) {
    info.clientVersion = String(clientVersion);
    info.updateAvailable = compareVersions(clientVersion, c.version) < 0;
    info.mandatory = compareVersions(clientVersion, info.minimumVersion) < 0;
  }
  return info;
};
