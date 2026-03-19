import { Router } from 'express';
import PhaseController from '../../controllers/phase.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import { createPhaseSchema, updatePhaseSchema, getPhaseSchema } from '../../validators/phase.validators.js';
import Validator from '../../middlewares/validators.middleware.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createPhaseSchema), PhaseController.create)
	.get(checkPermission(), Validator.query(getPhaseSchema), PhaseController.get);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updatePhaseSchema), PhaseController.update)
	.delete(checkPermission(), PhaseController.delete);

export default router;
