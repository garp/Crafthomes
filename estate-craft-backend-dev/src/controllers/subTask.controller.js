import SubTaskServices from '../services/modelServices/subTask.services.js';
import TaskServices from '../services/modelServices/task.services.js';
import { asyncHandler, transactionHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import trackActivity from '../middlewares/activities.middleware.js';
import AttachmentServices from '../services/modelServices/attachment.services.js';
import UserServices from '../services/modelServices/user.services.js';
import EmailService from '../services/modelServices/email.services.js';
import PhaseService from '../services/modelServices/phase.services.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';
import { sendNotification, NOTIFICATION_TYPES } from '../socket/emitters/notification.emitter.js';

// Helper to recalculate and update parent task progress based on its active subtasks
const updateParentTaskProgress = async (parentTaskId, tx) => {
	if (!parentTaskId) return;

	// Get all ACTIVE subtasks for the parent task
	const subTasks = await SubTaskServices.findMany(
		{
			where: { parentTaskId, status: 'ACTIVE' },
			select: { taskStatus: true },
		},
		tx
	);

	// If there are no active subtasks, reset progress to 0
	if (!subTasks || subTasks.length === 0) {
		await TaskServices.update(
			{
				where: { id: parentTaskId },
				data: { progress: 0 },
			},
			tx
		);
		return;
	}

	const totalSubTasks = subTasks.length;
	const completedSubTasks = subTasks.filter(st => st.taskStatus === 'COMPLETED').length;
	const progress = Math.round((completedSubTasks / totalSubTasks) * 100);

	await TaskServices.update(
		{
			where: { id: parentTaskId },
			data: { progress },
		},
		tx
	);
};

// SubTask.duration is String? in Prisma: normalize incoming request values to avoid Prisma validation errors
const normalizeSubTaskDuration = value => {
	if (value === undefined) return undefined;
	if (value === null || value === '') return null;
	if (typeof value === 'number') return String(value);
	if (typeof value === 'string') return value;
	return String(value);
};

// SubTask.assignee is String? in Prisma; accept array from client and use first assignee
const normalizeAssignee = value => {
	if (value === undefined || value === null) return undefined;
	if (Array.isArray(value)) return value.length > 0 ? value[0] : undefined;
	return typeof value === 'string' && value !== '' ? value : undefined;
};

// Helper to get projectId from parent task
const getProjectIdFromTask = async (parentTaskId, tx) => {
	if (!parentTaskId) return null;
	const task = await TaskServices.findOne(
		{
			where: { id: parentTaskId },
			select: { phase: { select: { projectId: true } } },
		},
		tx
	);
	return task?.phase?.projectId || null;
};

class SubTaskController {
	create = asyncHandler(async (req, res) => {
		const {
			name,
			duration,
			plannedStart,
			plannedEnd,
			predecessorTaskId,
			assignee: rawAssignee,
			assignedBy,
			delayedBy,
			parentTaskId,
			priority,
		} = req.body;
		const assignee = normalizeAssignee(rawAssignee);
		const { userId } = req.user;

		// Timeline validation removed since timelineId is not used in Task model
		const task = await TaskServices.findOne({
			where: { id: parentTaskId },
			include: { phase: { select: { projectId: true } } },
		});
		if (!task) return errorHandler('E-602', res);

		const projectId = task.phase?.projectId;
		const AssignedBy = assignedBy || userId;

		const data = {
			name,
			duration: normalizeSubTaskDuration(duration),
			plannedStart,
			plannedEnd,
			predecessorTaskId,
			assignee,
			assignedBy: AssignedBy,
			delayedBy,
			parentTaskId,
			priority,
			createdBy: userId,
		};
		const subTask = await SubTaskServices.create({ data });

		// Send email notification to assignee if assigned
		if (assignee && assignee !== userId) {
			setImmediate(async () => {
				try {
					const [assigneeUser, assigner, phase] = await Promise.all([
						UserServices.findOne({ where: { id: assignee }, select: { email: true, name: true } }),
						UserServices.findOne({ where: { id: userId }, select: { name: true } }),
						projectId
							? PhaseService.findOne({ where: { id: task.phaseId }, include: { project: { select: { name: true } } } })
							: null,
					]);

					if (assigneeUser?.email) {
						await EmailService.sendTaskAssignmentEmail({
							toEmail: assigneeUser.email,
							toName: assigneeUser.name,
							taskName: `[SubTask] ${name}`,
							taskId: subTask.id,
							projectId,
							assignedByName: assigner?.name,
							projectName: phase?.project?.name,
							priority,
							dueDate: plannedEnd,
						});
					}
				} catch (emailError) {
					console.error('Failed to send subtask assignment email:', emailError);
				}
			});

			// Send in-app notification to assignee (non-blocking)
			sendNotification({
				userId: assignee,
				actorId: userId,
				type: NOTIFICATION_TYPES.SUBTASK_ASSIGNED,
				title: `You were assigned subtask "${name}"`,
				metadata: { subTaskId: subTask.id, taskId: parentTaskId, projectId },
			});
		}

		// Track activity on SubTask with project info
		await trackActivity(userId, {
			projectId,
			entityType: ENTITY_TYPES.SUBTASK,
			entityId: subTask.id,
			entityName: subTask.name,
			subTaskId: subTask.id,
			activities: [`SubTask "${subTask.name}" created`],
			activityType: ACTIVITY_TYPES.CREATE,
		});

		// Also track activity on parent Task
		if (parentTaskId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.TASK,
				entityId: parentTaskId,
				entityName: task.name,
				taskId: parentTaskId,
				activities: [`SubTask "${subTask.name}" created`],
				activityType: ACTIVITY_TYPES.CREATE,
			});

			// Mark parent task as in progress when a subtask is added
			// (do not override COMPLETED tasks)
			if (task?.taskStatus !== 'COMPLETED' && task?.taskStatus !== 'IN_PROGRESS') {
				await TaskServices.update({
					where: { id: parentTaskId },
					data: { taskStatus: 'IN_PROGRESS' },
				});
			}

			// Recalculate parent task progress based on its subtasks
			await updateParentTaskProgress(parentTaskId);
		}
		return responseHandler(subTask, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const {
			id,
			search,
			pageNo = 0,
			pageLimit = 10,
			status = 'ACTIVE',
			taskStatus,
			projectId,
			parentTaskId,
			sortType = 'createdAt',
			sortOrder = -1,
		} = req.query;
		const where = { status };
		if (id) {
			where.id = id;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		if (taskStatus) {
			if (taskStatus !== 'PENDING' && taskStatus !== 'IN_PROGRESS' && taskStatus !== 'COMPLETED' && taskStatus !== 'BLOCKED')
				return errorHandler('E-008', res);
			where.taskStatus = taskStatus;
		}
		if (projectId) {
			where.phase = { projectId };
		}
		if (parentTaskId) {
			where.parentTaskId = parentTaskId;
		}
		const totalCount = await SubTaskServices.count({ where });
		const subTasks = await SubTaskServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			select: {
				id: true,
				name: true,
				description: true,
				attachments: true,
				duration: true,
				notes: true,
				priority: true,
				startDate: true,
				endDate: true,
				plannedStart: true,
				plannedEnd: true,
				taskStatus: true,
				unit: true,
				progress: true,
				status: true,
				predecessorTask: {
					select: {
						id: true,
						name: true,
					},
				},
				parentTask: {
					select: {
						id: true,
						name: true,
					},
				},
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
				comments: {
					select: {
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
			},
			orderBy: { [sortType]: sortOrder === 1 ? 'asc' : 'desc' },
		});
		return responseHandler({ subTasks, totalCount }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const {
			name,
			assignedBy,
			assignee: rawAssignee,
			attachments,
			duration,
			notes,
			priority,
			startDate,
			endDate,
			plannedStart,
			plannedEnd,
			description,
			status,
			taskStatus,
			unit,
			progress,
			predecessorTaskId,
		} = req.body;
		const assignee = normalizeAssignee(rawAssignee);

		const existingSubTask = await SubTaskServices.findOne({
			where: { id },
			include: { parentTask: { select: { id: true, name: true, phase: { select: { projectId: true } } } } },
		});
		if (!existingSubTask) return errorHandler('E-603', res);

		const projectId = existingSubTask.parentTask?.phase?.projectId;
		const updateData = { updatedBy: userId };
		const activityMessages = [];

		// Track changes
		if (name !== undefined && existingSubTask.name !== name) {
			updateData.name = name;
			activityMessages.push(`Name changed from "${existingSubTask.name}" to "${name}"`);
		}
		if (assignedBy !== undefined && existingSubTask.assignedBy !== assignedBy) {
			updateData.assignedBy = assignedBy;
			activityMessages.push('Assignment authority changed');
		}
		if (assignee !== undefined && existingSubTask.assignee !== assignee) {
			updateData.assignee = assignee;
			activityMessages.push(assignee ? 'SubTask assigned to a new user' : 'SubTask assignee removed');

			// Send email notification to new assignee if different from previous and not the current user
			if (assignee && assignee !== existingSubTask.assignee && assignee !== userId) {
				setImmediate(async () => {
					try {
						const [assigneeUser, assigner, phase] = await Promise.all([
							UserServices.findOne({ where: { id: assignee }, select: { email: true, name: true } }),
							UserServices.findOne({ where: { id: userId }, select: { name: true } }),
							projectId
								? PhaseService.findOne({
										where: { id: existingSubTask.task?.phaseId },
										include: { project: { select: { name: true } } },
								  })
								: null,
						]);

						if (assigneeUser?.email) {
							await EmailService.sendTaskAssignmentEmail({
								toEmail: assigneeUser.email,
								toName: assigneeUser.name,
								taskName: `[SubTask] ${existingSubTask.name}`,
								taskId: id,
								projectId,
								assignedByName: assigner?.name,
								projectName: phase?.project?.name,
								priority: existingSubTask.priority,
								dueDate: existingSubTask.plannedEnd,
							});
						}
					} catch (emailError) {
						console.error('Failed to send subtask assignment email:', emailError);
					}
				});

				// Send in-app notification to new assignee (non-blocking)
				sendNotification({
					userId: assignee,
					actorId: userId,
					type: NOTIFICATION_TYPES.SUBTASK_ASSIGNED,
					title: `You were assigned subtask "${existingSubTask.name}"`,
					metadata: { subTaskId: id, taskId: existingSubTask.parentTaskId, projectId },
				});
			}
		}
		if (attachments !== undefined && JSON.stringify(existingSubTask.attachments) !== JSON.stringify(attachments)) {
			const attachmentCount = Array.isArray(attachments) ? attachments.length : 0;
			const existingAttachmentCount = Array.isArray(existingSubTask.attachments) ? existingSubTask.attachments.length : 0;
			if (attachmentCount > existingAttachmentCount) {
				activityMessages.push(`${attachmentCount - existingAttachmentCount} attachment(s) added`);
			} else if (attachmentCount < existingAttachmentCount) {
				activityMessages.push(`${existingAttachmentCount - attachmentCount} attachment(s) removed`);
			} else {
				activityMessages.push('Attachments updated');
			}
		}
		if (duration !== undefined) {
			const normalizedDuration = normalizeSubTaskDuration(duration);
			if (existingSubTask.duration !== normalizedDuration) {
				updateData.duration = normalizedDuration;
				activityMessages.push('Duration updated');
			}
		}
		if (notes !== undefined && existingSubTask.notes !== notes) {
			updateData.notes = notes;
			activityMessages.push('Notes updated');
		}
		if (priority !== undefined && existingSubTask.priority !== priority) {
			updateData.priority = priority;
			activityMessages.push(`Priority changed from "${existingSubTask.priority || 'None'}" to "${priority}"`);
		}
		if (startDate !== undefined && existingSubTask.startDate !== startDate) {
			updateData.startDate = startDate;
			const date = new Date(startDate);
			const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
			activityMessages.push(`Start date updated to ${formattedDate}`);
		}
		if (endDate !== undefined && existingSubTask.endDate !== endDate) {
			updateData.endDate = endDate;
			const date = new Date(endDate);
			const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
			activityMessages.push(`End date updated to ${formattedDate}`);
		}
		if (plannedStart !== undefined && existingSubTask.plannedStart !== plannedStart) {
			updateData.plannedStart = plannedStart;
			const date = new Date(plannedStart);
			const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
			activityMessages.push(`Planned start updated to ${formattedDate}`);
		}
		if (plannedEnd !== undefined && existingSubTask.plannedEnd !== plannedEnd) {
			updateData.plannedEnd = plannedEnd;
			const date = new Date(plannedEnd);
			const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
			activityMessages.push(`Planned end updated to ${formattedDate}`);
		}
		if (description !== undefined && existingSubTask.description !== description) {
			updateData.description = description;
			activityMessages.push('Description updated');
		}
		if (status !== undefined && existingSubTask.status !== status) {
			updateData.status = status;
			activityMessages.push(`Status changed from "${existingSubTask.status}" to "${status}"`);
		}
		let taskStatusChanged = false;
		if (taskStatus !== undefined && existingSubTask.taskStatus !== taskStatus) {
			updateData.taskStatus = taskStatus;
			taskStatusChanged = true;
			activityMessages.push(`Task status changed from "${existingSubTask.taskStatus}" to "${taskStatus}"`);
		}
		if (unit !== undefined && existingSubTask.unit !== unit) {
			updateData.unit = unit;
			activityMessages.push('Unit updated');
		}
		if (progress !== undefined && existingSubTask.progress !== progress) {
			updateData.progress = progress;
			activityMessages.push(`Progress updated to ${progress}%`);
		}
		if (predecessorTaskId !== undefined && existingSubTask.predecessorTaskId !== predecessorTaskId) {
			updateData.predecessorTaskId = predecessorTaskId;
			activityMessages.push(predecessorTaskId ? 'Predecessor task added/updated' : 'Predecessor task removed');
		}

		const subTask = await SubTaskServices.update({ where: { id }, data: updateData });

		// Handle attachments separately (relation field - delete old, create new)
		if (attachments !== undefined) {
			// Delete existing attachments for this subtask
			await AttachmentServices.deleteMany({ where: { subTaskId: id } });
			// Create new attachments if provided
			if (attachments.length > 0) {
				await AttachmentServices.createMany({
					data: attachments.map(att => ({ ...att, subTaskId: id, updatedBy: userId })),
				});
			}
		}

		// Track activities
		if (activityMessages.length > 0) {
			// On SubTask with project info
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.SUBTASK,
				entityId: id,
				entityName: existingSubTask.name,
				subTaskId: id,
				activities: activityMessages,
				activityType: ACTIVITY_TYPES.UPDATE,
			});

			// Also on parent Task
			if (existingSubTask.parentTaskId) {
				await trackActivity(userId, {
					projectId,
					entityType: ENTITY_TYPES.TASK,
					entityId: existingSubTask.parentTaskId,
					entityName: existingSubTask.parentTask?.name,
					taskId: existingSubTask.parentTaskId,
					activities: activityMessages,
					activityType: ACTIVITY_TYPES.UPDATE,
				});
			}
		}

		// If task status changed, recalculate parent task progress
		if (taskStatusChanged && existingSubTask.parentTaskId) {
			await updateParentTaskProgress(existingSubTask.parentTaskId);
		}

		return responseHandler(subTask, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existingSubTask = await SubTaskServices.findOne({
			where: { id },
			include: { parentTask: { select: { id: true, name: true, phase: { select: { projectId: true } } } } },
		});
		if (!existingSubTask) return errorHandler('E-604', res);

		const projectId = existingSubTask.parentTask?.phase?.projectId;

		const subTask = await SubTaskServices.update({ where: { id }, data: { status: 'INACTIVE', updatedBy: userId } });

		await trackActivity(userId, {
			projectId,
			entityType: ENTITY_TYPES.SUBTASK,
			entityId: id,
			entityName: subTask.name,
			subTaskId: id,
			activities: [`SubTask "${subTask.name}" deleted`],
			activityType: ACTIVITY_TYPES.DELETE,
		});

		// Recalculate parent task progress if applicable
		if (existingSubTask.parentTaskId) {
			await updateParentTaskProgress(existingSubTask.parentTaskId);
		}
		return responseHandler(subTask, res, 200);
	});

	// Mark a subtask as completed and update its parent task's progress (transactional)
	markComplete = transactionHandler(async (req, res, _next, tx) => {
		const { id } = req.params;
		const { userId } = req.user;

		// Find the existing subtask within the transaction
		const existingSubTask = await SubTaskServices.findOne(
			{
				where: { id },
				include: { parentTask: { select: { id: true, name: true, phase: { select: { projectId: true } } } } },
			},
			tx
		);
		if (!existingSubTask) return errorHandler('E-604', res);

		const projectId = existingSubTask.parentTask?.phase?.projectId;

		// Determine new status and progress (toggle behavior)
		const isCurrentlyCompleted = existingSubTask.taskStatus === 'COMPLETED';
		const newStatus = isCurrentlyCompleted ? 'PENDING' : 'COMPLETED';
		const newProgress = isCurrentlyCompleted ? 0 : 100;
		const activityMessage = isCurrentlyCompleted
			? `SubTask "${existingSubTask.name}" marked as pending`
			: `SubTask "${existingSubTask.name}" marked as completed`;

		// Update subtask
		const subTask = await SubTaskServices.update(
			{
				where: { id },
				data: { taskStatus: newStatus, progress: newProgress, updatedBy: userId },
			},
			tx
		);

		// Track activity on subtask with project info
		await trackActivity(
			userId,
			{
				projectId,
				entityType: ENTITY_TYPES.SUBTASK,
				entityId: id,
				entityName: existingSubTask.name,
				subTaskId: id,
				activities: [activityMessage],
				activityType: ACTIVITY_TYPES.UPDATE,
				fieldUpdated: 'taskStatus',
			},
			tx
		);

		// Track activity on parent task and update its progress
		if (existingSubTask.parentTaskId) {
			await trackActivity(
				userId,
				{
					projectId,
					entityType: ENTITY_TYPES.TASK,
					entityId: existingSubTask.parentTaskId,
					entityName: existingSubTask.parentTask?.name,
					taskId: existingSubTask.parentTaskId,
					// Link this task activity to the subtask action as well
					subTaskId: id,
					activities: [activityMessage],
					activityType: ACTIVITY_TYPES.UPDATE,
					fieldUpdated: 'taskStatus',
				},
				tx
			);

			// Always recalculate parent task progress when toggling subtask completion
			await updateParentTaskProgress(existingSubTask.parentTaskId, tx);
		}

		return responseHandler(subTask, res, 200);
	});
}

export default new SubTaskController();
