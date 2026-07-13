const RepositoryInterface = require('./repository.interface');
const { query } = require('../db/db');

class PostgresRepository extends RepositoryInterface {
  async getAllTasks() {
    const result = await query('SELECT * FROM tasks ORDER BY created_at DESC');
    return result.rows;
  }

  async getTaskById(id) {
    const result = await query('SELECT * FROM tasks WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async createTask(task) {
    const { title, completed = false } = task;
    const result = await query(
      'INSERT INTO tasks (title, completed) VALUES ($1, $2) RETURNING *',
      [title, completed]
    );
    return result.rows[0];
  }

  async updateTask(id, updates) {
    const existing = await this.getTaskById(id);
    if (!existing) return null;

    const title = updates.title !== undefined ? updates.title : existing.title;
    const completed = updates.completed !== undefined ? updates.completed : existing.completed;

    const result = await query(
      'UPDATE tasks SET title = $1, completed = $2 WHERE id = $3 RETURNING *',
      [title, completed, id]
    );
    return result.rows[0] || null;
  }

  async deleteTask(id) {
    const existing = await this.getTaskById(id);
    if (!existing) return null;

    await query('DELETE FROM tasks WHERE id = $1', [id]);
    return existing;
  }
}

module.exports = PostgresRepository;
