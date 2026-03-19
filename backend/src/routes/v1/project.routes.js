import { Router } from 'express';
import ProjectController from '../../controllers/project.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import { createProjectSchema, updateProjectSchema, getProjectSchema } from '../../validators/project.validators.js';

const router = Router();

// Main CRUD routes
router
	.route('/')
	.post(checkPermission(), Validator.body(createProjectSchema), ProjectController.create)
	.get(checkPermission(), Validator.query(getProjectSchema), ProjectController.get);

// Individual project routes
router
	.route('/:projectId')
	// .get(checkPermission(), ProjectController.getById)
	.put(checkPermission(), Validator.body(updateProjectSchema), ProjectController.update)
	.delete(checkPermission(), ProjectController.delete);

router.route('/summary/:projectId').get(checkPermission(), ProjectController.summary);

// Get all assigned users for a project
router.route('/users/assigned-list/:projectId').get(checkPermission(), ProjectController.getAssignedUsers);

// Get linked data for a project (for deletion preview)
router.route('/linked-data/:projectId').get(checkPermission(), ProjectController.getLinkedData);

export default router;
