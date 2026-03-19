import Joi from 'joi';

export const getUserSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100).allow('', null),
	searchText: Joi.string().optional().allow('', null),
	type: Joi.string().optional(),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('all', 'active', 'inactive', 'ACTIVE', 'INACTIVE'),
	roleId: Joi.string().uuid().optional(),
	designationId: Joi.string().uuid().optional().allow('', null),
	sortType: Joi.string().optional().valid('sNo', 'name', 'email', 'phoneNumber', 'designationId', 'startDate', 'createdAt'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
	inviteState: Joi.string().optional().valid('SENT', 'ACCEPTED', 'PASSWORD_ADDED', 'REJECTED', 'COMPLETED'),
	userType: Joi.string().optional().valid('INTERNAL', 'CLIENT', 'CLIENT_CONTACT', 'VENDOR', 'VENDOR_CONTACT'),
	filterBy: Joi.string().optional().valid('client', 'vendor').allow('', null),
	clientId: Joi.string().uuid().optional().allow('', null),
	vendorId: Joi.string().uuid().optional().allow('', null),
});

export const createSchema = Joi.object({
	email: Joi.string().email().required(),
	name: Joi.string().required().min(2).max(100),
	roleId: Joi.string().optional().allow('', null),
	department: Joi.string().optional().allow('', null).max(100),
	phoneNumber: Joi.string().required(),
	userType: Joi.string().optional().valid('INTERNAL', 'CLIENT', 'CLIENT_CONTACT', 'VENDOR', 'VENDOR_CONTACT'),
	designationId: Joi.string().uuid().optional().allow('', null),
	clientId: Joi.string().uuid().optional().allow('', null),
	vendorId: Joi.string().uuid().optional().allow('', null),
}).or('clientId', 'vendorId');

export const getInternalUserSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100).allow('', null),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('all', 'active', 'inactive', 'ACTIVE', 'INACTIVE', 'ALL'),
	projectPurpose: Joi.string().optional().valid('true', 'false'),
});

export const createInternalUserSchema = Joi.object({
	email: Joi.string().email().required(),
	name: Joi.string().required().min(2).max(100),
	roleId: Joi.string().required(),
	department: Joi.string().optional().allow('', null).max(100),
	phoneNumber: Joi.string().required(),
	userType: Joi.string().optional().valid('INTERNAL').default('INTERNAL'),
	designationId: Joi.string().uuid().optional().allow('', null),
	reportsToId: Joi.string().uuid().optional().allow('', null),
	profilePhoto: Joi.string().uri().optional().allow('', null),
});

export const updateSchema = Joi.object({
	name: Joi.string().optional().min(2).max(100),
	phoneNumber: Joi.string().optional(),
	roleId: Joi.string().optional(),
	status: Joi.string().optional(),
	department: Joi.string().optional().allow('', null).max(100),
	designationId: Joi.string().uuid().optional().allow('', null),
	organization: Joi.string().optional().max(100),
	clientId: Joi.string().uuid().optional().allow('', null),
	vendorId: Joi.string().uuid().optional().allow('', null),
	reportsToId: Joi.string().uuid().optional().allow('', null),
	profilePhoto: Joi.string().uri().optional().allow('', null),
	password: Joi.string()
		.optional()
		.allow('', null)
		.custom((value, helpers) => {
			// If password is empty string, null or undefined, skip further validation
			if (value === '' || value === null || value === undefined) {
				return value;
			}

			// Enforce minimum length of 8 characters
			if (value.length < 6) {
				return helpers.error('any.custom', {
					message: 'Password must be at least 8 characters long',
				});
			}

			// Enforce at least one letter and one number
			const hasLetter = /[A-Za-z]/.test(value);
			const hasNumber = /\d/.test(value);
			if (!hasLetter || !hasNumber) {
				return helpers.error('any.custom', {
					message: 'Password must contain at least one letter and one number',
				});
			}

			return value;
		}, 'Password validation')
		.messages({
			'any.custom': '{{#message}}',
		}),
});

export const updateInternalUserSchema = Joi.object({
	name: Joi.string().optional().min(2).max(100),
	roleId: Joi.string().optional(),
	department: Joi.string().optional().allow('', null).max(100),
	phoneNumber: Joi.string().optional(),
	designationId: Joi.string().uuid().optional().allow('', null),
	password: Joi.string().optional().allow('', null),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	reportsToId: Joi.string().uuid().optional().allow('', null),
	profilePhoto: Joi.string().uri().optional().allow('', null),
});

export const acceptInviteSchema = Joi.object({
	email: Joi.string().email().required(),
});

export const rejectInviteSchema = Joi.object({
	email: Joi.string().email().required(),
	reason: Joi.string().optional().allow('', null),
});

export const addPasswordSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required(),
});
