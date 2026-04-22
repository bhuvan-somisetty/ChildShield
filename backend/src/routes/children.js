const express = require('express');
const router = express.Router();
const { Child, Activity } = require('../db');
const auth = require('../middleware/auth');

// Get single child
router.get('/:id', auth, async (req, res) => {
  try {
    const child = await Child.findOne({ where: { id: req.params.id, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });
    res.json({ child });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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
    
    let faces = child.authorizedFaces || [];
    
    if (imageStr === null) {
      // Delete face from array
      faces = faces.filter((_, idx) => idx !== slot);
    } else {
      if (slot >= 0 && slot < faces.length) {
         // Update existing slot
         faces[slot].image = imageStr;
         if(name) faces[slot].name = name;
      } else {
         // Add new face at end
         faces.push({
           id: Date.now().toString(),
           image: imageStr,
           name: name || `Face ${faces.length + 1}`,
           createdAt: new Date()
         });
      }
    }
    
    child.authorizedFaces = faces;
    
    // Sync to legacy fallback columns for schema safety
    child.faceEnrollment1 = faces.length > 0 ? faces[0].image : null;
    child.faceEnrollment2 = faces.length > 1 ? faces[1].image : null;

    child.changed('authorizedFaces', true);
    await child.save();
    
    res.json({ success: true, count: faces.length, child });
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

// Delete (remove) child profile
router.delete('/:id', auth, async (req, res) => {
  try {
    const child = await Child.findOne({ where: { id: req.params.id, parentId: req.user.id } });
    if (!child) return res.status(404).json({ error: 'Child not found' });
    await child.destroy();
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
