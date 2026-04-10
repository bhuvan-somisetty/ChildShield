const express = require('express');
const router = express.Router();
const { Child, FaceEvent, Parent } = require('../db');
const auth = require('../middleware/auth');

// Child device initializes pairing
router.post('/init-pairing', async (req, res) => {
  try {
    const { childName } = req.body;
    if (!childName) return res.status(400).json({ error: 'Child name required' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const child = await Child.create({
      name: childName,
      age: 10, // Default fallback
      pairingCode: code,
      isPaired: false,
      deviceState: 'active'
    });

    res.json({ success: true, childId: child.id, pairingCode: code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Refresh pairing code
router.put('/refresh-code/:childId', async (req, res) => {
  try {
    const child = await Child.findByPk(req.params.childId);
    if (!child) return res.status(404).json({ error: 'Child profile not found' });
    
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    child.pairingCode = code;
    await child.save();
    
    res.json({ success: true, pairingCode: code });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent confirms pairing via code or QR
router.post('/confirm-pairing', auth, async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ error: 'Code required' });

    const child = await Child.findOne({ where: { pairingCode: code } });
    if (!child) return res.status(404).json({ error: 'Invalid pairing code' });
    if (child.isPaired) return res.status(400).json({ error: 'Device is already connected' });

    child.parentId = req.user.id;
    child.isPaired = true;
    child.pairingCode = null; // Consume code
    await child.save();

    res.json({ success: true, child });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent unpairs device securely
router.post('/unpair/:childId', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const parent = await Parent.findByPk(req.user.id);
    
    const bcrypt = require('bcryptjs');
    const validPass = await bcrypt.compare(password, parent.parentControlPasswordHash);
    if (!validPass) return res.status(400).json({ error: 'Incorrect Parent Control Password' });

    const child = await Child.findOne({ where: { id: req.params.childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    child.parentId = null;
    child.isPaired = false;
    // We optionally regenerate code so child gets disconnected UI instantly
    child.pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    await child.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch extended status (including guard settings & timer)
router.get('/status/:childId', async (req, res) => {
  try {
    const child = await Child.findByPk(req.params.childId, {
      attributes: [
        'id', 'name', 'deviceState', 'lockReason', 'dailyLimitHours', 
        'voiceEnabled', 'safeMode', 'facePresenceEnabled',
        'faceMismatchAction', 'noFaceAction', 'noFaceTimeout', 'faceMonitoringFrequency',
        'timerEndTime', 'timerDurationMinutes', 'parentId'
      ]
    });
    if (!child) return res.status(404).json({ error: 'Not found' });
    
    // Check if timer has expired
    if (child.timerEndTime && new Date(child.timerEndTime) <= new Date() && child.deviceState === 'active') {
      child.deviceState = 'locked';
      child.lockReason = 'Time limit reached. Session timer expired.';
      await child.save();
    }
    
    const parent = await Parent.findByPk(child.parentId);

    res.json({ 
      success: true, 
      status: child,
      parentName: parent ? parent.fullName : 'Parent',
      childName: child.name,
      connected: child.isPaired,
      lastSync: new Date().toISOString()
    });

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
      child.timerEndTime = null;
      child.timerDurationMinutes = null;
    }

    await child.save();
    res.json({ success: true, deviceState: child.deviceState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set Timer for child (parent action)
router.post('/timer/:childId', auth, async (req, res) => {
  try {
    const { durationMinutes } = req.body;
    const child = await Child.findOne({ where: { id: req.params.childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });

    if (durationMinutes && durationMinutes > 0) {
      const endTime = new Date(Date.now() + durationMinutes * 60 * 1000);
      child.timerEndTime = endTime;
      child.timerDurationMinutes = durationMinutes;
      child.deviceState = 'active';
      child.lockReason = null;
    } else {
      // Clear timer
      child.timerEndTime = null;
      child.timerDurationMinutes = null;
    }
    
    await child.save();
    res.json({ 
      success: true, 
      timerEndTime: child.timerEndTime, 
      timerDurationMinutes: child.timerDurationMinutes 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Timer expired notification from child device
router.post('/timer-expired/:childId', async (req, res) => {
  try {
    const child = await Child.findByPk(req.params.childId);
    if (!child) return res.status(404).json({ error: 'Not found' });

    child.deviceState = 'locked';
    child.lockReason = 'Time limit reached. Session timer expired.';
    await child.save();

    res.json({ success: true, deviceState: 'locked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unlock device with parent password verification
router.post('/unlock/:childId', async (req, res) => {
  try {
    const { password } = req.body;
    const child = await Child.findByPk(req.params.childId);
    if (!child) return res.status(404).json({ error: 'Not found' });

    const parent = await Parent.findByPk(child.parentId);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    const bcrypt = require('bcryptjs');
    const validPass = await bcrypt.compare(password, parent.parentControlPasswordHash);
    
    if (!validPass) {
      return res.status(400).json({ error: 'Incorrect Parent Control Password' });
    }

    child.deviceState = 'active';
    child.lockReason = null;
    child.timerEndTime = null;
    child.timerDurationMinutes = null;
    await child.save();

    res.json({ success: true, deviceState: 'active' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// For backward compatibility or separate verify check
router.post('/verify-lock/:childId', async (req, res) => {
  try {
    const { password } = req.body;
    const child = await Child.findByPk(req.params.childId);
    if (!child) return res.status(404).json({ error: 'Not found' });

    const parent = await Parent.findByPk(child.parentId);
    const bcrypt = require('bcryptjs');
    const validPass = await bcrypt.compare(password, parent.parentControlPasswordHash);
    
    if (!validPass) return res.status(400).json({ success: false, error: 'Incorrect Password' });
    
    res.json({ success: true });
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
      sessionContext: 'Active Learning Session',
      severity: actionToApply === 'lock' ? 'critical' : actionToApply === 'pause' ? 'high' : 'medium',
      platform: 'Mobile (Expo)'
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
