import { Router } from 'express';
import TasksController from '../../controllers/tasks.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import { createTaskSchema, updateTaskSchema } from '../../validators/timeline.validators.js';
import { getTaskSchema } from '../../validators/task.validator.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createTaskSchema), TasksController.create)
	.get(checkPermission(), Validator.query(getTaskSchema), TasksController.get);

router.route('/mark-complete/:id').put(checkPermission(), TasksController.markComplete);
router.route('/approve/:id').put(checkPermission(), TasksController.approve);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updateTaskSchema), TasksController.update)
	.delete(checkPermission(), TasksController.delete);

export default router;
