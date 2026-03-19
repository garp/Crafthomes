import { Router } from 'express';
import ModuleAccessController from '../../controllers/moduleAccess.controller.js';
import { getModuleAccessSchema, bulkUpdateModuleAccessSchema } from '../../validators/moduleAccess.validators.js';
import Validator from '../../middlewares/validators.middleware.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

// Get available module definitions (static list)
router.get('/definitions', checkPermission(), ModuleAccessController.getDefinitions);

// Get module access for a role
router.get('/', checkPermission(), Validator.query(getModuleAccessSchema), ModuleAccessController.get);

// Bulk update module access for a role
router.put('/role/:id', checkPermission(), Validator.body(bulkUpdateModuleAccessSchema), ModuleAccessController.bulkUpdate);

export default router;
