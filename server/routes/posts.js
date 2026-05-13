import { Router } from 'express';
import { Sequelize } from 'sequelize';
import Post from '../models/Post.js';
import { auth } from '../middleware/auth.js';
import publishingEngine from '../services/publishingEngine.js';
import schedulingEngine from '../services/schedulingEngine.js';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

const router = Router();
const isDbConnected = () => true;

// Demo posts for when DB is not connected
const DEMO_POSTS = [
  { _id: 'd1', content: { text: '🚀 Excited to launch our new social media publishing engine! Manage all platforms from one dashboard.', hashtags: ['SocialMedia', 'MarTech', 'ContentMarketing'], link: 'https://sanjutechnologies.com' }, platforms: ['facebook', 'twitter', 'linkedin'], status: 'published', createdAt: new Date(Date.now() - 2 * 86400000), schedule: {}, publishStatus: [{ platform: 'facebook', status: 'published', publishedAt: new Date(Date.now() - 2 * 86400000), engagement: { likes: 142, comments: 23, shares: 45, views: 2800 } }, { platform: 'twitter', status: 'published', publishedAt: new Date(Date.now() - 2 * 86400000), engagement: { likes: 89, comments: 12, shares: 34, views: 5600 } }, { platform: 'linkedin', status: 'published', publishedAt: new Date(Date.now() - 2 * 86400000), engagement: { likes: 234, comments: 56, shares: 78, views: 12000 } }] },
  { _id: 'd2', content: { text: 'Behind the scenes of our development process 🎬 Building tools that make content creators lives easier.', hashtags: ['BehindTheScenes', 'DevLife'] }, platforms: ['instagram', 'facebook'], status: 'published', createdAt: new Date(Date.now() - 86400000), schedule: {}, publishStatus: [{ platform: 'instagram', status: 'published', publishedAt: new Date(Date.now() - 86400000), engagement: { likes: 567, comments: 89, shares: 23, views: 8900 } }, { platform: 'facebook', status: 'published', engagement: { likes: 123, comments: 34, shares: 12, views: 3400 } }] },
  { _id: 'd3', content: { text: '📊 5 tips for maximizing your social media engagement this quarter. Thread 🧵', hashtags: ['SocialMediaTips', 'Marketing'] }, platforms: ['twitter'], status: 'published', createdAt: new Date(Date.now() - 3 * 86400000), schedule: {}, publishStatus: [{ platform: 'twitter', status: 'published', engagement: { likes: 234, comments: 45, shares: 89, views: 15000 } }] },
  { _id: 'd4', content: { text: 'Join us for a live Q&A session this Friday at 3 PM IST! Discussing the future of social media automation.', hashtags: ['LiveQA', 'Automation'], link: 'https://sanjutechnologies.com/live' }, platforms: ['facebook', 'linkedin', 'twitter', 'instagram'], status: 'scheduled', createdAt: new Date(), schedule: { type: 'scheduled', scheduledAt: new Date(Date.now() + 3 * 86400000), timezone: 'Asia/Kolkata' }, publishStatus: [{ platform: 'facebook', status: 'scheduled' }, { platform: 'linkedin', status: 'scheduled' }, { platform: 'twitter', status: 'scheduled' }, { platform: 'instagram', status: 'scheduled' }] },
  { _id: 'd5', content: { text: 'Weekly content roundup: Top performing posts and insights from your analytics dashboard 📈', hashtags: ['Analytics', 'ContentStrategy'] }, platforms: ['linkedin', 'facebook'], status: 'draft', createdAt: new Date(Date.now() - 4 * 3600000), schedule: {}, publishStatus: [{ platform: 'linkedin', status: 'draft' }, { platform: 'facebook', status: 'draft' }] },
  { _id: 'd6', content: { text: 'New feature alert! 🎉 Bulk scheduling is here. Upload CSV and schedule weeks of content in seconds.', hashtags: ['NewFeature', 'BulkScheduling', 'Productivity'] }, platforms: ['twitter', 'facebook', 'linkedin'], status: 'partially_published', createdAt: new Date(Date.now() - 6 * 3600000), schedule: {}, publishStatus: [{ platform: 'twitter', status: 'queued' }, { platform: 'facebook', status: 'failed', error: 'Token expired', retryCount: 1 }, { platform: 'linkedin', status: 'published', publishedAt: new Date(), engagement: { likes: 67, comments: 12, shares: 8, views: 1200 } }] }
];

// Get all posts
router.get('/', auth, async (req, res) => {
  try {
    if (!isDbConnected()) {
      const { status, platform, search } = req.query;
      let filtered = [...DEMO_POSTS];
      if (status) filtered = filtered.filter(p => p.status === status);
      if (platform) filtered = filtered.filter(p => p.platforms.includes(platform));
      if (search) filtered = filtered.filter(p => p.content.text.toLowerCase().includes(search.toLowerCase()));
      return res.json({ posts: filtered, total: filtered.length, page: 1, totalPages: 1 });
    }

    const { status, platform, page = 1, limit = 20, search, campaign } = req.query;
    const filter = { user: req.userId };
    if (status) filter.status = status;
    if (platform) filter.platforms = platform;
    if (campaign) filter.campaign = campaign;
    if (search) filter['content.text'] = { [Sequelize.Op.iLike]: `%${search}%` };

    const total = await Post.count({ where: filter });
    const posts = await Post.findAll({ 
      where: filter, 
      order: [['createdAt', 'DESC']], 
      offset: (page - 1) * limit, 
      limit: Number(limit) 
    });

    res.json({ posts, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single post
router.get('/:id', auth, async (req, res) => {
  try {
    if (!isDbConnected()) {
      const post = DEMO_POSTS.find(p => p._id === req.params.id);
      return post ? res.json({ post }) : res.status(404).json({ error: 'Post not found' });
    }
    const post = await Post.findOne({ where: { _id: req.params.id, user: req.userId } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create post
router.post('/', auth, async (req, res) => {
  try {
    const { content, platformContent, platforms, media, schedule, campaign, labels, notes } = req.body;

    if (!isDbConnected()) {
      const newPost = {
        _id: `demo_${Date.now()}`,
        user: req.userId,
        content, platformContent, platforms: platforms || [], media: media || [],
        schedule: schedule || { type: 'immediate' },
        campaign, labels, notes,
        status: 'draft',
        publishStatus: (platforms || []).map(p => ({ platform: p, status: 'draft' })),
        createdAt: new Date()
      };
      DEMO_POSTS.unshift(newPost);
      return res.status(201).json({ post: newPost });
    }

    const post = await Post.create({
      user: req.userId, content, platformContent, platforms: platforms || [],
      media: media || [], schedule: schedule || { type: 'immediate' },
      campaign, labels, notes, status: 'draft',
      publishStatus: (platforms || []).map(p => ({ platform: p, status: 'draft' }))
    });
    res.status(201).json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update post
router.put('/:id', auth, async (req, res) => {
  try {
    if (!isDbConnected()) {
      const idx = DEMO_POSTS.findIndex(p => p._id === req.params.id);
      if (idx < 0) return res.status(404).json({ error: 'Post not found' });
      Object.assign(DEMO_POSTS[idx], req.body);
      return res.json({ post: DEMO_POSTS[idx] });
    }
    const post = await Post.findOne({ where: { _id: req.params.id, user: req.userId } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (['published', 'publishing'].includes(post.status)) return res.status(400).json({ error: 'Cannot edit published posts' });
    
    // For JSONB columns in Sequelize, we need to manually assign them or use update
    const updates = { ...req.body };
    if (updates.platforms) {
      updates.publishStatus = updates.platforms.map(p => ({ platform: p, status: post.status === 'scheduled' ? 'scheduled' : 'draft' }));
    }
    await post.update(updates);
    res.json({ post });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    if (!isDbConnected()) {
      const idx = DEMO_POSTS.findIndex(p => p._id === req.params.id);
      if (idx >= 0) DEMO_POSTS.splice(idx, 1);
      return res.json({ success: true });
    }
    await Post.destroy({ where: { _id: req.params.id, user: req.userId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Validate post
router.post('/:id/validate', auth, async (req, res) => {
  try {
    const post = isDbConnected() ? await Post.findOne({ where: { _id: req.params.id, user: req.userId } }) : DEMO_POSTS.find(p => p._id === req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const validations = publishingEngine.validateForPlatforms(post);
    res.json({ validations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Publish post
router.post('/:id/publish', auth, async (req, res) => {
  try {
    if (!isDbConnected()) {
      const post = DEMO_POSTS.find(p => p._id === req.params.id);
      if (post) {
        post.status = 'published';
        post.publishStatus = post.publishStatus.map(ps => ({ ...ps, status: 'published', publishedAt: new Date() }));
      }
      return res.json({ post, results: [{ success: true, platform: 'demo' }] });
    }
    const post = await Post.findOne({ where: { _id: req.params.id, user: req.userId } });
    if (!post) return res.status(404).json({ error: 'Post not found' });
    const result = await publishingEngine.publishPost(post._id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Schedule post
router.post('/:id/schedule', auth, async (req, res) => {
  try {
    const { scheduledAt, timezone } = req.body;
    if (!scheduledAt) return res.status(400).json({ error: 'scheduledAt is required' });
    if (!isDbConnected()) {
      const post = DEMO_POSTS.find(p => p._id === req.params.id);
      if (post) {
        post.status = 'scheduled';
        post.schedule = { type: 'scheduled', scheduledAt: new Date(scheduledAt), timezone };
        post.publishStatus = post.publishStatus.map(ps => ({ ...ps, status: 'scheduled' }));
      }
      return res.json({ post });
    }
    const post = await schedulingEngine.schedulePost(req.params.id, scheduledAt, timezone || req.user.timezone);
    res.json({ post });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Retry
router.post('/:id/retry', auth, async (req, res) => {
  try {
    if (!isDbConnected()) return res.json({ message: 'Retry simulated in demo mode' });
    const result = await publishingEngine.retryFailed(req.params.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk CSV
router.post('/bulk/csv', auth, async (req, res) => {
  try {
    const { csvData } = req.body;
    if (!csvData) return res.status(400).json({ error: 'csvData required' });
    const items = [];
    const stream = Readable.from(csvData);
    await new Promise((resolve, reject) => {
      stream.pipe(csvParser()).on('data', row => items.push(row)).on('end', resolve).on('error', reject);
    });
    if (!isDbConnected()) return res.json({ bulkId: `bulk_${Date.now()}`, total: items.length, succeeded: items.length, failed: 0 });
    const result = await schedulingEngine.bulkSchedule(req.userId, items);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Suggested times
router.get('/schedule/suggestions', auth, (req, res) => {
  const suggestions = schedulingEngine.getSuggestedTimes(req.user.timezone || req.query.timezone);
  res.json({ suggestions });
});

// Calendar events
router.get('/calendar/events', auth, async (req, res) => {
  try {
    if (!isDbConnected()) return res.json({ events: DEMO_POSTS.filter(p => p.schedule?.scheduledAt) });
    const { start, end } = req.query;
    const filter = { user: req.userId };
    if (start || end) {
      filter['schedule.scheduledAt'] = {};
      if (start) filter['schedule.scheduledAt'] = { [Sequelize.Op.gte]: new Date(start) };
      if (end) filter['schedule.scheduledAt'] = { ...filter['schedule.scheduledAt'], [Sequelize.Op.lte]: new Date(end) };
    }
    const posts = await Post.findAll({ where: filter, order: [['schedule.scheduledAt', 'ASC']] });
    res.json({ events: posts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
