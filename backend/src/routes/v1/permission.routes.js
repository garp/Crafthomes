import { Router } from 'express';
import Validator from '../../middlewares/validators.middleware.js';
import PermissionController from '../../controllers/permissions.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import {
	createPermissionSchema,
	createManyPermissionsSchema,
	updatePermissionSchema,
} from '../../validators/permission.validator.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createPermissionSchema), PermissionController.create)
	.get(checkPermission(), PermissionController.get);

router
	.route('/bulk')
	.post(checkPermission(), Validator.body(createManyPermissionsSchema), PermissionController.createMany);

// Role-specific permission management
router
	.route('/role/:id')
	.get(checkPermission(), PermissionController.getRolePermissions)
	.put(checkPermission(), PermissionController.updateRolePermissions);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updatePermissionSchema), PermissionController.update)
	.delete(checkPermission(), PermissionController.delete);

router.route('/status/:id').patch(checkPermission(), PermissionController.updateStatus);
router.route('/clear-cache').get(checkPermission(), PermissionController.clearCache);

export default router;
