import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler } from '../utils/responseHandler.js';
import NotificationServices from '../services/modelServices/notification.services.js';

class NotificationController {
	/**
	 * GET /notifications
	 * Query params: pageNo, pageLimit, unreadOnly
	 */
	get = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { pageNo = 0, pageLimit = 20, unreadOnly } = req.query;

		const result = await NotificationServices.getUserNotifications(userId, {
			pageNo: parseInt(pageNo, 10),
			pageLimit: parseInt(pageLimit, 10),
			unreadOnly: unreadOnly === 'true',
		});

		return responseHandler(result, res);
	});

	/**
	 * GET /notifications/count
	 * Returns unread notification count
	 */
	getUnreadCount = asyncHandler(async (req, res) => {
		const { userId } = req.user;

		const unreadCount = await NotificationServices.count({
			where: { userId, isRead: false, status: 'ACTIVE' },
		});

		return responseHandler({ unreadCount }, res);
	});

	/**
	 * PUT /notifications/:id/read
	 * Mark a single notification as read
	 */
	markAsRead = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const notification = await NotificationServices.update({
			where: { id, userId },
			data: { isRead: true, readAt: new Date() },
		});

		return responseHandler(notification, res);
	});

	/**
	 * PUT /notifications/read-all
	 * Mark all notifications as read for the current user
	 */
	markAllAsRead = asyncHandler(async (req, res) => {
		const { userId } = req.user;

		await NotificationServices.updateMany({
			where: { userId, isRead: false },
			data: { isRead: true, readAt: new Date() },
		});

		return responseHandler({ success: true }, res);
	});
}

export default new NotificationController();
