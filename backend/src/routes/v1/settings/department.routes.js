import { Router } from 'express';
import DepartmentController from '../../../controllers/settings/department.controller.js';
import Validator from '../../../middlewares/validators.middleware.js';
import {
	getDepartmentSchema,
	createDepartmentSchema,
	updateDepartmentSchema,
} from '../../../validators/department.validators.js';
import checkPermission from '../../../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
	.get(checkPermission(), Validator.query(getDepartmentSchema), DepartmentController.get)
	.post(checkPermission(), Validator.body(createDepartmentSchema), DepartmentController.create);

router.route('/:id')
	.get(checkPermission(), DepartmentController.getById)
	.put(checkPermission(), Validator.body(updateDepartmentSchema), DepartmentController.update)
	.delete(checkPermission(), DepartmentController.delete);

export default router;
