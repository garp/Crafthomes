import { ROOMS, SERVER_EVENTS, NOTIFICATION_TYPES } from '../constants.js';
import NotificationServices from '../../services/modelServices/notification.services.js';
import { logInfo, logError } from '../../utils/logger.js';

let io = null;

export const initNotificationEmitter = socketIo => {
	io = socketIo;
};

/**
 * Create notification in DB and emit to user via socket
 * @param {Object} params
 * @param {string} params.userId - Target user ID
 * @param {string} params.actorId - User who triggered (optional)
 * @param {string} params.type - NOTIFICATION_TYPES value
 * @param {string} params.title - Notification title
 * @param {string} [params.message] - Optional message
 * @param {Object} [params.metadata] - Additional data (taskId, projectId, etc.)
 */
export const sendNotification = async ({ userId, actorId, type, title, message, metadata }) => {
	// Don't notify yourself
	if (userId === actorId) return null;

	try {
		// 1. Persist to DB
		const notification = await NotificationServices.create({
			data: {
				userId,
				actorId,
				type,
				title,
				message,
				metadata,
			},
		});

		// 2. Emit via socket (fire-and-forget)
		if (io) {
			const room = `${ROOMS.USER}${userId}`;
			io.to(room).emit(SERVER_EVENTS.NOTIFICATION_NEW, {
				id: notification.id,
				type: notification.type,
				title: notification.title,
				message: notification.message,
				metadata: notification.metadata,
				actorId: notification.actorId,
				createdAt: notification.createdAt,
			});

			// Also send updated count
			const unreadCount = await NotificationServices.count({
				where: { userId, isRead: false, status: 'ACTIVE' },
			});
			io.to(room).emit(SERVER_EVENTS.NOTIFICATIONS_COUNT, { unreadCount });

			logInfo(`Notification sent to ${room}: ${type}`);
		}

		return notification;
	} catch (err) {
		logError(`Failed to send notification: ${err.message}`);
		return null;
	}
};

/**
 * Notify multiple users (batch)
 */
export const sendNotificationBatch = async (userIds, { actorId, type, title, message, metadata }) => {
	const uniqueUserIds = [...new Set(userIds)].filter(id => id && id !== actorId);
	await Promise.all(
		uniqueUserIds.map(userId => sendNotification({ userId, actorId, type, title, message, metadata }))
	);
};

// Re-export types for convenience
export { NOTIFICATION_TYPES };

