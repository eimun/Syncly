const { Pool } = require('pg');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL || 'NOT_FOUND';
console.log(`[DB] Attempting connection with: ${dbUrl.replace(/:.*@/, ':****@')}`);

const pool = new Pool({
  connectionString: dbUrl,
});

module.exports = pool;