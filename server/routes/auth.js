import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import crypto from 'crypto';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { getAdapter } from '../adapters/index.js';
import tokenManager from '../services/tokenManager.js';
import emailService from '../services/emailService.js';

const router = Router();

// Demo user fallback when MongoDB is not available
const DEMO_USER = {
  id: 'demo_user_001',
  _id: 'demo_user_001',
  name: 'Praky Demo',
  email: 'demo@sanjutechnologies.com',
  timezone: 'Asia/Kolkata',
  avatar: '',
  connectedPlatforms: [
    { platform: 'facebook', accountName: 'Sanju Technologies', isActive: true, connectedAt: new Date() },
    { platform: 'instagram', accountName: '@sanjutech', isActive: true, connectedAt: new Date() },
    { platform: 'twitter', accountName: '@sanjutech', isActive: true, connectedAt: new Date() },
    { platform: 'linkedin', accountName: 'Sanju Technologies', isActive: true, connectedAt: new Date() },
    { platform: 'youtube', accountName: 'Sanju Tech Channel', isActive: true, connectedAt: new Date() }
  ],
  settings: { defaultPlatforms: ['facebook', 'twitter'], autoSchedule: false, bestTimePosting: true }
};

const isDbConnected = () => mongoose.connection.readyState === 1;

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, timezone } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });

    // Demo mode — skip DB
    if (!isDbConnected()) {
      const token = jwt.sign({ userId: 'demo_user_001', demo: true }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      return res.status(201).json({ token, user: { ...DEMO_USER, name, email, timezone: timezone || 'UTC' } });
    }

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed, timezone: timezone || 'UTC' });
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });

    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, timezone: user.timezone, connectedPlatforms: [] } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Demo mode
    if (!isDbConnected()) {
      const token = jwt.sign({ userId: 'demo_user_001', demo: true }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
      return res.json({ token, user: DEMO_USER });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, timezone: user.timezone, connectedPlatforms: user.connectedPlatforms.map(p => ({ platform: p.platform, accountName: p.accountName, isActive: p.isActive })) } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user
router.get('/me', auth, (req, res) => {
  const user = req.user;
  res.json({ user: { id: user._id || user.id, name: user.name, email: user.email, timezone: user.timezone, avatar: user.avatar, connectedPlatforms: (user.connectedPlatforms || []).map(p => ({ platform: p.platform, accountName: p.accountName, isActive: p.isActive, tokenExpiry: p.tokenExpiry, connectedAt: p.connectedAt })), settings: user.settings } });
});

// Update current user profile
router.put('/me', auth, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({ user: { ...DEMO_USER, ...req.body } });
    }
    const allowedFields = ['name', 'email', 'timezone', 'avatar', 'settings'];
    const updates = {};
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    }
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, name: user.name, email: user.email, timezone: user.timezone, avatar: user.avatar, connectedPlatforms: user.connectedPlatforms.map(p => ({ platform: p.platform, accountName: p.accountName, isActive: p.isActive })), settings: user.settings } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get OAuth URL for a platform — embeds JWT in state param so callback can identify user
router.get('/connect/:platform', auth, (req, res) => {
  try {
    const adapter = getAdapter(req.params.platform);
    const baseUrl = adapter.getAuthUrl();
    if (!baseUrl) return res.status(400).json({ error: `${req.params.platform} does not use OAuth. Configure via API tokens.` });

    // Append state param with the user's JWT so the callback can identify them
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    const separator = baseUrl.includes('?') ? '&' : '?';
    const url = `${baseUrl}${separator}state=${encodeURIComponent(token)}`;

    res.json({ url });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// OAuth callback — PUBLIC route (no auth middleware!)
// Meta/Google/Twitter redirect here with ?code=...&state=JWT
router.get('/:platform/callback', async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Missing authorization code');

    // 1. Identify the user from the state (JWT token)
    let userId = null;
    if (state) {
      try {
        const decoded = jwt.verify(state, process.env.JWT_SECRET || 'dev-secret');
        userId = decoded.userId;
      } catch (e) {
        console.error('Invalid state token:', e.message);
      }
    }

    // 2. Exchange code for access token via the platform adapter
    let platform = req.params.platform;
    if (platform === 'google') platform = 'youtube'; // Map google callback to youtube adapter
    
    const adapter = getAdapter(platform);
    const tokenData = await adapter.handleCallback(code);

    // 3. Save tokens to the user's connectedPlatforms in MongoDB
    if (userId && isDbConnected()) {
      // For Facebook, save the first page as the connected account
      const connectData = {
        accessToken: tokenData.accessToken,
        refreshToken: tokenData.refreshToken,
        expiresIn: tokenData.expiresIn,
        accountId: tokenData.pages?.[0]?.id || tokenData.accountId,
        accountName: tokenData.pages?.[0]?.name || tokenData.accountName || platform,
        pageId: tokenData.pages?.[0]?.id || tokenData.pageId,
        pageName: tokenData.pages?.[0]?.name || tokenData.pageName,
        scopes: tokenData.scopes,
        metadata: { pages: tokenData.pages }
      };

      // If a page has its own access token (Facebook pages), use that
      if (tokenData.pages?.[0]?.access_token) {
        connectData.accessToken = tokenData.pages[0].access_token;
      }

      await tokenManager.connectPlatform(userId, platform, connectData);
      console.log(`✅ ${platform} connected for user ${userId}`);
    }

    // 4. Redirect to frontend with success
    const appUrl = process.env.NODE_ENV === 'production'
      ? `${req.protocol}://${req.get('host')}`
      : 'http://localhost:3001';

    res.redirect(`${appUrl}/platforms?connected=${platform}`);
  } catch (error) {
    console.error(`❌ OAuth callback error for ${req.params.platform}:`, error.message);

    const appUrl = process.env.NODE_ENV === 'production'
      ? `${req.protocol}://${req.get('host')}`
      : 'http://localhost:3001';

    res.redirect(`${appUrl}/platforms?error=${encodeURIComponent(error.message)}`);
  }
});

// Disconnect platform
router.post('/disconnect/:platform', auth, async (req, res) => {
  try {
    if (isDbConnected()) {
      await tokenManager.disconnectPlatform(req.userId, req.params.platform);
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get token status
router.get('/tokens', auth, async (req, res) => {
  if (!isDbConnected()) {
    return res.json({ tokens: DEMO_USER.connectedPlatforms.map(p => ({ ...p, status: 'active', hoursUntilExpiry: '720.0' })) });
  }
  const status = await tokenManager.getTokenStatus(req.userId);
  res.json({ tokens: status });
});

// Forgot password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) {
      // Return success anyway to prevent email enumeration
      return res.json({ success: true, message: 'If that email exists, a reset link was sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const appUrl = process.env.NODE_ENV === 'production'
      ? `${req.protocol}://${req.get('host')}`
      : 'http://localhost:3001';

    await emailService.sendPasswordResetEmail(user.email, resetToken, appUrl);

    res.json({ success: true, message: 'Password reset link sent to email' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'An error occurred while sending the reset email' });
  }
});

// Verify reset token (check if valid before showing the form)
router.get('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({ valid: false, error: 'This reset link has expired or already been used.' });
    }
    res.json({ valid: true });
  } catch (error) {
    res.status(500).json({ valid: false, error: 'An error occurred' });
  }
});

// Reset password
router.post('/reset-password/:token', async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ error: 'This reset link has expired or already been used.' });
    }

    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'An error occurred while resetting the password' });
  }
});

export default router;
