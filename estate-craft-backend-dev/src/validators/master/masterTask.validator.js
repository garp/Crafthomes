import Joi from 'joi';

const masterSubTaskSchema = Joi.object({
	id: Joi.string().optional().allow('', null),
	name: Joi.string().required().min(2).max(100),
	description: Joi.string().optional().allow('', null),
	duration: Joi.number().integer().min(0).optional().allow(null),
	predecessorTaskId: Joi.string().optional().allow('', null),
	priority: Joi.string().optional().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
	notes: Joi.string().optional().allow('', null),
});

export const getMasterTaskSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(2).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	sortType: Joi.string().optional().valid('createdAt'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
	masterPhaseId: Joi.string().uuid().optional(),
	projectTypeId: Joi.string().uuid().optional(),
});

export const createMasterTaskSchema = Joi.object({
	name: Joi.string().required().min(2).max(100),
	description: Joi.string().optional().allow('', null),
	masterPhaseId: Joi.array().items(Joi.string().uuid()).optional(),
	duration: Joi.number().integer().min(0).optional().allow(null),
	predecessorTaskId: Joi.string().uuid().optional().allow('', null),
	priority: Joi.string().optional().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
	notes: Joi.string().optional().allow(''),
	subTasks: Joi.array().items(masterSubTaskSchema).optional().default([]),
});

export const updateMasterTaskSchema = Joi.object({
	name: Joi.string().optional().min(2).max(100),
	description: Joi.string().optional().allow('', null),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	masterPhaseId: Joi.array().items(Joi.string().uuid()).optional(),
	duration: Joi.number().integer().min(0).optional().allow(null),
	predecessorTaskId: Joi.string().uuid().optional().allow('', null),
	priority: Joi.string().optional().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT'),
	notes: Joi.string().optional().allow(''),
	subTasks: Joi.array().items(masterSubTaskSchema).optional(),
});

export const bulkDeleteMasterTaskSchema = Joi.object({
	ids: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
		'array.min': 'At least one ID must be provided',
		'string.guid': 'Invalid ID format',
	}),
});
