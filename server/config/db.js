import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/socialflow', {
  dialect: 'postgres',
  logging: false,
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    // Sync models to database (creates tables if they don't exist)
    await sequelize.sync({ alter: true });
    console.log(`✅ PostgreSQL connected successfully`);
    return sequelize;
  } catch (error) {
    console.error(`❌ PostgreSQL connection error: ${error.message}`);
    console.warn('⚠️  Running in demo mode without DB');
    return null;
  }
};

export { sequelize, connectDB };
export default connectDB;
