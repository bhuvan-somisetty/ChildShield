const express = require('express');
const router = express.Router();
const { Child, Activity } = require('../db');
const auth = require('../middleware/auth');

// Get all children for parent
router.get('/', auth, async (req, res) => {
  try {
    const children = await Child.findAll({ where: { parentId: req.user.id } });
    res.json({ children });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create child profile
router.post('/', auth, async (req, res) => {
  try {
    const child = await Child.create({ ...req.body, parentId: req.user.id });
    res.json({ child });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save Face Data
router.post('/:id/face', auth, async (req, res) => {
  try {
    const { slot, imageStr, name } = req.body; // slot: legacy 1/2, imageStr: base64, name: label for face
    const child = await Child.findOne({ where: { id: req.params.id, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });
    
    // Support legacy slot-based for backward compatibility
    if (slot === 1) child.faceEnrollment1 = imageStr;
    if (slot === 2) child.faceEnrollment2 = imageStr;
    
    // New multi-face registration
    const faces = child.authorizedFaces || [];
    faces.push({
      id: Date.now().toString(),
      image: imageStr,
      name: name || `Face ${faces.length + 1}`,
      createdAt: new Date()
    });
    child.authorizedFaces = faces;
    
    // Use changed() if Sequelize doesn't detect deep JSON change
    child.changed('authorizedFaces', true);
    await child.save();
    
    res.json({ success: true, count: faces.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update child settings (Controls)
router.put('/:id', auth, async (req, res) => {
  try {
    const child = await Child.findOne({ where: { id: req.params.id, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });
    await child.update(req.body);
    res.json({ child });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
