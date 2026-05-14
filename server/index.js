import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import './models/index.js'; // Ensure models are registered
import authRoutes from './routes/auth.js';
import postRoutes from './routes/posts.js';
import mediaRoutes from './routes/media.js';
import platformRoutes from './routes/platforms.js';
import analyticsRoutes from './routes/analytics.js';
import schedulingEngine from './services/schedulingEngine.js';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
app.set('trust proxy', 1);

// Security & parsing
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: ['http://localhost:3001', 'http://localhost:3000'], credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Rate limiting
app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Static files
app.use('/uploads', express.static(path.resolve('uploads')));
app.use('/thumbnails', express.static(path.resolve('thumbnails')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/platforms', platformRoutes);
app.use('/api/analytics', analyticsRoutes);

// Privacy Policy & Terms (required by social platform OAuth)
app.get('/privacy', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Privacy Policy — SocialFlow</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f0;color:#1a1a2e;line-height:1.7;padding:40px 20px}
.container{max-width:720px;margin:0 auto;background:#fff;border-radius:16px;padding:48px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
h1{font-size:28px;margin-bottom:8px}h2{font-size:18px;margin:28px 0 8px;color:#333}p{margin-bottom:12px;color:#555}
.badge{display:inline-block;background:#e8f5e9;color:#2e7d32;padding:4px 12px;border-radius:99px;font-size:13px;margin-bottom:24px}
a{color:#4f46e5}</style></head><body><div class="container">
<h1>Privacy Policy</h1><span class="badge">Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
<p>SocialFlow ("we", "our", "us") operates the SocialFlow social media management platform. This page informs you of our policies regarding the collection, use, and disclosure of personal data.</p>
<h2>1. Information We Collect</h2><p>When you create an account, we collect your name, email address, and timezone. When you connect social media accounts, we store OAuth access tokens required to publish content on your behalf.</p>
<h2>2. How We Use Your Information</h2><p>We use your data solely to provide the SocialFlow service: scheduling, publishing, and analyzing social media posts across your connected platforms. We do not sell your data to third parties.</p>
<h2>3. Data Storage</h2><p>Your data is stored securely using MongoDB Atlas (encrypted at rest) and Google Cloud Platform infrastructure. Media files are stored in Google Cloud Storage.</p>
<h2>4. Third-Party Access</h2><p>We connect to social media platforms (Facebook, Instagram, Twitter/X, LinkedIn, YouTube, Pinterest, Telegram, WhatsApp) using their official APIs. We only request permissions necessary to publish and retrieve analytics on your behalf.</p>
<h2>5. Data Retention</h2><p>You can delete your account and all associated data at any time through the Settings page. Upon deletion, all your posts, media, and connected platform tokens are permanently removed.</p>
<h2>6. Cookies</h2><p>We use a single authentication cookie/token to keep you logged in. We do not use tracking cookies or third-party analytics.</p>
<h2>7. Contact</h2><p>For questions about this policy, contact us at <a href="mailto:demo@sanjutechnologies.com">demo@sanjutechnologies.com</a>.</p>
</div></body></html>`);
});

app.get('/terms', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Terms of Service — SocialFlow</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f0;color:#1a1a2e;line-height:1.7;padding:40px 20px}
.container{max-width:720px;margin:0 auto;background:#fff;border-radius:16px;padding:48px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
h1{font-size:28px;margin-bottom:8px}h2{font-size:18px;margin:28px 0 8px;color:#333}p{margin-bottom:12px;color:#555}
.badge{display:inline-block;background:#e8f5e9;color:#2e7d32;padding:4px 12px;border-radius:99px;font-size:13px;margin-bottom:24px}
a{color:#4f46e5}</style></head><body><div class="container">
<h1>Terms of Service</h1><span class="badge">Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
<p>By using SocialFlow, you agree to the following terms.</p>
<h2>1. Service Description</h2><p>SocialFlow is a social media management tool that allows you to compose, schedule, and publish content across multiple social media platforms from a single dashboard.</p>
<h2>2. Account Responsibilities</h2><p>You are responsible for maintaining the security of your account credentials and for all activity that occurs under your account. You must provide accurate information when creating your account.</p>
<h2>3. Acceptable Use</h2><p>You agree not to use SocialFlow to publish content that violates any applicable laws or the terms of service of the connected social media platforms. You are solely responsible for the content you publish.</p>
<h2>4. Platform Connections</h2><p>By connecting your social media accounts, you authorize SocialFlow to post content and retrieve analytics data on your behalf. You can revoke this access at any time by disconnecting the platform.</p>
<h2>5. Service Availability</h2><p>We strive for high availability but do not guarantee uninterrupted service. Scheduled posts may be delayed in rare circumstances due to platform API limitations or service maintenance.</p>
<h2>6. Limitation of Liability</h2><p>SocialFlow is provided "as is". We are not liable for any damages resulting from the use of our service, including but not limited to failed post deliveries or social media account issues.</p>
<h2>7. Contact</h2><p>For questions, contact us at <a href="mailto:demo@sanjutechnologies.com">demo@sanjutechnologies.com</a>.</p>
</div></body></html>`);
});

app.get('/data-deletion', (req, res) => {
  res.send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Data Deletion — SocialFlow</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f0;color:#1a1a2e;line-height:1.7;padding:40px 20px}
.container{max-width:720px;margin:0 auto;background:#fff;border-radius:16px;padding:48px;box-shadow:0 2px 12px rgba(0,0,0,.06)}
h1{font-size:28px;margin-bottom:8px}h2{font-size:18px;margin:28px 0 8px;color:#333}p,li{margin-bottom:12px;color:#555}
ul{padding-left:20px;margin-bottom:16px}
.badge{display:inline-block;background:#e8f5e9;color:#2e7d32;padding:4px 12px;border-radius:99px;font-size:13px;margin-bottom:24px}
a{color:#4f46e5}.note{background:#f0f4ff;border-radius:12px;padding:16px 20px;margin:20px 0;border-left:3px solid #4f46e5}</style></head><body><div class="container">
<h1>Data Deletion Instructions</h1><span class="badge">Last updated: ${new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
<p>SocialFlow allows you to delete your data at any time. Here's how:</p>
<h2>Option 1 — Delete from within the app</h2>
<ul><li>Log in to your SocialFlow account</li><li>Go to <strong>Settings</strong></li><li>Scroll to the bottom and click <strong>"Delete my account"</strong></li><li>Confirm the deletion — all your data will be permanently removed within 24 hours</li></ul>
<h2>Option 2 — Request deletion via email</h2>
<p>Send an email to <a href="mailto:demo@sanjutechnologies.com">demo@sanjutechnologies.com</a> with the subject line <strong>"Delete My Data"</strong> and include the email address associated with your account. We will process your request within 48 hours.</p>
<h2>What gets deleted</h2>
<ul><li>Your account profile (name, email, password)</li><li>All posts, drafts, and scheduled content</li><li>All uploaded media files</li><li>Connected platform OAuth tokens</li><li>Analytics and engagement data</li><li>All settings and preferences</li></ul>
<div class="note"><strong>Note:</strong> Content that was already published to external social media platforms (Facebook, Instagram, Twitter, etc.) will remain on those platforms. You will need to delete published content directly from each platform.</div>
<h2>Contact</h2><p>If you have questions about data deletion, contact us at <a href="mailto:demo@sanjutechnologies.com">demo@sanjutechnologies.com</a>.</p>
</div></body></html>`);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Serverless Cron Trigger (for Google Cloud Scheduler)
app.get('/api/cron/process', async (req, res) => {
  try {
    await schedulingEngine.processDuePosts();
    res.json({ status: 'success', message: 'Processed due posts' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, '../dist')));
  app.get('*', (req, res) => res.sendFile(path.resolve(__dirname, '../dist/index.html')));
}

// Start
const start = async () => {
  await connectDB();
  schedulingEngine.start();
  app.listen(PORT, () => {
    console.log(`\n🚀 Social Publishing Engine running on http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api`);
    console.log(`🎨 Dashboard: http://localhost:3001\n`);
  });
};

start();
