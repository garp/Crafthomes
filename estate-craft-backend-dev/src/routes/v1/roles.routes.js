import { Router } from 'express';
import RolesController from '../../controllers/roles.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

router.route('/').get(checkPermission(), RolesController.get).post(checkPermission(), RolesController.create);
router.route('/:id').put(checkPermission(), RolesController.updateRole);
router.route('/status/:id').put(checkPermission(), RolesController.updateStatus);

export default router;
