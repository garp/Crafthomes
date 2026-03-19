import { Router } from 'express';
import ProjectTypeController from '../../controllers/projectType.controller.js';
import Validator from '../../middlewares/validators.middleware.js';
import {
	createProjectTypeSchema,
	updateProjectTypeSchema,
	getProjectTypeSchema,
	rearrangeMasterPhaseOrderSchema,
	rearrangeMasterTaskOrderSchema,
	bulkDeleteProjectTypeSchema,
} from '../../validators/projectType.validator.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createProjectTypeSchema), ProjectTypeController.create)
	.get(checkPermission(), Validator.query(getProjectTypeSchema), ProjectTypeController.get);

router
	.route('/bulk')
	.delete(checkPermission(), Validator.body(bulkDeleteProjectTypeSchema), ProjectTypeController.bulkDelete);

router
	.route('/rearrange/master-phase')
	.put(checkPermission(), Validator.body(rearrangeMasterPhaseOrderSchema), ProjectTypeController.rearrangeMasterPhaseOrder);

router
	.route('/rearrange/master-task')
	.put(checkPermission(), Validator.body(rearrangeMasterTaskOrderSchema), ProjectTypeController.rearrangeMasterTaskOrder);

router
	.route('/:id')
	.get(checkPermission(), ProjectTypeController.getOne)
	.put(checkPermission(), Validator.body(updateProjectTypeSchema), ProjectTypeController.update)
	.delete(checkPermission(), ProjectTypeController.delete);

router
	.route('/:projectTypeId/masterPhase/:masterPhaseId/remove')
	.delete(checkPermission(), ProjectTypeController.removeMasterPhase);

router
	.route('/:projectTypeId/masterPhase/:masterPhaseId/masterTask/:masterTaskId/remove')
	.delete(checkPermission(), ProjectTypeController.removeMasterTask);

export default router;
