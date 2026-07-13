require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT, 10) || 5432,
    database: process.env.DB_NAME || 'tasksdb',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  },
  databaseUrl: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/tasksdb',
};

module.exports = config;
