const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Parent, Child } = require('../db');
const auth = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_demo';

// Register User
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone, parentControlPassword } = req.body;
    
    const existing = await Parent.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists.' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const parentControlPasswordHash = await bcrypt.hash(parentControlPassword, salt);

    const parent = await Parent.create({
      fullName, email, phone, passwordHash, parentControlPasswordHash
    });

    const token = jwt.sign({ id: parent.id }, JWT_SECRET, { expiresIn: '7d' });
    
    // Auto-create a default child
    await Child.create({
      name: 'Primary Profile',
      age: 10,
      parentId: parent.id
    });

    res.json({ token, user: { id: parent.id, fullName: parent.fullName, email: parent.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const parent = await Parent.findOne({ where: { email } });
    if (!parent) return res.status(400).json({ error: 'Invalid credentials.' });

    const validPass = await bcrypt.compare(password, parent.passwordHash);
    if (!validPass) return res.status(400).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: parent.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: parent.id, fullName: parent.fullName, email: parent.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Parent Password for Lock screen
router.post('/verify-parent-lock', auth, async (req, res) => {
  try {
    const { password } = req.body;
    const parent = await Parent.findByPk(req.user.id);
    const validPass = await bcrypt.compare(password, parent.parentControlPasswordHash);
    if (!validPass) return res.status(400).json({ error: 'Incorrect Parent Control Password' });
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Me
router.get('/me', auth, async (req, res) => {
  try {
    const parent = await Parent.findByPk(req.user.id, { attributes: ['id', 'fullName', 'email'] });
    res.json({ user: parent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
  try {
    const parent = await Parent.findByPk(req.user.id);
    if (!parent) return res.status(404).json({ error: 'User not found' });

    const { name, email, parentControlPassword } = req.body;
    if (name) parent.fullName = name;
    if (email) parent.email = email;
    if (parentControlPassword) {
      const salt = await bcrypt.genSalt(10);
      parent.parentControlPasswordHash = await bcrypt.hash(parentControlPassword, salt);
    }
    await parent.save();
    res.json({ success: true, user: { id: parent.id, fullName: parent.fullName, email: parent.email } });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
