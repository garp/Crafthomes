import Joi from 'joi';

// Custom pincode validation that accepts both string and number
const pincodeSchema = Joi.alternatives()
	.try(
		Joi.string().pattern(/^\d{6}$/),
		Joi.number().integer().min(100000).max(999999)
	)
	.custom((value) => String(value), 'convert to string');

export const getVendorSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	type: Joi.string().optional().valid('name', 'email', 'phoneNumber', 'status'),
	search: Joi.string().optional().min(2).max(100),
	searchText: Joi.string().optional().min(2).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('all', 'active', 'inactive', 'ACTIVE', 'INACTIVE'),
	sortType: Joi.string().optional().valid('sNo', 'name', 'email', 'phoneNumber', 'startDate', 'createdAt'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const createVendorSchema = Joi.object({
	email: Joi.string().email().required(),
	name: Joi.string().required().min(2).max(100),
	phoneNumber: Joi.string().required(),
	specializedId: Joi.array().items(Joi.string().uuid()).optional(),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	panDetails: Joi.string().optional().allow('', null),
	address: Joi.object({
		label: Joi.string().optional().allow('', null).max(100),
		building: Joi.when('pincode', {
			is: Joi.exist(),
			then: Joi.string().required().min(1).max(255),
			otherwise: Joi.string().optional().allow('', null).max(255),
		}),
		street: Joi.string().optional().allow('', null).max(255),
		locality: Joi.string().optional().allow('', null).max(255),
		city: Joi.when('pincode', {
			is: Joi.exist(),
			then: Joi.string().required().min(1).max(100),
			otherwise: Joi.string().optional().allow('', null).max(100),
		}),
		state: Joi.when('pincode', {
			is: Joi.exist(),
			then: Joi.string().required().min(1).max(100),
			otherwise: Joi.string().optional().allow('', null).max(100),
		}),
		landmark: Joi.string().optional().allow('', null).max(255),
		pincode: pincodeSchema.optional(),
		pincodeId: Joi.string().uuid().optional().allow(null, ''),
		country: Joi.string().optional().default('INDIA').max(100),
	}).optional().allow(null),
});

export const updateVendorSchema = Joi.object({
	name: Joi.string().optional(),
	phoneNumber: Joi.string().optional(),
	email: Joi.string().email().optional(),
	startDate: Joi.date().optional(),
	specializedId: Joi.array().items(Joi.string().uuid()).optional(),
	status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
	panDetails: Joi.string().optional().allow('', null),
	address: Joi.object({
		id: Joi.string().uuid().optional().allow('', null),
		label: Joi.string().optional().allow('', null).max(100),
		building: Joi.string().when('id', {
			is: Joi.exist(),
			then: Joi.string().optional().min(1).max(255),
			otherwise: Joi.string().required().min(1).max(255),
		}),
		street: Joi.string().optional().allow('', null).max(255),
		locality: Joi.string().optional().allow('', null).max(255),
		city: Joi.string().when('id', {
			is: Joi.exist(),
			then: Joi.string().optional().allow('', null).max(100),
			otherwise: Joi.string().required().min(1).max(100),
		}),
		state: Joi.string().when('id', {
			is: Joi.exist(),
			then: Joi.string().optional().min(1).max(100),
			otherwise: Joi.string().required().min(1).max(100),
		}),
		landmark: Joi.string().optional().allow('', null).max(255),
		pincode: Joi.when('id', {
			is: Joi.exist(),
			then: pincodeSchema.optional(),
			otherwise: pincodeSchema.required(),
		}),
		pincodeId: Joi.string().uuid().optional().allow(null, ''),
		country: Joi.string().optional().max(100),
	}).optional(),
});

export const getSpecializedSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(2).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
});

export const createSpecializedSchema = Joi.object({
	name: Joi.string().required(),
});

export const updateSpecializedSchema = Joi.object({
	name: Joi.string().optional(),
	status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
});
