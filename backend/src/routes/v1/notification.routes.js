import { Router } from 'express';
import NotificationController from '../../controllers/notification.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

router.route('/').get(checkPermission(), NotificationController.get);
router.route('/count').get(checkPermission(), NotificationController.getUnreadCount);
router.route('/read-all').put(checkPermission(), NotificationController.markAllAsRead);
router.route('/:id/read').put(checkPermission(), NotificationController.markAsRead);

export default router;
