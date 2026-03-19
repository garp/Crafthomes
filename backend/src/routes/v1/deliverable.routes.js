import { Router } from 'express';
import DeliverableController from '../../controllers/deliverable.controller.js';
import { createDeliverableSchema, updateDeliverableSchema } from '../../validators/deliverable.validators.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createDeliverableSchema), DeliverableController.create)
	.get(checkPermission(), DeliverableController.get);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updateDeliverableSchema), DeliverableController.update)
	.delete(checkPermission(), DeliverableController.delete);

export default router;
