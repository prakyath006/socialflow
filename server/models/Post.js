import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Post = sequelize.define('Post', {
  _id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user: { type: DataTypes.UUID, allowNull: false },
  content: { type: DataTypes.JSONB, defaultValue: {} },
  platformContent: { type: DataTypes.JSONB, defaultValue: [] },
  media: { type: DataTypes.JSONB, defaultValue: [] },
  platforms: { type: DataTypes.JSONB, defaultValue: [] },
  schedule: { type: DataTypes.JSONB, defaultValue: { type: 'immediate', timezone: 'UTC' } },
  publishStatus: { type: DataTypes.JSONB, defaultValue: [] },
  status: { 
    type: DataTypes.ENUM('draft', 'queued', 'scheduled', 'publishing', 'published', 'partially_published', 'failed', 'cancelled'),
    defaultValue: 'draft'
  },
  campaign: DataTypes.STRING,
  labels: { type: DataTypes.JSONB, defaultValue: [] },
  notes: DataTypes.STRING,
  bulkImportId: DataTypes.STRING
}, { 
  timestamps: true,
  indexes: [
    { fields: ['user', 'status'] },
    { fields: ['status'] },
    { fields: ['campaign'] }
  ]
});

export default Post;
