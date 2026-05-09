import mongoose from 'mongoose';

const postSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Content
  content: {
    text: { type: String, default: '' },
    hashtags: [String],
    mentions: [String],
    link: String,
    callToAction: String
  },

  // Platform-specific content overrides
  platformContent: [{
    platform: { type: String, required: true },
    text: String,
    hashtags: [String],
    mentions: [String],
    link: String,
    // YouTube-specific
    title: String,
    description: String,
    tags: [String],
    category: String,
    privacy: { type: String, enum: ['public', 'private', 'unlisted'] },
    // Pinterest-specific
    boardId: String,
    altText: String
  }],

  // Media attachments
  media: [{
    type: { type: String, enum: ['image', 'video', 'gif', 'document', 'audio'] },
    originalUrl: String,
    processedUrl: String,
    thumbnailUrl: String,
    filename: String,
    mimeType: String,
    size: Number,
    width: Number,
    height: Number,
    duration: Number, // seconds for video
    platformVariants: [{
      platform: String,
      url: String,
      width: Number,
      height: Number
    }]
  }],

  // Target platforms
  platforms: [{ 
    type: String, 
    enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'pinterest', 'telegram', 'whatsapp'] 
  }],

  // Scheduling
  schedule: {
    type: { type: String, enum: ['immediate', 'scheduled', 'queued', 'recurring'], default: 'immediate' },
    scheduledAt: Date,
    timezone: { type: String, default: 'UTC' },
    recurringPattern: String, // cron expression
    recurringEnd: Date
  },

  // Status tracking per platform
  publishStatus: [{
    platform: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['draft', 'queued', 'scheduled', 'publishing', 'published', 'failed', 'cancelled'], 
      default: 'draft' 
    },
    publishedAt: Date,
    externalId: String, // ID on the platform
    externalUrl: String, // URL on the platform
    error: String,
    retryCount: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    lastRetryAt: Date,
    engagement: {
      likes: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      views: { type: Number, default: 0 },
      clicks: { type: Number, default: 0 },
      lastUpdated: Date
    }
  }],

  // Overall status
  status: { 
    type: String, 
    enum: ['draft', 'queued', 'scheduled', 'publishing', 'published', 'partially_published', 'failed', 'cancelled'],
    default: 'draft'
  },

  // Metadata
  campaign: String,
  labels: [String],
  notes: String,
  bulkImportId: String, // For CSV bulk imports

}, { timestamps: true });

// Indexes for efficient querying
postSchema.index({ user: 1, status: 1 });
postSchema.index({ 'schedule.scheduledAt': 1, status: 1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ campaign: 1 });

export default mongoose.model('Post', postSchema);
