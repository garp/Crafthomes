import Joi from 'joi';

export const getMasterPhaseSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	projectTypeId: Joi.string().uuid().optional(),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'name'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const createMasterPhaseSchema = Joi.object({
	name: Joi.string().required().min(2).max(100),
	description: Joi.string().optional().allow('', null),
	masterTasks: Joi.array().items(Joi.string().uuid()).optional(),
	projectTypeId: Joi.string().uuid().optional(),
});

export const updateMasterPhaseSchema = Joi.object({
	name: Joi.string().optional().min(2).max(100),
	description: Joi.string().optional().allow('', null),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	masterTasks: Joi.array().items(Joi.string().uuid()).optional(),
});

export const bulkDeleteMasterPhaseSchema = Joi.object({
	ids: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
		'array.min': 'At least one ID must be provided',
		'string.guid': 'Invalid ID format',
	}),
});
