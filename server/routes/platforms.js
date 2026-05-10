import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import platforms from '../config/platforms.js';
import { getSupportedPlatforms } from '../adapters/index.js';

const router = Router();

// Get all platform configs (public)
router.get('/', (req, res) => {
  res.json({ platforms: Object.values(platforms) });
});

// Get specific platform config
router.get('/:id', (req, res) => {
  const config = platforms[req.params.id];
  if (!config) return res.status(404).json({ error: 'Platform not found' });
  res.json({ platform: config });
});

// Get supported platform list
router.get('/supported/list', (req, res) => {
  res.json({ platforms: getSupportedPlatforms() });
});

export default router;
