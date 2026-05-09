import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalName: String,
  filename: String,
  mimeType: String,
  size: Number,
  type: { type: String, enum: ['image', 'video', 'gif', 'document', 'audio'] },
  
  // Paths
  originalPath: String,
  processedPath: String,
  thumbnailPath: String,

  // Dimensions
  width: Number,
  height: Number,
  duration: Number,

  // Processing status
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  processingError: String,

  // Platform-specific variants
  variants: [{
    platform: String,
    path: String,
    width: Number,
    height: Number,
    size: Number,
    format: String
  }],

  // Metadata
  alt: String,
  caption: String,
  tags: [String]
}, { timestamps: true });

export default mongoose.model('Media', mediaSchema);
