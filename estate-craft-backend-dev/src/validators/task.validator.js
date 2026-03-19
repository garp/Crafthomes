import joi from 'joi';

export const attachmentSchema = joi.object({
	name: joi.string().required(),
	url: joi.string().uri().required(),
	key: joi.string().optional(),
	type: joi.string().optional(),
	mimeType: joi.string().optional(),
	size: joi.number().optional(),
});

export const getTaskSchema = joi.object({
	id: joi.string().uuid().optional(),
	search: joi.string().optional().min(1).max(100),
	pageNo: joi.number().integer().optional().default(0),
	pageLimit: joi.number().integer().optional().default(10),
	status: joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	taskStatus: joi.string().optional().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED').allow('', null),
	projectId: joi.string().uuid().optional(),
	phaseId: joi.string().uuid().optional(),
	timelineId: joi.string().uuid().optional(),
	assignedToMe: joi
		.alternatives()
		.try(joi.boolean(), joi.string().valid('true', 'false', '1', '0', 'yes', 'no'))
		.optional(),
	approvalPending: joi
		.alternatives()
		.try(joi.boolean(), joi.string().valid('true', 'false', '1', '0', 'yes', 'no'))
		.optional(),
	plannedStart: joi.string().isoDate().optional(),
	plannedEnd: joi.string().isoDate().optional(),
	sortType: joi
		.string()
		.optional()
		.valid('createdAt', 'updatedAt', 'name', 'sNo', 'priority', 'taskStatus', 'plannedStart', 'plannedEnd'),
	sortOrder: joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const createCommentSchema = joi
	.object({
		content: joi.string().required(),
		taskId: joi.string().uuid().optional(),
		subTaskId: joi.string().uuid().optional(),
		attachments: joi.array().items(attachmentSchema).optional(),
	})
	.or('taskId', 'subTaskId');

export const updateCommentSchema = joi.object({
	content: joi.string().required(),
	attachments: joi.array().items(attachmentSchema).optional(),
});

export const getCommentSchema = joi.object({
	id: joi.string().uuid().optional(),
	taskId: joi.string().uuid().optional(),
	subTaskId: joi.string().uuid().optional(),
	pageNo: joi.number().integer().optional().default(0),
	pageLimit: joi.number().integer().optional().default(10),
});
