import { Router } from 'express';
import SubTaskController from '../../controllers/subTask.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import { createSubTaskSchema, updateSubTaskSchema, getSubTaskSchema } from '../../validators/subTask.validator.js';

const router = Router();

router.post('/', checkPermission(), Validator.body(createSubTaskSchema), SubTaskController.create);
router.get('/', checkPermission(), Validator.query(getSubTaskSchema), SubTaskController.get);

// Mark a subtask as completed
router.put('/mark-complete/:id', checkPermission(), SubTaskController.markComplete);

router.put('/:id', checkPermission(), Validator.body(updateSubTaskSchema), SubTaskController.update);
router.delete('/:id', checkPermission(), SubTaskController.delete);

export default router;
