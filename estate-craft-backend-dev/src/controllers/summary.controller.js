import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import TaskServices from '../services/modelServices/task.services.js';
import PaymentServices from '../services/modelServices/payment.services.js';
import MomServices from '../services/modelServices/mom.services.js';
import UserServices from '../services/modelServices/user.services.js';

/**
 * For CLIENT / CLIENT_CONTACT users, returns an extra where clause so tasks are limited to
 * projects belonging to the user's clientId. Returns null for other users or when clientId is missing.
 * Same logic as tasks.controller.js get().
 */
async function getClientTaskFilter(loggedInUser) {
	if (loggedInUser?.userType !== 'CLIENT' && loggedInUser?.userType !== 'CLIENT_CONTACT') {
		return null;
	}
	const fullUser = await UserServices.findOne({
		where: { id: loggedInUser.userId },
		select: { clientId: true },
	});
	if (!fullUser?.clientId) {
		return null;
	}
	return {
		phase: {
			project: {
				clientId: fullUser.clientId,
			},
		},
	};
}

class SummaryController {
	getTaskSummary = asyncHandler(async (req, res) => {
		// Calculate the date 6 months ago from now
		const sixMonthsAgo = new Date();
		sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
		const now = new Date();

		const clientFilter = await getClientTaskFilter(req.user);
		const andClause = clientFilter ? { AND: [clientFilter] } : {};

		// Pending tasks and recently added pending tasks
		const pendingTasks = await TaskServices.count({
			where: {
				taskStatus: 'PENDING',
				status: 'ACTIVE',
				...andClause,
			},
		});
		const recentlyAddedPendingTasks = await TaskServices.count({
			where: {
				taskStatus: 'PENDING',
				status: 'ACTIVE',
				createdAt: {
					gte: sixMonthsAgo,
				},
				...andClause,
			},
		});

		// In progress tasks and recently added in progress tasks
		const inProgressTasks = await TaskServices.count({
			where: {
				taskStatus: 'IN_PROGRESS',
				status: 'ACTIVE',
				...andClause,
			},
		});
		const recentlyAddedInProgressTasks = await TaskServices.count({
			where: {
				taskStatus: 'IN_PROGRESS',
				status: 'ACTIVE',
				createdAt: {
					gte: sixMonthsAgo,
				},
				...andClause,
			},
		});

		// Completed tasks and recently added completed tasks
		const completedTasks = await TaskServices.count({
			where: {
				taskStatus: 'COMPLETED',
				status: 'ACTIVE',
				...andClause,
			},
		});
		const recentlyAddedCompletedTasks = await TaskServices.count({
			where: {
				taskStatus: 'COMPLETED',
				status: 'ACTIVE',
				createdAt: {
					gte: sixMonthsAgo,
				},
				...andClause,
			},
		});

		// Overdue (delayed) tasks:
		// plannedEnd in the past AND not completed (otherwise completed historical tasks would be counted as overdue forever)
		const overdueTasks = await TaskServices.count({
			where: {
				plannedEnd: {
					lt: now,
				},
				taskStatus: { not: 'COMPLETED' },
				status: 'ACTIVE',
				...andClause,
			},
		});
		const recentlyAddedOverdueTasks = await TaskServices.count({
			where: {
				plannedEnd: {
					lt: now,
				},
				taskStatus: { not: 'COMPLETED' },
				status: 'ACTIVE',
				createdAt: {
					gte: sixMonthsAgo,
				},
				...andClause,
			},
		});

		// Dashboard-friendly response (matches frontend cards)
		const dashboard = {
			openTask: { total: pendingTasks, addedLast6Months: recentlyAddedPendingTasks },
			overdueTask: { total: overdueTasks, addedLast6Months: recentlyAddedOverdueTasks },
			inProgress: { total: inProgressTasks, addedLast6Months: recentlyAddedInProgressTasks },
			completed: { total: completedTasks, addedLast6Months: recentlyAddedCompletedTasks },
		};

		// Backward compatibility for any existing clients consuming the old array format
		const legacy = [
			{ pendingTasks, recentlyAddedPendingTasks },
			{ inProgressTasks, recentlyAddedInProgressTasks },
			{ completedTasks, recentlyAddedCompletedTasks },
			{ overdueTasks, recentlyAddedOverdueTasks },
		];

		return responseHandler({ ...dashboard, legacy }, res, 200);
	});

	getRunningTasksSummary = asyncHandler(async (req, res) => {
		const clientFilter = await getClientTaskFilter(req.user);
		const where = {
			taskStatus: 'IN_PROGRESS',
			status: 'ACTIVE',
			...(clientFilter && { AND: [clientFilter] }),
		};
		const runningTasks = await TaskServices.findMany({
			where,
			select: {
				id: true,
				sNo: true,
				name: true,
				phase: {
					select: {
						id: true,
						name: true,
						project: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				priority: true,
			},
		});
		return responseHandler({ runningTasks }, res, 200);
	});

	getPaymentSummary = asyncHandler(async (req, res) => {
		const { pageNo = 0, pageLimit = 10, sortType = 'createdAt', sortOrder = -1 } = req.query;
		const paymentSummary = await PaymentServices.findMany({
			where: {
				status: 'ACTIVE',
			},
			select: {
				id: true,
				sNo: true,
				project: {
					select: {
						id: true,
						name: true,
					},
				},
				client: {
					select: {
						id: true,
						name: true,
					},
				},
				dueDate: true,
				paymentStatus: true,
				paymentDate: true,
				paymentType: true,
				paymentMethod: true,
				otherPaymentMethod: true,
				paymentItems: {
					select: {
						id: true,
						name: true,
						quantity: true,
						price: true,
					},
				},
			},
			orderBy: {
				[sortType]: sortOrder === 1 ? 'asc' : 'desc',
			},
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
		});

		return responseHandler({ paymentSummary }, res);
	})

	getMomSummary = asyncHandler(async (req, res) => {
		const { pageNo = 0, pageLimit = 10, sortType = 'createdAt', sortOrder = -1 } = req.query;
		const momSummary = await MomServices.findMany({
			where: {
				status: 'ACTIVE',
			},
			select: {
				id: true,
				sNo: true,
				startDate: true,
				project: {
					select: {
						id: true,
						name: true,
					},
				},
				momStatus: true,
				momAttendees: {
					select: {
						id: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},
				attachments: {
					select: {
						id: true,
						name: true,
						url: true,
						key: true,
						type: true,
						mimeType: true,
						size: true,
					},
				},
			},
			orderBy: {
				[sortType]: sortOrder === 1 ? 'asc' : 'desc',
			},
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
		});
		return responseHandler({ momSummary }, res);
	});

	getTasksByType = asyncHandler(async (req, res) => {
		const { pageNo = 0, pageLimit = 5 } = req.query;
		const skip = parseInt(pageNo, 10) * parseInt(pageLimit, 10);
		const take = parseInt(pageLimit, 10);

		const clientFilter = await getClientTaskFilter(req.user);
		const andClause = clientFilter ? { AND: [clientFilter] } : {};

		const openWhere = {
			taskStatus: 'PENDING',
			status: 'ACTIVE',
			...andClause,
		};
		const runningWhere = {
			taskStatus: 'IN_PROGRESS',
			status: 'ACTIVE',
			...andClause,
		};

		const taskSelect = {
			id: true,
			sNo: true,
			name: true,
			priority: true,
			phase: {
				select: {
					id: true,
					name: true,
					project: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
			TaskAssignee: {
				select: {
					User: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
		};

		// Fetch Open Tasks (PENDING status) and Running Tasks (IN_PROGRESS status) in parallel
		const [openTasks, openTasksCount, runningTasks, runningTasksCount] = await Promise.all([
			TaskServices.findMany({
				where: openWhere,
				select: taskSelect,
				skip,
				take,
				orderBy: [{ priority: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }],
			}),
			TaskServices.count({
				where: openWhere,
			}),
			TaskServices.findMany({
				where: runningWhere,
				select: taskSelect,
				skip,
				take,
				orderBy: { createdAt: 'desc' },
			}),
			TaskServices.count({
				where: runningWhere,
			}),
		]);

		// Transform to flatten assignees and project
		const transformTasks = (tasks) =>
			tasks.map((task) => ({
				id: task.id,
				sNo: task.sNo,
				name: task.name,
				priority: task.priority || 'MEDIUM', // Default to MEDIUM if null
				phase: task.phase ? { id: task.phase.id, name: task.phase.name } : null,
				project: task.phase?.project || null,
				assignees: task.TaskAssignee?.map((ta) => ta.User) || [],
			}));

		return responseHandler(
			{
				openTasks: transformTasks(openTasks),
				runningTasks: transformTasks(runningTasks),
				pagination: {
					openTasks: { total: openTasksCount, page: parseInt(pageNo, 10), limit: take },
					runningTasks: { total: runningTasksCount, page: parseInt(pageNo, 10), limit: take },
				},
			},
			res,
			200
		);
	});
}

export default new SummaryController();
