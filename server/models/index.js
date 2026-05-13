import User from './User.js';
import Post from './Post.js';
import Media from './Media.js';
import Analytics from './Analytics.js';
import { sequelize } from '../config/db.js';

User.hasMany(Post, { foreignKey: 'user' });
Post.belongsTo(User, { foreignKey: 'user' });

User.hasMany(Media, { foreignKey: 'user' });
Media.belongsTo(User, { foreignKey: 'user' });

User.hasMany(Analytics, { foreignKey: 'user' });
Analytics.belongsTo(User, { foreignKey: 'user' });

export { User, Post, Media, Analytics, sequelize };
