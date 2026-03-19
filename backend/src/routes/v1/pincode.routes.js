import { Router } from 'express';
import PincodeController from '../../controllers/pincode.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import {
	getPincodeSchema,
	createPincodeSchema,
	updatePincodeSchema,
	pincodeParamSchema,
} from '../../validators/pincode.validators.js';

const router = Router();

// Search by 6-digit pincode: GET /api/v1/pincode?pincode=560001
router.route('/')
	.get(checkPermission(), Validator.query(getPincodeSchema), PincodeController.get)
	.post(checkPermission(), Validator.body(createPincodeSchema), PincodeController.create);

// CRUD operations by ID (for admin)
router.route('/:id')
	.get(checkPermission(), Validator.params(pincodeParamSchema), PincodeController.getById)
	.put(checkPermission(), Validator.params(pincodeParamSchema), Validator.body(updatePincodeSchema), PincodeController.update)
	.delete(checkPermission(), Validator.params(pincodeParamSchema), PincodeController.delete);

export default router;
