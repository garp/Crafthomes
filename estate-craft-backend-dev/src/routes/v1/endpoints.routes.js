import { Router } from 'express';
import EndpointsController from '../../controllers/endpoints.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

// Get all available API endpoints grouped by module
router.route('/').get(checkPermission(), EndpointsController.getGrouped);

// Get flat list of all available API endpoints
router.route('/flat').get(checkPermission(), EndpointsController.getFlat);

export default router;
