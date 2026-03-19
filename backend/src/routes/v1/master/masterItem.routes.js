import { Router } from 'express';
import MasterItemController from '../../../controllers/master/masterItem.controller.js';
import Validator from '../../../middlewares/validators.middleware.js';
import {
	createMasterItemSchema,
	updateMasterItemSchema,
	getMasterItemSchema,
} from '../../../validators/master/masterItem.validator.js';
import checkPermission from '../../../middlewares/auth.middleware.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createMasterItemSchema), MasterItemController.create)
	.get(checkPermission(), Validator.query(getMasterItemSchema), MasterItemController.get);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updateMasterItemSchema), MasterItemController.update)
	.delete(checkPermission(), MasterItemController.delete);

export default router;
