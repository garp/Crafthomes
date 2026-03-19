import Joi from 'joi';

export const getClientSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	type: Joi.string().optional().valid('name', 'email', 'phoneNumber', 'status'),
	search: Joi.string().optional().min(2).max(100),
	searchText: Joi.string().optional().min(2).max(100),
	projectId: Joi.string().uuid().optional(),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('all', 'active', 'inactive', 'ACTIVE', 'INACTIVE'),
	sortType: Joi.string().optional().valid('sNo', 'name', 'email', 'phoneNumber', 'startDate', 'createdAt'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

// Custom pincode validation that accepts both string and number
const pincodeSchema = Joi.alternatives()
	.try(
		Joi.string().pattern(/^\d{6}$/),
		Joi.number().integer().min(100000).max(999999)
	)
	.custom((value) => String(value), 'convert to string');

const addressCreateSchema = Joi.object({
	label: Joi.string().optional().allow('', null).max(100),
	building: Joi.string().required().min(1).max(255),
	street: Joi.string().optional().allow('', null).max(255),
	locality: Joi.string().optional().allow('', null).max(255),
	city: Joi.string().required().min(1).max(100),
	state: Joi.string().required().min(1).max(100),
	landmark: Joi.string().optional().allow('', null).max(255),
	pincode: pincodeSchema.required(),
	pincodeId: Joi.string().uuid().optional().allow(null, ''),
	country: Joi.string().optional().default('INDIA').max(100),
});

const addressUpdateSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	label: Joi.string().optional().allow('', null).max(100),
	building: Joi.string().when('id', {
		is: Joi.exist(),
		then: Joi.string().optional().min(1).max(255),
		otherwise: Joi.string().required().min(1).max(255),
	}),
	street: Joi.string().optional().allow('', null).max(255),
	locality: Joi.string().optional().allow('', null).max(255),
	city: Joi.when('id', {
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
});

export const createClientSchema = Joi.object({
	email: Joi.string().email().required(),
	name: Joi.string().required().min(2).max(100),
	phoneNumber: Joi.string().required(),
	organizationName: Joi.string().optional().allow('', null),
	clientType: Joi.string().valid('INDIVIDUAL', 'ORGANIZATION').optional().default('INDIVIDUAL'),
	gstIn: Joi.string().optional().allow('', null),
	panDetails: Joi.string().optional().allow('', null),
	addresses: Joi.array().items(addressCreateSchema).optional(),
});

export const updateClientSchema = Joi.object({
	name: Joi.string().optional().min(2).max(100),
	phoneNumber: Joi.string().optional(),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	organizationName: Joi.string().optional().allow('', null),
	clientType: Joi.string().optional().valid('INDIVIDUAL', 'ORGANIZATION'),
	gstIn: Joi.string().optional().allow('', null),
	panDetails: Joi.string().optional().allow('', null),
	addresses: Joi.array().items(addressUpdateSchema).optional(),
});
