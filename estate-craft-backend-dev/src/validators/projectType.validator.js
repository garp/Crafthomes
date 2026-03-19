import Joi from 'joi';

export const getProjectTypeSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(2).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	sortType: Joi.string().optional().valid('createdAt'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
	projectTypeGroupId: Joi.string().uuid().optional(),
});

export const createProjectTypeSchema = Joi.object({
	name: Joi.string().required().min(2).max(100),
	phases: Joi.array().items(Joi.string().uuid().optional()).optional(),
});

export const updateProjectTypeSchema = Joi.object({
	name: Joi.string().optional().min(2).max(100),
	phases: Joi.array().items(Joi.string().uuid().optional()).optional(),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
});

export const rearrangeMasterPhaseOrderSchema = Joi.object({
	projectTypeId: Joi.string().uuid().required(),
	masterPhases: Joi.array().items(Joi.string().uuid().required()).required(),
});

export const rearrangeMasterTaskOrderSchema = Joi.object({
	projectTypeId: Joi.string().uuid().required(),
	masterPhaseId: Joi.string().uuid().required(),
	masterTasks: Joi.array().items(Joi.string().uuid().required()).required(),
});

export const bulkDeleteProjectTypeSchema = Joi.object({
	ids: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
		'array.min': 'At least one ID must be provided',
		'string.guid': 'Invalid ID format',
	}),
});
