import Joi from 'joi';

export const getPhaseSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	projectId: Joi.string().uuid().optional(),
	timelineId: Joi.string().uuid().optional(),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'name'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const createPhaseSchema = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().optional().allow('', null),
	projectId: Joi.string().optional(),
	masterPhaseCheck: Joi.boolean().optional(),
	timelineId: Joi.string().optional(),
});

export const updatePhaseSchema = Joi.object({
	name: Joi.string().optional(),
	description: Joi.string().optional().allow('', null),
	projectId: Joi.string().optional(),
	masterPhaseCheck: Joi.boolean().optional(),
	timelineId: Joi.string().optional(),
});
