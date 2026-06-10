/**
 * AlphaGuard AI — URL Safety Route
 * Checks links visited on the child device against the URLhaus malware DB and
 * logs malicious hits to the parent's security feed (UrlEvent).
 *
 *  POST /api/safety/check-url           (child device — no JWT)  { childId?, url }
 *  GET  /api/safety/url-events/:childId (parent — auth + ownership)
 */
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Child, UrlEvent } = require('../db');
const { checkUrl } = require('../services/UrlSafetyService');

const severityFor = (result) => {
  if (result.verdict !== 'malicious') return 'low';
  // Online live malware is worse than an offline/dead link
  return result.urlStatus === 'online' ? 'critical' : 'high';
};

// ── Check a URL (called by the child device for each visited link) ─────────────
router.post('/check-url', async (req, res) => {
  try {
    const { childId, url } = req.body;
    if (!url) return res.status(400).json({ error: 'url is required' });

    const result = await checkUrl(url);

    // Only persist a security event when the link is actually flagged and we
    // have a valid, existing child to attribute it to.
    let logged = false;
    if (result.verdict === 'malicious' && childId) {
      const child = await Child.findByPk(childId);
      if (child) {
        await UrlEvent.create({
          childId,
          url: result.url,
          host: result.host,
          verdict: result.verdict,
          threat: result.threat,
          urlStatus: result.urlStatus,
          tags: result.tags || [],
          blacklists: result.blacklists || {},
          severity: severityFor(result),
          source: result.source,
        });
        logged = true;
      }
    }

    res.json({ success: true, result, logged });
  } catch (err) {
    console.error('[URL Safety]', err.message);
    res.status(500).json({ error: 'URL check failed', details: err.message });
  }
});

// ── Parent: list recent flagged URL events for one of their children ───────────
router.get('/url-events/:childId', auth, async (req, res) => {
  try {
    const { childId } = req.params;

    // Ownership check — only the parent who owns this child can read its events
    const child = await Child.findOne({ where: { id: childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found or unauthorized' });

    const events = await UrlEvent.findAll({
      where: { childId },
      order: [['timestamp', 'DESC']],
      limit: 100,
    });

    res.json({ success: true, events });
  } catch (err) {
    console.error('[URL Safety Events]', err.message);
    res.status(500).json({ error: 'Failed to fetch URL events', details: err.message });
  }
});

module.exports = router;
