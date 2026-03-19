import Joi from 'joi';

const quotationItemSchema = Joi.object({
	masterItemId: Joi.string().required(),
	mrp: Joi.number().integer().min(0).optional(),
	quantity: Joi.number().integer().min(1).required(),
	discount: Joi.number().precision(2).min(0).optional(),
	total: Joi.number().precision(2).min(0).required(),
	gst: Joi.number().precision(2).min(0).optional(),
	attachmentId: Joi.string().optional(),
	area: Joi.string().optional().allow(null, ''),
	areaId: Joi.string().uuid().optional().allow(null, ''),
	unitId: Joi.string().uuid().optional().allow(null, ''),
});

export const getQuotationSchema = Joi.object({
	id: Joi.string().uuid(),
	search: Joi.string().optional().allow('', null),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	quotationStatus: Joi.string().optional().valid('PENDING', 'COMPLETED', 'CANCELLED', 'DRAFT').allow('', null),
	clientId: Joi.string().uuid().optional(),
	projectId: Joi.string().uuid(),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'name', 'totalAmount'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
}).or('id', 'projectId');

export const createQuotationSchema = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().optional().allow('', null),
	items: Joi.array().items(quotationItemSchema).optional(),
	clientId: Joi.string().required(),
	discount: Joi.number().precision(2).min(0).optional(),
	paidAmount: Joi.number().precision(2).min(0).optional(),
	remainingAmount: Joi.number().precision(2).min(0).optional(),
	totalAmount: Joi.number().precision(2).min(0).optional(),
	projectId: Joi.string().required(),
	startDate: Joi.date().optional(),
	policyId: Joi.string().required(),
});

export const updateQuotationSchema = Joi.object({
	name: Joi.string().optional(),
	description: Joi.string().optional().allow('', null),
	items: Joi.array().items(quotationItemSchema).optional(),
	quotationStatus: Joi.string().valid('PENDING', 'COMPLETED', 'CANCELLED', 'DRAFT').optional(),
	clientId: Joi.string().optional(),
	discount: Joi.number().precision(2).min(0).optional(),
	paidAmount: Joi.number().precision(2).min(0).optional(),
	remainingAmount: Joi.number().precision(2).min(0).optional(),
	projectId: Joi.string().required(),
	totalAmount: Joi.number().precision(2).min(0).optional(),
	startDate: Joi.date().optional(),
	policyId: Joi.string().optional(),
});
