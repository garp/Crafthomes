import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import ActivitiesServices from '../services/modelServices/activities.services.js';
import ProjectServices from '../services/modelServices/project.services.js';

class ActivitiesController {
	/**
	 * Get activities for a specific task or subtask (backwards compatible)
	 * GET /api/v1/activities?taskId=xxx&subTaskId=xxx
	 */
	get = asyncHandler(async (req, res) => {
		const { taskId, subTaskId, pageNo = 0, pageLimit = 50, sortOrder = -1 } = req.query;

		const where = {};
		if (taskId) where.taskId = taskId;
		if (subTaskId) where.subTaskId = subTaskId;

		// Get total count
		const totalCount = await ActivitiesServices.count({ where });

		// Build orderBy - sortOrder: 1 = asc, -1 = desc (default desc)
		const orderBy = { createdAt: parseInt(sortOrder, 10) === 1 ? 'asc' : 'desc' };

		// Get activities with user details
		const activities = await ActivitiesServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			select: {
				id: true,
				activity: true,
				activityType: true,
				fieldUpdated: true,
				entityType: true,
				entityId: true,
				entityName: true,
				projectId: true,
				taskId: true,
				subTaskId: true,
				createdAt: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy,
		});

		return responseHandler({ activities, totalCount }, res);
	});

	/**
	 * Get all activities for a specific project
	 * GET /api/v1/activities/project/:projectId
	 * 
	 * Query params:
	 * - pageNo: Page number (0-indexed), default 0
	 * - pageLimit: Number of records per page, default 50
	 * - entityType: Filter by entity type (project, phase, task, subtask, quotation, payment, snag, comment)
	 * - activityType: Filter by activity type (create, update, delete, comment)
	 * - startDate: Filter from date (ISO format: 2026-01-10T10:37:12.060Z)
	 * - endDate: Filter to date (ISO format: 2026-01-10T13:37:12.060Z)
	 * - sortOrder: Sort order (1 = asc, -1 = desc), default -1 (desc)
	 */
	getByProject = asyncHandler(async (req, res) => {
		const { projectId } = req.params;
		const {
			pageNo = 0,
			pageLimit = 50,
			entityType,
			activityType,
			startDate,
			endDate,
			sortOrder = -1,
		} = req.query;

		// Validate project exists
		const project = await ProjectServices.findOne({ where: { id: projectId } });
		if (!project) {
			return errorHandler('E-404', res);
		}

		const where = { projectId };

		// Optional filters
		if (entityType) where.entityType = entityType;
		if (activityType) where.activityType = activityType;

		// Date range filter - handles ISO format like 2026-01-10T10:37:12.060Z
		if (startDate || endDate) {
			where.createdAt = {};
			if (startDate) where.createdAt.gte = new Date(startDate);
			if (endDate) where.createdAt.lte = new Date(endDate);
		}

		const totalCount = await ActivitiesServices.count({ where });

		// Build orderBy - sortOrder: 1 = asc, -1 = desc (default desc)
		const orderBy = { createdAt: parseInt(sortOrder, 10) === 1 ? 'asc' : 'desc' };

		const activities = await ActivitiesServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			select: {
				id: true,
				activity: true,
				activityType: true,
				entityType: true,
				entityId: true,
				entityName: true,
				fieldUpdated: true,
				taskId: true,
				subTaskId: true,
				createdAt: true,
				user: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy,
		});

		return responseHandler({ activities, totalCount, project: { id: project.id, name: project.name } }, res);
	});

	/**
	 * Get activity summary/stats for a project dashboard
	 * GET /api/v1/activities/project/:projectId/summary
	 */
	getSummary = asyncHandler(async (req, res) => {
		const { projectId } = req.params;
		const { days = 7 } = req.query;

		// Validate project exists
		const project = await ProjectServices.findOne({ where: { id: projectId } });
		if (!project) {
			return errorHandler('E-404', res);
		}

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - parseInt(days, 10));

		// Get activity counts grouped by entityType
		const byEntityType = await ActivitiesServices.groupBy({
			by: ['entityType'],
			where: {
				projectId,
				createdAt: { gte: startDate },
			},
			_count: { id: true },
		});

		// Get activity counts grouped by activityType
		const byActivityType = await ActivitiesServices.groupBy({
			by: ['activityType'],
			where: {
				projectId,
				createdAt: { gte: startDate },
			},
			_count: { id: true },
		});

		// Get total count for the period
		const totalCount = await ActivitiesServices.count({
			where: {
				projectId,
				createdAt: { gte: startDate },
			},
		});

		// Get recent activities (last 10)
		const recentActivities = await ActivitiesServices.findMany({
			where: {
				projectId,
				createdAt: { gte: startDate },
			},
			take: 10,
			select: {
				id: true,
				activity: true,
				activityType: true,
				entityType: true,
				entityName: true,
				createdAt: true,
				user: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: { createdAt: 'desc' },
		});

		return responseHandler(
			{
				project: { id: project.id, name: project.name },
				period: `${days} days`,
				totalCount,
				byEntityType: byEntityType.map(item => ({
					entityType: item.entityType,
					count: item._count.id,
				})),
				byActivityType: byActivityType.map(item => ({
					activityType: item.activityType,
					count: item._count.id,
				})),
				recentActivities,
			},
			res
		);
	});
}

export default new ActivitiesController();
