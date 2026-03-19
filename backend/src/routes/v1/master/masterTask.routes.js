import { Router } from 'express';
import MasterTaskController from '../../../controllers/master/masterTask.controller.js';
import Validator from '../../../middlewares/validators.middleware.js';
import {
	createMasterTaskSchema,
	updateMasterTaskSchema,
	getMasterTaskSchema,
	bulkDeleteMasterTaskSchema,
} from '../../../validators/master/masterTask.validator.js';
import checkPermission from '../../../middlewares/auth.middleware.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createMasterTaskSchema), MasterTaskController.create)
	.get(checkPermission(), Validator.query(getMasterTaskSchema), MasterTaskController.get);

router
	.route('/bulk')
	.delete(checkPermission(), Validator.body(bulkDeleteMasterTaskSchema), MasterTaskController.bulkDelete);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updateMasterTaskSchema), MasterTaskController.update)
	.delete(checkPermission(), MasterTaskController.delete);

export default router;
