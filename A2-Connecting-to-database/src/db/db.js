const Database = require('better-sqlite3');
const config = require('../config');

// Opening the file path creates the database automatically if it is missing.
const db = new Database(config.dbPath);

const SEED_TASKS = [
  { title: 'Buy milk', done: false },
  { title: 'Walk the dog', done: false },
  { title: 'Finish the SQLite assignment', done: true },
];

function createTable() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id    INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT    NOT NULL,
      done  BOOLEAN NOT NULL DEFAULT 0
    );
  `);
}

// Insert the example tasks only on the very first run (when the table is empty).
function seedExampleTasks() {
  const { count } = db.prepare('SELECT COUNT(*) AS count FROM tasks').get();
  if (count > 0) return;

  const insert = db.prepare('INSERT INTO tasks (title, done) VALUES (?, ?)');
  const seedAll = db.transaction((tasks) => {
    for (const task of tasks) {
      insert.run(task.title, task.done ? 1 : 0);
    }
  });

  seedAll(SEED_TASKS);
  console.log(`Seeded ${SEED_TASKS.length} example tasks into the database`);
}

function initDb() {
  createTable();
  seedExampleTasks();
}

module.exports = { db, initDb };
