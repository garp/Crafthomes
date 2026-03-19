import { asyncHandler, transactionHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import TaskServices from '../services/modelServices/task.services.js';
import PhaseService from '../services/modelServices/phase.services.js';
import trackActivity from '../middlewares/activities.middleware.js';
import CommentServices from '../services/modelServices/comment.services.js';
import AttachmentServices from '../services/modelServices/attachment.services.js';
import SubTaskServices from '../services/modelServices/subTask.services.js';
import TaskAssigneeServices from '../services/modelServices/taskAssignee.services.js';
import TaskPredecessorServices from '../services/modelServices/mapping/taskPredecessor.services.js';
import TimelineTaskOrderServices from '../services/modelServices/mapping/timelineTaskOrder.services.js';
import UserServices from '../services/modelServices/user.services.js';
import EmailService from '../services/modelServices/email.services.js';
import { startDateToDuration } from '../utils/functions/timeFunction.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';
import { sendNotification, sendNotificationBatch, NOTIFICATION_TYPES } from '../socket/emitters/notification.emitter.js';

// SubTask.duration is String? in Prisma: normalize incoming request values to avoid Prisma validation errors
const normalizeSubTaskDuration = value => {
	if (value === undefined) return undefined;
	if (value === null || value === '') return null;
	if (typeof value === 'number') return String(value);
	if (typeof value === 'string') return value;
	return String(value);
};

const isSuperAdmin = user => String(user?.role?.name || '').toLowerCase() === 'super_admin';

class TasksController {
	create = transactionHandler(async (req, res, _, tx) => {
		const {
			name,
			duration,
			plannedStart,
			plannedEnd,
			predecessorTaskIds,
			assignee,
			assignedBy,
			delayedBy,
			phaseId,
			projectId: requestProjectId,
			notes,
			description,
			priority,
			attachments = [],
			subTasks = [],
		} = req.body;
		const { userId } = req.user;

		const data = {
			name,
			createdBy: userId,
		};

		let projectId = null;

		// Validate phase if provided
		if (phaseId) {
			const phase = await PhaseService.findOne({ where: { id: phaseId } }, tx);
			if (!phase) return errorHandler('E-602', res);
			data.phaseId = phase.id;
			projectId = phase.projectId;
			data.projectId = projectId;
		} else if (requestProjectId) {
			// If no phaseId but projectId is provided, store on task and use for activity tracking
			projectId = requestProjectId;
			data.projectId = requestProjectId;
		}

		// Normalize predecessorTaskIds to array
		const predecessorIds = predecessorTaskIds
			? Array.isArray(predecessorTaskIds)
				? predecessorTaskIds.filter(id => id) // Filter out empty strings
				: [predecessorTaskIds].filter(id => id)
			: [];

		// Validate predecessor tasks if provided
		for (const predecessorId of predecessorIds) {
			const predecessorTask = await TaskServices.findOne({ where: { id: predecessorId } }, tx);
			if (!predecessorTask) return errorHandler('E-603', res);
		}

		// Validate assignees if provided
		if (assignee) {
			const assigneeIds = Array.isArray(assignee) ? assignee : [assignee];
			for (const assigneeId of assigneeIds) {
				const userExists = await UserServices.findOne({ where: { id: assigneeId } }, tx);
				if (!userExists) return errorHandler('E-104', res);
			}
		}

		// Validate assignedBy user if provided
		if (assignedBy) {
			const assignedByUser = await UserServices.findOne({ where: { id: assignedBy } }, tx);
			if (!assignedByUser) return errorHandler('E-104', res);
		}

		// Add optional fields
		if (priority) data.priority = priority;
		if (notes) data.notes = notes;
		// duration is Int? in Prisma; use nullish coalescing so 0 is respected
		data.duration = duration ?? startDateToDuration(plannedStart, plannedEnd);
		if (plannedStart) data.plannedStart = plannedStart;
		if (plannedEnd) data.plannedEnd = plannedEnd;
		data.assignedBy = assignedBy || userId;
		if (delayedBy) data.delayedBy = delayedBy;
		if (description) data.description = description;

		// Create the task
		const task = await TaskServices.create({ data }, tx);

		// Create predecessor relationships
		if (predecessorIds.length > 0) {
			const predecessorData = predecessorIds.map(predecessorId => ({
				taskId: task.id,
				predecessorTaskId: predecessorId,
				createdBy: userId,
			}));
			await TaskPredecessorServices.createMany({ data: predecessorData }, tx);
		}

		// Handle assignee (can be string or array)
		if (assignee) {
			const assigneeIds = Array.isArray(assignee) ? assignee : [assignee];
			const assigneeData = assigneeIds.map(assigneeId => ({
				taskId: task.id,
				userId: assigneeId,
				createdBy: userId,
			}));
			await TaskAssigneeServices.createMany({ data: assigneeData }, tx);

			// Send email notifications to assignees (after transaction commits)
			const assigner = await UserServices.findOne({ where: { id: userId }, select: { name: true } }, tx);
			const phase =
				phaseId && projectId
					? await PhaseService.findOne({ where: { id: phaseId }, include: { project: { select: { name: true } } } }, tx)
					: null;
			const projectName = phase?.project?.name;

			// Fetch assignee details and send emails (non-blocking)
			setImmediate(async () => {
				try {
					for (const assigneeId of assigneeIds) {
						// Skip if assignee is the same as the creator
						if (assigneeId === userId) continue;

						const assigneeUser = await UserServices.findOne({
							where: { id: assigneeId },
							select: { email: true, name: true },
						});

						if (assigneeUser?.email) {
							await EmailService.sendTaskAssignmentEmail({
								toEmail: assigneeUser.email,
								toName: assigneeUser.name,
								taskName: name,
								taskId: task.id,
								projectId,
								assignedByName: assigner?.name,
								projectName,
								priority,
								dueDate: plannedEnd,
							});
						}
					}
				} catch (emailError) {
					console.error('Failed to send task assignment emails:', emailError);
				}
			});

			// Send in-app notifications to assignees (non-blocking)
			sendNotificationBatch(assigneeIds, {
				actorId: userId,
				type: NOTIFICATION_TYPES.TASK_ASSIGNED,
				title: `You were assigned task "${name}"`,
				message: projectName ? `In project "${projectName}"` : undefined,
				metadata: { taskId: task.id, projectId },
			});
		}

		// Create attachments
		if (attachments.length > 0) {
			await AttachmentServices.createMany(
				{
					data: attachments.map(att => ({
						...att,
						taskId: task.id,
						createdBy: userId,
					})),
				},
				tx
			);
		}

		// Create subtasks with proper handling
		if (subTasks.length > 0) {
			for (const subTaskData of subTasks) {
				const { attachments: subTaskAttachments = [], ...subTaskFields } = subTaskData;

				// Create the subtask
				const createdSubTask = await SubTaskServices.create(
					{
						data: {
							...subTaskFields,
							duration: normalizeSubTaskDuration(subTaskFields.duration),
							parentTaskId: task.id,
							createdBy: userId,
						},
					},
					tx
				);

				// Create subtask attachments if provided
				if (subTaskAttachments.length > 0) {
					await AttachmentServices.createMany(
						{
							data: subTaskAttachments.map(att => ({
								...att,
								subTaskId: createdSubTask.id,
								createdBy: userId,
							})),
						},
						tx
					);
				}

				// Track subtask creation activity (within the same transaction)
				await trackActivity(
					userId,
					{
						projectId,
						entityType: ENTITY_TYPES.SUBTASK,
						entityId: createdSubTask.id,
						entityName: createdSubTask.name,
						taskId: task.id,
						activities: [`SubTask "${createdSubTask.name}" created`],
						activityType: ACTIVITY_TYPES.CREATE,
					},
					tx
				);
			}
		}

		// Track task creation activity (within the same transaction)
		await trackActivity(
			userId,
			{
				projectId,
				entityType: ENTITY_TYPES.TASK,
				entityId: task.id,
				entityName: task.name,
				taskId: task.id,
				activities: [`Task "${task.name}" created`],
				activityType: ACTIVITY_TYPES.CREATE,
			},
			tx
		);

		return responseHandler(task, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const loggedInUser = req.user;
		const {
			id,
			search,
			pageNo = 0,
			pageLimit = 10,
			status = 'ACTIVE',
			taskStatus,
			projectId,
			phaseId,
			timelineId,
			assignedToMe,
			approvalPending,
			plannedStart,
			plannedEnd,
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
		// Phase filters: projectId, phaseId, timelineId (project-dependent)
		// Tasks can exist without a phase (created directly against a project).
		// When filtering by projectId alone, match both:
		//   1. Tasks linked via phase (phase.projectId = X)
		//   2. Tasks directly on the project with no phase (task.projectId = X, phaseId null)
		if (projectId && !phaseId && !timelineId) {
			if (!where.AND) where.AND = [];
			where.AND.push({
				OR: [{ phase: { projectId } }, { projectId, phaseId: null }],
			});
		} else if (phaseId || timelineId) {
			where.phase = {};
			if (projectId) where.phase.projectId = projectId;
			if (phaseId) where.phase.id = phaseId;
			if (timelineId) where.phase.timelineId = timelineId;
		}

		// Filter by plannedStart (tasks starting on or after this date)
		if (plannedStart) {
			where.plannedStart = { gte: new Date(plannedStart) };
		}

		// Filter by plannedEnd (tasks ending on or before this date)
		if (plannedEnd) {
			where.plannedEnd = { lte: new Date(plannedEnd) };
		}

		// Filter: tasks assigned to logged-in user (via TaskAssignee)
		if (assignedToMe !== undefined) {
			const flag = String(assignedToMe).toLowerCase();
			if (flag === 'true' || flag === '1' || flag === 'yes') {
				if (!where.AND) where.AND = [];
				where.AND.push({
					TaskAssignee: {
						some: {
							userId: loggedInUser.userId,
						},
					},
				});
			}
		}

		// Filter: tasks that are completed but still pending approval
		if (approvalPending !== undefined) {
			const flag = String(approvalPending).toLowerCase();
			if (flag === 'true' || flag === '1' || flag === 'yes') {
				if (!where.AND) where.AND = [];
				where.AND.push({
					taskStatus: 'COMPLETED',
					approvalStatus: 'PENDING',
				});
			}
		}

		// Access control for client-side users:
		// - CLIENT / CLIENT_CONTACT: can see tasks only for projects of their clientId
		if (loggedInUser?.userType === 'CLIENT' || loggedInUser?.userType === 'CLIENT_CONTACT') {
			const fullUser = await UserServices.findOne({
				where: { id: loggedInUser.userId },
				select: { clientId: true },
			});

			if (fullUser?.clientId) {
				// Ensure task's phase.project belongs to the same client
				if (!where.AND) where.AND = [];
				where.AND.push({
					phase: {
						project: {
							clientId: fullUser.clientId,
						},
					},
				});
			}
		}

		// Build orderBy object - default to createdAt desc
		const orderBy = {
			[sortType]: sortOrder === 1 ? 'asc' : 'desc',
		};

		const totalCount = await TaskServices.count({ where });
		const tasks = await TaskServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
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
				approvalStatus: true,
				approvedBy: true,
				approvedAt: true,
				unit: true,
				progress: true,
				phaseId: true,
				projectId: true,
				updatedAt: true,
				createdAt: true,
				subTasks: {
					select: {
						id: true,
						name: true,
						taskStatus: true,
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
						predecessorTask: {
							select: {
								id: true,
								name: true,
							},
						},
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
				approvedByUser: {
					select: {
						id: true,
						name: true,
						email: true,
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
								plannedStart: true,
								plannedEnd: true,
								taskStatus: true,
								projectId: true, // Added projectId to predecessorTask if available
							},
						},
					},
				},
				phase: {
					select: {
						id: true,
						name: true,
						description: true,
						projectId: true,
						project: {
							select: {
								id: true,
								name: true,
								assignProjectManager: true,
							},
						},
						timeline: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				project: {
					select: {
						id: true,
						name: true,
						assignProjectManager: true,
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
						attachments: {
							select: {
								id: true,
								name: true,
								url: true,
								key: true,
								mimeType: true,
							},
						},
					},
				},
				Activities: {
					select: {
						id: true,
						activity: true,
						activityType: true,
						fieldUpdated: true,
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
			},
			orderBy,
		});

		// Return tasks exactly as stored in DB (including progress)
		return responseHandler({ tasks, totalCount }, res);
	});

	markComplete = transactionHandler(async (req, res, _, tx) => {
		const { id } = req.params;
		const { userId } = req.user;

		// Fetch existing task with its subtasks, predecessors, and phase for projectId
		const existingTask = await TaskServices.findOne(
			{
				where: { id },
				include: {
					subTasks: true,
					phase: { select: { projectId: true } },
					predecessors: {
						include: {
							predecessorTask: {
								select: {
									id: true,
									name: true,
									taskStatus: true,
								},
							},
						},
					},
				},
			},
			tx
		);

		if (!existingTask) return errorHandler('E-603', res);
		if (existingTask.approvalStatus === 'APPROVED') {
			return errorHandler('E-008', res, 'Approved tasks cannot be modified');
		}

		const projectId = existingTask.phase?.projectId;
		let updatedTask;
		const isCurrentlyCompleted = existingTask.taskStatus === 'COMPLETED';
		const taskActivityMessage = isCurrentlyCompleted
			? `Task "${existingTask.name}" marked as pending`
			: `Task "${existingTask.name}" marked as completed`;

		// Only validate predecessors when marking as complete (not when toggling back to pending)
		if (!isCurrentlyCompleted && existingTask.predecessors && existingTask.predecessors.length > 0) {
			// Filter only predecessors that have a valid predecessorTask (skip if task was deleted)
			const validPredecessors = existingTask.predecessors.filter(p => p.predecessorTask);

			if (validPredecessors.length > 0) {
				// Check if any predecessor task is BLOCKED
				const blockedPredecessors = validPredecessors.filter(p => p.predecessorTask.taskStatus === 'BLOCKED');

				if (blockedPredecessors.length > 0) {
					return errorHandler('E-607', res, 'Please unblock predecessor tasks first');
				}

				// Check if all predecessor tasks are completed
				const incompletePredecessors = validPredecessors.filter(p => p.predecessorTask.taskStatus !== 'COMPLETED');

				if (incompletePredecessors.length > 0) {
					return errorHandler('E-608', res, 'Please complete predecessor tasks first');
				}
			}
		}

		if (isCurrentlyCompleted) {
			// Toggle: if already completed, set status back to PENDING but keep existing progress
			updatedTask = await TaskServices.update(
				{
					where: { id },
					data: {
						taskStatus: 'PENDING',
						approvalStatus: 'PENDING',
						approvedBy: null,
						approvedAt: null,
						updatedBy: userId,
					},
				},
				tx
			);
		} else {
			// Mark all subtasks as completed with 100% progress (if any)
			if (existingTask.subTasks && existingTask.subTasks.length > 0) {
				const subTaskIds = existingTask.subTasks.map(st => st.id);
				await SubTaskServices.updateMany(
					{
						where: { id: { in: subTaskIds } },
						data: {
							taskStatus: 'COMPLETED',
							progress: 100,
							updatedBy: userId,
						},
					},
					tx
				);

				// Track activity for each subtask that was auto-completed by parent task completion
				for (const st of existingTask.subTasks) {
					await trackActivity(
						userId,
						{
							projectId,
							entityType: ENTITY_TYPES.SUBTASK,
							entityId: st.id,
							entityName: st.name,
							subTaskId: st.id,
							taskId: id,
							activities: [`SubTask "${st.name}" auto-completed because parent task was completed`],
							activityType: ACTIVITY_TYPES.UPDATE,
							fieldUpdated: 'taskStatus',
						},
						tx
					);
				}
			}

			// Mark task as completed with 100% progress
			updatedTask = await TaskServices.update(
				{
					where: { id },
					data: {
						taskStatus: 'COMPLETED',
						approvalStatus: 'PENDING',
						approvedBy: null,
						approvedAt: null,
						progress: 100,
						updatedBy: userId,
					},
				},
				tx
			);
		}

		// Track activity on task completion toggle
		await trackActivity(
			userId,
			{
				projectId,
				entityType: ENTITY_TYPES.TASK,
				entityId: id,
				entityName: existingTask.name,
				taskId: id,
				activities: [taskActivityMessage],
				activityType: ACTIVITY_TYPES.UPDATE,
				fieldUpdated: 'taskStatus',
			},
			tx
		);

		return responseHandler(updatedTask, res);
	});

	update = transactionHandler(async (req, res, _, tx) => {
		const { id } = req.params;
		const {
			name,
			description,
			status,
			phaseId,
			projectId: requestProjectId,
			predecessorTaskIds,
			assignee,
			assignees,
			assignedBy,
			attachments,
			taskStatus,
			priority,
			plannedEnd,
			plannedStart,
			duration,
		} = req.body;
		const { userId } = req.user;

		const existingTask = await TaskServices.findOne(
			{
				where: { id },
				include: {
					phase: { select: { id: true, name: true, projectId: true } },
					predecessors: { select: { predecessorTaskId: true } },
				},
			},
			tx
		);
		if (!existingTask) return errorHandler('E-603', res);
		if (existingTask.approvalStatus === 'APPROVED') {
			return errorHandler('E-008', res, 'Approved tasks cannot be edited');
		}

		const oldProjectId = existingTask.phase?.projectId;
		let projectId = oldProjectId || requestProjectId; // Use requestProjectId if task has no phase
		let newPhase = null; // Store new phase info for activity tracking
		const updateData = { updatedBy: userId };
		const fieldUpdates = []; // Track field updates with field name and message

		// Track phase change - validate and handle carefully
		if (phaseId !== undefined && existingTask.phaseId !== phaseId) {
			// Validate that the new phase exists
			newPhase = await PhaseService.findOne(
				{
					where: { id: phaseId },
					select: { id: true, name: true, projectId: true, project: { select: { name: true } } },
				},
				tx
			);

			if (!newPhase) {
				return errorHandler('E-404', res, 'Phase not found');
			}

			// Check if this is a cross-project move (moving task to a different project)
			const isCrossProjectMove = newPhase.projectId !== oldProjectId;

			if (isCrossProjectMove) {
				// For cross-project moves, we need to be extra careful
				// Update projectId to the new project for subsequent activity tracking
				projectId = newPhase.projectId;
			}

			updateData.phaseId = phaseId;
			fieldUpdates.push({
				field: 'phaseId',
				message: isCrossProjectMove
					? `moved to phase "${newPhase.name}" in project "${newPhase.project?.name}"`
					: `moved to phase "${newPhase.name}"`,
				metadata: {
					oldPhaseId: existingTask.phaseId,
					oldPhaseName: existingTask.phase?.name,
					newPhaseId: phaseId,
					newPhaseName: newPhase.name,
					isCrossProjectMove,
					...(isCrossProjectMove && {
						oldProjectId,
						newProjectId: newPhase.projectId,
						newProjectName: newPhase.project?.name,
					}),
				},
			});

			// Clean up old TimeLineTaskOrder entries when task moves to a different phase
			// This ensures the task doesn't appear in the old phase's ordered list
			await TimelineTaskOrderServices.deleteMany({ where: { taskId: id } }, tx);
		}

		// Track name change
		if (name !== undefined && existingTask.name !== name) {
			updateData.name = name;
			fieldUpdates.push({
				field: 'name',
				message: `updated name to ${name}`,
			});
		}

		// Track description change
		if (description !== undefined && existingTask.description !== description) {
			updateData.description = description;
			fieldUpdates.push({
				field: 'description',
				message: 'updated description',
			});
		}

		// Track status change
		if (status !== undefined && existingTask.status !== status) {
			updateData.status = status;
			fieldUpdates.push({
				field: 'status',
				message: `updated status to ${status}`,
			});
		}

		// Track planned end change
		if (plannedEnd !== undefined && existingTask.plannedEnd !== plannedEnd) {
			updateData.plannedEnd = plannedEnd;
			const date = new Date(plannedEnd);
			const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
			fieldUpdates.push({
				field: 'plannedEnd',
				message: `updated planned end to ${formattedDate}`,
			});
		}
		// Track planned start change
		if (plannedStart !== undefined && existingTask.plannedStart !== plannedStart) {
			updateData.plannedStart = plannedStart;
			const date = new Date(plannedStart);
			const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
			fieldUpdates.push({
				field: 'plannedStart',
				message: `updated planned start to ${formattedDate}`,
			});
		}

		// duration is Int? in Prisma.
		// Only change duration when duration is explicitly provided OR planned dates are being updated.
		if (duration !== undefined || plannedStart !== undefined || plannedEnd !== undefined) {
			const effectiveStart = plannedStart !== undefined ? plannedStart : existingTask.plannedStart;
			const effectiveEnd = plannedEnd !== undefined ? plannedEnd : existingTask.plannedEnd;
			const calculatedDuration = duration !== undefined ? duration : startDateToDuration(effectiveStart, effectiveEnd);

			if (existingTask.duration !== calculatedDuration) {
				updateData.duration = calculatedDuration;
				fieldUpdates.push({
					field: 'duration',
					message: 'updated duration',
				});
			}
		}

		// Handle predecessor tasks update (many-to-many)
		// - predecessorTaskIds: null => clear all predecessors
		// - predecessorTaskIds: [] => treat as "no change" (prevents accidental removals)
		// - predecessorTaskIds: <uuid> or [<uuid>, ...] => replace
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

		// Handle assignee update.
		// - assignee: null => clear all assignees (and record activity)
		// - assignee: []   => treat as "no change" (prevents accidental removals from forms that submit empty arrays)
		// - assignee: <uuid> or [<uuid>, ...] => replace
		const shouldProcessAssignee =
			assignee === null || (assignee !== undefined && !(Array.isArray(assignee) && assignee.length === 0));
		if (shouldProcessAssignee) {
			// Get existing assignees to determine new ones for email notifications
			const existingAssignees = await TaskAssigneeServices.findMany({ where: { taskId: id } }, tx);
			const existingAssigneeIds = existingAssignees.map(a => a.userId);

			await TaskAssigneeServices.deleteMany({ where: { taskId: id } }, tx);

			const assigneeIds = assignee === null ? [] : Array.isArray(assignee) ? assignee : [assignee];
			if (assigneeIds.length > 0 && assigneeIds[0]) {
				const assigneeData = assigneeIds.map(assigneeId => ({
					taskId: id,
					userId: assigneeId,
					createdBy: userId,
				}));
				await TaskAssigneeServices.createMany({ data: assigneeData }, tx);

				// Determine new assignees (not in previous list)
				const newAssigneeIds = assigneeIds.filter(aid => !existingAssigneeIds.includes(aid));

				// Send email notifications to new assignees (after transaction commits)
				if (newAssigneeIds.length > 0) {
					const assigner = await UserServices.findOne({ where: { id: userId }, select: { name: true } }, tx);
					// Use new phase info if phase was changed, otherwise fetch from existing task's phase
					let projectName;
					if (newPhase) {
						projectName = newPhase.project?.name;
					} else if (existingTask.phase?.projectId) {
						const phase = await PhaseService.findOne(
							{
								where: { id: existingTask.phaseId },
								include: { project: { select: { name: true } } },
							},
							tx
						);
						projectName = phase?.project?.name;
					}

					// Non-blocking email sending
					setImmediate(async () => {
						try {
							for (const newAssigneeId of newAssigneeIds) {
								// Skip if assignee is the same as the user making the update
								if (newAssigneeId === userId) continue;

								const assigneeUser = await UserServices.findOne({
									where: { id: newAssigneeId },
									select: { email: true, name: true },
								});

								if (assigneeUser?.email) {
									await EmailService.sendTaskAssignmentEmail({
										toEmail: assigneeUser.email,
										toName: assigneeUser.name,
										taskName: existingTask.name,
										taskId: id,
										projectId,
										assignedByName: assigner?.name,
										projectName,
										priority: existingTask.priority,
										dueDate: existingTask.plannedEnd,
									});
								}
							}
						} catch (emailError) {
							console.error('Failed to send task assignment emails:', emailError);
						}
					});

					// Send in-app notifications to new assignees (non-blocking)
					sendNotificationBatch(newAssigneeIds, {
						actorId: userId,
						type: NOTIFICATION_TYPES.TASK_ASSIGNED,
						title: `You were assigned task "${existingTask.name}"`,
						message: projectName ? `In project "${projectName}"` : undefined,
						metadata: { taskId: id, projectId },
					});
				}
			}

			fieldUpdates.push({
				field: 'assignee',
				message:
					assigneeIds.length > 0 && assigneeIds[0]
						? `updated assignee (${assigneeIds.length} user${assigneeIds.length !== 1 ? 's' : ''})`
						: 'removed assignee',
			});
		}

		// Track assignedBy change
		if (assignedBy !== undefined && existingTask.assignedBy !== assignedBy) {
			updateData.assignedBy = assignedBy;
			fieldUpdates.push({
				field: 'assignedBy',
				message: 'updated assigned by',
			});
		}

		// Track attachment change (don't add to updateData - handled separately as relation)
		if (attachments !== undefined && JSON.stringify(existingTask.attachments) !== JSON.stringify(attachments)) {
			const attachmentCount = Array.isArray(attachments) ? attachments.length : 0;
			const existingAttachmentCount = Array.isArray(existingTask.attachments) ? existingTask.attachments.length : 0;

			let attachmentMessage = '';
			if (attachmentCount > existingAttachmentCount) {
				attachmentMessage = `added ${attachmentCount - existingAttachmentCount} attachment(s)`;
			} else if (attachmentCount < existingAttachmentCount) {
				attachmentMessage = `removed ${existingAttachmentCount - attachmentCount} attachment(s)`;
			} else {
				attachmentMessage = 'updated attachments';
			}

			fieldUpdates.push({
				field: 'attachments',
				message: attachmentMessage,
			});
		}

		// Track task status change
		if (taskStatus !== undefined && existingTask.taskStatus !== taskStatus) {
			updateData.taskStatus = taskStatus;
			fieldUpdates.push({
				field: 'taskStatus',
				message: `Updated task status from ${existingTask.taskStatus} to ${taskStatus}`,
			});

			// Auto-set progress to 100 when task is marked as COMPLETED
			if (taskStatus === 'COMPLETED') {
				updateData.approvalStatus = 'PENDING';
				updateData.approvedBy = null;
				updateData.approvedAt = null;
				updateData.progress = 100;
				fieldUpdates.push({
					field: 'progress',
					message: 'Progress auto-set to 100% on completion',
				});
			} else if (existingTask.approvalStatus === 'APPROVED') {
				updateData.approvalStatus = 'PENDING';
				updateData.approvedBy = null;
				updateData.approvedAt = null;
				fieldUpdates.push({
					field: 'approvalStatus',
					message: 'Approval reset because task is no longer completed',
				});
			}

			// Notify task assignees about status change (non-blocking)
			setImmediate(async () => {
				try {
					const taskAssignees = await TaskAssigneeServices.findMany({ where: { taskId: id } });
					const assigneeIds = taskAssignees.map(a => a.userId);
					if (assigneeIds.length > 0) {
						sendNotificationBatch(assigneeIds, {
							actorId: userId,
							type: NOTIFICATION_TYPES.STATUS_CHANGED,
							title: `Task "${existingTask.name}" status changed to ${taskStatus}`,
							metadata: { taskId: id, projectId, oldStatus: existingTask.taskStatus, newStatus: taskStatus },
						});
					}
				} catch (err) {
					console.error('Failed to send status change notifications:', err);
				}
			});
		}

		// Track priority change
		if (priority !== undefined && existingTask.priority !== priority) {
			updateData.priority = priority;
			fieldUpdates.push({
				field: 'priority',
				message: `Updated priority from ${existingTask.priority} to ${priority}`,
			});
		}

		// Update task
		const task = await TaskServices.update({ where: { id }, data: updateData }, tx);

		// Handle attachments separately (relation field - delete old, create new)
		if (attachments !== undefined) {
			// Delete existing attachments for this task
			await AttachmentServices.deleteMany({ where: { taskId: id } }, tx);
			// Create new attachments if provided
			if (attachments.length > 0) {
				await AttachmentServices.createMany(
					{ data: attachments.map(att => ({ ...att, taskId: id, createdBy: userId, updatedBy: userId })) },
					tx
				);
			}
		}

		// Register activities - create separate activity for each field update (within the same transaction)
		if (fieldUpdates.length > 0) {
			for (const update of fieldUpdates) {
				// For phase changes with cross-project moves, log activity to BOTH projects
				if (update.field === 'phaseId' && update.metadata?.isCrossProjectMove) {
					// Log "task moved out" to old project
					await trackActivity(
						userId,
						{
							projectId: oldProjectId,
							entityType: ENTITY_TYPES.TASK,
							entityId: id,
							entityName: existingTask.name,
							taskId: id,
							activities: [`task moved to project "${update.metadata.newProjectName}"`],
							activityType: ACTIVITY_TYPES.UPDATE,
							fieldUpdated: 'phaseId',
							metadata: update.metadata,
						},
						tx
					);
					// Log "task moved in" to new project
					await trackActivity(
						userId,
						{
							projectId: update.metadata.newProjectId,
							entityType: ENTITY_TYPES.TASK,
							entityId: id,
							entityName: existingTask.name,
							taskId: id,
							activities: [update.message],
							activityType: ACTIVITY_TYPES.UPDATE,
							fieldUpdated: 'phaseId',
							metadata: update.metadata,
						},
						tx
					);
				} else {
					// Standard activity logging
					await trackActivity(
						userId,
						{
							projectId,
							entityType: ENTITY_TYPES.TASK,
							entityId: id,
							entityName: existingTask.name,
							taskId: id,
							activities: [update.message],
							activityType: ACTIVITY_TYPES.UPDATE,
							fieldUpdated: update.field,
							...(update.metadata && { metadata: update.metadata }),
						},
						tx
					);
				}
			}
		}

		return responseHandler(task, res);
	});

	approve = transactionHandler(async (req, res, _, tx) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existingTask = await TaskServices.findOne(
			{
				where: { id },
				select: {
					id: true,
					name: true,
					projectId: true,
					taskStatus: true,
					approvalStatus: true,
					project: {
						select: {
							id: true,
							name: true,
							assignProjectManager: true,
						},
					},
					phase: {
						select: {
							projectId: true,
							project: {
								select: {
									id: true,
									name: true,
									assignProjectManager: true,
								},
							},
						},
					},
				},
			},
			tx
		);

		if (!existingTask) return errorHandler('E-603', res);

		const project = existingTask.project || existingTask.phase?.project || null;
		const projectId = project?.id || existingTask.projectId || existingTask.phase?.projectId || null;
		const projectManagerId = project?.assignProjectManager || null;

		if (!isSuperAdmin(req.user) && projectManagerId !== userId) {
			return errorHandler('E-007', res, 'Only the assigned project manager or super admin can approve this task');
		}

		if (existingTask.taskStatus !== 'COMPLETED') {
			return errorHandler('E-008', res, 'Only completed tasks can be approved');
		}

		if (existingTask.approvalStatus === 'APPROVED') {
			return responseHandler(existingTask, res);
		}

		const task = await TaskServices.update(
			{
				where: { id },
				data: {
					approvalStatus: 'APPROVED',
					approvedBy: userId,
					approvedAt: new Date(),
					updatedBy: userId,
				},
			},
			tx
		);

		await trackActivity(
			userId,
			{
				projectId,
				entityType: ENTITY_TYPES.TASK,
				entityId: id,
				entityName: existingTask.name,
				taskId: id,
				activities: [`Task "${existingTask.name}" approved`],
				activityType: ACTIVITY_TYPES.UPDATE,
				fieldUpdated: 'approvalStatus',
			},
			tx
		);

		return responseHandler(task, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existingTask = await TaskServices.findOne({
			where: { id },
			include: { phase: { select: { projectId: true } } },
		});
		if (!existingTask) return errorHandler('E-603', res);
		if (existingTask.approvalStatus === 'APPROVED') {
			return errorHandler('E-008', res, 'Approved tasks cannot be deleted');
		}

		const projectId = existingTask.phase?.projectId;

		const task = await TaskServices.update({ where: { id }, data: { status: 'INACTIVE', updatedBy: userId } });
		await trackActivity(userId, {
			projectId,
			entityType: ENTITY_TYPES.TASK,
			entityId: id,
			entityName: task.name,
			taskId: id,
			activities: [`Task "${task.name}" deleted`],
			activityType: ACTIVITY_TYPES.DELETE,
		});
		return responseHandler(task, res);
	});
}
export default new TasksController();
