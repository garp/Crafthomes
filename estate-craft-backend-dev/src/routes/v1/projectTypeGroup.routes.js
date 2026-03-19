import { Router } from 'express';
import ProjectTypeGroupController from '../../controllers/projectTypeGroup.controller.js';
import Validator from '../../middlewares/validators.middleware.js';
import {
	createProjectTypeGroupSchema,
	updateProjectTypeGroupSchema,
	getProjectTypeGroupSchema,
	rearrangeProjectTypeOrderSchema,
	bulkDeleteProjectTypeGroupSchema,
} from '../../validators/projectTypeGroup.validator.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createProjectTypeGroupSchema), ProjectTypeGroupController.create)
	.get(checkPermission(), Validator.query(getProjectTypeGroupSchema), ProjectTypeGroupController.get);

router
	.route('/bulk')
	.delete(checkPermission(), Validator.body(bulkDeleteProjectTypeGroupSchema), ProjectTypeGroupController.bulkDelete);

router
	.route('/rearrange/project-type')
	.put(checkPermission(), Validator.body(rearrangeProjectTypeOrderSchema), ProjectTypeGroupController.rearrangeProjectTypeOrder);

router
	.route('/:id')
	.get(checkPermission(), ProjectTypeGroupController.getOne)
	.put(checkPermission(), Validator.body(updateProjectTypeGroupSchema), ProjectTypeGroupController.update)
	.delete(checkPermission(), ProjectTypeGroupController.delete);

export default router;
