import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import mediaProcessor from '../services/mediaProcessor.js';
import Media from '../models/Media.js';
import path from 'path';

const router = Router();

// Upload media
router.post('/upload', auth, upload.array('files', 10), async (req, res) => {
  try {
    const { platforms } = req.body;
    const targetPlatforms = platforms ? platforms.split(',').map(p => p.trim()) : [];
    const results = [];

    for (const file of req.files) {
      const isVideo = file.mimetype.startsWith('video/');
      const isImage = file.mimetype.startsWith('image/');

      let processed = { original: { path: '', width: 0, height: 0 }, variants: [], thumbnail: null };

      // Upload original file to GCS
      const gcsOriginalUrl = await mediaProcessor.uploadOriginal(file.path, file.originalname);
      processed.original.path = gcsOriginalUrl;

      if (isImage) {
        const imageProcessed = await mediaProcessor.processImage(file.path, targetPlatforms);
        processed.thumbnail = imageProcessed.thumbnail;
        processed.variants = imageProcessed.variants;
        processed.original.width = imageProcessed.original.width;
        processed.original.height = imageProcessed.original.height;
      } else if (isVideo) {
        processed.thumbnail = await mediaProcessor.generateVideoThumbnail(file.path);
      }
      
      // Clean up local file since it's now in GCS
      import('fs').then(fs => {
        fs.unlinkSync(file.path);
      });

      const media = await Media.create({
        user: req.userId,
        originalName: file.originalname,
        filename: file.filename,
        mimeType: file.mimetype,
        size: file.size,
        type: isVideo ? 'video' : isImage ? 'image' : 'document',
        originalPath: file.path,
        processedPath: processed.original?.path,
        thumbnailPath: processed.thumbnail?.path,
        width: processed.original?.width,
        height: processed.original?.height,
        processingStatus: 'completed',
        variants: processed.variants?.map(v => ({
          platform: v.platform, path: v.path, width: v.width, height: v.height, format: v.format
        })) || []
      });

      results.push(media);
    }

    res.status(201).json({ media: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user's media library
router.get('/', auth, async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = { user: req.userId };
    if (type) filter.type = type;

    const total = await Media.countDocuments(filter);
    const media = await Media.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit));

    res.json({ media, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete media
router.delete('/:id', auth, async (req, res) => {
  try {
    await Media.findOneAndDelete({ _id: req.params.id, user: req.userId });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Serve uploaded files
router.get('/file/:filename', (req, res) => {
  const filePath = path.resolve('uploads', req.params.filename);
  res.sendFile(filePath);
});

router.get('/thumb/:filename', (req, res) => {
  const filePath = path.resolve('thumbnails', req.params.filename);
  res.sendFile(filePath);
});

export default router;
