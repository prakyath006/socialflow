import { DataTypes } from 'sequelize';
import { sequelize } from '../config/db.js';

const Media = sequelize.define('Media', {
  _id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user: { type: DataTypes.UUID, allowNull: false },
  originalName: DataTypes.STRING,
  filename: DataTypes.STRING,
  mimeType: DataTypes.STRING,
  size: DataTypes.INTEGER,
  type: { type: DataTypes.ENUM('image', 'video', 'gif', 'document', 'audio') },
  originalPath: DataTypes.STRING,
  processedPath: DataTypes.STRING,
  thumbnailPath: DataTypes.STRING,
  width: DataTypes.INTEGER,
  height: DataTypes.INTEGER,
  duration: DataTypes.INTEGER,
  processingStatus: { type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'), defaultValue: 'pending' },
  processingError: DataTypes.STRING,
  variants: { type: DataTypes.JSONB, defaultValue: [] },
  alt: DataTypes.STRING,
  caption: DataTypes.STRING,
  tags: { type: DataTypes.JSONB, defaultValue: [] }
}, { timestamps: true });

export default Media;
