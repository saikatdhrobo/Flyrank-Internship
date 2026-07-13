/**
 * Repository Interface — contract that every repository must fulfill.
 *
 * Services and controllers depend on this interface, never on a concrete
 * storage implementation. To switch databases (e.g. MySQL, SQLite) you
 * only need to write a new repository class that implements these methods.
 *
 * @interface Repository
 */
class RepositoryInterface {
  /** @returns {Promise<object[]>} */
  async getAllTasks() {
    throw new Error('Method not implemented: getAllTasks');
  }

  /** @param {number} id @returns {Promise<object|null>} */
  async getTaskById(id) {
    throw new Error('Method not implemented: getTaskById');
  }

  /** @param {{ title: string, completed?: boolean }} task @returns {Promise<object>} */
  async createTask(task) {
    throw new Error('Method not implemented: createTask');
  }

  /** @param {number} id @param {{ title?: string, completed?: boolean }} updates @returns {Promise<object|null>} */
  async updateTask(id, updates) {
    throw new Error('Method not implemented: updateTask');
  }

  /** @param {number} id @returns {Promise<object|null>} */
  async deleteTask(id) {
    throw new Error('Method not implemented: deleteTask');
  }
}

module.exports = RepositoryInterface;
