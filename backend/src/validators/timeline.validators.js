import joi from 'joi';
import { attachmentSchema } from './task.validator.js';

const createSubTaskSchema = joi.object({
	name: joi.string().required(),
	parentTaskId: joi.string().uuid().optional(),
	assignedBy: joi.string().uuid().optional(),
	assignee: joi.alternatives().try(joi.string().uuid(), joi.array().items(joi.string().uuid())).optional(),
	attachments: joi.array().items(attachmentSchema).optional(),
	// SubTask.duration is String? in Prisma; accept number/string (controller will normalize).
	duration: joi.alternatives().try(joi.number().integer().min(0), joi.string()).optional().empty('').allow(null),
	notes: joi.string().optional(),
	priority: joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
	startDate: joi.date().optional(),
	endDate: joi.date().optional(),
	plannedStart: joi.date().optional(),
	plannedEnd: joi.date().optional(),
	description: joi.string().optional().allow(''),
	status: joi.string().valid('ACTIVE', 'INACTIVE').optional(),
	taskStatus: joi.string().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED').optional(),
	unit: joi.string().optional(),
	progress: joi.number().integer().min(0).max(100).optional(),
	predecessorTaskId: joi.string().uuid().optional().allow('').allow(null),
});

export const getTimelineSchema = joi.object({
	id: joi.string().uuid().optional(),
	pageNo: joi.number().integer().optional().default(0),
	pageLimit: joi.number().integer().optional().default(10),
	status: joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	timelineStatus: joi
		.string()
		.optional()
		.valid('PENDING', 'PENDING_APPROVAL', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'DELETED'),
	projectId: joi.string().uuid().optional(),
	sortType: joi.string().optional().valid('createdAt', 'updatedAt', 'name', 'createdOn', 'plannedStart', 'plannedEnd'),
	sortOrder: joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const getPhaseSchema = joi.object({
	id: joi.string().uuid().optional(),
	projectId: joi.string().uuid().optional(),
	timelineId: joi.string().uuid().optional(),
	status: joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	sortType: joi.string().optional().valid('createdAt', 'updatedAt', 'name'),
	sortOrder: joi.number().integer().valid(0, 1).optional().default(0),
});

export const getTaskSchema = joi.object({
	id: joi.string().uuid().optional(),
	phaseId: joi.string().uuid().optional(),
	status: joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	taskStatus: joi.string().optional().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'),
	sortType: joi.string().optional().valid('createdAt', 'updatedAt', 'name', 'priority'),
	sortOrder: joi.number().integer().valid(0, 1).optional().default(0),
});

export const createTimelineSchema = joi.object({
	name: joi.string().required(),
	projectId: joi.string().required(),
	createdOn: joi.date().optional(),
	plannedStart: joi.date().required(),
	plannedEnd: joi.date().optional().allow(null),
	templateTimelineId: joi.string().uuid().optional().allow('', null),
	sentTo: joi.string().uuid().optional().allow('', null),
});

export const updateTimelineSchema = joi.object({
	name: joi.string().optional(),
	projectId: joi.string().optional(),
	createdOn: joi.date().optional(),
	plannedStart: joi.date().optional(),
	plannedEnd: joi.date().optional().allow(null),
	sentTo: joi.string().uuid().optional().allow(null),
	status: joi.string().optional(),
	timelineStatus: joi
		.string()
		.optional()
		.valid('PENDING', 'PENDING_APPROVAL', 'IN_PROGRESS', 'COMPLETED', 'ARCHIVED', 'DELETED'),
});

export const createPhaseSchema = joi.object({
	name: joi.string().required(),
	description: joi.string().optional().allow(''),
	projectId: joi.string().required(),
	timelineId: joi.string().required(),
	masterPhaseCheck: joi.boolean().required(),
});

export const createTaskSchema = joi.object({
	name: joi.string().required(),
	phaseId: joi.string().uuid().optional().allow('').empty(''),
	projectId: joi.string().uuid().required(),
	plannedStart: joi.date().optional(),
	plannedEnd: joi.date().optional(),
	duration: joi.number().integer().min(0).optional(),
	assignee: joi.alternatives().try(joi.string().uuid(), joi.array().items(joi.string().uuid())).optional(),
	assignedBy: joi.string().uuid().optional(),
	predecessorTaskIds: joi
		.alternatives()
		.try(joi.string().uuid(), joi.array().items(joi.string().uuid()))
		.optional()
		.allow(null),
	notes: joi.string().optional(),
	priority: joi.string().optional().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
	description: joi.string().optional().allow(''),
	attachments: joi.array().items(attachmentSchema).optional(),
	subTasks: joi.array().items(createSubTaskSchema).optional(),
});

export const updateTaskSchema = joi.object({
	name: joi.string().optional(),
	description: joi.string().optional().allow(''),
	// Task.duration is Int? in Prisma; accept numeric strings via Joi conversion.
	// Treat "" as "not provided" to avoid Prisma validation errors.
	duration: joi.number().integer().min(0).optional().empty('').allow(null),
	plannedStart: joi.date().optional(),
	plannedEnd: joi.date().optional(),
	phaseId: joi.string().uuid().optional(),
	projectId: joi.string().uuid().optional(),
	// assignee behavior:
	// - null => clear assignees
	// - []   => treat as "no change" in controller (prevents accidental removals)
	assignee: joi.alternatives().try(joi.string().uuid(), joi.array().items(joi.string().uuid())).optional().allow(null),
	assignedBy: joi.string().optional(),
	predecessorTaskIds: joi
		.alternatives()
		.try(joi.string().uuid(), joi.array().items(joi.string().uuid()))
		.optional()
		.allow(null),
	status: joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	taskStatus: joi.string().optional().valid('PENDING', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED'),
	priority: joi.string().optional().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
	attachments: joi.array().items(attachmentSchema).optional(),
	subTasks: joi.array().items(createSubTaskSchema).optional(),
});

export const updatePhaseOrderSchema = joi.object({
	timelineId: joi.string().uuid().required(),
	phases: joi.array().items(joi.string().uuid().required()).required(),
});

export const updateTaskOrderSchema = joi.object({
	timelineId: joi.string().uuid().required(),
	phaseId: joi.string().uuid().required(),
	tasks: joi.array().items(joi.string().uuid().required()).required(),
});
