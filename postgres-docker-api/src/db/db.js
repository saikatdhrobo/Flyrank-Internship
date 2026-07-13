const { Pool } = require('pg');
const config = require('../config');

const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

async function query(text, params) {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
}

async function initDb() {
  const start = Date.now();
  const maxRetries = 30;
  const retryDelay = 2000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      console.log('Connected to PostgreSQL');
      await client.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id        SERIAL PRIMARY KEY,
          title     VARCHAR(255) NOT NULL,
          completed BOOLEAN      NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP   NOT NULL DEFAULT NOW()
        );
      `);
      client.release();
      console.log(`Database initialized in ${Date.now() - start}ms`);
      return;
    } catch (err) {
      console.error(`PostgreSQL connection attempt ${attempt}/${maxRetries} failed:`, err.message);
      if (attempt === maxRetries) {
        throw new Error('Could not connect to PostgreSQL after multiple retries');
      }
      await new Promise((r) => setTimeout(r, retryDelay));
    }
  }
}

module.exports = { pool, query, initDb };
