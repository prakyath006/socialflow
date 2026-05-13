import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import { User, Post, sequelize } from './models/index.js';

dotenv.config();

const seed = async () => {
  await connectDB();
  console.log('🌱 Seeding database...');

  // Clean
  await User.destroy({ where: {} });
  await Post.destroy({ where: {} });

  // Create demo user
  const password = await bcrypt.hash('demo123', 12);
  const user = await User.create({
    name: 'Praky Demo',
    email: 'demo@sanjutechnologies.com',
    password,
    timezone: 'Asia/Kolkata',
    connectedPlatforms: [
      { platform: 'facebook', accountName: 'Sanju Technologies', isActive: true, connectedAt: new Date(), accountId: 'demo_fb' },
      { platform: 'instagram', accountName: '@sanjutech', isActive: true, connectedAt: new Date(), accountId: 'demo_ig' },
      { platform: 'twitter', accountName: '@sanjutech', isActive: true, connectedAt: new Date(), accountId: 'demo_tw' },
      { platform: 'linkedin', accountName: 'Sanju Technologies', isActive: true, connectedAt: new Date(), accountId: 'demo_li' },
      { platform: 'youtube', accountName: 'Sanju Tech Channel', isActive: true, connectedAt: new Date(), accountId: 'demo_yt' }
    ]
  });

  // Create sample posts
  const posts = [
    { content: { text: '🚀 Excited to launch our new social media publishing engine! Manage all your platforms from one dashboard.', hashtags: ['SocialMedia', 'MarTech', 'ContentMarketing'], link: 'https://sanjutechnologies.com' }, platforms: ['facebook', 'twitter', 'linkedin'], status: 'published', publishStatus: [{ platform: 'facebook', status: 'published', publishedAt: new Date(Date.now() - 2 * 86400000), engagement: { likes: 142, comments: 23, shares: 45, views: 2800 } }, { platform: 'twitter', status: 'published', publishedAt: new Date(Date.now() - 2 * 86400000), engagement: { likes: 89, comments: 12, shares: 34, views: 5600 } }, { platform: 'linkedin', status: 'published', publishedAt: new Date(Date.now() - 2 * 86400000), engagement: { likes: 234, comments: 56, shares: 78, views: 12000 } }] },
    { content: { text: 'Behind the scenes of our development process 🎬 Building tools that make content creators lives easier.', hashtags: ['BehindTheScenes', 'DevLife', 'StartupLife'] }, platforms: ['instagram', 'facebook'], status: 'published', publishStatus: [{ platform: 'instagram', status: 'published', publishedAt: new Date(Date.now() - 86400000), engagement: { likes: 567, comments: 89, shares: 23, views: 8900 } }, { platform: 'facebook', status: 'published', publishedAt: new Date(Date.now() - 86400000), engagement: { likes: 123, comments: 34, shares: 12, views: 3400 } }] },
    { content: { text: '📊 5 tips for maximizing your social media engagement this quarter. Thread 🧵', hashtags: ['SocialMediaTips', 'Marketing'] }, platforms: ['twitter'], status: 'published', publishStatus: [{ platform: 'twitter', status: 'published', publishedAt: new Date(Date.now() - 3 * 86400000), engagement: { likes: 234, comments: 45, shares: 89, views: 15000 } }] },
    { content: { text: 'Join us for a live Q&A session this Friday at 3 PM IST! We will be discussing the future of social media automation.', hashtags: ['LiveQA', 'SocialMediaAutomation'], link: 'https://sanjutechnologies.com/live' }, platforms: ['facebook', 'linkedin', 'twitter', 'instagram'], status: 'scheduled', schedule: { type: 'scheduled', scheduledAt: new Date(Date.now() + 3 * 86400000), timezone: 'Asia/Kolkata' }, publishStatus: [{ platform: 'facebook', status: 'scheduled' }, { platform: 'linkedin', status: 'scheduled' }, { platform: 'twitter', status: 'scheduled' }, { platform: 'instagram', status: 'scheduled' }] },
    { content: { text: 'Weekly content roundup: Top performing posts and insights from your analytics dashboard 📈', hashtags: ['Analytics', 'ContentStrategy'] }, platforms: ['linkedin', 'facebook'], status: 'draft', publishStatus: [{ platform: 'linkedin', status: 'draft' }, { platform: 'facebook', status: 'draft' }] },
    { content: { text: 'New feature alert! 🎉 Bulk scheduling is here. Upload your CSV and schedule weeks of content in seconds.', hashtags: ['NewFeature', 'BulkScheduling', 'Productivity'] }, platforms: ['twitter', 'facebook', 'linkedin'], status: 'queued', publishStatus: [{ platform: 'twitter', status: 'queued' }, { platform: 'facebook', status: 'failed', error: 'Token expired', retryCount: 1 }, { platform: 'linkedin', status: 'published', publishedAt: new Date(), engagement: { likes: 67, comments: 12, shares: 8, views: 1200 } }] }
  ];

  for (const postData of posts) {
    await Post.create({ user: user._id, ...postData });
  }

  console.log('✅ Seeded: 1 user, 6 posts');
  console.log('   Login: demo@sanjutechnologies.com / demo123');
  process.exit(0);
};

seed().catch(e => { console.error(e); process.exit(1); });
