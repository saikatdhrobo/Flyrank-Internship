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

  async updateTask(id, updates) {
    const existing = await this.getTaskById(id);
    if (!existing) return null;

    const title = updates.title !== undefined ? updates.title : existing.title;
    const done = updates.done !== undefined ? (updates.done ? 1 : 0) : existing.done;

    db.prepare('UPDATE tasks SET title = ?, done = ? WHERE id = ?').run(title, done, id);
    return this.getTaskById(id);
  }

  async deleteTask(id) {
    const existing = await this.getTaskById(id);
    if (!existing) return null;

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    return existing;
  }
}

module.exports = SqliteRepository;
