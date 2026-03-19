import Joi from 'joi';

export const getModuleAccessSchema = Joi.object({
	roleId: Joi.string().uuid().required(),
});

export const bulkUpdateModuleAccessSchema = Joi.object({
	modules: Joi.array()
		.items(
			Joi.object({
				topLevel: Joi.string().required(),
				typeLevel: Joi.string().allow(null, '').optional(),
				subtypeLevel: Joi.string().allow(null, '').optional(),
			}),
		)
		.required(),
});
