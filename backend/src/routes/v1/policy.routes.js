import { Router } from 'express';
import PolicyController from '../../controllers/policy.controller.js';
import {
	getPolicySchema,
	createPolicySchema,
	updatePolicySchema,
} from '../../validators/policy.validators.js';
import Validator from '../../middlewares/validators.middleware.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
	.get(checkPermission(), Validator.query(getPolicySchema), PolicyController.get)
	.post(checkPermission(), Validator.body(createPolicySchema), PolicyController.create);

router.route('/:id')
	.get(checkPermission(), PolicyController.getById)
	.put(checkPermission(), Validator.body(updatePolicySchema), PolicyController.update)
	.delete(checkPermission(), PolicyController.delete);

export default router;

