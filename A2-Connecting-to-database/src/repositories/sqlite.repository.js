const RepositoryInterface = require('./repository.interface');
const { db } = require('../db/db');

// SQLite stores booleans as 0/1 integers; convert them back to real booleans for JSON.
function mapRow(row) {
  return { id: row.id, title: row.title, done: !!row.done };
}

class SqliteRepository extends RepositoryInterface {
  async getAllTasks() {
    const rows = db.prepare('SELECT * FROM tasks ORDER BY id').all();
    return rows.map(mapRow);
  }

  async getTaskById(id) {
    const row = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return row ? mapRow(row) : null;
  }

  async createTask(task) {
    const result = db
      .prepare('INSERT INTO tasks (title, done) VALUES (?, ?)')
      .run(task.title, task.done ? 1 : 0);
    return this.getTaskById(result.lastInsertRowid);
  }
}

module.exports = SqliteRepository;
