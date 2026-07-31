const { Router } = require('express');
const TaskController = require('../controllers/task.controller');
const TaskService = require('../services/task.service');
const SqliteRepository = require('../repositories/sqlite.repository');

const router = Router();

// Wire up the dependency chain: repository → service → controller
const repository = new SqliteRepository();
const service = new TaskService(repository);
const controller = new TaskController(service);

router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.delete);

module.exports = router;
