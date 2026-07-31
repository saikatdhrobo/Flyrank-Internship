const path = require('path');

const config = {
  port: parseInt(process.env.PORT, 10) || 3000,
  // SQLite stores everything in one file. Default location: project root.
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', '..', 'tasks.db'),
};

module.exports = config;
