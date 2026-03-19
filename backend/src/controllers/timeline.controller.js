import TimelineService from '../services/modelServices/timeline.service.js';
import TimelinePhaseOrderServices from '../services/modelServices/mapping/timelinePhaseOrder.services.js';
import TimelineTaskOrderServices from '../services/modelServices/mapping/timelineTaskOrder.services.js';
import TaskPredecessorServices from '../services/modelServices/mapping/taskPredecessor.services.js';
import { asyncHandler, transactionHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import MasterPhaseService from '../services/modelServices/master/masterPhase.services.js';
import PhaseService from '../services/modelServices/phase.services.js';
import TaskServices from '../services/modelServices/task.services.js';
import { computeDelayedBy } from '../utils/functions/timeFunction.js';
import UserServices from '../services/modelServices/user.services.js';
import trackActivity from '../middlewares/activities.middleware.js';
import TaskAssigneeServices from '../services/modelServices/taskAssignee.services.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';

function addDays(date, days) {
	const nextDate = new Date(date);
	nextDate.setDate(nextDate.getDate() + days);
	return nextDate;
}

function toDateValue(date) {
	if (!date) return null;
	const normalizedDate = date instanceof Date ? date : new Date(date);
	return Number.isNaN(normalizedDate.getTime()) ? null : normalizedDate.getTime();
}

function normalizeMasterSubTaskTemplates(subTasks) {
	if (!Array.isArray(subTasks)) return [];

	return subTasks
		.filter(subTask => subTask && subTask.name)
		.map((subTask, index) => ({
			id: subTask.id || `master-subtask-${index}`,
			name: subTask.name,
			description: subTask.description ?? '',
			duration: subTask.duration ?? null,
			predecessorTaskId: subTask.predecessorTaskId || null,
			priority: subTask.priority || 'MEDIUM',
			notes: subTask.notes ?? '',
		}));
}

async function cloneMasterSubTasksIntoTask({ tx, masterTaskSubTasks, parentTaskId, userId, taskPlannedStart }) {
	const normalizedSubTasks = normalizeMasterSubTaskTemplates(masterTaskSubTasks);
	if (normalizedSubTasks.length === 0) return;

	const templateSubTaskIdToCreatedSubTaskId = new Map();
	const pendingSubTaskPredecessors = [];

	for (let subTaskIndex = 0; subTaskIndex < normalizedSubTasks.length; subTaskIndex += 1) {
		const templateSubTask = normalizedSubTasks[subTaskIndex];
		const shouldAutoScheduleSubTask = !templateSubTask.predecessorTaskId && taskPlannedStart && templateSubTask.duration != null;
		const subTaskPlannedStart = shouldAutoScheduleSubTask ? new Date(taskPlannedStart) : undefined;
		const subTaskPlannedEnd = shouldAutoScheduleSubTask
			? addDays(new Date(taskPlannedStart), Number(templateSubTask.duration))
			: undefined;

		const createdSubTask = await tx.subTask.create({
			data: {
				parentTaskId,
				name: templateSubTask.name,
				description: templateSubTask.description,
				duration: templateSubTask.duration != null ? String(templateSubTask.duration) : null,
				priority: templateSubTask.priority,
				notes: templateSubTask.notes,
				...(subTaskPlannedStart && { plannedStart: subTaskPlannedStart }),
				...(subTaskPlannedEnd && { plannedEnd: subTaskPlannedEnd }),
				status: 'ACTIVE',
				createdBy: userId,
			},
		});

		templateSubTaskIdToCreatedSubTaskId.set(templateSubTask.id, createdSubTask.id);
		if (templateSubTask.predecessorTaskId) {
			pendingSubTaskPredecessors.push({
				subTaskId: createdSubTask.id,
				predecessorTemplateSubTaskId: templateSubTask.predecessorTaskId,
			});
		}
	}

	for (const { subTaskId, predecessorTemplateSubTaskId } of pendingSubTaskPredecessors) {
		const predecessorSubTaskId = templateSubTaskIdToCreatedSubTaskId.get(predecessorTemplateSubTaskId);
		if (!predecessorSubTaskId || predecessorSubTaskId === subTaskId) continue;

		await tx.subTask.update({
			where: { id: subTaskId },
			data: {
				predecessorTaskId: predecessorSubTaskId,
			},
		});
	}
}

async function getTemplateTotalDuration(tx, projectTypeId) {
	const projectType = await tx.projectType.findFirst({
		where: { id: projectTypeId, status: 'ACTIVE' },
		select: {
			id: true,
			masterPhases: {
				select: {
					MasterPhase: {
						select: {
							MasterPhaseMasterTask: {
								select: {
									MasterTask: {
										select: {
											duration: true,
										},
									},
								},
							},
						},
					},
				},
			},
		},
	});

	if (!projectType) return null;

	const totalDuration = (projectType.masterPhases || []).reduce((timelineTotal, projectTypePhase) => {
		const phaseDuration = (projectTypePhase.MasterPhase?.MasterPhaseMasterTask || []).reduce((taskTotal, taskMapping) => {
			return taskTotal + (taskMapping.MasterTask?.duration || 0);
		}, 0);
		return timelineTotal + phaseDuration;
	}, 0);

	return totalDuration;
}

async function cloneTemplateIntoTimeline({ tx, projectTypeId, projectId, timelineId, userId, timelinePlannedStart }) {
	const projectType = await tx.projectType.findFirst({
		where: { id: projectTypeId, status: 'ACTIVE' },
		select: {
			id: true,
			masterPhases: {
				orderBy: { sNo: 'asc' },
				select: {
					masterPhaseId: true,
					MasterPhase: {
						select: {
							id: true,
							name: true,
							description: true,
							MasterPhaseMasterTask: {
								orderBy: { sNo: 'asc' },
								select: {
									sNo: true,
									MasterTask: {
										select: {
											id: true,
											name: true,
											description: true,
											duration: true,
											predecessorTaskId: true,
											priority: true,
											notes: true,
											subTasks: true,
										},
									},
								},
							},
						},
					},
				},
			},
			MasterPhaseOrder: {
				select: {
					masterPhaseId: true,
					order: true,
				},
				orderBy: { order: 'asc' },
			},
			MasterTaskOrder: {
				select: {
					masterPhaseId: true,
					masterTaskId: true,
					order: true,
				},
				orderBy: { order: 'asc' },
			},
		},
	});

	if (!projectType) return false;

	const phaseOrderMap = new Map();
	(projectType.MasterPhaseOrder || []).forEach(po => {
		phaseOrderMap.set(po.masterPhaseId, po.order);
	});

	const taskOrderMap = new Map();
	(projectType.MasterTaskOrder || []).forEach(to => {
		taskOrderMap.set(`${to.masterPhaseId}_${to.masterTaskId}`, to.order);
	});

	const sortedMasterPhases = [...projectType.masterPhases].sort((a, b) => {
		const orderA = phaseOrderMap.get(a.masterPhaseId) ?? Number.MAX_SAFE_INTEGER;
		const orderB = phaseOrderMap.get(b.masterPhaseId) ?? Number.MAX_SAFE_INTEGER;
		return orderA - orderB;
	});

	const masterTaskIdToCreatedTaskId = new Map();
	const pendingPredecessors = [];

	for (let phaseIndex = 0; phaseIndex < sortedMasterPhases.length; phaseIndex += 1) {
		const masterPhase = sortedMasterPhases[phaseIndex].MasterPhase;
		if (!masterPhase) continue;

		const createdPhase = await tx.phase.create({
			data: {
				name: masterPhase.name,
				description: masterPhase.description,
				projectId,
				timelineId,
				masterPhaseId: masterPhase.id,
				status: 'ACTIVE',
				createdBy: userId,
			},
		});

		await tx.timelinePhaseOrder.create({
			data: {
				timelineId,
				phaseId: createdPhase.id,
				order: phaseIndex + 1,
			},
		});

		const sortedTasks = [...(masterPhase.MasterPhaseMasterTask || [])].sort((a, b) => {
			const orderA = taskOrderMap.get(`${masterPhase.id}_${a.MasterTask.id}`) ?? Number.MAX_SAFE_INTEGER;
			const orderB = taskOrderMap.get(`${masterPhase.id}_${b.MasterTask.id}`) ?? Number.MAX_SAFE_INTEGER;
			if (orderA !== orderB) return orderA - orderB;
			return (a.sNo ?? 0) - (b.sNo ?? 0);
		});

		for (let taskIndex = 0; taskIndex < sortedTasks.length; taskIndex += 1) {
			const masterTask = sortedTasks[taskIndex].MasterTask;
			if (!masterTask) continue;
			const shouldAutoScheduleTask = !masterTask.predecessorTaskId && timelinePlannedStart && masterTask.duration != null;
			const taskPlannedStart = shouldAutoScheduleTask ? new Date(timelinePlannedStart) : undefined;
			const taskPlannedEnd = shouldAutoScheduleTask ? addDays(new Date(timelinePlannedStart), masterTask.duration) : undefined;

			const createdTask = await tx.task.create({
				data: {
					name: masterTask.name,
					description: masterTask.description ?? '',
					duration: masterTask.duration,
					priority: masterTask.priority,
					notes: masterTask.notes,
					phaseId: createdPhase.id,
					...(taskPlannedStart && { plannedStart: taskPlannedStart }),
					...(taskPlannedEnd && { plannedEnd: taskPlannedEnd }),
					status: 'ACTIVE',
					createdBy: userId,
				},
			});

			await cloneMasterSubTasksIntoTask({
				tx,
				masterTaskSubTasks: masterTask.subTasks,
				parentTaskId: createdTask.id,
				userId,
				taskPlannedStart,
			});

			masterTaskIdToCreatedTaskId.set(masterTask.id, createdTask.id);
			if (masterTask.predecessorTaskId) {
				pendingPredecessors.push({
					taskId: createdTask.id,
					predecessorMasterTaskId: masterTask.predecessorTaskId,
				});
			}

			await tx.timeLineTaskOrder.create({
				data: {
					timelineId,
					phaseId: createdPhase.id,
					taskId: createdTask.id,
					order: taskIndex + 1,
				},
			});
		}
	}

	const predecessorRows = pendingPredecessors
		.map(({ taskId, predecessorMasterTaskId }) => {
			const predecessorTaskId = masterTaskIdToCreatedTaskId.get(predecessorMasterTaskId);
			if (!predecessorTaskId || predecessorTaskId === taskId) return null;
			return {
				taskId,
				predecessorTaskId,
				createdBy: userId,
			};
		})
		.filter(Boolean);

	if (predecessorRows.length > 0) {
		await tx.taskPredecessor.createMany({
			data: predecessorRows,
		});
	}

	return true;
}

class TimelineController {
	create = transactionHandler(async (req, res, _next, tx) => {
		const { name, projectId, createdOn, plannedStart, plannedEnd, sentTo, templateTimelineId } = req.body;
		const { userId } = req.user;
		const project = await tx.project.findUnique({
			where: { id: projectId },
			select: { id: true },
		});
		if (!project) return errorHandler('E-404', res);

		const lastTimeline = await tx.timeline.findFirst({
			where: { projectId, status: 'ACTIVE' },
			select: { order: true },
			orderBy: { order: 'desc' },
		});

		let normalizedPlannedEnd = plannedEnd ? new Date(plannedEnd) : null;

		if (templateTimelineId && plannedStart) {
			const templateTotalDuration = await getTemplateTotalDuration(tx, templateTimelineId);
			if (templateTotalDuration == null) {
				return errorHandler('E-405', res);
			}
			normalizedPlannedEnd = addDays(new Date(plannedStart), templateTotalDuration);
		}

		const data = {
			name,
			projectId,
			createdBy: userId,
			order: (lastTimeline?.order ?? -1) + 1,
			plannedStart: plannedStart ? new Date(plannedStart) : null,
			plannedEnd: normalizedPlannedEnd,
			...(createdOn != null && { createdOn: new Date(createdOn) }),
			...(sentTo && { sentToId: sentTo }),
		};
		const timeline = await tx.timeline.create({ data });

		if (templateTimelineId) {
			const cloned = await cloneTemplateIntoTimeline({
				tx,
				projectTypeId: templateTimelineId,
				projectId,
				timelineId: timeline.id,
				userId,
				timelinePlannedStart: data.plannedStart,
			});
			if (!cloned) return errorHandler('E-405', res);
		}

		const createActivities = [`Timeline "${timeline.name}" created`];
		if (templateTimelineId) {
			createActivities.push('Timeline created from template');
		}

		await trackActivity(
			userId,
			{
				projectId,
				entityType: ENTITY_TYPES.TIMELINE,
				entityId: timeline.id,
				entityName: timeline.name,
				activities: createActivities,
				activityType: ACTIVITY_TYPES.CREATE,
				metadata: templateTimelineId ? { templateTimelineId } : undefined,
			},
			tx
		);

		return responseHandler(timeline, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const {
			id,
			search,
			pageNo = 0,
			pageLimit = 10,
			projectId,
			timelineStatus,
			sortType = 'createdAt',
			sortOrder = -1,
		} = req.query;
		const where = { status: 'ACTIVE' };
		if (id) {
			where.id = id;
		}
		if (projectId) {
			where.projectId = projectId;
		}
		if (timelineStatus) {
			where.timelineStatus = timelineStatus;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		const totalCount = await TimelineService.count({ where });
		const timelines = await TimelineService.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			include: {
				project: {
					select: {
						id: true,
						name: true,
					},
				},
				TimelinePhaseOrder: {
					include: {
						Phase: {
							include: {
								Task: true,
								masterPhase: true,
							},
						},
					},
					orderBy: {
						order: 'asc',
					},
				},
				sentTo: {
					select: {
						id: true,
						name: true,
					},
				},
				createdByUser: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: { [sortType]: sortOrder === 1 ? 'asc' : 'desc' },
		});

		// Transform response to maintain backward compatibility
		const transformedTimelines = timelines.map(timeline => ({
			...timeline,
			Phase: timeline.TimelinePhaseOrder?.map(tpo => tpo.Phase) || [],
			TimelinePhaseOrder: undefined, // Remove to keep response clean
		}));

		return responseHandler({ timelines: transformedTimelines, totalCount }, res, 200);
	});

	getById = asyncHandler(async (req, res) => {
		const { timelineId } = req.params;
		// 🔹 Fetch timeline
		const timeline = await TimelineService.findOne({ where: { id: timelineId } });
		if (!timeline) return errorHandler('E-603', res);
		if (timeline.timelineStatus === 'DELETED') return errorHandler('E-609', res);

		// Shared task select used for ordered + unordered tasks
		const taskSelect = {
			id: true,
			sNo: true,
			name: true,
			phaseId: true,
			description: true,
			attachments: true,
			duration: true,
			priority: true,
			plannedStart: true,
			plannedEnd: true,
			taskStatus: true,
			unit: true,
			progress: true,
			startDate: true,
			endDate: true,
			createdAt: true,
			updatedAt: true,
			status: true,
			assignedByUser: {
				select: {
					id: true,
					name: true,
				},
			},
			assigneeUser: {
				select: {
					id: true,
					name: true,
				},
			},
			TaskAssignee: {
				select: {
					id: true,
					userId: true,
					User: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
			},
			predecessors: {
				select: {
					id: true,
					predecessorTaskId: true,
					predecessorTask: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
			subTasks: {
				select: {
					id: true,
					name: true,
					taskStatus: true,
				},
			},
			comments: {
				select: {
					id: true,
					content: true,
					createdAt: true,
					createdByUser: {
						select: {
							id: true,
							name: true,
						},
					},
				},
			},
			Activities: {
				select: {
					id: true,
					activity: true,
					activityType: true,
					createdAt: true,
					user: {
						select: {
							id: true,
							name: true,
							email: true,
						},
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			},
		};

		// 🔹 Fetch phase orders (phase list is ordered by mapping table)
		const timelineOrder = await TimelinePhaseOrderServices.findMany({
			where: { timelineId: timeline.id },
			select: {
				order: true,
				Phase: {
					select: {
						id: true,
						name: true,
						description: true,
						status: true,
						createdAt: true,
						updatedAt: true,
					},
				},
			},
			orderBy: {
				order: 'asc',
			},
		});

		// Get phase IDs that already have an order entry
		const orderedPhaseIds = new Set(timelineOrder.map(item => item.Phase.id));

		// 🔹 Fetch phases linked directly to timeline but without TimelinePhaseOrder entry
		const unorderedPhases = await PhaseService.findMany({
			where: {
				timelineId: timeline.id,
				status: 'ACTIVE',
				id: { notIn: Array.from(orderedPhaseIds) },
			},
			select: {
				id: true,
				name: true,
				description: true,
				status: true,
				createdAt: true,
				updatedAt: true,
			},
			orderBy: { sNo: 'asc' },
		});

		// Combine ordered phases with unordered phases (unordered phases come after ordered ones)
		const maxOrder = timelineOrder.length > 0 ? Math.max(...timelineOrder.map(item => item.order)) : 0;
		const combinedTimelineOrder = [
			...timelineOrder,
			...unorderedPhases.map((phase, index) => ({
				order: maxOrder + index + 1,
				Phase: phase,
			})),
		];

		const phaseIds = combinedTimelineOrder.map(item => item.Phase.id);

		// 🔹 Fetch ordered tasks from mapping table (rearrange flow writes here)
		const orderedTaskOrders = await TimelineTaskOrderServices.findMany({
			where: { timelineId: timeline.id, phaseId: { in: phaseIds } },
			select: {
				order: true,
				phaseId: true,
				Task: { select: taskSelect },
			},
			orderBy: [{ phaseId: 'asc' }, { order: 'asc' }],
		});

		// 🔹 Fetch all active tasks in these phases (used as fallback for tasks without a mapping row)
		const allPhaseTasks = await TaskServices.findMany({
			where: { phaseId: { in: phaseIds }, status: 'ACTIVE' },
			select: taskSelect,
			orderBy: { sNo: 'asc' },
		});

		// Build map of phaseId -> [{task, order}] preserving order info
		const orderedTasksByPhase = new Map();
		for (const row of orderedTaskOrders) {
			if (!row?.Task || row.Task.status !== 'ACTIVE') continue;
			if (!orderedTasksByPhase.has(row.phaseId)) orderedTasksByPhase.set(row.phaseId, []);
			orderedTasksByPhase.get(row.phaseId).push({ task: row.Task, order: row.order });
		}

		const allTasksByPhase = new Map();
		for (const task of allPhaseTasks) {
			if (!allTasksByPhase.has(task.phaseId)) allTasksByPhase.set(task.phaseId, []);
			allTasksByPhase.get(task.phaseId).push(task);
		}

		// 🔹 Build ordered phases response: mapping-order first, then remaining tasks by sNo
		const phases = combinedTimelineOrder.map(item => {
			const phaseId = item.Phase.id;
			const orderedWithOrder = orderedTasksByPhase.get(phaseId) || [];
			const orderedIds = new Set(orderedWithOrder.map(t => t.task.id));

			// Get the max order from ordered tasks, or 0 if none
			const maxTaskOrder = orderedWithOrder.length > 0 ? Math.max(...orderedWithOrder.map(t => t.order)) : 0;

			// Get remaining tasks that don't have an order entry
			const remainder = (allTasksByPhase.get(phaseId) || []).filter(t => !orderedIds.has(t.id));

			// Combine: ordered tasks with their order, then remainder with auto-assigned order
			const tasks = [
				...orderedWithOrder.map(t => ({ ...t.task, order: t.order })),
				...remainder.map((t, index) => ({ ...t, order: maxTaskOrder + index + 1 })),
			];

			// Sort tasks by order to ensure correct ordering
			tasks.sort((a, b) => a.order - b.order);

			return {
				phaseDetails: {
					id: item.Phase.id,
					name: item.Phase.name,
					description: item.Phase.description,
					status: item.Phase.status,
					createdAt: item.Phase.createdAt,
					updatedAt: item.Phase.updatedAt,
					tasks,
					taskCount: tasks.length,
				},
				order: item.order,
			};
		});

		// 🔹 Calculate stats
		let totalTasks = 0;
		let totalSubTasks = 0;
		let completedTasks = 0;
		let completedSubTasks = 0;

		phases.forEach(item => {
			totalTasks += item.phaseDetails.tasks.length;
			item.phaseDetails.tasks.forEach(task => {
				// Count completed tasks
				if (task.taskStatus === 'COMPLETED') {
					completedTasks += 1;
				}

				// Count total and completed subtasks
				totalSubTasks += task.subTasks.length;
				task.subTasks.forEach(subTask => {
					if (subTask.taskStatus === 'COMPLETED') {
						completedSubTasks += 1;
					}
				});
			});
		});

		// Calculate progress percentage
		const totalWork = totalTasks + totalSubTasks;
		const completedWork = completedTasks + completedSubTasks;
		const progressPercentage = totalWork > 0 ? Math.round((completedWork / totalWork) * 100) : 0;

		// 🔹 Transform response
		const formattedResponse = {
			timelineId: timeline.id,
			stats: {
				totalTasks,
				totalSubTasks,
				completedTasks,
				completedSubTasks,
				progressPercentage,
			},
			phases,
		};

		return responseHandler(formattedResponse, res, 200);
	});

	update = asyncHandler(async (req, res) => {
		const { timelineId } = req.params;
		const { name, createdOn, plannedStart, plannedEnd, sentTo, status, timelineStatus } = req.body;
		const { userId } = req.user;

		const existingTimeline = await TimelineService.findOne({ where: { id: timelineId } });
		if (!existingTimeline) return errorHandler('E-603', res);

		const updateData = { updatedBy: userId };
		const activityMessages = [];
		if (name !== undefined && name !== existingTimeline.name) {
			updateData.name = name;
			activityMessages.push(`Timeline name updated to "${name}"`);
		}
		if (createdOn !== undefined && toDateValue(createdOn) !== toDateValue(existingTimeline.createdOn)) {
			updateData.createdOn = new Date(createdOn);
			activityMessages.push('Timeline created on date updated');
		}
		if (plannedStart !== undefined && toDateValue(plannedStart) !== toDateValue(existingTimeline.plannedStart)) {
			updateData.plannedStart = plannedStart ? new Date(plannedStart) : null;
			activityMessages.push('Timeline planned start updated');
		}
		if (plannedEnd !== undefined && toDateValue(plannedEnd) !== toDateValue(existingTimeline.plannedEnd)) {
			updateData.plannedEnd = plannedEnd ? new Date(plannedEnd) : null;
			activityMessages.push('Timeline planned end updated');
		}
		if (sentTo !== undefined) {
			if (sentTo && sentTo !== existingTimeline.sentToId) {
				const existingSentTo = await UserServices.findOne({ where: { id: sentTo } });
				if (!existingSentTo) return errorHandler('E-104', res);
				updateData.sentToId = sentTo;
				activityMessages.push('Timeline sent to user updated');
			} else if (!sentTo && existingTimeline.sentToId) {
				updateData.sentToId = null;
				activityMessages.push('Timeline sent to user removed');
			} else {
				updateData.sentToId = existingTimeline.sentToId;
			}
		}
		if (status !== undefined && status !== existingTimeline.status) {
			updateData.status = status;
			activityMessages.push(`Timeline record status updated to ${status}`);
		}
		if (timelineStatus !== undefined) {
			updateData.timelineStatus = timelineStatus;
			if (timelineStatus !== existingTimeline.timelineStatus) {
				if (timelineStatus === 'ARCHIVED') {
					activityMessages.push(`Timeline "${existingTimeline.name}" archived`);
				} else if (existingTimeline.timelineStatus === 'ARCHIVED' && timelineStatus !== 'ARCHIVED') {
					activityMessages.push(`Timeline "${existingTimeline.name}" unarchived`);
				} else if (timelineStatus === 'DELETED') {
					activityMessages.push(`Timeline "${existingTimeline.name}" deleted`);
				} else {
					activityMessages.push(`Timeline status updated to ${timelineStatus}`);
				}
			}
		}

		const timeline = await TimelineService.update({ where: { id: timelineId }, data: updateData });
		if (activityMessages.length > 0) {
			await trackActivity(userId, {
				projectId: existingTimeline.projectId,
				entityType: ENTITY_TYPES.TIMELINE,
				entityId: existingTimeline.id,
				entityName: timeline.name,
				activities: activityMessages,
				activityType:
					timelineStatus && timelineStatus !== existingTimeline.timelineStatus
						? ACTIVITY_TYPES.STATUS_CHANGE
						: ACTIVITY_TYPES.UPDATE,
				fieldUpdated: timelineStatus && timelineStatus !== existingTimeline.timelineStatus ? 'timelineStatus' : undefined,
				metadata:
					timelineStatus && timelineStatus !== existingTimeline.timelineStatus
						? { oldValue: existingTimeline.timelineStatus, newValue: timelineStatus }
						: undefined,
			});
		}
		return responseHandler(timeline, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { timelineId } = req.params;
		const { userId } = req.user;
		const existingTimeline = await TimelineService.findOne({ where: { id: timelineId } });
		if (!existingTimeline) return errorHandler('E-603', res);
		const timeline = await TimelineService.update({
			where: { id: timelineId },
			data: { timelineStatus: 'DELETED', updatedBy: userId },
		});
		if (!timeline) return errorHandler('E-603', res);
		await trackActivity(userId, {
			projectId: existingTimeline.projectId,
			entityType: ENTITY_TYPES.TIMELINE,
			entityId: existingTimeline.id,
			entityName: existingTimeline.name,
			activities: [`Timeline "${existingTimeline.name}" deleted`],
			activityType: ACTIVITY_TYPES.DELETE,
			fieldUpdated: 'timelineStatus',
			metadata: { oldValue: existingTimeline.timelineStatus, newValue: 'DELETED' },
		});
		return responseHandler(timeline, res, 200);
	});

	createPhase = asyncHandler(async (req, res) => {
		const { name, description, projectId, timelineId, masterPhaseCheck } = req.body;
		const { userId } = req.user;
		let masterPhase = null;
		if (masterPhaseCheck) {
			masterPhase = await MasterPhaseService.create({ data: { name, description, createdBy: userId } });
		}
		const phase = await PhaseService.create({
			data: { name, description, projectId, timelineId, createdBy: userId, masterPhaseId: masterPhase?.id },
		});

		// Create TimelinePhaseOrder entry for proper ordering
		if (timelineId) {
			// Get the current max order for this timeline
			const maxOrderRecord = await TimelinePhaseOrderServices.findMany({
				where: { timelineId },
				orderBy: { order: 'desc' },
				take: 1,
			});
			const nextOrder = maxOrderRecord.length > 0 ? maxOrderRecord[0].order + 1 : 1;

			await TimelinePhaseOrderServices.create({
				data: {
					timelineId,
					phaseId: phase.id,
					order: nextOrder,
				},
			});
		}

		return responseHandler(phase, res, 201);
	});

	getPhase = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 10, projectId, timelineId } = req.query;
		const where = { status: 'ACTIVE' };
		if (id) {
			where.id = id;
		}
		if (projectId) {
			where.projectId = projectId;
		}
		if (timelineId) {
			where.timelineId = timelineId;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		const totalCount = await PhaseService.count({ where });
		const phases = await PhaseService.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			select: {
				id: true,
				name: true,
				description: true,
				status: true,
				projectId: true,
				timelineId: true,
				Task: {
					where: {
						status: 'ACTIVE',
					},
					select: {
						id: true,
						name: true,
						description: true,
						attachments: true,
						duration: true,
						priority: true,
						plannedStart: true,
						plannedEnd: true,
						taskStatus: true,
						unit: true,
						progress: true,
						assignedByUser: {
							select: {
								id: true,
								name: true,
							},
						},
						assigneeUser: {
							select: {
								id: true,
								name: true,
							},
						},
						TaskAssignee: {
							select: {
								id: true,
								userId: true,
								User: {
									select: {
										id: true,
										name: true,
										email: true,
									},
								},
							},
						},
						predecessors: {
							select: {
								id: true,
								predecessorTaskId: true,
								predecessorTask: {
									select: {
										id: true,
										name: true,
									},
								},
							},
						},
					},
				},
				masterPhase: true,
			},
			orderBy: { sNo: 'asc' },
		});

		// Add delayedBy calculation for tasks in each phase
		const phasesWithDelayedBy = phases.map(phase => ({
			...phase,
			Task: phase.Task.map(task => ({
				...task,
				delayedBy: computeDelayedBy(task.plannedEnd, task.taskStatus),
			})),
		}));

		return responseHandler({ phases: phasesWithDelayedBy, totalCount }, res, 200);
	});

	createTask = asyncHandler(async (req, res) => {
		const { name, description, plannedStart, plannedEnd, predecessorTaskIds, assignee, assignedBy, delayedBy, phaseId } =
			req.body;
		const { userId } = req.user;

		// Timeline validation removed since timelineId is not used in Task model
		const phase = await PhaseService.findOne({ where: { id: phaseId } });
		if (!phase) return errorHandler('E-602', res);

		const AssignedBy = assignedBy || userId;

		const data = { name, phaseId, createdBy: userId };
		if (description) data.description = description;
		if (plannedStart) data.plannedStart = plannedStart;
		if (plannedEnd) data.plannedEnd = plannedEnd;

		// Normalize predecessorTaskIds to array
		const predecessorIds = predecessorTaskIds
			? Array.isArray(predecessorTaskIds)
				? predecessorTaskIds.filter(id => id)
				: [predecessorTaskIds].filter(id => id)
			: [];

		// Validate predecessor tasks if provided
		for (const predecessorId of predecessorIds) {
			const existingPredecessorTask = await TaskServices.findOne({ where: { id: predecessorId } });
			if (!existingPredecessorTask) return errorHandler('E-603', res);
		}

		if (assignedBy) {
			const existingAssignedBy = await UserServices.findOne({ where: { id: assignedBy } });
			if (!existingAssignedBy) return errorHandler('E-104', res);
			data.assignedBy = assignedBy;
		}
		if (delayedBy) data.delayedBy = delayedBy;

		const task = await TaskServices.create({ data: { ...data, assignedBy: AssignedBy, createdBy: userId } });

		// Create predecessor relationships
		if (predecessorIds.length > 0) {
			const predecessorData = predecessorIds.map(predecessorId => ({
				taskId: task.id,
				predecessorTaskId: predecessorId,
				createdBy: userId,
			}));
			await TaskPredecessorServices.createMany({ data: predecessorData });
		}

		// Handle assignee (can be string or array)
		if (assignee) {
			const assigneeIds = Array.isArray(assignee) ? assignee : [assignee];
			const assigneeData = assigneeIds.map(assigneeId => ({
				taskId: task.id,
				userId: assigneeId,
				createdBy: userId,
			}));
			await TaskAssigneeServices.createMany({ data: assigneeData });
		}

		await trackActivity(userId, {
			taskId: task.id,
			activities: [`Task "${task.name}" created`],
			activityType: 'create',
		});
		return responseHandler(task, res, 201);
	});

	getTask = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 10 } = req.query;
		const where = { status: 'ACTIVE' };

		if (id) {
			where.id = id;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}

		const totalCount = await TaskServices.count({ where });
		const tasks = await TaskServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			select: {
				id: true,
				name: true,
				description: true,
				attachments: true,
				duration: true,
				priority: true,
				plannedStart: true,
				plannedEnd: true,
				taskStatus: true,
				unit: true,
				progress: true,
				phaseId: true,
				assignedByUser: {
					select: {
						id: true,
						name: true,
					},
				},
				assigneeUser: {
					select: {
						id: true,
						name: true,
					},
				},
				TaskAssignee: {
					select: {
						id: true,
						userId: true,
						User: {
							select: {
								id: true,
								name: true,
								email: true,
							},
						},
					},
				},
				predecessors: {
					select: {
						id: true,
						predecessorTaskId: true,
						predecessorTask: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
			orderBy: { sNo: 'asc' },
		});

		// Add delayedBy calculation for each task
		const tasksWithDelayedBy = tasks.map(task => ({
			...task,
			delayedBy: computeDelayedBy(task.plannedEnd, task.taskStatus),
		}));

		return responseHandler({ tasks: tasksWithDelayedBy, totalCount }, res, 200);
	});

	getOrderedTasks = asyncHandler(async (req, res) => {
		const { timelineId, phaseId } = req.query;

		// Query through TimeLineTaskOrder which has both timelineId and phaseId
		const taskOrders = await TimelineTaskOrderServices.findMany({
			where: { timelineId, phaseId },
			select: {
				order: true,
				Task: {
					select: {
						id: true,
						sNo: true,
						name: true,
						description: true,
						attachments: true,
						duration: true,
						priority: true,
						plannedStart: true,
						plannedEnd: true,
						taskStatus: true,
						unit: true,
						progress: true,
						startDate: true,
						endDate: true,
						status: true,
						createdAt: true,
						updatedAt: true,
						assignedByUser: {
							select: {
								id: true,
								name: true,
							},
						},
						assigneeUser: {
							select: {
								id: true,
								name: true,
							},
						},
						TaskAssignee: {
							select: {
								id: true,
								userId: true,
								User: {
									select: {
										id: true,
										name: true,
										email: true,
									},
								},
							},
						},
						predecessors: {
							select: {
								id: true,
								predecessorTaskId: true,
								predecessorTask: {
									select: {
										id: true,
										name: true,
									},
								},
							},
						},
						subTasks: {
							select: {
								id: true,
								name: true,
								taskStatus: true,
							},
						},
					},
				},
			},
			orderBy: { order: 'asc' },
		});

		// Filter out inactive tasks and include order field in response
		const tasks = taskOrders
			.filter(taskOrder => taskOrder.Task && taskOrder.Task.status === 'ACTIVE')
			.map(taskOrder => ({ ...taskOrder.Task, order: taskOrder.order }));

		return responseHandler(tasks, res, 200);
	});

	updateTask = transactionHandler(async (req, res, _, tx) => {
		const { id } = req.params;
		const { name, duration, plannedStart, plannedEnd, predecessorTaskIds, assignee, assignedBy, phaseId } = req.body;
		const { userId } = req.user;

		const existingTask = await TaskServices.findOne(
			{
				where: { id },
				include: { predecessors: { select: { predecessorTaskId: true } } },
			},
			tx
		);
		if (!existingTask) return errorHandler('E-603', res);

		const updateData = { updatedBy: userId };
		const fieldUpdates = [];

		if (name !== undefined && existingTask.name !== name) {
			updateData.name = name;
			fieldUpdates.push({ field: 'name', message: `updated name to ${name}` });
		}
		if (duration !== undefined && existingTask.duration !== duration) {
			updateData.duration = duration;
			fieldUpdates.push({ field: 'duration', message: 'updated duration' });
		}
		if (plannedStart !== undefined && existingTask.plannedStart !== plannedStart) {
			updateData.plannedStart = plannedStart;
			fieldUpdates.push({ field: 'plannedStart', message: 'updated planned start' });
		}
		if (plannedEnd !== undefined && existingTask.plannedEnd !== plannedEnd) {
			updateData.plannedEnd = plannedEnd;
			fieldUpdates.push({ field: 'plannedEnd', message: 'updated planned end' });
		}

		if (phaseId !== undefined && existingTask.phaseId !== phaseId) {
			const existingPhase = await PhaseService.findOne({ where: { id: phaseId } }, tx);
			if (!existingPhase) return errorHandler('E-602', res);
			updateData.phaseId = phaseId;
			fieldUpdates.push({ field: 'phaseId', message: 'updated phase' });

			// Clean up old TimeLineTaskOrder entries when task moves to a different phase
			await TimelineTaskOrderServices.deleteMany({ where: { taskId: id } }, tx);
		}

		// Handle predecessor tasks update (many-to-many)
		const shouldProcessPredecessors =
			predecessorTaskIds === null ||
			(predecessorTaskIds !== undefined && !(Array.isArray(predecessorTaskIds) && predecessorTaskIds.length === 0));

		if (shouldProcessPredecessors) {
			const existingPredecessorIds = existingTask.predecessors?.map(p => p.predecessorTaskId) || [];
			const newPredecessorIds =
				predecessorTaskIds === null
					? []
					: Array.isArray(predecessorTaskIds)
						? predecessorTaskIds.filter(pid => pid)
						: [predecessorTaskIds].filter(pid => pid);

			// Check if predecessors have changed
			const sortedExisting = [...existingPredecessorIds].sort();
			const sortedNew = [...newPredecessorIds].sort();
			const predecessorsChanged = JSON.stringify(sortedExisting) !== JSON.stringify(sortedNew);

			if (predecessorsChanged) {
				// Validate all new predecessor tasks exist
				for (const predecessorId of newPredecessorIds) {
					const predecessorTask = await TaskServices.findOne({ where: { id: predecessorId } }, tx);
					if (!predecessorTask) return errorHandler('E-603', res);
					// Prevent self-reference
					if (predecessorId === id) return errorHandler('E-008', res, 'A task cannot be its own predecessor');
				}

				// Delete existing predecessors and create new ones
				await TaskPredecessorServices.deleteMany({ where: { taskId: id } }, tx);

				if (newPredecessorIds.length > 0) {
					const predecessorData = newPredecessorIds.map(predecessorId => ({
						taskId: id,
						predecessorTaskId: predecessorId,
						createdBy: userId,
					}));
					await TaskPredecessorServices.createMany({ data: predecessorData }, tx);
				}

				fieldUpdates.push({
					field: 'predecessorTaskIds',
					message:
						newPredecessorIds.length > 0
							? `updated predecessor tasks (${newPredecessorIds.length} task${newPredecessorIds.length !== 1 ? 's' : ''})`
							: 'removed all predecessor tasks',
				});
			}
		}

		// Handle assignee update (can be string or array)
		const shouldProcessAssignee =
			assignee === null || (assignee !== undefined && !(Array.isArray(assignee) && assignee.length === 0));
		if (shouldProcessAssignee) {
			await TaskAssigneeServices.deleteMany({ where: { taskId: id } }, tx);

			const assigneeIds = assignee === null ? [] : Array.isArray(assignee) ? assignee : [assignee];
			if (assigneeIds.length > 0 && assigneeIds[0]) {
				const assigneeData = assigneeIds.map(assigneeId => ({
					taskId: id,
					userId: assigneeId,
					createdBy: userId,
				}));
				await TaskAssigneeServices.createMany({ data: assigneeData }, tx);
			}

			fieldUpdates.push({
				field: 'assignee',
				message:
					assigneeIds.length > 0 && assigneeIds[0]
						? `updated assignee (${assigneeIds.length} user${assigneeIds.length !== 1 ? 's' : ''})`
						: 'removed assignee',
			});
		}

		if (assignedBy !== undefined && existingTask.assignedBy !== assignedBy) {
			const existingAssignedBy = await UserServices.findOne({ where: { id: assignedBy } }, tx);
			if (!existingAssignedBy) return errorHandler('E-104', res);
			updateData.assignedBy = assignedBy;
			fieldUpdates.push({ field: 'assignedBy', message: 'updated assigned by' });
		}

		const task = await TaskServices.update({ where: { id }, data: updateData }, tx);

		if (fieldUpdates.length > 0) {
			for (const update of fieldUpdates) {
				await trackActivity(
					userId,
					{
						taskId: id,
						activities: [update.message],
						activityType: 'update',
						fieldUpdated: update.field,
					},
					tx
				);
			}
		}

		return responseHandler(task, res, 200);
	});

	deleteTask = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const task = await TaskServices.update({ where: { id }, data: { status: 'INACTIVE', updatedBy: userId } });
		if (!task) return errorHandler('E-603', res);
		return responseHandler(task, res, 200);
	});

	rearrangePhaseOrder = transactionHandler(async (req, res, _, tx) => {
		const { timelineId, phases } = req.body;

		// Validate timeline exists
		const timeline = await tx.timeline.findUnique({ where: { id: timelineId } });
		if (!timeline) return errorHandler('E-601', res);

		// Validate all phases exist and belong to this timeline
		for (const phaseId of phases) {
			const phase = await tx.phase.findUnique({ where: { id: phaseId } });
			if (!phase) return errorHandler('E-602', res);

			// Ensure phase belongs to provided timeline
			if (phase.timelineId && phase.timelineId !== timelineId) {
				return errorHandler('E-606', res);
			}
		}

		// Update or create each phase order sequentially
		for (let i = 0; i < phases.length; i += 1) {
			// First find the record to get its unique id
			const phaseOrderRecord = await tx.timelinePhaseOrder.findFirst({
				where: {
					timelineId,
					phaseId: phases[i],
				},
			});

			if (phaseOrderRecord) {
				// Update existing record
				await tx.timelinePhaseOrder.update({
					where: { id: phaseOrderRecord.id },
					data: { order: i + 1 },
				});
			} else {
				// Create new record if it doesn't exist
				await tx.timelinePhaseOrder.create({
					data: {
						timelineId,
						phaseId: phases[i],
						order: i + 1,
					},
				});
			}
		}

		const updatedTimeline = await tx.timelinePhaseOrder.findMany({
			where: { timelineId },
			orderBy: { order: 'asc' },
		});

		return responseHandler(updatedTimeline, res, 200);
	});

	rearrangeTaskOrder = transactionHandler(async (req, res, _, tx) => {
		const { timelineId, phaseId, tasks } = req.body;

		// Validate timeline exists
		const timeline = await tx.timeline.findUnique({ where: { id: timelineId } });
		if (!timeline) return errorHandler('E-601', res);

		// Validate phase exists
		const phase = await tx.phase.findUnique({ where: { id: phaseId } });
		if (!phase) return errorHandler('E-602', res);

		// Ensure phase belongs to provided timeline
		// Check direct relationship or through TimelinePhaseOrder mapping
		if (phase.timelineId && phase.timelineId !== timelineId) {
			return errorHandler('E-606', res);
		}
		if (!phase.timelineId) {
			// Check if phase is linked via TimelinePhaseOrder
			const phaseOrderExists = await tx.timelinePhaseOrder.findFirst({
				where: { timelineId, phaseId },
			});
			if (!phaseOrderExists) return errorHandler('E-606', res);
		}

		// Validate all tasks exist and belong to this phase
		for (const taskId of tasks) {
			const task = await tx.task.findUnique({ where: { id: taskId } });
			if (!task) return errorHandler('E-603', res);
			if (!task.phaseId || task.phaseId !== phaseId) return errorHandler('E-605', res);
		}

		// Update or create each task order sequentially
		for (let i = 0; i < tasks.length; i += 1) {
			// First find the record to get its unique id
			const taskOrderRecord = await tx.timeLineTaskOrder.findFirst({
				where: {
					timelineId,
					phaseId,
					taskId: tasks[i],
				},
			});

			if (taskOrderRecord) {
				// Update existing record
				await tx.timeLineTaskOrder.update({
					where: { id: taskOrderRecord.id },
					data: { order: i + 1 },
				});
			} else {
				// Create new record if it doesn't exist
				await tx.timeLineTaskOrder.create({
					data: {
						timelineId,
						phaseId,
						taskId: tasks[i],
						order: i + 1,
					},
				});
			}
		}

		const updatedTimeline = await tx.timeLineTaskOrder.findMany({
			where: { timelineId, phaseId },
			orderBy: { order: 'asc' },
		});

		return responseHandler(updatedTimeline, res, 200);
	});
}

export default new TimelineController();
