import { Router } from 'express';
import MasterPhaseController from '../../../controllers/master/masterPhase.controller.js';
import Validator from '../../../middlewares/validators.middleware.js';
import {
	createMasterPhaseSchema,
	updateMasterPhaseSchema,
	getMasterPhaseSchema,
	bulkDeleteMasterPhaseSchema,
} from '../../../validators/master/masterPhase.validator.js';
import checkPermission from '../../../middlewares/auth.middleware.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createMasterPhaseSchema), MasterPhaseController.create)
	.get(checkPermission(), Validator.query(getMasterPhaseSchema), MasterPhaseController.get);

router
	.route('/bulk')
	.delete(checkPermission(), Validator.body(bulkDeleteMasterPhaseSchema), MasterPhaseController.bulkDelete);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updateMasterPhaseSchema), MasterPhaseController.update)
	.delete(checkPermission(), MasterPhaseController.delete);

router.route('/project-type/:projectTypeId').get(checkPermission(), MasterPhaseController.getByProjectTypeId);

export default router;
