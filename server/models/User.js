import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const User = sequelize.define('User', {
  _id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  avatar: { type: DataTypes.STRING, defaultValue: '' },
  timezone: { type: DataTypes.STRING, defaultValue: 'UTC' },
  role: { type: DataTypes.ENUM('admin', 'editor', 'viewer'), defaultValue: 'admin' },
  resetPasswordToken: DataTypes.STRING,
  resetPasswordExpires: DataTypes.DATE,
  connectedPlatforms: { type: DataTypes.JSONB, defaultValue: [] },
  settings: { 
    type: DataTypes.JSONB, 
    defaultValue: {
      defaultPlatforms: [], autoSchedule: false, bestTimePosting: true,
      notifications: { email: true, push: true, onFailure: true }
    }
  }
}, { timestamps: true });

export default User;
