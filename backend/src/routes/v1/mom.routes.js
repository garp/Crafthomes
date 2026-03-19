import { Router } from 'express';
import MOMController from '../../controllers/mom.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import { createMOMSchema, updateMOMSchema, getMOMSchema } from '../../validators/mom.validators.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createMOMSchema), MOMController.create)
	.get(checkPermission(), Validator.query(getMOMSchema), MOMController.get);

router
	.route('/:id')
	.get(checkPermission(), MOMController.getById)
	.put(checkPermission(), Validator.body(updateMOMSchema), MOMController.update)
	.delete(checkPermission(), MOMController.delete);

router
	.route('/:id/share')
	.post(checkPermission(), MOMController.share);

export default router;
