const express = require('express');
const router = express.Router();
const { Child, FaceEvent } = require('../db');
const auth = require('../middleware/auth');

// Generate pairing code for a child profile (parent action)
router.post('/generate-code/:childId', auth, async (req, res) => {
  try {
    const child = await Child.findOne({ where: { id: req.params.childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    child.pairingCode = code;
    child.isPaired = false;
    await child.save();

    res.json({ success: true, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Child device pairs
router.post('/pair', async (req, res) => {
  try {
    const { pairingCode } = req.body;
    const child = await Child.findOne({ where: { pairingCode } });
    if (!child) return res.status(404).json({ error: 'Invalid pairing code.' });

    child.isPaired = true;
    child.deviceState = 'active';
    await child.save();

    res.json({
      success: true,
      session: {
        childId: child.id,
        name: child.name,
        dailyLimitHours: child.dailyLimitHours,
        voiceEnabled: child.voiceEnabled,
        facePresenceEnabled: child.facePresenceEnabled
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch extended status (including guard settings)
router.get('/status/:childId', async (req, res) => {
  try {
    const child = await Child.findByPk(req.params.childId, {
      attributes: [
        'id', 'name', 'deviceState', 'lockReason', 'dailyLimitHours', 
        'voiceEnabled', 'safeMode', 'facePresenceEnabled',
        'faceMismatchAction', 'noFaceAction', 'noFaceTimeout', 'faceMonitoringFrequency'
      ]
    });
    if (!child) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, status: child });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent sends control command
router.post('/control/:childId', auth, async (req, res) => {
  try {
    const { action, reason } = req.body;
    const child = await Child.findOne({ where: { id: req.params.childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    if (action === 'lock') {
      child.deviceState = 'locked';
      child.lockReason = reason || 'Parent locked the device';
    } else if (action === 'pause') {
      child.deviceState = 'paused';
      child.lockReason = reason || 'Session paused by parent';
    } else if (action === 'resume') {
      child.deviceState = 'active';
      child.lockReason = null;
    }

    await child.save();
    res.json({ success: true, deviceState: child.deviceState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ENHANCED: Log face mismatch / absence alert
router.post('/face-alert/:childId', async (req, res) => {
  try {
    const { snapshot, status: faceStatus } = req.body; // status: 'mismatch' | 'no-face'
    const child = await Child.findByPk(req.params.childId);
    if (!child) return res.status(404).json({ error: 'Not found' });

    const type = faceStatus === 'no-face' ? 'no-face' : 'mismatch';
    const actionToApply = type === 'no-face' ? child.noFaceAction : child.faceMismatchAction;
    
    // Create Event Log
    await FaceEvent.create({
      childId: child.id,
      type,
      snapshot: child.saveFaceSnapshots ? snapshot : null,
      status: type === 'no-face' ? 'Face Absent' : 'Unknown User',
      actionTaken: actionToApply,
      sessionContext: 'Active Learning Session' // Demo context
    });

    // Apply Action if needed
    if (actionToApply === 'lock') {
      child.deviceState = 'locked';
      child.lockReason = type === 'no-face' ? 'Face Guard: Supervision Lost' : 'Face Guard: Unauthorized User';
    } else if (actionToApply === 'pause') {
      child.deviceState = 'paused';
      child.lockReason = type === 'no-face' ? 'Security Pause: No face detected' : 'Security Pause: Unknown face';
    }
    
    await child.save();
    res.json({ success: true, action: actionToApply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch Security Logs
router.get('/face-events/:childId', auth, async (req, res) => {
  try {
    const events = await FaceEvent.findAll({
      where: { childId: req.params.childId },
      order: [['timestamp', 'DESC']],
      limit: 50
    });
    res.json({ success: true, events });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
