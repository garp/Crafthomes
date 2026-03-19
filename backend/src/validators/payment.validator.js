import Joi from 'joi';

const paymentItemSchema = Joi.object({
	id: Joi.string().uuid().optional().allow(''),
	name: Joi.string().required(),
	quantity: Joi.number().required(),
	price: Joi.number().required(),
});

export const createPaymentSchema = Joi.object({
	projectId: Joi.string().uuid().required(),
	clientId: Joi.string().uuid().required(),
	dueDate: Joi.date().optional().allow('', null),
	items: Joi.array().items(paymentItemSchema).required(),
	referenceId: Joi.string().optional().allow(''),
	subTotalAmount: Joi.number().optional(),
	discount: Joi.number().optional(),
	tax: Joi.number().optional(),
	totalAmount: Joi.number().optional(),
	paymentType: Joi.string().valid('ADVANCE', 'INTERIM', 'FINAL').optional().allow(''),
	paymentMethod: Joi.string().valid('CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE_TRANSFER', 'OTHER').optional().allow(''),
	otherPaymentMethod: Joi.string().optional().allow(''),
});

export const getPaymentSchema = Joi.object({
	search: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	projectId: Joi.string().uuid().optional(),
	clientId: Joi.string().uuid().optional(),
	paymentType: Joi.string().valid('ADVANCE', 'INTERIM', 'FINAL').optional(),
	paymentStatus: Joi.string()
		.valid('DRAFT', 'PENDING', 'PROCESSING', 'PAID', 'PARTIALLY_PAID', 'REQUESTED', 'CANCELLED')
		.optional(),
	paymentMethod: Joi.string().valid('CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE_TRANSFER', 'OTHER').optional().allow(''),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'name', 'quantity', 'price'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});
export const updatePaymentSchema = Joi.object({
	projectId: Joi.string().uuid().optional(),
	clientId: Joi.string().uuid().optional(),
	dueDate: Joi.date().optional().allow('', null),
	items: Joi.array().items(paymentItemSchema).optional(),
	referenceId: Joi.string().optional().allow(''),
	subTotalAmount: Joi.number().optional(),
	discount: Joi.number().optional(),
	tax: Joi.number().optional(),
	totalAmount: Joi.number().optional(),
	paymentType: Joi.string().valid('ADVANCE', 'INTERIM', 'FINAL').optional().allow(''),
	paymentMethod: Joi.string().valid('CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE_TRANSFER', 'OTHER').optional().allow(''),
	paymentStatus: Joi.string()
		.valid('DRAFT', 'PENDING', 'PROCESSING', 'PAID', 'PARTIALLY_PAID', 'REQUESTED', 'CANCELLED')
		.optional(),
	otherPaymentMethod: Joi.string().optional().allow(''),
});
