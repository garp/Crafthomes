import Joi from 'joi';

const attachmentSchema = Joi.object({
	name: Joi.string().required(),
	url: Joi.string().uri().required(),
	key: Joi.string().optional(),
	type: Joi.string().optional(),
	mimeType: Joi.string().optional(),
	size: Joi.number().optional(),
});

export const getSubTaskSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	taskStatus: Joi.string().optional().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'),
	projectId: Joi.string().uuid().optional(),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'name', 'priority', 'taskStatus', 'startDate', 'endDate'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
	parentTaskId: Joi.string().uuid().optional(),
});

// assignee: accept string (single user id) or array of user ids; backend stores single assignee (first of array)
const assigneeSchema = Joi.alternatives().try(
	Joi.string().uuid().allow(null, ''),
	Joi.array().items(Joi.string().uuid()).min(0).single()
);

export const createSubTaskSchema = Joi.object({
	name: Joi.string().required(),
	parentTaskId: Joi.string().required(),
	assignedBy: Joi.string().optional(),
	assignee: assigneeSchema.optional(),
	attachments: Joi.array().items(attachmentSchema).optional(),
	// SubTask.duration is String? in Prisma; accept number/string and normalize in controller.
	duration: Joi.alternatives().try(Joi.number().integer().min(0), Joi.string()).optional().empty('').allow(null),
	notes: Joi.string().optional(),
	priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
	startDate: Joi.date().optional(),
	endDate: Joi.date().optional(),
	plannedStart: Joi.date().optional(),
	plannedEnd: Joi.date().optional(),
	description: Joi.string().optional().allow(''),
	status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
	createdBy: Joi.string().optional(),
	updatedBy: Joi.string().optional(),
	taskStatus: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED').optional(),
	unit: Joi.string().optional(),
	progress: Joi.number().integer().min(0).max(100).optional(),
	predecessorTaskId: Joi.string().optional(),
});

export const updateSubTaskSchema = Joi.object({
	name: Joi.string().optional(),
	assignedBy: Joi.string().optional(),
	assignee: assigneeSchema.optional(),
	attachments: Joi.array().items(attachmentSchema).optional(),
	// SubTask.duration is String? in Prisma; accept number/string and normalize in controller.
	duration: Joi.alternatives().try(Joi.number().integer().min(0), Joi.string()).optional().empty('').allow(null),
	notes: Joi.string().optional(),
	priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
	startDate: Joi.date().optional(),
	endDate: Joi.date().optional(),
	plannedStart: Joi.date().optional(),
	plannedEnd: Joi.date().optional(),
	description: Joi.string().optional().allow(''),
	status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
	updatedBy: Joi.string().optional(),
	taskStatus: Joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED').optional(),
	unit: Joi.string().optional(),
	progress: Joi.number().integer().min(0).max(100).optional(),
	predecessorTaskId: Joi.string().optional(),
});
