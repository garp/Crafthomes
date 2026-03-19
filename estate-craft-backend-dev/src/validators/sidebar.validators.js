import Joi from 'joi';

export const getSidebarSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	roleId: Joi.string().uuid().optional(),
	status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
});

export const createSidebarSchema = Joi.object({
	name: Joi.string().required().min(1).max(100),
	slug: Joi.string().required().min(1).max(100),
	frontendName: Joi.string().required().min(1).max(100),
	roleId: Joi.string().uuid().required(),
	options: Joi.object().unknown(true).required(),
});

export const updateSidebarSchema = Joi.object({
	name: Joi.string().optional().min(1).max(100),
	slug: Joi.string().optional().min(1).max(100),
	frontendName: Joi.string().optional().min(1).max(100),
	roleId: Joi.string().uuid().optional(),
	options: Joi.object().unknown(true).optional(),
	status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
});
