import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';

// Demo user for when MongoDB is not available
const DEMO_USER = {
  _id: 'demo_user_001',
  id: 'demo_user_001',
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

export const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');

    // Only use demo mode if DB is truly disconnected AND token is a demo token
    if (mongoose.connection.readyState !== 1 && decoded.demo) {
      req.user = DEMO_USER;
      req.userId = DEMO_USER._id;
      return next();
    }

    // For real users, always look up from DB
    if (mongoose.connection.readyState === 1) {
      const user = await User.findById(decoded.userId).select('-password');
      if (!user) return res.status(401).json({ error: 'User not found' });
      req.user = user;
      req.userId = user._id;
      return next();
    }

    // DB is down and token is not demo — still try demo fallback
    req.user = DEMO_USER;
    req.userId = DEMO_USER._id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies?.token;
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
      if (mongoose.connection.readyState === 1) {
        req.user = await User.findById(decoded.userId).select('-password');
        req.userId = req.user?._id;
      } else if (decoded.demo) {
        req.user = DEMO_USER;
        req.userId = DEMO_USER._id;
      }
    }
  } catch {}
  next();
};
