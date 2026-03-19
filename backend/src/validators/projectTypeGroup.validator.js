import Joi from 'joi';

export const getProjectTypeGroupSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'name', 'sNo'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const createProjectTypeGroupSchema = Joi.object({
	name: Joi.string().required().min(2).max(100),
	description: Joi.string().optional().allow('', null),
	projectTypes: Joi.array().items(Joi.string().uuid()).optional().max(100),
});

export const updateProjectTypeGroupSchema = Joi.object({
	name: Joi.string().optional().min(2).max(100),
	description: Joi.string().optional().allow('', null),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	projectTypes: Joi.array().items(Joi.string().uuid()).optional().max(100),
});

export const rearrangeProjectTypeOrderSchema = Joi.object({
	projectTypeGroupId: Joi.string().uuid().required(),
	projectTypes: Joi.array().items(Joi.string().uuid().required()).required().max(100),
});

export const bulkDeleteProjectTypeGroupSchema = Joi.object({
	ids: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
		'array.min': 'At least one ID must be provided',
		'string.guid': 'Invalid ID format',
	}),
});
