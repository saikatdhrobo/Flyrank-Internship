/**
 * Task Service — contains all business logic, including the 400/404 rules.
 *
 * It depends on a RepositoryInterface implementation, not on SQLite directly.
 * This keeps the service testable and storage-agnostic.
 */
class TaskService {
  /**
   * @param {import('../repositories/repository.interface')} repository
   */
  constructor(repository) {
    this.repository = repository;
  }

  async getAllTasks() {
    return this.repository.getAllTasks();
  }

  async getTaskById(id) {
    const num = Number(id);
    if (!Number.isInteger(num) || num < 1) {
      const err = new Error('Invalid task ID');
      err.status = 400;
      throw err;
    }

    const task = await this.repository.getTaskById(num);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      throw err;
    }
    return task;
  }

  async createTask(data) {
    if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
      const err = new Error('Title is required and must be a non-empty string');
      err.status = 400;
      throw err;
    }

    return this.repository.createTask({
      title: data.title.trim(),
      done: data.done !== undefined ? !!data.done : false,
    });
  }

  async updateTask(id, data) {
    const num = Number(id);
    if (!Number.isInteger(num) || num < 1) {
      const err = new Error('Invalid task ID');
      err.status = 400;
      throw err;
    }

    if (data.title !== undefined && (typeof data.title !== 'string' || data.title.trim().length === 0)) {
      const err = new Error('Title must be a non-empty string');
      err.status = 400;
      throw err;
    }

    const task = await this.repository.updateTask(num, {
      title: data.title !== undefined ? data.title.trim() : undefined,
      done: data.done !== undefined ? !!data.done : undefined,
    });

    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      throw err;
    }
    return task;
  }

  async deleteTask(id) {
    const num = Number(id);
    if (!Number.isInteger(num) || num < 1) {
      const err = new Error('Invalid task ID');
      err.status = 400;
      throw err;
    }

    const task = await this.repository.deleteTask(num);
    if (!task) {
      const err = new Error('Task not found');
      err.status = 404;
      throw err;
    }
    return task;
  }
}

module.exports = TaskService;
