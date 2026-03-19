import Joi from 'joi';
import { fileSchema } from './master/masterItem.validator.js';

export const getProjectSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100),
	searchText: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	projectStatus: Joi.string().optional().valid('NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'COMPLETED'),
	sortType: Joi.string().optional().valid('sNo', 'name', 'city', 'startDate', 'endDate', 'createdAt', 'updatedAt'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(1),
});

export const createProjectSchema = Joi.object({
	name: Joi.string().required().min(2).max(100),
	clientId: Joi.string().uuid().optional().allow('', null),
	// Legacy single project type support
	projectTypeId: Joi.string().uuid().optional().allow('', null),
	// New: project type group and multiple project types for multiple timelines
	projectTypeGroupId: Joi.string().uuid().optional().allow('', null),
	projectTypeIds: Joi.array().items(Joi.string().uuid()).optional().allow(null),
	estimatedBudget: Joi.number().integer().min(0).optional(),
	currency: Joi.string().valid('USD', 'INR').optional(),
	paymentStatus: Joi.string().valid('PENDING', 'PAID', 'PARTIALLY_PAID').optional(),
	masterPhases: Joi.array().items(Joi.string().uuid()).optional(),
	city: Joi.string().required().min(2).max(100),
	state: Joi.string().required().min(2).max(100),
	address: Joi.string().optional().max(500),
	addressId: Joi.string().uuid().optional(),
	startDate: Joi.date().required(),
	endDate: Joi.date().optional().greater(Joi.ref('startDate')).allow('', null),
	assignProjectManager: Joi.string().uuid().optional(),
	assignClientContact: Joi.array().items(Joi.string().uuid()).optional(),
	assignedInternalUsersId: Joi.array().items(Joi.string().uuid()).optional(),
	description: Joi.string().optional().max(1000).allow(''),
	attachments: Joi.array().items(fileSchema).optional(),
});

export const updateProjectSchema = Joi.object({
	name: Joi.string().optional().min(2).max(100),
	clientId: Joi.string().uuid().optional().allow('', null),
	estimatedBudget: Joi.number().integer().min(0).optional(),
	currency: Joi.string().valid('USD', 'INR').optional(),
	paymentStatus: Joi.string().valid('PENDING', 'PAID', 'PARTIALLY_PAID').optional(),
	city: Joi.string().optional().min(2).max(100),
	state: Joi.string().optional().min(2).max(100),
	address: Joi.string().optional().max(500),
	addressId: Joi.string().uuid().optional(),
	startDate: Joi.date().optional(),
	endDate: Joi.date().optional().greater(Joi.ref('startDate')),
	assignProjectManager: Joi.string().uuid().optional(),
	assignClientContact: Joi.array().items(Joi.string().uuid()).optional(),
	assignedInternalUsersId: Joi.array().items(Joi.string().uuid()).optional(),
	description: Joi.string().optional().max(1000).allow(''),
	attachments: Joi.array().items(fileSchema).optional(),
	status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
	projectStatus: Joi.string().valid('NOT_STARTED', 'IN_PROGRESS', 'DELAYED', 'COMPLETED').optional(),
});
