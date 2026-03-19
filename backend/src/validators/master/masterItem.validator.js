import Joi from 'joi';

export const fileSchema = Joi.object({
	id: Joi.string().uuid().optional(), // Allow id for existing attachments
	url: Joi.string().required(),
	name: Joi.string().required(),
	type: Joi.string().required(),
	key: Joi.string().required(),
	size: Joi.number().required(),
	mimeType: Joi.string().required(),
	createdAt: Joi.date().required(),
	updatedAt: Joi.date().optional().allow(null), // May not be set initially
	createdBy: Joi.string().required(),
	updatedBy: Joi.string().optional().allow(null), // May be null if never updated
});

export const getMasterItemSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	categoryId: Joi.string().uuid().optional(),
	subCategoryId: Joi.string().uuid().optional(),
	vendorId: Joi.string().uuid().optional(),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'name', 'mrp'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const createMasterItemSchema = Joi.object({
	name: Joi.string().required().min(2).max(100),
	description: Joi.string().required().min(2).max(500).allow(''),
	primaryFile: Joi.array().items(fileSchema).optional().allow(null),
	secondaryFile: Joi.array().items(fileSchema).optional().allow(null),
	categoryId: Joi.string().optional().uuid().allow(null),
	subCategoryId: Joi.string().optional().uuid().allow(null),
	vendorId: Joi.string().optional().uuid().allow(null),
	materialFile: Joi.array().items(fileSchema).optional().allow(null),
	materialCode: Joi.string().optional().allow(null),
	colorCode: Joi.string().optional().allow(null),
	mrp: Joi.number().required().min(0),
	currency: Joi.string().required().valid('INR', 'USD', 'RMB'),
	tags: Joi.array().items(Joi.string()).optional().allow(null),
	unitId: Joi.string().optional().uuid().allow(null),
});

export const updateMasterItemSchema = Joi.object({
	name: Joi.string().optional().min(2).max(100),
	description: Joi.string().optional().min(2).max(500).allow(''),
	primaryFile: Joi.array().items(fileSchema).optional(),
	secondaryFile: Joi.array().items(fileSchema).optional(),
	categoryId: Joi.string().optional().uuid().allow(null),
	subCategoryId: Joi.string().optional().uuid().allow(null),
	vendorId: Joi.string().optional().uuid().allow(null),
	materialFile: Joi.array().items(fileSchema).optional().allow(null),
	materialCode: Joi.string().optional().allow(null),
	colorCode: Joi.string().optional().allow(null),
	currency: Joi.string().optional().valid('INR', 'USD', 'RMB'),
	mrp: Joi.number().required().min(0),
	tags: Joi.array().items(Joi.string()).optional(),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	unitId: Joi.string().optional().uuid().allow(null),
});
