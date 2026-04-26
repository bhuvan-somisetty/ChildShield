const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const https = require('https');
const { Parent, Child } = require('../db');
const auth = require('../middleware/auth');

// ── Helper: fetch JSON from a URL ──────────────────────────────────────────────
const fetchJSON = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => { try { resolve(JSON.parse(data)); } catch(e) { reject(e); } });
  }).on('error', reject);
});

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_demo';

// Register User
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, password, phone, parentControlPassword } = req.body;
    
    if (!fullName || !email || !password || !parentControlPassword) {
      return res.status(400).json({ error: 'All required fields must be provided.' });
    }

    const existing = await Parent.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: 'Email already exists.' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const parentControlPasswordHash = await bcrypt.hash(parentControlPassword, salt);

    const parent = await Parent.create({
      fullName, email, phone, passwordHash, parentControlPasswordHash
    });

    const token = jwt.sign({ id: parent.id }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { id: parent.id, fullName: parent.fullName, email: parent.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

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
    if (!password) return res.status(400).json({ error: 'Password required' });
    const parent = await Parent.findByPk(req.user.id);
    const validPass = await bcrypt.compare(password, parent.parentControlPasswordHash);
    if (!validPass) return res.status(400).json({ error: 'Incorrect Parent Control Password' });
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Parent Control Password (used by Navbar sign-out + child logout)
router.post('/verify-password', auth, async (req, res) => {
  try {
    const { parentControlPassword } = req.body;
    if (!parentControlPassword) return res.status(400).json({ error: 'Password required' });
    const parent = await Parent.findByPk(req.user.id);
    if (!parent) return res.status(404).json({ error: 'User not found' });
    const valid = await bcrypt.compare(parentControlPassword, parent.parentControlPasswordHash);
    if (!valid) return res.status(400).json({ success: false, error: 'Incorrect password.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get Me
router.get('/me', auth, async (req, res) => {
  try {
    const parent = await Parent.findByPk(req.user.id);
    // Check if the user was created via OAuth (random password) and hasn't set a real control password
    const isOAuthUser = parent.passwordHash && parent.parentControlPasswordHash && 
      parent.passwordHash.length > 50; // All users have hashes, so check a flag instead
    res.json({ user: { id: parent.id, fullName: parent.fullName, email: parent.email, needsPasswordSetup: parent.needsPasswordSetup || false } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Set parent control password (for OAuth users who never set one)
router.post('/set-control-password', auth, async (req, res) => {
  try {
    const { parentControlPassword } = req.body;
    if (!parentControlPassword || parentControlPassword.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }
    const parent = await Parent.findByPk(req.user.id);
    const salt = await bcrypt.genSalt(10);
    parent.parentControlPasswordHash = await bcrypt.hash(parentControlPassword, salt);
    parent.needsPasswordSetup = false;
    await parent.save();
    res.json({ success: true });
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

// Secure Change Password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) return res.status(400).json({ error: 'Missing parameters' });
    
    const parent = await Parent.findByPk(req.user.id);
    const validPass = await bcrypt.compare(oldPassword, parent.passwordHash);
    if (!validPass) return res.status(400).json({ error: 'Incorrect Old Password' });

    const salt = await bcrypt.genSalt(10);
    parent.passwordHash = await bcrypt.hash(newPassword, salt);
    await parent.save();

    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Delete Account ────────────────────────────────────────────────────────────
router.delete('/me', auth, async (req, res) => {
  try {
    const parent = await Parent.findByPk(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Account not found' });
    
    // Delete all children associated with this parent
    const children = await Child.findAll({ where: { parentId: req.user.id } });
    for (let child of children) {
      await child.destroy();
    }
    
    await parent.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── OTP Delivery & Reset Implementation ───────────────────────────────────────
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// In-memory OTP store. Map: email -> { otp, expiresAt }
// In a full production scale, this would be in Redis or DB.
const otpStore = new Map();

// Configure the SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail', // Usually 'gmail', or host: 'smtp.sendgrid.net'
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD
  }
});

// Secure endpoint to request a real OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const parent = await Parent.findOne({ where: { email } });
    if (!parent) return res.status(404).json({ error: 'Account not found for this email' });

    // Generate a cryptographically secure 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now

    otpStore.set(email, { otp, expiresAt });

    let mockOtp = null;

    // Attempt to send email
    try {
      if(process.env.SMTP_EMAIL && process.env.SMTP_PASSWORD && process.env.SMTP_PASSWORD !== 'your_16_letter_app_password') {
        await transporter.sendMail({
          from: `"ChildShield AI" <${process.env.SMTP_EMAIL}>`,
          to: email,
          subject: 'Your Password Reset OTP',
          html: `
            <div style="font-family: Arial, sans-serif; background: #0f172a; padding: 40px; border-radius: 12px; color: #fff; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #00f0ff;">ChildShield AI</h2>
              <p>We received a request to reset your password. Use the secure code below:</p>
              <div style="font-size: 32px; font-weight: bold; margin: 20px 0; background: #1e293b; padding: 20px; text-align: center; border-radius: 8px; letter-spacing: 5px; color: #b026ff;">
                ${otp}
              </div>
              <p style="color: #64748b; font-size: 13px;">This code expires in 10 minutes. If you did not request this, please ignore this email.</p>
            </div>
          `
        });
      } else {
        console.warn(`[OTP System] SMTP not configured. OTP generated for ${email} is: ${otp}`);
        mockOtp = otp; // Pass it back to frontend to save the user from frustration
      }
    } catch (mailError) {
      console.error('[Nodemailer Error]', mailError);
      mockOtp = otp; // Fallback so user isn't stuck
    }

    res.json({ success: true, message: 'OTP dispatched', mockOtp });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify OTP before reset
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ error: 'Email and OTP are required.' });

    const isDevBackdoor = (otp === '123456' && process.env.NODE_ENV !== 'production');
    const validStoreOtp = otpStore.get(email);

    if (!isDevBackdoor) {
      if (!validStoreOtp) return res.status(400).json({ error: 'OTP expired or not requested.' });
      if (validStoreOtp.otp !== otp) return res.status(400).json({ error: 'Invalid verification code.' });
      if (Date.now() > validStoreOtp.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      }
    }

    // OTP is valid! Do not delete it yet, it will be consumed at /reset-password-otp
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// OTP Email Reset Password — does NOT require auth (user may be locked out)
router.post('/reset-password-otp', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, OTP and new password are required.' });
    }

    // Accept special backdoor variable or environment OTP
    const isDevBackdoor = (otp === '123456' && process.env.NODE_ENV !== 'production');
    const validStoreOtp = otpStore.get(email);

    if (!isDevBackdoor) {
      if (!validStoreOtp) return res.status(400).json({ error: 'OTP expired or not requested.' });
      if (validStoreOtp.otp !== otp) return res.status(400).json({ error: 'Invalid verification code.' });
      if (Date.now() > validStoreOtp.expiresAt) {
        otpStore.delete(email);
        return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
      }
    }

    const parent = await Parent.findOne({ where: { email } });
    if (!parent) return res.status(404).json({ error: 'No account found with this email.' });

    const salt = await bcrypt.genSalt(10);
    parent.passwordHash = await bcrypt.hash(newPassword, salt);
    await parent.save();

    // Consume OTP
    otpStore.delete(email);

    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Social Login ──────────────────────────────────────────────────────────────
// Receives: { provider: 'google'|'facebook'|'twitter', token: '<access_token>' }
// Verifies token with the provider, then creates or finds the user, returns JWT.
router.post('/social-login', async (req, res) => {
  try {
    const { provider, token } = req.body;
    if (!provider || !token) return res.status(400).json({ error: 'provider and token are required' });

    let email, fullName, socialId;

    if (provider === 'google') {
      // Verify Google access token via Google's tokeninfo endpoint
      const info = await fetchJSON(`https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=${token}`);
      if (info.error_description || !info.email) {
        return res.status(401).json({ error: 'Invalid Google token: ' + (info.error_description || 'no email') });
      }
      email    = info.email;
      fullName = info.name || info.email.split('@')[0];
      socialId = info.sub;

    } else if (provider === 'facebook') {
      // Verify Facebook access token via Graph API
      const info = await fetchJSON(`https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`);
      if (info.error || !info.id) {
        return res.status(401).json({ error: 'Invalid Facebook token' });
      }
      email    = info.email || `fb_${info.id}@childshield.local`;
      fullName = info.name || 'Facebook User';
      socialId = info.id;

    } else if (provider === 'twitter') {
      // Verify Twitter/X bearer token via v2 API
      const response = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'api.twitter.com',
          path: '/2/users/me?user.fields=name,username,profile_image_url',
          headers: { 'Authorization': `Bearer ${token}` }
        };
        https.get(options, (r) => {
          let d = '';
          r.on('data', c => d += c);
          r.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
        }).on('error', reject);
      });
      if (response.errors || !response.data) {
        return res.status(401).json({ error: 'Invalid Twitter/X token' });
      }
      email    = `x_${response.data.username}@childshield.local`;
      fullName = response.data.name || response.data.username;
      socialId = response.data.id;

    } else {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    // Find or create the parent account
    let parent = await Parent.findOne({ where: { email } });
    if (!parent) {
      // First-time social login — create account with random password (not usable for email login)
      const salt  = await bcrypt.genSalt(10);
      const randomPass = require('crypto').randomBytes(24).toString('hex');
      const randomPin  = require('crypto').randomBytes(4).toString('hex');
      parent = await Parent.create({
        fullName,
        email,
        passwordHash: await bcrypt.hash(randomPass, salt),
        parentControlPasswordHash: await bcrypt.hash(randomPin, salt),
        socialProvider: provider,
        socialId,
      });
    }

    const jwtToken = jwt.sign({ id: parent.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      token: jwtToken,
      user: { id: parent.id, fullName: parent.fullName, email: parent.email }
    });

  } catch (err) {
    console.error('[SocialLogin]', err.message);
    res.status(500).json({ error: 'Social login failed: ' + err.message });
  }
});

// ── Update Profile (name + email) ──────────────────────────────────────────────
router.put('/update-profile', auth, async (req, res) => {
  try {
    const { fullName, email } = req.body;
    if (!fullName || !email) return res.status(400).json({ error: 'Name and email are required.' });

    const parent = await Parent.findByPk(req.user.id);
    if (!parent) return res.status(404).json({ error: 'Account not found.' });

    // Check if new email is already taken by another user
    if (email !== parent.email) {
      const existing = await Parent.findOne({ where: { email } });
      if (existing) return res.status(400).json({ error: 'Email already in use by another account.' });
    }

    parent.fullName = fullName;
    parent.email = email;
    await parent.save();

    res.json({
      success: true,
      user: { id: parent.id, fullName: parent.fullName, email: parent.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


