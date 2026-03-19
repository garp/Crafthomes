import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import TimesheetServices from '../services/modelServices/timesheet.services.js';
import TimesheetWeekServices from '../services/modelServices/timesheetWeek.services.js';
import TimesheetApproverAssignmentServices from '../services/modelServices/timesheetApproverAssignment.services.js';
import ProjectServices from '../services/modelServices/project.services.js';
import TaskServices from '../services/modelServices/task.services.js';
import TimesheetTaskServices from '../services/modelServices/mapping/timesheetTask.services.js';
import UserServices from '../services/modelServices/user.services.js';
import PrismaService from '../services/databaseServices/db.js';
import { sendNotification, sendNotificationBatch, NOTIFICATION_TYPES } from '../socket/emitters/notification.emitter.js';
import trackActivity from '../middlewares/activities.middleware.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';

const isSuperAdmin = user => String(user?.role?.name || '').toLowerCase() === 'super_admin';

const startOfDay = d => {
	const date = new Date(d);
	date.setHours(0, 0, 0, 0);
	return date;
};

const nextDay = d => {
	const date = startOfDay(d);
	date.setDate(date.getDate() + 1);
	return date;
};

const startOfWeek = d => {
	const date = startOfDay(d);
	const day = date.getDay();
	// Start week on Monday (day 1); if Sunday (0), go back 6 days
	const diff = day === 0 ? 6 : day - 1;
	date.setDate(date.getDate() - diff);
	return date;
};

const nextWeek = d => {
	const date = startOfWeek(d);
	date.setDate(date.getDate() + 7);
	return date;
};

const startOfMonth = d => {
	const date = startOfDay(d);
	date.setDate(1);
	return date;
};

const startOfFinancialYear = d => {
	const date = startOfDay(d);
	const month = date.getMonth(); // 0-indexed (0 = Jan, 3 = Apr)
	const year = date.getFullYear();
	// Financial year starts April 1st
	if (month >= 3) {
		// April or later: FY started this calendar year
		date.setFullYear(year, 3, 1);
	} else {
		// Jan-Mar: FY started previous calendar year
		date.setFullYear(year - 1, 3, 1);
	}
	return date;
};

const sumDurationMinutes = timesheets =>
	timesheets.reduce((acc, t) => {
		if (t.startTime && t.endTime) {
			return acc + Math.round((new Date(t.endTime).getTime() - new Date(t.startTime).getTime()) / (60 * 1000));
		}
		return acc;
	}, 0);

const formatHoursMinutes = totalMinutes => {
	const hours = Math.floor(totalMinutes / 60);
	const minutes = totalMinutes % 60;
	return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const formatDurationForActivity = (minutes) => {
	const hours = Math.floor(minutes / 60);
	const mins = minutes % 60;
	if (hours > 0 && mins > 0) return `${hours}h ${mins}m`;
	if (hours > 0) return `${hours}h`;
	return `${mins}m`;
};

const formatDateForActivity = (date) => {
	const d = new Date(date);
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

/**
 * Log timesheet activity for each linked task (non-blocking).
 * Called after timesheet create/update/delete to record work in the task activity feed.
 */
const logTimesheetActivityForTasks = async ({ tasks, userId, projectId, timesheetId, durationMinutes, date, action }) => {
	if (!tasks || tasks.length === 0) return;

	const formattedDuration = formatDurationForActivity(durationMinutes);
	const formattedDate = formatDateForActivity(date);

	const activityMessages = {
		create: `Logged ${formattedDuration} of work on ${formattedDate}`,
		update: `Updated time log to ${formattedDuration} on ${formattedDate}`,
		delete: `Removed time log of ${formattedDuration} from ${formattedDate}`,
	};

	const message = activityMessages[action] || activityMessages.create;

	const promises = tasks.map((task) =>
		trackActivity(userId, {
			projectId: projectId || undefined,
			entityType: ENTITY_TYPES.TIMESHEET,
			entityId: timesheetId,
			entityName: `Timesheet - ${formattedDate}`,
			taskId: task.id,
			activities: [message],
			activityType: ACTIVITY_TYPES.TIMESHEET,
			metadata: {
				timesheetId,
				durationMinutes,
				date: formattedDate,
				action,
			},
		})
	);

	// Fire-and-forget: don't let activity tracking break the main flow
	Promise.allSettled(promises).catch(() => { });
};

const computeTimeRange = ({ startTime, endTime, duration }) => {
	const start = new Date(startTime);
	if (Number.isNaN(start.getTime())) return { error: 'E-1703' };

	let end = null;

	// Duration takes priority over endTime when provided
	if (duration !== undefined && duration !== null) {
		end = new Date(start.getTime() + Number(duration) * 60 * 1000);
		if (Number.isNaN(end.getTime())) return { error: 'E-1703' };
	} else if (endTime) {
		end = new Date(endTime);
		if (Number.isNaN(end.getTime())) return { error: 'E-1703' };
	}

	if (!end) return { error: 'E-1703' };
	if (end.getTime() <= start.getTime()) return { error: 'E-1703' };

	// basic sanity cap to prevent runaway durations
	if (end.getTime() - start.getTime() > 24 * 60 * 60 * 1000) return { error: 'E-1703' };

	return { start, end };
};

const buildOverlapWhere = ({ userId, start, end, excludeId }) => {
	const where = {
		userId,
		...(excludeId ? { id: { not: excludeId } } : {}),
		OR: [
			// Records with endTime present: standard overlap check
			{
				endTime: { not: null, gt: start },
				startTime: { lt: end },
			},
			// Records with endTime missing (legacy/null): treat as point-in-time at startTime
			{
				endTime: null,
				startTime: { gte: start, lt: end },
			},
		],
	};
	return where;
};

const isValidDate = d => d instanceof Date && !Number.isNaN(d.getTime());

const normalizeWeekStart = input => {
	const base = input ? new Date(input) : new Date();
	if (!isValidDate(base)) return null;
	return startOfWeek(base);
};

const hasActiveAssignment = (assignment, now = new Date()) => {
	if (!assignment?.active) return false;
	const from = assignment.effectiveFrom ? new Date(assignment.effectiveFrom) : null;
	const to = assignment.effectiveTo ? new Date(assignment.effectiveTo) : null;
	if (from && isValidDate(from) && now.getTime() < from.getTime()) return false;
	if (to && isValidDate(to) && now.getTime() > to.getTime()) return false;
	return true;
};

const requireApproverForEmployee = async ({ approverId, employeeId }) => {
	const now = new Date();
	const assignment = await TimesheetApproverAssignmentServices.findFirst({
		where: { employeeId, approverId },
		select: { id: true, active: true, effectiveFrom: true, effectiveTo: true },
	});
	return Boolean(assignment && hasActiveAssignment(assignment, now));
};

const logDecision = async ({ actorId, targetType, action, timesheetId, timesheetWeekId, comment, metadata }) => {
	try {
		await PrismaService.getInstance().timesheetDecisionLog.create({
			data: {
				actorId,
				targetType,
				action,
				comment: comment || null,
				metadata: metadata || undefined,
				timesheetId: timesheetId || null,
				timesheetWeekId: timesheetWeekId || null,
			},
		});
	} catch (err) {
		// audit log must never break main flow
		console.warn('TimesheetDecisionLog failed:', err?.message || err);
	}
};

const computeWeekStatusFromEntries = entries => {
	const statuses = (entries || []).map(e => e.status).filter(Boolean);
	if (statuses.length === 0) return null;
	if (statuses.includes('REJECTED')) return 'REJECTED';
	if (statuses.every(s => s === 'BILLED')) return 'BILLED';
	if (statuses.every(s => s === 'APPROVED' || s === 'BILLED')) return 'APPROVED';
	if (statuses.every(s => s === 'SUBMITTED' || s === 'APPROVED' || s === 'REJECTED' || s === 'BILLED')) return 'SUBMITTED';
	return 'DRAFT';
};

class TimesheetController {
	create = asyncHandler(async (req, res) => {
		const { projectId, taskId, taskIds, description, date, startTime, endTime, duration } = req.body;
		const { userId } = req.user;

		const range = computeTimeRange({ startTime, endTime, duration });
		if (range.error) return errorHandler(range.error, res);

		const normalizedTaskIds = taskIds && Array.isArray(taskIds) ? taskIds.filter(Boolean) : [];
		if (taskId) normalizedTaskIds.push(taskId);
		const uniqueTaskIds = Array.from(new Set(normalizedTaskIds));

		// Validate task/project linkage (fast + prevents Prisma relation errors)
		const [tasks, project] = await Promise.all([
			uniqueTaskIds.length > 0
				? TaskServices.findMany({
					where: { id: { in: uniqueTaskIds } },
					select: {
						id: true,
						name: true,
						phase: { select: { projectId: true } },
					},
				})
				: Promise.resolve([]),
			projectId ? ProjectServices.findOne({ where: { id: projectId }, select: { id: true, name: true } }) : Promise.resolve(null),
		]);

		if (uniqueTaskIds.length > 0 && tasks.length !== uniqueTaskIds.length) return errorHandler('E-603', res);
		if (projectId && !project) return errorHandler('E-401', res);

		// Ensure tasks belong to a single project (and match projectId if provided)
		if (tasks.length > 0) {
			const projectIds = Array.from(new Set(tasks.map(t => t?.phase?.projectId).filter(Boolean)));
			if (projectIds.length > 1) return errorHandler('E-422', res, 'Selected tasks belong to multiple projects');
			if (projectId && projectIds.length === 1 && projectIds[0] !== projectId) {
				return errorHandler('E-422', res, 'One or more tasks do not belong to the provided project');
			}
		}

		// Prevent overlaps for same user (across all tasks/projects)
		const overlap = await TimesheetServices.findFirst({
			where: buildOverlapWhere({ userId, start: range.start, end: range.end }),
			select: { id: true },
		});
		if (overlap) return errorHandler('E-1702', res);

		// derive projectId from tasks if not provided
		const derivedProjectId = projectId || tasks.find(t => t?.phase?.projectId)?.phase?.projectId || null;

		const created = await TimesheetServices.create({
			data: {
				projectId: derivedProjectId,
				userId,
				description: description || null,
				date,
				startTime: range.start,
				endTime: range.end,
				createdBy: userId,
				updatedBy: userId,
			},
			include: {
				project: { select: { id: true, name: true } },
				user: { select: { id: true, name: true, email: true } },
			},
		});

		// Create junction rows (if tasks provided)
		if (tasks.length > 0) {
			await TimesheetTaskServices.createMany({
				data: tasks.map(t => ({
					timesheetId: created.id,
					taskId: t.id,
					createdBy: userId,
				})),
			});
		}

		const linkedTasks = tasks.map(t => ({ id: t.id, name: t.name }));
		const durationMinutes = Math.round(
			(new Date(created.endTime).getTime() - new Date(created.startTime).getTime()) / (60 * 1000)
		);

		// Log activity for each linked task (non-blocking)
		logTimesheetActivityForTasks({
			tasks: linkedTasks,
			userId,
			projectId: derivedProjectId,
			timesheetId: created.id,
			durationMinutes,
			date: created.date || created.startTime,
			action: 'create',
		});

		return responseHandler({ ...created, tasks: linkedTasks, durationMinutes }, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const {
			id,
			userId: queryUserId,
			projectId,
			taskIds,
			date,
			fromDate,
			toDate,
			startTime,
			endTime,
			status,
			pageNo = 0,
			pageLimit = 10,
			sortType = 'createdAt',
			sortOrder = -1,
		} = req.query;

		// Use query userId if provided, otherwise fall back to token userId
		const userId = queryUserId || req.user.userId;
		const where = { userId };

		if (id) where.id = id;
		if (projectId) where.projectId = projectId;
		if (status) where.status = status;

		// date filters
		if (date) {
			where.date = { gte: startOfDay(date), lt: nextDay(date) };
		} else if (fromDate || toDate) {
			where.date = {};
			if (fromDate) where.date.gte = startOfDay(fromDate);
			if (toDate) where.date.lt = nextDay(toDate);
		}

		// time range filters
		if (startTime) where.startTime = { gte: new Date(startTime) };
		if (endTime) where.endTime = { lte: new Date(endTime) };

		const skip = parseInt(pageNo, 10) * parseInt(pageLimit, 10);
		const take = parseInt(pageLimit, 10);
		const orderBy = { [sortType]: sortOrder === 1 ? 'asc' : 'desc' };

		// filter by taskIds through junction table
		if (taskIds) {
			// normalize to array (validator allows single string or array)
			const taskIdArray = Array.isArray(taskIds) ? taskIds : [taskIds];
			where.TimesheetTask = { some: { taskId: { in: taskIdArray } } };
		}

		// Date boundaries for stats (based on current date)
		const now = new Date();
		const todayStart = startOfDay(now);
		const todayEnd = nextDay(now);
		const weekStart = startOfWeek(now);
		const monthStart = startOfMonth(now);
		const fyStart = startOfFinancialYear(now);

		const [totalCount, timesheets, todayTimesheets, weekTimesheets, monthTimesheets, fyTimesheets] = await Promise.all([
			TimesheetServices.count({ where }),
			TimesheetServices.findMany({
				where,
				skip,
				take,
				include: {
					project: { select: { id: true, name: true } },
					TimesheetTask: {
						select: {
							taskId: true,
							Task: { select: { id: true, name: true } },
						},
					},
				},
				orderBy,
			}),
			// Stats queries - fetch timesheets for each period
			TimesheetServices.findMany({
				where: { userId, date: { gte: todayStart, lt: todayEnd } },
				select: { startTime: true, endTime: true },
			}),
			TimesheetServices.findMany({
				where: { userId, date: { gte: weekStart, lt: todayEnd } },
				select: { startTime: true, endTime: true },
			}),
			TimesheetServices.findMany({
				where: { userId, date: { gte: monthStart, lt: todayEnd } },
				select: { startTime: true, endTime: true },
			}),
			TimesheetServices.findMany({
				where: { userId, date: { gte: fyStart, lt: todayEnd } },
				select: { startTime: true, endTime: true },
			}),
		]);

		// Calculate stats
		const stats = {
			today: {
				totalMinutes: sumDurationMinutes(todayTimesheets),
				formatted: formatHoursMinutes(sumDurationMinutes(todayTimesheets)),
			},
			thisWeek: {
				totalMinutes: sumDurationMinutes(weekTimesheets),
				formatted: formatHoursMinutes(sumDurationMinutes(weekTimesheets)),
			},
			thisMonth: {
				totalMinutes: sumDurationMinutes(monthTimesheets),
				formatted: formatHoursMinutes(sumDurationMinutes(monthTimesheets)),
			},
			thisFinancialYear: {
				totalMinutes: sumDurationMinutes(fyTimesheets),
				formatted: formatHoursMinutes(sumDurationMinutes(fyTimesheets)),
			},
		};

		const enriched = timesheets.map(t => ({
			...t,
			tasks: (t.TimesheetTask || []).map(tt => tt.Task).filter(Boolean),
			TimesheetTask: undefined,
			durationMinutes:
				t.startTime && t.endTime
					? Math.round((new Date(t.endTime).getTime() - new Date(t.startTime).getTime()) / (60 * 1000))
					: null,
		}));

		return responseHandler({ timesheets: enriched, totalCount, stats }, res, 200);
	});

	getById = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const timesheet = await TimesheetServices.findOne({
			where: { id },
			include: {
				project: { select: { id: true, name: true } },
				TimesheetTask: {
					select: {
						taskId: true,
						Task: { select: { id: true, name: true } },
					},
				},
				user: { select: { id: true, name: true, email: true } },
			},
		});

		if (!timesheet) return errorHandler('E-1701', res);
		if (timesheet.userId !== userId && !isSuperAdmin(req.user)) return errorHandler('E-007', res);

		const durationMinutes =
			timesheet.startTime && timesheet.endTime
				? Math.round((new Date(timesheet.endTime).getTime() - new Date(timesheet.startTime).getTime()) / (60 * 1000))
				: null;
		const tasks = (timesheet.TimesheetTask || []).map(tt => tt.Task).filter(Boolean);
		return responseHandler({ ...timesheet, tasks, TimesheetTask: undefined, durationMinutes }, res, 200);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const { projectId, taskId, taskIds, description, date, startTime, endTime, duration, status } = req.body;

		const existing = await TimesheetServices.findOne({
			where: { id },
			include: {
				TimesheetTask: { select: { taskId: true } },
				timesheetWeek: { select: { id: true, status: true } },
			},
		});
		if (!existing) return errorHandler('E-1701', res);
		if (existing.userId !== userId && !isSuperAdmin(req.user)) return errorHandler('E-007', res);

		// Status rules
		if (status !== undefined && !isSuperAdmin(req.user)) return errorHandler('E-007', res);

		const updatingCoreFields =
			projectId !== undefined ||
			taskId !== undefined ||
			taskIds !== undefined ||
			description !== undefined ||
			date !== undefined ||
			startTime !== undefined ||
			endTime !== undefined ||
			duration !== undefined;

		if (
			(existing.status !== 'PENDING' || (existing.timesheetWeek && existing.timesheetWeek.status !== 'DRAFT')) &&
			updatingCoreFields &&
			!isSuperAdmin(req.user)
		) {
			return errorHandler('E-1704', res);
		}

		// Normalize replacement tasks (if provided)
		const normalizedTaskIds = taskIds === null ? null : Array.isArray(taskIds) ? taskIds.filter(Boolean) : [];
		if (taskId) {
			if (normalizedTaskIds === null)
				return errorHandler('E-422', res, 'Use either taskIds=null to clear OR provide taskId/taskIds to set');
			normalizedTaskIds.push(taskId);
		}
		const uniqueTaskIds = normalizedTaskIds === null ? null : Array.from(new Set(normalizedTaskIds));

		// Validate project and tasks if provided
		const [tasks, project] = await Promise.all([
			uniqueTaskIds && uniqueTaskIds.length > 0
				? TaskServices.findMany({
					where: { id: { in: uniqueTaskIds } },
					select: { id: true, name: true, phase: { select: { projectId: true } } },
				})
				: Promise.resolve([]),
			projectId ? ProjectServices.findOne({ where: { id: projectId }, select: { id: true } }) : Promise.resolve(null),
		]);

		if (uniqueTaskIds && uniqueTaskIds.length > 0 && tasks.length !== uniqueTaskIds.length) return errorHandler('E-603', res);
		if (projectId !== undefined && projectId !== null && projectId !== '' && projectId && !project)
			return errorHandler('E-401', res);
		if (tasks.length > 0) {
			const taskProjectIds = Array.from(new Set(tasks.map(t => t?.phase?.projectId).filter(Boolean)));
			if (taskProjectIds.length > 1) return errorHandler('E-422', res, 'Selected tasks belong to multiple projects');

			// If projectId explicitly provided, tasks must match it (when task has a project)
			if (projectId && taskProjectIds.length === 1 && taskProjectIds[0] !== projectId) {
				return errorHandler('E-422', res, 'One or more tasks do not belong to the provided project');
			}

			// If projectId not provided but timesheet already has a project, enforce match
			if (!projectId && existing.projectId && taskProjectIds.length === 1 && taskProjectIds[0] !== existing.projectId) {
				return errorHandler('E-422', res, 'One or more tasks do not belong to the timesheet project');
			}
		}

		// Compute new time range if any time fields change
		let newStart = existing.startTime;
		let newEnd = existing.endTime;
		if (startTime !== undefined || endTime !== undefined || duration !== undefined) {
			const range = computeTimeRange({
				startTime: startTime !== undefined ? startTime : existing.startTime,
				// Only pass existing endTime if endTime is explicitly provided OR duration is not provided
				// If duration is provided without endTime, let duration compute the new endTime
				endTime: endTime !== undefined ? endTime : duration !== undefined ? undefined : existing.endTime,
				duration: duration !== undefined ? duration : undefined,
			});
			if (range.error) return errorHandler(range.error, res);
			newStart = range.start;
			newEnd = range.end;

			const overlap = await TimesheetServices.findFirst({
				where: buildOverlapWhere({ userId: existing.userId, start: newStart, end: newEnd, excludeId: existing.id }),
				select: { id: true },
			});
			if (overlap) return errorHandler('E-1702', res);
		}

		const updated = await TimesheetServices.update({
			where: { id },
			data: {
				// If caller explicitly sets projectId (including null), use it.
				// Else, if tasks are being replaced and existing has no projectId, derive projectId from tasks.
				projectId:
					projectId !== undefined
						? projectId || null
						: (taskIds !== undefined || taskId !== undefined) && !existing.projectId
							? tasks.find(t => t?.phase?.projectId)?.phase?.projectId || null
							: undefined,
				description: description !== undefined ? description : undefined,
				date: date !== undefined ? date : undefined,
				startTime: startTime !== undefined || endTime !== undefined || duration !== undefined ? newStart : undefined,
				endTime: startTime !== undefined || endTime !== undefined || duration !== undefined ? newEnd : undefined,
				status: status !== undefined ? status : undefined,
				updatedBy: userId,
			},
			include: {
				project: { select: { id: true, name: true } },
				user: { select: { id: true, name: true, email: true } },
			},
		});

		// Replace task links if requested (taskIds null clears all)
		if (taskIds !== undefined || taskId !== undefined) {
			await TimesheetTaskServices.deleteMany({ where: { timesheetId: id } });
			if (uniqueTaskIds !== null && tasks.length > 0) {
				await TimesheetTaskServices.createMany({
					data: tasks.map(t => ({
						timesheetId: id,
						taskId: t.id,
						createdBy: userId,
					})),
				});
			}
		}

		const durationMinutes =
			updated.startTime && updated.endTime
				? Math.round((new Date(updated.endTime).getTime() - new Date(updated.startTime).getTime()) / (60 * 1000))
				: null;

		// Return current tasks from junction (consistent response)
		const taskLinks = await TimesheetTaskServices.findMany({
			where: { timesheetId: id },
			select: {
				Task: { select: { id: true, name: true } },
			},
		});
		const currentTasks = (taskLinks || []).map(l => l.Task).filter(Boolean);

		// Log activity for each linked task (non-blocking)
		if (currentTasks.length > 0) {
			logTimesheetActivityForTasks({
				tasks: currentTasks,
				userId,
				projectId: updated.projectId,
				timesheetId: id,
				durationMinutes,
				date: updated.date || updated.startTime,
				action: 'update',
			});
		}

		return responseHandler({ ...updated, tasks: currentTasks, durationMinutes }, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existing = await TimesheetServices.findOne({
			where: { id },
			include: {
				timesheetWeek: { select: { id: true, status: true } },
				TimesheetTask: { select: { Task: { select: { id: true, name: true } } } },
			},
		});
		if (!existing) return errorHandler('E-1701', res);
		if (existing.userId !== userId && !isSuperAdmin(req.user)) return errorHandler('E-007', res);
		if (
			(existing.status !== 'PENDING' || (existing.timesheetWeek && existing.timesheetWeek.status !== 'DRAFT')) &&
			!isSuperAdmin(req.user)
		) {
			return errorHandler('E-1704', res);
		}

		// Capture linked tasks before deletion (cascade removes junction rows)
		const linkedTasks = (existing.TimesheetTask || []).map(tt => tt.Task).filter(Boolean);
		const durationMinutes =
			existing.startTime && existing.endTime
				? Math.round((new Date(existing.endTime).getTime() - new Date(existing.startTime).getTime()) / (60 * 1000))
				: 0;

		const deleted = await TimesheetServices.delete({ where: { id } });

		// Log activity for each previously linked task (non-blocking)
		if (linkedTasks.length > 0) {
			logTimesheetActivityForTasks({
				tasks: linkedTasks,
				userId,
				projectId: existing.projectId,
				timesheetId: id,
				durationMinutes,
				date: existing.date || existing.startTime,
				action: 'delete',
			});
		}

		return responseHandler(deleted, res, 200);
	});

	submitWeek = asyncHandler(async (req, res) => {
		const { userId } = req.user;

		// Get ALL pending timesheet entries (across all weeks)
		const allPendingEntries = await TimesheetServices.findMany({
			where: { userId, status: 'PENDING' },
			select: { id: true, date: true, status: true, timesheetWeekId: true },
			orderBy: { date: 'asc' },
		});

		if (!allPendingEntries || allPendingEntries.length === 0) {
			return errorHandler('E-422', res, 'No pending timesheet entries found');
		}

		// Group entries by week (Monday-Sunday)
		const entriesByWeek = new Map();
		for (const entry of allPendingEntries) {
			if (!entry.date) continue;
			const weekStart = startOfWeek(entry.date);
			const weekKey = weekStart.toISOString();
			if (!entriesByWeek.has(weekKey)) {
				entriesByWeek.set(weekKey, {
					weekStart,
					weekEnd: nextWeek(weekStart),
					entries: [],
				});
			}
			entriesByWeek.get(weekKey).entries.push(entry);
		}

		const submittedWeeks = [];

		// For each week, create/update TimesheetWeek and submit entries
		for (const [weekKey, weekData] of entriesByWeek.entries()) {
			const { weekStart, weekEnd, entries } = weekData;

			// Create or get week row
			const week = await TimesheetWeekServices.upsert({
				where: { userId_weekStartDate: { userId, weekStartDate: weekStart } },
				create: {
					userId,
					weekStartDate: weekStart,
					weekEndDate: weekEnd,
					status: 'SUBMITTED',
					submittedAt: new Date(),
					submittedBy: userId,
					createdBy: userId,
					updatedBy: userId,
				},
				update: {
					weekEndDate: weekEnd,
					status: 'SUBMITTED',
					submittedAt: new Date(),
					submittedBy: userId,
					updatedBy: userId,
				},
				select: { id: true, userId: true, weekStartDate: true, weekEndDate: true, status: true, submittedAt: true },
			});

			// Attach entries to week + mark submitted
			const entryIds = entries.map(e => e.id);
			await TimesheetServices.updateMany({
				where: { id: { in: entryIds }, status: 'PENDING' },
				data: {
					timesheetWeekId: week.id,
					status: 'SUBMITTED',
					submittedAt: new Date(),
					submittedBy: userId,
					updatedBy: userId,
				},
			});

			await logDecision({
				actorId: userId,
				targetType: 'WEEK',
				action: 'SUBMIT',
				timesheetWeekId: week.id,
				metadata: { weekStartDate: weekStart.toISOString(), entryCount: entries.length },
			});

			// Notify approvers about submission (non-blocking)
			setImmediate(async () => {
				try {
					// Get explicit approvers
					const assignments = await TimesheetApproverAssignmentServices.findMany({
						where: { employeeId: userId, active: true },
						select: { approverId: true },
					});
					const approverIds = assignments.map(a => a.approverId);

					// Get manager via reportsTo
					const submitter = await UserServices.findOne({
						where: { id: userId },
						select: { name: true, reportsToId: true },
					});
					if (submitter?.reportsToId) approverIds.push(submitter.reportsToId);

					const uniqueApproverIds = [...new Set(approverIds)];
					if (uniqueApproverIds.length > 0) {
						const weekLabel = weekStart.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
						sendNotificationBatch(uniqueApproverIds, {
							actorId: userId,
							type: NOTIFICATION_TYPES.TIMESHEET_WEEK_SUBMITTED,
							title: `${submitter?.name || 'A team member'} submitted timesheet for week of ${weekLabel}`,
							metadata: { timesheetWeekId: week.id },
						});
					}
				} catch (err) {
					console.error('Failed to send timesheet submission notifications:', err);
				}
			});

			submittedWeeks.push(week);
		}

		return responseHandler({ weeks: submittedWeeks, count: submittedWeeks.length }, res, 200);
	});

	getApprovals = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { employeeId, weekStartDate, status, pageNo = 0, pageLimit = 20 } = req.query;

		// 1. Check for explicit approver assignments
		const assignmentWhere = { approverId: userId, active: true };
		if (employeeId) assignmentWhere.employeeId = employeeId;

		const assignments = await TimesheetApproverAssignmentServices.findMany({
			where: assignmentWhere,
			select: { employeeId: true, effectiveFrom: true, effectiveTo: true, active: true },
		});
		const assignedEmployeeIds = assignments.filter(a => hasActiveAssignment(a)).map(a => a.employeeId);

		// 2. Fall back to users who report to this approver (via reportsToId)
		const directReports = await UserServices.findMany({
			where: { reportsToId: userId, status: 'ACTIVE' },
			select: { id: true },
		});
		const directReportIds = directReports.map(u => u.id);

		// 3. Combine both lists (explicit assignments + direct reports)
		const activeEmployeeIds = [...new Set([...assignedEmployeeIds, ...directReportIds])];

		// If filtering by specific employee, check if they're in the combined list
		if (employeeId && !activeEmployeeIds.includes(employeeId)) {
			return responseHandler({ weeks: [], totalCount: 0 }, res, 200);
		}

		if (activeEmployeeIds.length === 0) {
			return responseHandler({ weeks: [], totalCount: 0 }, res, 200);
		}

		// If employeeId is provided, filter only that employee's weeks.
		// Otherwise, show weeks for all employees this approver can approve.
		const where = employeeId ? { userId: employeeId } : { userId: { in: activeEmployeeIds } };
		if (status) where.status = status;
		if (weekStartDate) {
			const w = normalizeWeekStart(weekStartDate);
			if (!w) return errorHandler('E-422', res, 'Invalid weekStartDate');
			where.weekStartDate = w;
		}

		const skip = parseInt(pageNo, 10) * parseInt(pageLimit, 10);
		const take = parseInt(pageLimit, 10);

		const [totalCount, weeks] = await Promise.all([
			TimesheetWeekServices.count({ where }),
			TimesheetWeekServices.findMany({
				where,
				skip,
				take,
				orderBy: { weekStartDate: 'desc' },
				include: {
					user: { select: { id: true, name: true, email: true, designation: { select: { name: true, displayName: true } } } },
					timesheets: {
						select: {
							id: true,
							date: true,
							startTime: true,
							endTime: true,
							status: true,
							description: true,
							project: { select: { id: true, name: true } },
						},
					},
				},
			}),
		]);

		// add totals (computed in JS)
		const enriched = (weeks || []).map(w => {
			const totalMinutes = sumDurationMinutes(w.timesheets || []);
			return {
				...w,
				totals: {
					totalMinutes,
					formatted: formatHoursMinutes(totalMinutes),
					entryCount: (w.timesheets || []).length,
				},
			};
		});

		return responseHandler({ weeks: enriched, totalCount }, res, 200);
	});

	decideEntry = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const { action, comment, billingRef } = req.body;

		const existing = await TimesheetServices.findOne({
			where: { id },
			include: { timesheetWeek: { select: { id: true, status: true } } },
		});
		if (!existing) return errorHandler('E-1701', res);

		const canAct =
			isSuperAdmin(req.user) || (await requireApproverForEmployee({ approverId: userId, employeeId: existing.userId }));
		if (!canAct) return errorHandler('E-007', res);

		if (action === 'REJECT' && (comment === undefined || comment === null || String(comment).trim() === '')) {
			return errorHandler('E-422', res, 'Reject requires comment');
		}

		const now = new Date();
		const data = { updatedBy: userId };
		if (action === 'APPROVE') {
			data.status = 'APPROVED';
			data.approvedAt = now;
			data.approvedBy = userId;
			data.rejectedAt = null;
			data.rejectedBy = null;
			data.rejectionComment = null;
		} else if (action === 'REJECT') {
			data.status = 'REJECTED';
			data.rejectedAt = now;
			data.rejectedBy = userId;
			data.rejectionComment = String(comment || '').trim();
		} else if (action === 'BILL') {
			data.status = 'BILLED';
			data.billedAt = now;
			data.billedBy = userId;
			data.billingRef = billingRef ? String(billingRef) : null;
		}

		const updated = await TimesheetServices.update({
			where: { id },
			data,
			include: { timesheetWeek: { select: { id: true, weekStartDate: true } } },
		});

		await logDecision({
			actorId: userId,
			targetType: 'ENTRY',
			action,
			timesheetId: id,
			timesheetWeekId: updated.timesheetWeekId || undefined,
			comment: action === 'REJECT' ? data.rejectionComment : null,
			metadata: action === 'BILL' ? { billingRef: data.billingRef } : undefined,
		});

		// Notify timesheet owner about the decision (non-blocking)
		if (existing.userId && existing.userId !== userId) {
			const typeMap = { APPROVE: NOTIFICATION_TYPES.TIMESHEET_APPROVED, REJECT: NOTIFICATION_TYPES.TIMESHEET_REJECTED, BILL: NOTIFICATION_TYPES.TIMESHEET_BILLED };
			const titleMap = { APPROVE: 'Your timesheet entry was approved', REJECT: 'Your timesheet entry was rejected', BILL: 'Your timesheet entry was billed' };
			if (typeMap[action]) {
				sendNotification({
					userId: existing.userId,
					actorId: userId,
					type: typeMap[action],
					title: titleMap[action],
					message: action === 'REJECT' ? data.rejectionComment : undefined,
					metadata: { timesheetId: id, timesheetWeekId: updated.timesheetWeekId },
				});
			}
		}

		// Update week derived status if linked
		if (updated.timesheetWeekId) {
			const entries = await TimesheetServices.findMany({
				where: { timesheetWeekId: updated.timesheetWeekId },
				select: { status: true },
			});
			const derived = computeWeekStatusFromEntries(entries);
			if (derived) {
				await TimesheetWeekServices.update({
					where: { id: updated.timesheetWeekId },
					data: {
						status: derived,
						...(derived === 'APPROVED' ? { approvedAt: now, approvedBy: userId } : {}),
						...(derived === 'REJECTED' ? { rejectedAt: now, rejectedBy: userId } : {}),
						...(derived === 'BILLED' ? { billedAt: now, billedBy: userId, billingRef: data.billingRef || undefined } : {}),
						updatedBy: userId,
					},
				});
			}
		}

		return responseHandler(updated, res, 200);
	});

	decideWeek = asyncHandler(async (req, res) => {
		const { id } = req.params; // weekId
		const { userId } = req.user;
		const { action, comment, billingRef } = req.body;

		const week = await TimesheetWeekServices.findOne({
			where: { id },
			include: { user: { select: { id: true } } },
		});
		if (!week) return errorHandler('E-422', res, 'Timesheet week not found');

		const canAct = isSuperAdmin(req.user) || (await requireApproverForEmployee({ approverId: userId, employeeId: week.userId }));
		if (!canAct) return errorHandler('E-007', res);

		if (action === 'REJECT' && (comment === undefined || comment === null || String(comment).trim() === '')) {
			return errorHandler('E-422', res, 'Reject requires comment');
		}

		const now = new Date();
		const weekData = { updatedBy: userId };
		let entryData = null;

		if (action === 'APPROVE') {
			weekData.status = 'APPROVED';
			weekData.approvedAt = now;
			weekData.approvedBy = userId;
			weekData.rejectedAt = null;
			weekData.rejectedBy = null;
			weekData.rejectionComment = null;
			entryData = {
				status: 'APPROVED',
				approvedAt: now,
				approvedBy: userId,
				rejectedAt: null,
				rejectedBy: null,
				rejectionComment: null,
				updatedBy: userId,
			};
		} else if (action === 'REJECT') {
			weekData.status = 'REJECTED';
			weekData.rejectedAt = now;
			weekData.rejectedBy = userId;
			weekData.rejectionComment = String(comment || '').trim();
			entryData = {
				status: 'REJECTED',
				rejectedAt: now,
				rejectedBy: userId,
				rejectionComment: weekData.rejectionComment,
				updatedBy: userId,
			};
		} else if (action === 'BILL') {
			weekData.status = 'BILLED';
			weekData.billedAt = now;
			weekData.billedBy = userId;
			weekData.billingRef = billingRef ? String(billingRef) : null;
			entryData = { status: 'BILLED', billedAt: now, billedBy: userId, billingRef: weekData.billingRef, updatedBy: userId };
		}

		const updatedWeek = await TimesheetWeekServices.update({
			where: { id },
			data: weekData,
		});

		if (entryData) {
			await TimesheetServices.updateMany({
				where: { timesheetWeekId: id },
				data: entryData,
			});
		}

		await logDecision({
			actorId: userId,
			targetType: 'WEEK',
			action,
			timesheetWeekId: id,
			comment: action === 'REJECT' ? weekData.rejectionComment : null,
			metadata: action === 'BILL' ? { billingRef: weekData.billingRef } : undefined,
		});

		// Notify timesheet owner about week decision (non-blocking)
		if (week.userId && week.userId !== userId) {
			const typeMap = { APPROVE: NOTIFICATION_TYPES.TIMESHEET_APPROVED, REJECT: NOTIFICATION_TYPES.TIMESHEET_REJECTED, BILL: NOTIFICATION_TYPES.TIMESHEET_BILLED };
			const titleMap = { APPROVE: 'Your timesheet week was approved', REJECT: 'Your timesheet week was rejected', BILL: 'Your timesheet week was billed' };
			if (typeMap[action]) {
				sendNotification({
					userId: week.userId,
					actorId: userId,
					type: typeMap[action],
					title: titleMap[action],
					message: action === 'REJECT' ? weekData.rejectionComment : undefined,
					metadata: { timesheetWeekId: id },
				});
			}
		}

		return responseHandler(updatedWeek, res, 200);
	});

	createApproverAssignment = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		if (!isSuperAdmin(req.user)) return errorHandler('E-007', res);

		const created = await TimesheetApproverAssignmentServices.create({
			data: {
				employeeId: req.body.employeeId,
				approverId: req.body.approverId,
				active: req.body.active !== undefined ? req.body.active : true,
				effectiveFrom: req.body.effectiveFrom || null,
				effectiveTo: req.body.effectiveTo || null,
				createdBy: userId,
				updatedBy: userId,
			},
		});
		return responseHandler(created, res, 201);
	});

	getApproverAssignments = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		if (!isSuperAdmin(req.user)) return errorHandler('E-007', res);

		const { employeeId, approverId, active, pageNo = 0, pageLimit = 20 } = req.query;
		const where = {};
		if (employeeId) where.employeeId = employeeId;
		if (approverId) where.approverId = approverId;
		if (active !== undefined) where.active = active === true || String(active).toLowerCase() === 'true';

		const skip = parseInt(pageNo, 10) * parseInt(pageLimit, 10);
		const take = parseInt(pageLimit, 10);

		const [totalCount, assignments] = await Promise.all([
			TimesheetApproverAssignmentServices.count({ where }),
			TimesheetApproverAssignmentServices.findMany({
				where,
				skip,
				take,
				orderBy: { createdAt: 'desc' },
				include: {
					employee: { select: { id: true, name: true, email: true } },
					approver: { select: { id: true, name: true, email: true } },
				},
			}),
		]);

		return responseHandler({ assignments, totalCount }, res, 200);
	});

	updateApproverAssignment = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		if (!isSuperAdmin(req.user)) return errorHandler('E-007', res);

		const { id } = req.params;
		const existing = await TimesheetApproverAssignmentServices.findOne({ where: { id } });
		if (!existing) return errorHandler('E-422', res, 'Approver assignment not found');

		const updated = await TimesheetApproverAssignmentServices.update({
			where: { id },
			data: {
				active: req.body.active !== undefined ? req.body.active : undefined,
				effectiveFrom: req.body.effectiveFrom !== undefined ? req.body.effectiveFrom : undefined,
				effectiveTo: req.body.effectiveTo !== undefined ? req.body.effectiveTo : undefined,
				updatedBy: userId,
			},
		});
		return responseHandler(updated, res, 200);
	});

	deleteApproverAssignment = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		if (!isSuperAdmin(req.user)) return errorHandler('E-007', res);

		const { id } = req.params;
		const existing = await TimesheetApproverAssignmentServices.findOne({ where: { id } });
		if (!existing) return errorHandler('E-422', res, 'Approver assignment not found');

		const updated = await TimesheetApproverAssignmentServices.update({
			where: { id },
			data: { active: false, updatedBy: userId },
		});
		return responseHandler(updated, res, 200);
	});
}

export default new TimesheetController();
