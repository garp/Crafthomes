import { Router } from 'express';
import SummaryController from '../../controllers/summary.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

router.route('/task').get(checkPermission(), SummaryController.getTaskSummary);
router.route('/running-tasks').get(checkPermission(), SummaryController.getRunningTasksSummary);
router.route('/payment-progress').get(checkPermission(), SummaryController.getPaymentSummary);
router.route('/mom-progress').get(checkPermission(), SummaryController.getMomSummary);
router.route('/tasks-by-type').get(checkPermission(), SummaryController.getTasksByType);

export default router;
