import { ROOMS, CLIENT_EVENTS, SERVER_EVENTS } from '../constants.js';
import NotificationServices from '../../services/modelServices/notification.services.js';
import UserServices from '../../services/modelServices/user.services.js';
import { logInfo } from '../../utils/logger.js';

export const registerHandlers = (io, socket) => {
	const { user } = socket;

	// Join user's personal room on connect
	const userRoom = `${ROOMS.USER}${user.id}`;
	socket.join(userRoom);
	logInfo(`Socket ${socket.id} joined room: ${userRoom}`);

	// Send unread count on connect
	sendUnreadCount(socket, user.id);

	// Handle "me" - return authenticated user details
	socket.on(CLIENT_EVENTS.ME, async callback => {
		logInfo(`Socket event received: ${CLIENT_EVENTS.ME} | user: ${user.id}`);
		try {
			const userDetails = await UserServices.findOne({
				where: { id: user.id },
				select: {
					id: true,
					name: true,
					email: true,
					phoneNumber: true,
					userType: true,
					status: true,
					role: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			});

			socket.emit(SERVER_EVENTS.USER_ME, userDetails);
			if (typeof callback === 'function') callback({ success: true, user: userDetails });
		} catch (err) {
			if (typeof callback === 'function') callback({ success: false, error: err.message });
		}
	});

	// Handle mark single notification as read
	socket.on(CLIENT_EVENTS.NOTIFICATION_MARK_READ, async (notificationId, callback) => {
		logInfo(`Socket event received: ${CLIENT_EVENTS.NOTIFICATION_MARK_READ} | user: ${user.id} | data: ${JSON.stringify({ notificationId })}`);
		try {
			await NotificationServices.update({
				where: { id: notificationId, userId: user.id },
				data: { isRead: true, readAt: new Date() },
			});
			sendUnreadCount(socket, user.id);
			if (typeof callback === 'function') callback({ success: true });
		} catch (err) {
			if (typeof callback === 'function') callback({ success: false, error: err.message });
		}
	});

	// Handle mark all as read
	socket.on(CLIENT_EVENTS.NOTIFICATION_MARK_ALL_READ, async callback => {
		logInfo(`Socket event received: ${CLIENT_EVENTS.NOTIFICATION_MARK_ALL_READ} | user: ${user.id}`);
		try {
			await NotificationServices.updateMany({
				where: { userId: user.id, isRead: false },
				data: { isRead: true, readAt: new Date() },
			});
			sendUnreadCount(socket, user.id);
			if (typeof callback === 'function') callback({ success: true });
		} catch (err) {
			if (typeof callback === 'function') callback({ success: false, error: err.message });
		}
	});

	// Cleanup on disconnect
	socket.on('disconnect', reason => {
		logInfo(`Socket ${socket.id} disconnected: ${reason}`);
	});
};

/**
 * Send current unread count to socket
 */
async function sendUnreadCount(socket, userId) {
	try {
		const count = await NotificationServices.count({
			where: { userId, isRead: false, status: 'ACTIVE' },
		});
		socket.emit(SERVER_EVENTS.NOTIFICATIONS_COUNT, { unreadCount: count });
	} catch (err) {
		// Silently fail - unread count is non-critical
	}
}

