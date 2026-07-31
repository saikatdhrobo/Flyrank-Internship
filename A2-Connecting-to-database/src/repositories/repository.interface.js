/**
 * Repository Interface — the contract every storage implementation must fulfill.
 *
 * Services and controllers depend on this interface, never on a concrete
 * storage implementation. To switch databases you only need to write a new
 * repository class that implements these methods.
 *
 * @interface Repository
 */
class RepositoryInterface {
  /** @param {{ search?: string, done?: boolean, sort?: string }} [query] @returns {Promise<object[]>} */
  async getAllTasks() {
    throw new Error('Method not implemented: getAllTasks');
  }

  /** @param {number} id @returns {Promise<object|null>} */
  async getTaskById(id) {
    throw new Error('Method not implemented: getTaskById');
  }

  /** @param {{ title: string, done?: boolean }} task @returns {Promise<object>} */
  async createTask(task) {
    throw new Error('Method not implemented: createTask');
  }

  /** @param {number} id @param {{ title?: string, done?: boolean }} updates @returns {Promise<object|null>} */
  async updateTask(id, updates) {
    throw new Error('Method not implemented: updateTask');
  }

  /** @param {number} id @returns {Promise<object|null>} */
  async deleteTask(id) {
    throw new Error('Method not implemented: deleteTask');
  }

  /** @returns {Promise<{ total: number, done: number, pending: number }>} */
  async getStats() {
    throw new Error('Method not implemented: getStats');
  }
}

module.exports = RepositoryInterface;
