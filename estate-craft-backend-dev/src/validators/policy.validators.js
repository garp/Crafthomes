import Joi from 'joi';

export const getPolicySchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	sortType: Joi.string().optional().valid('sNo', 'companyName', 'city', 'state', 'createdAt').default('createdAt'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const createPolicySchema = Joi.object({
	logo: Joi.string().required().max(500),
	companyName: Joi.string().required().min(1).max(255),
	address: Joi.string().required().min(1).max(500),
	pincode: Joi.number().integer().min(100000).max(999999).required(),
	city: Joi.string().required().min(1).max(100),
	state: Joi.string().required().min(1).max(100),
	country: Joi.string().required().min(1).max(100),
	website: Joi.string().uri().optional().allow('', null).max(255),
	termsAndConditions: Joi.string().optional().allow('', null),
	gstIn: Joi.string().optional().allow('', null).max(50),
	taxId: Joi.string().optional().allow('', null).max(50),
	bankAccountNumber: Joi.string().optional().allow('', null).max(50),
	bankAccountName: Joi.string().optional().allow('', null).max(100),
	bankName: Joi.string().optional().allow('', null).max(100),
	bankBranch: Joi.string().optional().allow('', null).max(100),
	bankIFSC: Joi.string().optional().allow('', null).max(20),
});

export const updatePolicySchema = Joi.object({
	logo: Joi.string().optional().max(500),
	companyName: Joi.string().optional().min(1).max(255),
	address: Joi.string().optional().min(1).max(500),
	pincode: Joi.number().integer().min(100000).max(999999).optional(),
	city: Joi.string().optional().min(1).max(100),
	state: Joi.string().optional().min(1).max(100),
	country: Joi.string().optional().min(1).max(100),
	website: Joi.string().uri().optional().allow('', null).max(255),
	termsAndConditions: Joi.string().optional().allow('', null),
	gstIn: Joi.string().optional().allow('', null).max(50),
	taxId: Joi.string().optional().allow('', null).max(50),
	bankAccountNumber: Joi.string().optional().allow('', null).max(50),
	bankAccountName: Joi.string().optional().allow('', null).max(100),
	bankName: Joi.string().optional().allow('', null).max(100),
	bankBranch: Joi.string().optional().allow('', null).max(100),
	bankIFSC: Joi.string().optional().allow('', null).max(20),
});

