const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Resolve database path
const dbPath = path.resolve(__dirname, '../../data.db');

// Ensure data directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Connect to SQLite database
const db = new Database(dbPath);

// Enable WAL mode for better performance under concurrent operations
db.pragma('journal_mode = WAL');

// Read schema and initialize tables
const schemaPath = path.resolve(__dirname, './schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');
db.exec(schema);

// Seed default schedules if they don't exist
const checkSchedules = db.prepare('SELECT COUNT(*) as count FROM schedules').get();
if (checkSchedules.count === 0) {
  const insertSchedule = db.prepare(`
    INSERT INTO schedules (name, cron_expression, active)
    VALUES (?, ?, ?)
  `);
  
  // Daily Sales Summary Report at 11:59 PM (23:59)
  insertSchedule.run('Daily Sales Report', '59 23 * * *', 1);
  // Weekly Sales Summary Report on Sundays at 11:59 PM
  insertSchedule.run('Weekly Sales Report', '59 23 * * 0', 1);
  // Hourly System Health Check / Audit - every hour at minute 0
  insertSchedule.run('Hourly Sales Pulse', '0 * * * *', 1);
  
  console.log('seeded default schedules successfully.');
}

console.log(`Connected to SQLite database at: ${dbPath}`);

module.exports = db;
