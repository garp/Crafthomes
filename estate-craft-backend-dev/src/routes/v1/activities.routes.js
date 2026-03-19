import { Router } from 'express';
import ActivitiesController from '../../controllers/activities.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

// Existing route (backwards compatible) - get activities by taskId or subTaskId
router.get('/', checkPermission(), ActivitiesController.get);

// Get all activities for a specific project
router.get('/project/:projectId', checkPermission(), ActivitiesController.getByProject);

// Get activity summary/stats for project dashboard
router.get('/project/:projectId/summary', checkPermission(), ActivitiesController.getSummary);

export default router;
