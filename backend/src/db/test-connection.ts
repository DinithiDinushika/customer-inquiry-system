import { testConnection, pool } from '../config/db.js';

const run = async () => {
  console.log('Testing PostgreSQL connection...');
  const success = await testConnection();
  if (success) {
    console.log('PostgreSQL connection test passed successfully!');
  } else {
    console.error('PostgreSQL connection test failed. Please check your credentials in .env');
  }
  await pool.end();
  process.exit(success ? 0 : 1);
};

run();
