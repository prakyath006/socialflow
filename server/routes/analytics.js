import { Router } from 'express';
import { Sequelize } from 'sequelize';
import { auth } from '../middleware/auth.js';
import Analytics from '../models/Analytics.js';
import Post from '../models/Post.js';

const router = Router();
const isDbConnected = () => true;

// Dashboard overview stats
router.get('/overview', auth, async (req, res) => {
  try {
    // Demo mode
    if (!isDbConnected()) {
      return res.json({
        overview: { totalPosts: 24, publishedPosts: 18, scheduledPosts: 4, failedPosts: 2 },
        platformDistribution: [
          { _id: 'facebook', count: 18 }, { _id: 'twitter', count: 15 },
          { _id: 'linkedin', count: 12 }, { _id: 'instagram', count: 10 },
          { _id: 'youtube', count: 3 }
        ],
        dailyPosts: Array.from({ length: 14 }, (_, i) => ({
          _id: new Date(Date.now() - (13 - i) * 86400000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 5) + 1
        })),
        recentPosts: []
      });
    }

    const userId = req.userId;
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);

    const [totalPosts, publishedPosts, scheduledPosts, failedPosts, recentPosts] = await Promise.all([
      Post.count({ where: { user: userId } }),
      Post.count({ where: { user: userId, status: 'published' } }),
      Post.count({ where: { user: userId, status: 'scheduled' } }),
      Post.count({ where: { user: userId, status: 'failed' } }),
      Post.findAll({ where: { user: userId, createdAt: { [Sequelize.Op.gte]: sevenDaysAgo } }, order: [['createdAt', 'DESC']], limit: 5 })
    ]);

    const allUserPosts = await Post.findAll({ where: { user: userId }, attributes: ['platforms', 'createdAt'] });
    const distMap = {};
    const dailyMap = {};
    allUserPosts.forEach(p => {
      // platformDist
      if (p.platforms && Array.isArray(p.platforms)) {
        p.platforms.forEach(plat => {
          distMap[plat] = (distMap[plat] || 0) + 1;
        });
      }
      
      // dailyPosts
      if (p.createdAt >= thirtyDaysAgo) {
        const dateStr = p.createdAt.toISOString().split('T')[0];
        dailyMap[dateStr] = (dailyMap[dateStr] || 0) + 1;
      }
    });

    const platformDist = Object.entries(distMap).map(([k, v]) => ({ _id: k, count: v })).sort((a,b) => b.count - a.count);
    const dailyPosts = Object.entries(dailyMap).map(([k, v]) => ({ _id: k, count: v })).sort((a,b) => a._id.localeCompare(b._id));

    res.json({ overview: { totalPosts, publishedPosts, scheduledPosts, failedPosts }, platformDistribution: platformDist, dailyPosts, recentPosts });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Engagement metrics
router.get('/engagement', auth, async (req, res) => {
  try {
    if (!isDbConnected()) {
      return res.json({
        totals: { likes: 1456, comments: 271, shares: 289, views: 49900, clicks: 834 },
        byPlatform: {
          facebook: { likes: 265, comments: 57, shares: 57, views: 6200 },
          instagram: { likes: 567, comments: 89, shares: 23, views: 8900 },
          twitter: { likes: 323, comments: 57, shares: 123, views: 20600 },
          linkedin: { likes: 301, comments: 68, shares: 86, views: 13200 },
          youtube: { likes: 0, comments: 0, shares: 0, views: 1000 }
        }
      });
    }

    const posts = await Post.findAll({ where: { user: req.userId, status: 'published' } });
    const totals = { likes: 0, comments: 0, shares: 0, views: 0, clicks: 0 };
    const byPlatform = {};

    posts.forEach(post => {
      post.publishStatus.forEach(ps => {
        if (ps.engagement) {
          totals.likes += ps.engagement.likes || 0;
          totals.comments += ps.engagement.comments || 0;
          totals.shares += ps.engagement.shares || 0;
          totals.views += ps.engagement.views || 0;
          totals.clicks += ps.engagement.clicks || 0;
          if (!byPlatform[ps.platform]) byPlatform[ps.platform] = { likes: 0, comments: 0, shares: 0, views: 0 };
          byPlatform[ps.platform].likes += ps.engagement.likes || 0;
          byPlatform[ps.platform].comments += ps.engagement.comments || 0;
          byPlatform[ps.platform].shares += ps.engagement.shares || 0;
          byPlatform[ps.platform].views += ps.engagement.views || 0;
        }
      });
    });

    res.json({ totals, byPlatform });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
