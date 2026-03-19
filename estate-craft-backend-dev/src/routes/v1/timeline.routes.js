import { Router } from 'express';
import TimelineController from '../../controllers/timeline.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import {
	createTimelineSchema,
	createPhaseSchema,
	createTaskSchema,
	updateTaskSchema,
	updateTimelineSchema,
	updatePhaseOrderSchema,
	updateTaskOrderSchema,
	getTimelineSchema,
	getPhaseSchema,
	getTaskSchema,
} from '../../validators/timeline.validators.js';
import Validator from '../../middlewares/validators.middleware.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createTimelineSchema), TimelineController.create)
	.get(checkPermission(), Validator.query(getTimelineSchema), TimelineController.get);

router
	.route('/phase')
	.post(checkPermission(), Validator.body(createPhaseSchema), TimelineController.createPhase)
	.get(checkPermission(), Validator.query(getPhaseSchema), TimelineController.getPhase);

router
	.route('/rearrange/phase')
	.put(checkPermission(), Validator.body(updatePhaseOrderSchema), TimelineController.rearrangePhaseOrder);

router
	.route('/rearrange/task')
	.put(checkPermission(), Validator.body(updateTaskOrderSchema), TimelineController.rearrangeTaskOrder);

router.route('/ordered-tasks').get(checkPermission(), TimelineController.getOrderedTasks);

router
	.route('/task')
	.post(checkPermission(), Validator.body(createTaskSchema), TimelineController.createTask)
	.get(checkPermission(), Validator.query(getTaskSchema), TimelineController.getTask);

router
	.route('/task/:id')
	.put(checkPermission(), Validator.body(updateTaskSchema), TimelineController.updateTask)
	.delete(checkPermission(), TimelineController.deleteTask);

router
	.route('/:timelineId')
	.get(checkPermission(), TimelineController.getById)
	.put(checkPermission(), Validator.body(updateTimelineSchema), TimelineController.update)
	.delete(checkPermission(), TimelineController.delete);

export default router;
