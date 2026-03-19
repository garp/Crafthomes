import Joi from 'joi';
import { attachmentSchema } from './task.validator.js';

export const getMOMSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	projectId: Joi.string().uuid().optional(),
	search: Joi.string().optional().allow('', null),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	sortType: Joi.string().optional().valid('sNo', 'title', 'startDate', 'createdAt', 'updatedAt').default('createdAt'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const createMOMSchema = Joi.object({
	projectId: Joi.string().uuid().required(),
	title: Joi.string().required().min(1).max(255),
	startDate: Joi.date().optional().allow(null),
	heldOn: Joi.string().optional().allow('', null),
	purpose: Joi.string().optional().allow('', null),
	attendeeIds: Joi.array().items(Joi.string().uuid()).optional().min(1),
	attachments: Joi.array().items(attachmentSchema).optional(),
});

export const updateMOMSchema = Joi.object({
	projectId: Joi.string().uuid().optional(),
	title: Joi.string().optional().min(1).max(255),
	startDate: Joi.date().optional().allow(null),
	heldOn: Joi.string().optional().allow('', null),
	purpose: Joi.string().optional().allow('', null),
	attendeeIds: Joi.array().items(Joi.string().uuid()).optional(),
	attachments: Joi.array().items(attachmentSchema).optional(),
});
