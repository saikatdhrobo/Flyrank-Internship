/**
 * Task Controller — parses the request and delegates to the service.
 */
class TaskController {
  /**
   * @param {import('../services/task.service')} taskService
   */
  constructor(taskService) {
    this.service = taskService;
  }

  getAll = async (req, res, next) => {
    try {
      const tasks = await this.service.getAllTasks(req.query);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  };

  getById = async (req, res, next) => {
    try {
      const task = await this.service.getTaskById(req.params.id);
      res.json(task);
    } catch (err) {
      next(err);
    }
  };

  create = async (req, res, next) => {
    try {
      const task = await this.service.createTask(req.body);
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const task = await this.service.updateTask(req.params.id, req.body);
      res.json(task);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req, res, next) => {
    try {
      const task = await this.service.deleteTask(req.params.id);
      res.json(task);
    } catch (err) {
      next(err);
    }
  };

  getStats = async (req, res, next) => {
    try {
      const stats = await this.service.getStats();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  };
}

module.exports = TaskController;
