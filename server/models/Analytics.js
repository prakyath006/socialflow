import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Analytics = sequelize.define('Analytics', {
  _id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user: { type: DataTypes.UUID, allowNull: false },
  post: DataTypes.UUID,
  platform: DataTypes.STRING,
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  metrics: { 
    type: DataTypes.JSONB, 
    defaultValue: {
      impressions: 0, reach: 0, engagement: 0, likes: 0, comments: 0, shares: 0, saves: 0, clicks: 0, views: 0, followers: 0
    }
  }
}, { 
  timestamps: true,
  indexes: [{ fields: ['user', 'platform', 'date'] }]
});

export default Analytics;
