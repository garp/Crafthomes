import CommentServices from '../services/modelServices/comment.services.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import TaskServices from '../services/modelServices/task.services.js';
import SubTaskServices from '../services/modelServices/subTask.services.js';
import AttachmentServices from '../services/modelServices/attachment.services.js';
import trackActivity from '../middlewares/activities.middleware.js';
import UserServices from '../services/modelServices/user.services.js';
import EmailService from '../services/modelServices/email.services.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';
import { sendNotificationBatch, NOTIFICATION_TYPES } from '../socket/emitters/notification.emitter.js';

const extractMentionUserIds = html => {
	if (!html || typeof html !== 'string') return [];
	const ids = new Set();

	// Robust mention extraction (supports attribute order variations)
	const patterns = [
		/<span[^>]*data-type="mention"[^>]*data-id="([^"]+)"[^>]*>/g,
		/<span[^>]*data-id="([^"]+)"[^>]*data-type="mention"[^>]*>/g,
	];

	for (const regex of patterns) {
		let match;
		while ((match = regex.exec(html)) !== null) {
			if (match[1]) ids.add(match[1]);
		}
	}
	return Array.from(ids);
};

// Helper to get projectId from task or subtask
const getProjectIdFromTaskOrSubTask = async (taskId, subTaskId) => {
	if (taskId) {
		const task = await TaskServices.findOne({
			where: { id: taskId },
			select: { phase: { select: { projectId: true } } },
		});
		return task?.phase?.projectId || null;
	}
	if (subTaskId) {
		const subTask = await SubTaskServices.findOne({
			where: { id: subTaskId },
			select: { parentTask: { select: { phase: { select: { projectId: true } } } } },
		});
		return subTask?.parentTask?.phase?.projectId || null;
	}
	return null;
};

class CommentController {
	create = asyncHandler(async (req, res) => {
		const { content, taskId, subTaskId, attachments = [] } = req.body;
		const { userId } = req.user;

		let task = null;
		let subTask = null;
		let projectId = null;

		if (taskId) {
			task = await TaskServices.findOne({
				where: { id: taskId },
				include: { phase: { select: { projectId: true } } },
			});
			if (!task) return errorHandler('E-603', res);
			projectId = task.phase?.projectId;
		}
		if (subTaskId) {
			subTask = await SubTaskServices.findOne({
				where: { id: subTaskId },
				include: { parentTask: { select: { id: true, name: true, phase: { select: { projectId: true } } } } },
			});
			if (!subTask) return errorHandler('E-604', res);
			projectId = subTask.parentTask?.phase?.projectId;
		}

		const commentData = await CommentServices.create({ data: { content, taskId, subTaskId, createdBy: userId } });
		if (attachments.length > 0) {
			await AttachmentServices.createMany({
				data: attachments.map(att => ({ ...att, commentId: commentData.id, createdBy: userId })),
			});
		}

		// Track activity with project info
		const activityMessage =
			attachments.length > 0 ? `Added a comment with ${attachments.length} attachment(s)` : 'Added a comment';

		if (taskId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.COMMENT,
				entityId: commentData.id,
				entityName: task?.name ? `Comment on ${task.name}` : 'Comment',
				taskId,
				activities: [activityMessage],
				activityType: ACTIVITY_TYPES.COMMENT,
			});
		} else if (subTaskId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.COMMENT,
				entityId: commentData.id,
				entityName: subTask?.name ? `Comment on ${subTask.name}` : 'Comment',
				subTaskId,
				activities: [activityMessage],
				activityType: ACTIVITY_TYPES.COMMENT,
			});
		}

		// Respond first (do not block comment creation on email)
		responseHandler(commentData, res, 201);

		// Send in-app notifications for mentions (non-blocking)
		const mentionedIds = extractMentionUserIds(content).filter(id => id && id !== userId);
		if (mentionedIds.length > 0) {
			const entityName = task?.name || subTask?.name || 'a task';
			sendNotificationBatch(mentionedIds, {
				actorId: userId,
				type: NOTIFICATION_TYPES.COMMENT_MENTION,
				title: `You were mentioned in a comment on "${entityName}"`,
				metadata: { commentId: commentData.id, taskId, subTaskId, projectId },
			});
		}

		// Fire-and-forget: notify mentioned users via email
		setImmediate(async () => {
			try {
				const mentionedUserIds = extractMentionUserIds(content).filter(id => id && id !== userId);
				if (mentionedUserIds.length === 0) return;
				console.info('Mention email: extracted mention userIds:', mentionedUserIds);

				const [author, fetchedTask] = await Promise.all([
					UserServices.findOne({ where: { id: userId }, select: { id: true, name: true } }),
					taskId
						? TaskServices.findOne({
								where: { id: taskId },
								select: { id: true, name: true, phase: { select: { projectId: true } } },
						  })
						: subTaskId
							? SubTaskServices.findOne({
								where: { id: subTaskId },
								select: {
									id: true,
									name: true,
									parentTask: {
										select: { id: true, name: true, phase: { select: { projectId: true } } },
									},
								},
							})
							: null,
				]);

				// For subtask comment, send the parent task link/name in email
				const taskName = taskId ? fetchedTask?.name : fetchedTask?.parentTask?.name;
				const resolvedTaskId = taskId ? fetchedTask?.id : fetchedTask?.parentTask?.id;
				const projectId = taskId ? fetchedTask?.phase?.projectId : fetchedTask?.parentTask?.phase?.projectId;

				const users = await UserServices.findMany({
					where: { id: { in: mentionedUserIds } },
					select: { id: true, email: true, name: true, status: true },
				});
				console.info(
					'Mention email: recipients:',
					users.map(u => ({ id: u.id, email: u.email, status: u.status }))
				);

				await Promise.all(
					users
						.filter(u => u?.email && u.status === 'ACTIVE')
						.map(u =>
							EmailService.sendMentionInCommentEmail({
								toEmail: u.email,
								toName: u.name,
								mentionedByName: author?.name,
								taskName,
								taskId: resolvedTaskId,
								projectId,
								commentHtml: content,
							})
						)
				);
			} catch (err) {
				console.error('Mention email send failed:', err);
			}
		});

		return;
	});

	get = asyncHandler(async (req, res) => {
		const { id, taskId, subTaskId, pageNo = 0, pageLimit = 10 } = req.query;
		const where = { status: 'ACTIVE' };
		if (id) {
			where.id = id;
		}
		if (taskId) {
			where.taskId = taskId;
		}
		if (subTaskId) {
			where.subTaskId = subTaskId;
		}
		const totalCount = await CommentServices.count({ where });
		const comments = await CommentServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy: { createdAt: 'desc' },
			select: {
				id: true,
				sNo: true,
				content: true,
				createdAt: true,
				taskId: true,
				subTaskId: true,
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
						size: true,
						createdAt: true,
					},
				},
			},
		});
		return responseHandler({ comments, totalCount }, res, 200);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { content, attachments = [] } = req.body;
		const { userId } = req.user;

		// Check if comment exists
		const comment = await CommentServices.findOne({ where: { id } });
		if (!comment) return errorHandler('E-1001', res);

		// Check if comment is already deleted
		if (comment.status === 'INACTIVE') return errorHandler('E-1003', res);

		// Check authorization - user must be the creator
		if (comment.createdBy !== userId) return errorHandler('E-1002', res);

		// Get projectId for activity tracking
		const projectId = await getProjectIdFromTaskOrSubTask(comment.taskId, comment.subTaskId);

		const activityMessages = [];

		// Track content change
		if (content !== undefined && content !== comment.content) {
			activityMessages.push('Comment updated');
		}

		// Update comment content
		const updatedComment = await CommentServices.update({
			where: { id },
			data: { content, updatedBy: userId },
			include: {
				attachments: true,
			},
		});

		// Handle attachments if provided
		if (attachments.length > 0) {
			// Delete existing attachments for this comment
			await AttachmentServices.deleteMany({ where: { commentId: id } });
			// Create new attachments
			await AttachmentServices.createMany({
				data: attachments.map(att => ({ ...att, commentId: id, updatedBy: userId })),
			});
			activityMessages.push(`Comment attachments updated (${attachments.length} attachment(s))`);
		}

		// Fetch updated comment with attachments
		const finalComment = await CommentServices.findOne({
			where: { id },
			include: {
				attachments: true,
			},
		});

		// Track activity with project info
		if (activityMessages.length > 0) {
			if (comment.taskId) {
				await trackActivity(userId, {
					projectId,
					entityType: ENTITY_TYPES.COMMENT,
					entityId: id,
					entityName: 'Comment',
					taskId: comment.taskId,
					activities: activityMessages,
					activityType: ACTIVITY_TYPES.COMMENT,
				});
			} else if (comment.subTaskId) {
				await trackActivity(userId, {
					projectId,
					entityType: ENTITY_TYPES.COMMENT,
					entityId: id,
					entityName: 'Comment',
					subTaskId: comment.subTaskId,
					activities: activityMessages,
					activityType: ACTIVITY_TYPES.COMMENT,
				});
			}
		}

		return responseHandler(finalComment, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		// Check if comment exists
		const comment = await CommentServices.findOne({ where: { id } });
		if (!comment) return errorHandler('E-1001', res);

		// Check if comment is already deleted
		if (comment.status === 'INACTIVE') return errorHandler('E-1003', res);

		// Check authorization - user must be the creator
		if (comment.createdBy !== userId) return errorHandler('E-1002', res);

		// Get projectId for activity tracking
		const projectId = await getProjectIdFromTaskOrSubTask(comment.taskId, comment.subTaskId);

		// Soft delete the comment
		const deletedComment = await CommentServices.delete({
			where: { id },
		});

		// Track activity with project info
		if (comment.taskId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.COMMENT,
				entityId: id,
				entityName: 'Comment',
				taskId: comment.taskId,
				activities: ['Comment deleted'],
				activityType: ACTIVITY_TYPES.DELETE,
			});
		} else if (comment.subTaskId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.COMMENT,
				entityId: id,
				entityName: 'Comment',
				subTaskId: comment.subTaskId,
				activities: ['Comment deleted'],
				activityType: ACTIVITY_TYPES.DELETE,
			});
		}

		return responseHandler(deletedComment, res, 200);
	});
}

export default new CommentController();
