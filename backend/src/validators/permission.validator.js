import Joi from 'joi';

export const createPermissionSchema = Joi.object({
	name: Joi.string().required().min(2).max(100),
	group: Joi.string().required().min(2).max(100),
	description: Joi.string().optional().max(100).allow(''),
	endpoint: Joi.string().required().min(2).max(100),
	method: Joi.string().required().min(2).max(100),
	roleId: Joi.string().required(),
});

export const createManyPermissionsSchema = Joi.object({
	permissions: Joi.array()
		.items(
			Joi.object({
				name: Joi.string().required().min(2).max(100),
				group: Joi.string().required().min(2).max(100),
				description: Joi.string().optional().max(100).allow(''),
				endpoint: Joi.string().required().min(2).max(100),
				method: Joi.string().required().min(2).max(100),
				roleId: Joi.string().required(),
			})
		)
		.min(1)
		.required(),
});

export const updatePermissionSchema = Joi.object({
	name: Joi.string().optional().min(2).max(100),
	group: Joi.string().optional().min(2).max(100),
	description: Joi.string().optional().max(100).allow(''),
	endpoint: Joi.string().optional().min(2).max(100),
	method: Joi.string().optional().min(2).max(100),
	roleId: Joi.string().optional(),
});
