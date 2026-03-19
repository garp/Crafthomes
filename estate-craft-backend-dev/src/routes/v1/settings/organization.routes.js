import { Router } from 'express';
import OrganizationController from '../../../controllers/settings/organization.controller.js';
import checkPermission from '../../../middlewares/auth.middleware.js';

const router = Router();

router.route('/').get(checkPermission(), OrganizationController.get);
router.route('/:userId').get(checkPermission(), OrganizationController.get);

export default router;
