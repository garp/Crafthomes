import { Router } from 'express';
import DesignationController from '../../../controllers/settings/designation.controller.js';
import Validator from '../../../middlewares/validators.middleware.js';
import {
	getDesignationSchema,
	createDesignationSchema,
	updateDesignationSchema,
	bulkCreateDesignationSchema,
} from '../../../validators/designation.validators.js';
import checkPermission from '../../../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
	.get(checkPermission(), Validator.query(getDesignationSchema), DesignationController.get)
	.post(checkPermission(), Validator.body(createDesignationSchema), DesignationController.create);

router.route('/bulk')
	.post(checkPermission(), Validator.body(bulkCreateDesignationSchema), DesignationController.bulkCreate);

router.route('/:id')
	.get(checkPermission(), DesignationController.getById)
	.put(checkPermission(), Validator.body(updateDesignationSchema), DesignationController.update)
	.delete(checkPermission(), DesignationController.delete);

export default router;
