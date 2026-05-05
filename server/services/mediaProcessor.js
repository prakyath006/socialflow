import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { v4 as uuid } from 'uuid';
import platforms from '../config/platforms.js';
import { Storage } from '@google-cloud/storage';

const storage = new Storage({ projectId: 'feisty-ranger-435205-m6' });
const bucketName = 'socialflow-media-feisty-ranger';
const bucket = storage.bucket(bucketName);

// Helper function to upload local file to GCS
async function uploadToGCS(localFilePath, destinationPath) {
  await bucket.upload(localFilePath, {
    destination: destinationPath,
    public: true,
    metadata: {
      cacheControl: 'public, max-age=31536000',
    },
  });
  return `https://storage.googleapis.com/${bucketName}/${destinationPath}`;
}

/**
 * Media Processing Pipeline
 * - Auto image resizing per platform specs
 * - Thumbnail generation
 * - Compression optimization
 * - Platform-specific variant generation
 */
class MediaProcessor {
  constructor() {
    this.uploadDir = path.resolve('uploads');
    this.thumbDir = path.resolve('thumbnails');
    this.ensureDirs();
  }

  async ensureDirs() {
    await fs.mkdir(this.uploadDir, { recursive: true });
    await fs.mkdir(this.thumbDir, { recursive: true });
    // Create platform subdirectories
    for (const p of Object.keys(platforms)) {
      await fs.mkdir(path.join(this.uploadDir, p), { recursive: true });
    }
  }

  async uploadOriginal(filePath, originalName) {
    const ext = path.extname(originalName);
    const id = uuid();
    const destName = `originals/${id}${ext}`;
    const url = await uploadToGCS(filePath, destName);
    return url;
  }

  /**
   * Process an uploaded image — resize and create platform variants
   */
  async processImage(filePath, targetPlatforms = []) {
    const id = uuid();
    const metadata = await sharp(filePath).metadata();
    const results = { original: { path: filePath, width: metadata.width, height: metadata.height, format: metadata.format }, variants: [], thumbnail: null };

    // Generate thumbnail
    const thumbName = `${id}_thumb.webp`;
    const thumbPath = path.join(this.thumbDir, thumbName);
    await sharp(filePath).resize(300, 300, { fit: 'cover' }).webp({ quality: 80 }).toFile(thumbPath);
    const thumbGCS = await uploadToGCS(thumbPath, `thumbnails/${thumbName}`);
    await fs.unlink(thumbPath);
    results.thumbnail = { path: thumbGCS, width: 300, height: 300 };

    // Generate platform-specific variants
    for (const platformId of targetPlatforms) {
      const config = platforms[platformId];
      if (!config?.imageSpecs?.recommended) continue;

      const { width, height } = config.imageSpecs.recommended;
      const variantName = `${id}_${platformId}.jpg`;
      const variantPath = path.join(this.uploadDir, platformId, variantName);

      await sharp(filePath)
        .resize(width, height, { fit: 'cover', position: 'center' })
        .jpeg({ quality: 85, progressive: true })
        .toFile(variantPath);

      const variantGCS = await uploadToGCS(variantPath, `platforms/${platformId}/${variantName}`);
      await fs.unlink(variantPath);
      results.variants.push({ platform: platformId, path: variantGCS, width, height, format: 'jpeg' });
    }

    return results;
  }

  /**
   * Compress an image while maintaining quality
   */
  async compressImage(filePath, maxSizeBytes = 5 * 1024 * 1024) {
    const stat = await fs.stat(filePath);
    if (stat.size <= maxSizeBytes) return filePath;

    let quality = 85;
    const ext = path.extname(filePath).toLowerCase();
    const outPath = filePath.replace(ext, `_compressed${ext}`);

    while (quality > 20) {
      const pipeline = sharp(filePath);
      if (['.jpg', '.jpeg'].includes(ext)) {
        await pipeline.jpeg({ quality, progressive: true }).toFile(outPath);
      } else if (ext === '.png') {
        await pipeline.png({ quality, compressionLevel: 9 }).toFile(outPath);
      } else {
        await pipeline.webp({ quality }).toFile(outPath);
      }

      const newStat = await fs.stat(outPath);
      if (newStat.size <= maxSizeBytes) return outPath;
      quality -= 10;
    }

    return outPath;
  }

  /**
   * Generate video thumbnail (uses Sharp for first frame or placeholder)
   * For full FFmpeg integration, use processVideo()
   */
  async generateVideoThumbnail(videoPath) {
    const id = uuid();
    const thumbName = `${id}_video_thumb.jpg`;
    const thumbPath = path.join(this.thumbDir, thumbName);

    // Placeholder thumbnail — in production, FFmpeg extracts actual frames
    await sharp({ create: { width: 1280, height: 720, channels: 3, background: { r: 30, g: 30, b: 40 } } })
      .composite([{
        input: Buffer.from(`<svg width="1280" height="720"><rect width="1280" height="720" fill="#1e1e28"/><polygon points="580,280 580,440 720,360" fill="white" opacity="0.8"/><text x="640" y="520" text-anchor="middle" fill="white" font-size="32" font-family="Arial">Video Preview</text></svg>`),
        top: 0, left: 0
      }])
      .jpeg({ quality: 85 })
      .toFile(thumbPath);

    const thumbGCS = await uploadToGCS(thumbPath, `thumbnails/${thumbName}`);
    await fs.unlink(thumbPath);
    return { path: thumbGCS, width: 1280, height: 720 };
  }

  /**
   * Validate media against platform specs
   */
  validateMedia(file, platformId, mediaType = 'image') {
    const config = platforms[platformId];
    if (!config) return { valid: false, errors: ['Unknown platform'] };

    const errors = [];
    const specs = mediaType === 'video' ? config.videoSpecs : config.imageSpecs;

    if (!specs) {
      errors.push(`${config.name} does not support ${mediaType} uploads`);
      return { valid: false, errors };
    }

    if (file.size > specs.maxSize) {
      errors.push(`File too large. Max: ${(specs.maxSize / 1024 / 1024).toFixed(0)}MB, Got: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
    }

    const ext = path.extname(file.originalname || file.filename || '').replace('.', '').toLowerCase();
    if (specs.formats && !specs.formats.includes(ext)) {
      errors.push(`Unsupported format: .${ext}. Supported: ${specs.formats.join(', ')}`);
    }

    return { valid: errors.length === 0, errors };
  }
}

export default new MediaProcessor();
