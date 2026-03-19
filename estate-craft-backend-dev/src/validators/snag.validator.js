import Joi from 'joi';
import { attachmentSchema } from './task.validator.js';

export const getSnagSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE', 'DELETED'),
	snagStatus: Joi.string().optional().valid('TEMPORARY', 'PENDING', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'),
	priority: Joi.string().optional().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'title', 'priority', 'snagStatus'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
	projectId: Joi.string().uuid().optional().allow('', null),
	vendorId: Joi.string().uuid().optional().allow('', null),
});

export const createSnagSchema = Joi.object({
	title: Joi.string().required(),
	description: Joi.string().optional().allow(''),
	location: Joi.string().optional().allow(''),
	snagCategory: Joi.string().optional().allow(''),
	otherCategory: Joi.string().optional().allow(''),
	snagSubCategory: Joi.string().optional().allow(''),
	otherSubCategory: Joi.string().optional().allow(''),
	priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional().allow(''),
	snagStatus: Joi.string().valid('TEMPORARY', 'PENDING', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED').optional(),
	attachments: Joi.array().items(attachmentSchema).optional(),
	expectedCloseDate: Joi.date().optional().allow(null),
	assignedTo: Joi.string().optional().allow('', null),
	assignedBy: Joi.string().optional().allow('', null),
	projectId: Joi.string().uuid().optional().allow('', null),
	vendorId: Joi.string().uuid().optional().allow('', null),
});

export const updateSnagSchema = Joi.object({
	title: Joi.string().optional().allow(''),
	description: Joi.string().optional().allow(''),
	location: Joi.string().optional().allow(''),
	snagCategory: Joi.string().optional().allow(''),
	otherCategory: Joi.string().optional().allow(''),
	snagSubCategory: Joi.string().optional().allow(''),
	otherSubCategory: Joi.string().optional().allow(''),
	priority: Joi.string().valid('LOW', 'MEDIUM', 'HIGH', 'CRITICAL').optional().allow(''),
	status: Joi.string().valid('ACTIVE', 'INACTIVE', 'DELETED').optional(),
	snagStatus: Joi.string().valid('TEMPORARY', 'PENDING', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED').optional(),
	attachments: Joi.array().items(attachmentSchema).optional(),
	expectedCloseDate: Joi.date().optional().allow(null),
	assignedTo: Joi.string().optional().allow('', null),
	assignedBy: Joi.string().optional().allow('', null),
	items: Joi.array().items(Joi.string()).optional(),
	vendorId: Joi.string().uuid().optional().allow('', null),
});
