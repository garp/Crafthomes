import Joi from 'joi';

export const createDeliverableSchema = Joi.object({
	projectId: Joi.string().uuid().required(),
	taskId: Joi.string().uuid().required(),
	dueDate: Joi.date().optional().allow('', null),
	priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
});

export const updateDeliverableSchema = Joi.object({
	dueDate: Joi.date().optional().allow('', null),
	priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'URGENT').optional(),
	deliverableStatus: Joi.string().valid('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'IN_REVIEW', 'DELAYED').optional(),
	status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
});
