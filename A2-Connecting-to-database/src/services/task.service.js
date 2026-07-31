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
}

module.exports = TaskService;
