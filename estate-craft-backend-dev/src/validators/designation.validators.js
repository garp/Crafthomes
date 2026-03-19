import Joi from 'joi';

export const getDesignationSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	sortType: Joi.string().optional().valid('sNo', 'name', 'displayName', 'createdAt').default('sNo'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(1),
	status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
});

export const createDesignationSchema = Joi.object({
	name: Joi.string().required().min(1).max(100).uppercase(),
	displayName: Joi.string().required().min(1).max(255),
	description: Joi.string().optional().allow('', null).max(500),
	meta: Joi.object().optional().allow(null),
});

export const updateDesignationSchema = Joi.object({
	name: Joi.string().optional().min(1).max(100).uppercase(),
	displayName: Joi.string().optional().min(1).max(255),
	description: Joi.string().optional().allow('', null).max(500),
	status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
	meta: Joi.object().optional().allow(null),
});

export const bulkCreateDesignationSchema = Joi.object({
	designations: Joi.array().items(
		Joi.object({
			name: Joi.string().required().min(1).max(100).uppercase(),
			displayName: Joi.string().required().min(1).max(255),
			description: Joi.string().optional().allow('', null).max(500),
			meta: Joi.object().optional().allow(null),
		})
	).min(1).required(),
});
