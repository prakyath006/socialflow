import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '' },
  timezone: { type: String, default: 'UTC' },
  role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'admin' },
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  connectedPlatforms: [{
    platform: { type: String, enum: ['facebook', 'instagram', 'twitter', 'linkedin', 'youtube', 'pinterest', 'telegram', 'whatsapp'] },
    accountId: String,
    accountName: String,
    accessToken: String,
    refreshToken: String,
    tokenExpiry: Date,
    pageId: String, // Facebook page ID
    pageName: String,
    profileUrl: String,
    isActive: { type: Boolean, default: true },
    connectedAt: { type: Date, default: Date.now },
    lastRefreshed: Date,
    scopes: [String],
    metadata: mongoose.Schema.Types.Mixed
  }],
  settings: {
    defaultPlatforms: [String],
    autoSchedule: { type: Boolean, default: false },
    bestTimePosting: { type: Boolean, default: true },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      onFailure: { type: Boolean, default: true }
    }
  }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
