const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS users (
      uid TEXT PRIMARY KEY,
      email TEXT,
      display_name TEXT,
      xp INTEGER DEFAULT 0,
      level INTEGER DEFAULT 1
    );`,
    `CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      user_uid TEXT REFERENCES users(uid),
      title TEXT NOT NULL,
      xp_reward INTEGER DEFAULT 0,
      priority TEXT DEFAULT 'MEDIUM',
      status TEXT DEFAULT 'PENDING',
      progress TEXT DEFAULT '0%',
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS xp_logs (
      id SERIAL PRIMARY KEY,
      users_uid TEXT REFERENCES users(uid),
      task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
      xp_earned INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    );`,
    `CREATE TABLE IF NOT EXISTS inventory (
      id SERIAL PRIMARY KEY,
      user_uid TEXT REFERENCES users(uid),
      item_name TEXT NOT NULL,
      quantity INTEGER DEFAULT 1
    );`
  ];

  try {
    console.log('--- Initializing Database ---');
    for (const q of queries) {
      await pool.query(q);
      console.log('✅ Executed query successfully');
    }
    console.log('--- Database Initialization Complete ---');
  } catch (err) {
    console.error('❌ Database Initialization Failed:', err.message);
  } finally {
    await pool.end();
  }
}

initDB();
