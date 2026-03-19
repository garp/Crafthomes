import Joi from 'joi';

export const getPincodeSchema = Joi.object({
	pincode: Joi.number().integer().min(100000).max(999999).required(),
});

export const createPincodeSchema = Joi.object({
	pincode: Joi.number().integer().min(100000).max(999999).required(),
	state: Joi.string().required().min(2).max(100),
	city: Joi.string().required().min(2).max(100),
	district: Joi.string().required().min(2).max(100),
	circle: Joi.string().optional().allow('', null).max(200),
	region: Joi.string().optional().allow('', null).max(200),
	division: Joi.string().optional().allow('', null).max(200),
	office: Joi.string().optional().allow('', null).max(200),
	officeType: Joi.string().optional().allow('', null).max(50),
	delivery: Joi.string().optional().allow('', null).max(50),
});

export const updatePincodeSchema = Joi.object({
	pincode: Joi.number().integer().min(100000).max(999999).optional(),
	state: Joi.string().optional().min(2).max(100),
	city: Joi.string().optional().min(2).max(100),
	district: Joi.string().optional().min(2).max(100),
	circle: Joi.string().optional().allow('', null).max(200),
	region: Joi.string().optional().allow('', null).max(200),
	division: Joi.string().optional().allow('', null).max(200),
	office: Joi.string().optional().allow('', null).max(200),
	officeType: Joi.string().optional().allow('', null).max(50),
	delivery: Joi.string().optional().allow('', null).max(50),
	status: Joi.string().valid('ACTIVE', 'INACTIVE').optional(),
});

export const pincodeParamSchema = Joi.object({
	id: Joi.string().uuid().required(),
});
