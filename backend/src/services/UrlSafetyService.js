/**
 * AlphaGuard AI — URL Safety Service
 * Checks URLs against the URLhaus (abuse.ch) malware URL database.
 *
 * URLhaus API: https://urlhaus-api.abuse.ch/v1/url/
 *  - POST form body: url=<the url to check>
 *  - Returns { query_status: 'ok' | 'no_results' | ... , threat, url_status, tags, blacklists }
 *
 * abuse.ch now issues free Auth-Keys for their APIs. If URLHAUS_AUTH_KEY is set
 * in the environment it is sent as the `Auth-Key` header; otherwise we still
 * attempt the request and degrade gracefully (returning verdict 'unknown')
 * rather than throwing — a safety lookup must never crash the calling flow.
 */

const URLHAUS_ENDPOINT = 'https://urlhaus-api.abuse.ch/v1/url/';

// Lightweight in-process cache so we don't re-query the same URL repeatedly.
// Map: url -> { verdict, expiresAt }
const _cache = new Map();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const _normalize = (raw) => {
  if (!raw || typeof raw !== 'string') return null;
  let url = raw.trim();
  if (!url) return null;
  // Add a scheme if missing so URLhaus + URL parsing behave
  if (!/^https?:\/\//i.test(url)) url = `http://${url}`;
  try {
    const u = new URL(url);
    return { url: u.href, host: u.hostname };
  } catch {
    return null;
  }
};

/**
 * Check a single URL against URLhaus.
 * Resolves to a verdict object — never rejects.
 *
 * @param {string} rawUrl
 * @returns {Promise<{verdict:'malicious'|'clean'|'unknown', url:string|null, host:string|null,
 *                     threat:string|null, urlStatus:string|null, tags:string[], blacklists:object,
 *                     source:string, reason?:string}>}
 */
async function checkUrl(rawUrl) {
  const parsed = _normalize(rawUrl);
  if (!parsed) {
    return { verdict: 'unknown', url: null, host: null, threat: null, urlStatus: null,
             tags: [], blacklists: {}, source: 'urlhaus', reason: 'Invalid URL' };
  }

  const { url, host } = parsed;

  // Serve from cache when fresh
  const cached = _cache.get(url);
  if (cached && cached.expiresAt > Date.now()) {
    return { ...cached.value, cached: true };
  }

  const base = { url, host, source: 'urlhaus' };

  try {
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (process.env.URLHAUS_AUTH_KEY) headers['Auth-Key'] = process.env.URLHAUS_AUTH_KEY;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(URLHAUS_ENDPOINT, {
      method: 'POST',
      headers,
      body: new URLSearchParams({ url }).toString(),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      return { ...base, verdict: 'unknown', threat: null, urlStatus: null, tags: [],
               blacklists: {}, reason: `URLhaus HTTP ${res.status}` };
    }

    const data = await res.json();

    let value;
    if (data.query_status === 'ok') {
      // URL is present in the URLhaus database → known-bad
      value = {
        ...base,
        verdict: 'malicious',
        threat: data.threat || 'malware',
        urlStatus: data.url_status || null,        // 'online' | 'offline'
        tags: Array.isArray(data.tags) ? data.tags : [],
        blacklists: data.blacklists || {},
      };
    } else if (data.query_status === 'no_results') {
      // Not in URLhaus. This is NOT a guarantee of safety, just "not known-bad".
      value = { ...base, verdict: 'clean', threat: null, urlStatus: null, tags: [], blacklists: {} };
    } else {
      // e.g. 'invalid_url', 'http_post_expected', auth errors
      value = { ...base, verdict: 'unknown', threat: null, urlStatus: null, tags: [],
                blacklists: {}, reason: data.query_status || 'unexpected response' };
    }

    _cache.set(url, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  } catch (err) {
    // Network error / timeout — fail open with 'unknown', never throw
    return { ...base, verdict: 'unknown', threat: null, urlStatus: null, tags: [],
             blacklists: {}, reason: err.name === 'AbortError' ? 'URLhaus timeout' : err.message };
  }
}

module.exports = { checkUrl };
