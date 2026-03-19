import Joi from 'joi';

export const getAddressSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	clientId: Joi.string().uuid().optional(),
	vendorId: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(2).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'city', 'state'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const createAddressSchema = Joi.object({
	clientId: Joi.string().uuid().optional().allow('', null),
	vendorId: Joi.string().uuid().optional().allow('', null),
	label: Joi.string().optional().allow('', null).max(100),
	building: Joi.string().required().min(1).max(255),
	street: Joi.string().optional().allow('', null).max(255),
	locality: Joi.string().optional().allow('', null).max(255),
	city: Joi.string().required().min(1).max(100),
	state: Joi.string().required().min(1).max(100),
	landmark: Joi.string().optional().allow('', null).max(255),
	pincode: Joi.string()
		.pattern(/^\d{6}$/)
		.required(),
	country: Joi.string().optional().default('INDIA').max(100),
});

export const updateAddressSchema = Joi.object({
	clientId: Joi.string().uuid().optional().allow('', null),
	vendorId: Joi.string().uuid().optional().allow('', null),
	label: Joi.string().optional().allow('', null).max(100),
	building: Joi.string().optional().min(1).max(255),
	street: Joi.string().optional().allow('', null).max(255),
	locality: Joi.string().optional().allow('', null).max(255),
	city: Joi.string().optional().allow('', null).max(100),
	state: Joi.string().optional().min(1).max(100),
	landmark: Joi.string().optional().allow('', null).max(255),
	pincode: Joi.string()
		.pattern(/^\d{6}$/)
		.optional(),
	country: Joi.string().optional().max(100),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
});
