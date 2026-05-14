import { Sequelize } from 'sequelize';

const DB_URL = "postgresql://postgres.bijahcvxmdjxcotxerlr:Prakyath%4042k6@aws-1-us-west-2.pooler.supabase.com:5432/postgres";

const sequelize = new Sequelize(DB_URL, { dialect: 'postgres', logging: false });

async function main() {
  try {
    await sequelize.authenticate();
    console.log('Connected to Supabase');

    // Get all users
    const [users] = await sequelize.query('SELECT "_id", "name", "email", "connectedPlatforms" FROM "Users"');
    console.log(`\nFound ${users.length} user(s):\n`);

    for (const user of users) {
      console.log(`User: ${user.name} (${user.email})`);
      console.log(`ID: ${user._id}`);
      const platforms = user.connectedPlatforms;
      console.log(`connectedPlatforms type: ${typeof platforms}`);
      console.log(`connectedPlatforms value:`, JSON.stringify(platforms, null, 2));
      console.log('---');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await sequelize.close();
  }
}

main();
