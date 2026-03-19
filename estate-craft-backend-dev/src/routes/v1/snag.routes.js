import { Router } from 'express';
import SnagController from '../../controllers/snag.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import { createSnagSchema, updateSnagSchema, getSnagSchema } from '../../validators/snag.validator.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createSnagSchema), SnagController.create)
	.get(checkPermission(), Validator.query(getSnagSchema), SnagController.get);

router
	.route('/:id')
	.get(checkPermission(), SnagController.getById)
	.put(checkPermission(), Validator.body(updateSnagSchema), SnagController.update)
	.delete(checkPermission(), SnagController.delete);

export default router;
