const express = require('express');
const router = express.Router();
const { Child, FaceEvent, Parent, Location, SafeZone } = require('../db');
const auth = require('../middleware/auth');

// ─── In-memory logout request store ──────────────────────────────────────────
// childId -> { status: 'pending'|'approved'|'denied', timestamp, childName }
const logoutRequests = new Map();

// Child requests logout (verifies password first, then sends to parent for approval)
router.post('/logout-request', async (req, res) => {
  try {
    const { childId, parentControlPassword } = req.body;
    if (!childId || !parentControlPassword) {
      return res.status(400).json({ error: 'childId and parentControlPassword are required' });
    }
    const child = await Child.findByPk(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const parent = await Parent.findByPk(child.parentId);
    if (parent && parent.parentControlPasswordHash) {
      const bcrypt = require('bcryptjs');
      const valid = await bcrypt.compare(parentControlPassword, parent.parentControlPasswordHash);
      if (!valid) return res.status(400).json({ error: 'Incorrect Parent Control Password' });
    }

    // Password correct → set pending request
    logoutRequests.set(String(childId), { status: 'pending', timestamp: Date.now(), childName: child.name });
    res.json({ success: true, message: 'Logout request sent to parent for approval' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent checks for pending logout requests
router.get('/logout-request/:childId', async (req, res) => {
  const request = logoutRequests.get(String(req.params.childId));
  res.json({ success: true, request: request || null });
});

// Parent responds to logout request
router.post('/logout-respond/:childId', auth, async (req, res) => {
  try {
    const { approved } = req.body;
    const childId = String(req.params.childId);
    const request = logoutRequests.get(childId);
    if (!request || request.status !== 'pending') {
      return res.status(400).json({ error: 'No pending logout request' });
    }

    if (approved) {
      logoutRequests.set(childId, { ...request, status: 'approved' });
      // Actually disconnect the child
      const child = await Child.findByPk(req.params.childId);
      if (child) {
        child.isPaired = false;
        child.parentId = null;
        await child.save();
      }
    } else {
      logoutRequests.set(childId, { ...request, status: 'denied' });
    }

    // Clean up after 30 seconds
    setTimeout(() => logoutRequests.delete(childId), 30000);

    res.json({ success: true, status: approved ? 'approved' : 'denied' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Child device initializes pairing
router.post('/init-pairing', async (req, res) => {
  try {
    const { childName, gender } = req.body;
    if (!childName) return res.status(400).json({ error: 'Child name required' });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const child = await Child.create({
      name: childName,
      age: 10, // Default fallback
      gender: gender || undefined,
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

    // Destroy child record completely to ensure data is lost and starts fresh as requested
    await child.destroy();

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
        'voiceEnabled', 'safeMode', 'nightRestriction', 'facePresenceEnabled',
        'faceMismatchAction', 'noFaceAction', 'noFaceTimeout', 'faceMonitoringFrequency',
        'timerEndTime', 'timerDurationMinutes', 'parentId',
        'isPaired' // REQUIRED: used to detect pairing completion on child device
      ]
    });
    if (!child) return res.status(404).json({ error: 'Not found' });
    
    // Check if timer has expired
    if (child.timerEndTime && new Date(child.timerEndTime) <= new Date() && child.deviceState === 'active') {
      child.deviceState = 'locked';
      child.lockReason = 'Time limit reached. Session timer expired.';
      await child.save();
    }
    
    const parent = child.parentId ? await Parent.findByPk(child.parentId) : null;

    res.json({ 
      success: true, 
      status: child,
      parentName: parent ? parent.fullName : 'Parent',
      childName: child.name,
      connected: child.isPaired === true,
      lastSync: new Date().toISOString()
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Child device pairs using a code entered by child (alternative pairing flow)
// Called by PairingSetup.jsx at /child/setup as a fallback entry
router.post('/pair', async (req, res) => {
  try {
    const { pairingCode } = req.body;
    if (!pairingCode) return res.status(400).json({ error: 'Pairing code required' });

    const child = await Child.findOne({ where: { pairingCode } });
    if (!child) return res.status(404).json({ error: 'Invalid pairing code. Please check and try again.' });
    if (child.isPaired) return res.status(400).json({ error: 'This device is already paired.' });

    // Return session info — actual pairing is confirmed by parent
    res.json({
      success: true,
      session: { childId: child.id, childName: child.name },
      message: 'Waiting for parent to confirm pairing.'
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

// Alert parent that child is trying to logout / disconnect
router.post('/disconnect-attempt', async (req, res) => {
  try {
    const { childId } = req.body;
    if (!childId) return res.status(400).json({ error: 'Child ID required' });
    
    // Log a FaceEvent (reusing table for security alerts)
    await FaceEvent.create({
      childId,
      type: 'disconnect_attempt',
      message: 'Child attempted to logout or disconnect the device without authorization.',
      severity: 'high',
      confidence: 1.0,
      timestamp: new Date()
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Validate parent control password to actually disconnect
router.post('/disconnect', async (req, res) => {
  try {
    const { childId, parentControlPassword } = req.body;
    if (!childId || !parentControlPassword) {
      return res.status(400).json({ error: 'childId and parentControlPassword are required' });
    }

    const child = await Child.findByPk(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    // Find parent and verify password
    const parent = await Parent.findByPk(child.parentId);
    if (parent && parent.parentControlPasswordHash) {
      const bcrypt = require('bcryptjs');
      const validPass = await bcrypt.compare(parentControlPassword, parent.parentControlPasswordHash);
      if (!validPass) {
        return res.status(400).json({ error: 'Incorrect Parent Control Password' });
      }
    }

    // Disconnect child
    child.isPaired = false;
    child.parentId = null;
    await child.save();

    res.json({ success: true });
  } catch (err) {
    console.error('[Disconnect Error]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// LOCATION TRACKING APIs
// ==========================================

// Child device periodically posts location
router.post('/location', async (req, res) => {
  try {
    const { childId, latitude, longitude, accuracy, speed, battery } = req.body;
    if (!childId || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'Missing location data' });
    }

    const child = await Child.findByPk(childId);
    if (!child || !child.locationTrackingEnabled) {
      return res.status(403).json({ error: 'Tracking disabled or child not found' });
    }

    const loc = await Location.create({
      childId, latitude, longitude, accuracy, speed, battery
    });

    res.json({ success: true, locationId: loc.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent fetches location history for a child
router.get('/locations/:childId', auth, async (req, res) => {
  try {
    const { childId } = req.params;
    const { Op } = require('sequelize');

    // Make sure this parent owns this child
    const child = await Child.findOne({ where: { id: childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found or unauthorized' });

    // Fetch locations from the past 24 hours
    const yesterday = new Date(new Date() - 24 * 60 * 60 * 1000);
    const { isMongo } = require('../db');
    const timeFilter = isMongo ? { $gte: yesterday } : { [require('sequelize').Op.gte]: yesterday };
    
    const locations = await Location.findAll({
      where: {
        childId,
        timestamp: timeFilter
      },
      order: [['timestamp', 'DESC']],
      limit: 1000
    });

    res.json({ success: true, trackingEnabled: child.locationTrackingEnabled, locations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Parent toggles location tracking on/off
router.put('/toggle-location/:childId', auth, async (req, res) => {
  try {
    const child = await Child.findOne({ where: { id: req.params.childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Unauthorized' });

    child.locationTrackingEnabled = req.body.enabled;
    await child.save();

    res.json({ success: true, locationTrackingEnabled: child.locationTrackingEnabled });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Safe Zone CRUD ──────────────────────────────────────────────────────────

// Create a safe zone
router.post('/safe-zones', auth, async (req, res) => {
  try {
    const { childId, name, type, latitude, longitude, radiusMeters, address } = req.body;
    if (!childId || !name || !latitude || !longitude) {
      return res.status(400).json({ error: 'childId, name, latitude, and longitude are required' });
    }
    const child = await Child.findOne({ where: { id: childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found or unauthorized' });

    const zone = await SafeZone.create({
      childId, name, type: type || 'custom',
      latitude, longitude, radiusMeters: radiusMeters || 200,
      address: address || null
    });
    res.json({ success: true, zone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List safe zones for a child
router.get('/safe-zones/:childId', auth, async (req, res) => {
  try {
    const zones = await SafeZone.findAll({ where: { childId: req.params.childId }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, zones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List safe zones for child device (no parent auth needed)
router.get('/child-safe-zones/:childId', async (req, res) => {
  try {
    const child = await Child.findByPk(req.params.childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });
    const zones = await SafeZone.findAll({ where: { childId: req.params.childId }, order: [['createdAt', 'DESC']] });
    res.json({ success: true, zones });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a safe zone
router.put('/safe-zones/:zoneId', auth, async (req, res) => {
  try {
    const zone = await SafeZone.findByPk(req.params.zoneId);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    const { name, type, latitude, longitude, radiusMeters, address } = req.body;
    if (name !== undefined) zone.name = name;
    if (type !== undefined) zone.type = type;
    if (latitude !== undefined) zone.latitude = latitude;
    if (longitude !== undefined) zone.longitude = longitude;
    if (radiusMeters !== undefined) zone.radiusMeters = radiusMeters;
    if (address !== undefined) zone.address = address;
    await zone.save();
    res.json({ success: true, zone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a safe zone
router.delete('/safe-zones/:zoneId', auth, async (req, res) => {
  try {
    const zone = await SafeZone.findByPk(req.params.zoneId);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    await SafeZone.destroy({ where: { id: zone.id || zone._id } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reverse geocoding proxy (uses free Nominatim API)
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=18&addressdetails=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'ChildShield-AI/1.0' } });
    const data = await response.json();
    const addr = data.address || {};
    res.json({
      success: true,
      displayName: data.display_name || '',
      city: addr.city || addr.town || addr.village || addr.hamlet || '',
      locality: addr.suburb || addr.neighbourhood || addr.village || '',
      state: addr.state || '',
      country: addr.country || '',
      road: addr.road || '',
      postcode: addr.postcode || ''
    });
  } catch (err) {
    res.json({ success: false, displayName: 'Unknown location', city: '', locality: '' });
  }
});

// ─── App Locking ─────────────────────────────────────────────────────────────

// Lock an app on child device
router.post('/lock-app', auth, async (req, res) => {
  try {
    const { childId, appName } = req.body;
    if (!childId || !appName) return res.status(400).json({ error: 'childId and appName required' });
    const child = await Child.findOne({ where: { id: childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });
    
    const locked = child.lockedApps || [];
    if (!locked.find(a => a.appName === appName)) {
      locked.push({ appName, lockedAt: new Date().toISOString(), lockedBy: 'parent' });
      child.lockedApps = locked;
      child.changed('lockedApps', true);
      await child.save();
    }
    res.json({ success: true, lockedApps: child.lockedApps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Unlock an app
router.post('/unlock-app', auth, async (req, res) => {
  try {
    const { childId, appName } = req.body;
    if (!childId || !appName) return res.status(400).json({ error: 'childId and appName required' });
    const child = await Child.findOne({ where: { id: childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });
    
    child.lockedApps = (child.lockedApps || []).filter(a => a.appName !== appName);
    child.changed('lockedApps', true);
    await child.save();
    res.json({ success: true, lockedApps: child.lockedApps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get locked apps list
router.get('/locked-apps/:childId', auth, async (req, res) => {
  try {
    const child = await Child.findOne({ where: { id: req.params.childId, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });
    
    // Auto-unlock apps locked more than 24 hours ago
    const now = Date.now();
    const filtered = (child.lockedApps || []).filter(a => {
      const lockedMs = new Date(a.lockedAt).getTime();
      return (now - lockedMs) < 24 * 60 * 60 * 1000;
    });
    if (filtered.length !== (child.lockedApps || []).length) {
      child.lockedApps = filtered;
      child.changed('lockedApps', true);
      await child.save();
    }
    res.json({ success: true, lockedApps: filtered });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Child-side: check locked apps (no auth — child doesn't have JWT) ────────
router.get('/check-app-lock/:childId', async (req, res) => {
  try {
    const child = await Child.findByPk(req.params.childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });
    res.json({ success: true, lockedApps: child.lockedApps || [] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Child unlocks an app with parent password
router.post('/unlock-app-child', async (req, res) => {
  try {
    const { childId, appName, parentPassword } = req.body;
    if (!childId || !appName || !parentPassword) {
      return res.status(400).json({ error: 'childId, appName, and parentPassword are required' });
    }
    const child = await Child.findByPk(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const parent = await Parent.findByPk(child.parentId);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    const bcrypt = require('bcryptjs');
    const validPass = await bcrypt.compare(parentPassword, parent.parentControlPasswordHash);
    if (!validPass) {
      return res.status(400).json({ error: 'Incorrect Parent Control Password' });
    }

    child.lockedApps = (child.lockedApps || []).filter(a => a.appName !== appName);
    child.changed('lockedApps', true);
    await child.save();
    res.json({ success: true, lockedApps: child.lockedApps });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Child unlocks the entire device with parent password
router.post('/unlock-device-child', async (req, res) => {
  try {
    const { childId, parentPassword } = req.body;
    if (!childId || !parentPassword) {
      return res.status(400).json({ error: 'childId and parentPassword are required' });
    }
    const child = await Child.findByPk(childId);
    if (!child) return res.status(404).json({ error: 'Child not found' });

    const parent = await Parent.findByPk(child.parentId);
    if (!parent) return res.status(404).json({ error: 'Parent not found' });

    const bcrypt = require('bcryptjs');
    const validPass = await bcrypt.compare(parentPassword, parent.parentControlPasswordHash);
    if (!validPass) {
      return res.status(400).json({ error: 'Incorrect Parent Control Password' });
    }

    child.deviceState = 'active';
    child.lockReason = null;
    await child.save();
    res.json({ success: true, deviceState: child.deviceState });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Nearby facilities search (proximity-based) ─────────────────────────────
router.get('/nearby-facilities', async (req, res) => {
  try {
    const { lat, lon, type } = req.query;
    if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' });

    const radius = 0.05; // ~5km bounding box
    const latF = parseFloat(lat);
    const lonF = parseFloat(lon);
    const viewbox = `${lonF - radius},${latF + radius},${lonF + radius},${latF - radius}`;
    const searchType = type || 'police';

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchType)}&viewbox=${viewbox}&bounded=1&limit=5&addressdetails=1`;
    const response = await fetch(url, { headers: { 'User-Agent': 'ChildShield-AI/1.0' } });
    const data = await response.json();

    const facilities = (data || []).map(item => {
      const dist = haversineDistance(latF, lonF, parseFloat(item.lat), parseFloat(item.lon));
      return {
        name: item.address?.[searchType] || item.display_name?.split(',')[0] || searchType,
        address: item.display_name || '',
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        distance: dist,
        distanceText: dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`,
        type: searchType
      };
    }).sort((a, b) => a.distance - b.distance);

    res.json({ success: true, facilities });
  } catch (err) {
    res.json({ success: true, facilities: [] });
  }
});

function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

module.exports = router;
