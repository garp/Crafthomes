import Joi from 'joi';

export const getDepartmentSchema = Joi.object({
	id: Joi.string().uuid(),
	search: Joi.string().allow(''),
	pageNo: Joi.number().integer().min(0).default(0),
	pageLimit: Joi.number().integer().min(1).max(100).default(100),
	sortType: Joi.string().valid('sNo', 'name', 'displayName', 'createdAt').default('sNo'),
	sortOrder: Joi.number().valid(1, -1).default(1),
	status: Joi.string().valid('ACTIVE', 'INACTIVE'),
});

export const createDepartmentSchema = Joi.object({
	name: Joi.string().required().trim().min(1).max(100),
	displayName: Joi.string().required().trim().min(1).max(100),
	description: Joi.string().allow('', null).max(500),
});

export const updateDepartmentSchema = Joi.object({
	name: Joi.string().trim().min(1).max(100),
	displayName: Joi.string().trim().min(1).max(100),
	description: Joi.string().allow('', null).max(500),
	status: Joi.string().valid('ACTIVE', 'INACTIVE'),
});
