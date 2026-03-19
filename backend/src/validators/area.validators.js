import Joi from 'joi';

export const createAreaSchema = Joi.object({
	name: Joi.string().required().min(1).max(100).trim(),
});

export const updateAreaSchema = Joi.object({
	name: Joi.string().optional().min(1).max(100).trim(),
});

export const getAreaSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().allow('', null).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(100),
	sortType: Joi.string().optional().valid('name', 'sNo', 'createdAt').default('name'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(1),
});
