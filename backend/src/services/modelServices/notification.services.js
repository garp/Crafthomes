import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class NotificationServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().notification, 'notification');
	}

	/**
	 * Get paginated notifications for a user
	 */
	async getUserNotifications(userId, { pageNo = 0, pageLimit = 20, unreadOnly = false }) {
		const where = { userId, status: 'ACTIVE' };
		if (unreadOnly) where.isRead = false;

		const [notifications, totalCount] = await Promise.all([
			this.findMany({
				where,
				skip: pageNo * pageLimit,
				take: pageLimit,
				orderBy: { createdAt: 'desc' },
				select: {
					id: true,
					type: true,
					title: true,
					message: true,
					metadata: true,
					isRead: true,
					createdAt: true,
					actor: {
						select: { id: true, name: true },
					},
				},
			}),
			this.count({ where }),
		]);

		return { notifications, totalCount };
	}
}

export default new NotificationServices();

