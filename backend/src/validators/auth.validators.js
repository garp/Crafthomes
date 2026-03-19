import Joi from 'joi';

export const loginSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required().min(6).max(50),
});

export const refreshAccessTokenSchema = Joi.object({
	refreshToken: Joi.string().required(),
});

export const createUserSchema = Joi.object({
	email: Joi.string().email().required(),
	password: Joi.string().required().min(6).max(50),
	name: Joi.string().required().min(2).max(100),
	roleId: Joi.string().required(),
	designation: Joi.string().optional().max(100),
	location: Joi.string().optional().max(100),
	department: Joi.string().optional().max(100),
	startDate: Joi.date().required(),
	organization: Joi.string().optional().max(100),
	phoneNumber: Joi.string().required().max(12).min(10),
});

export const forgotPasswordSchema = Joi.object({
	email: Joi.string().email().required(),
});

export const loginWithOtpSchema = Joi.object({
	email: Joi.string().email().required().trim(),
});

export const verifyOTPSchema = Joi.object({
	email: Joi.string().email().required().trim(),
	code: Joi.alternatives()
		.try(
			Joi.number().integer().min(100000).max(999999),
			Joi.string().length(6).pattern(/^\d{6}$/)
		)
		.required()
		.custom((v, helpers) => {
			const num = typeof v === 'string' ? parseInt(v, 10) : v;
			if (num < 100000 || num > 999999) return helpers.error('number.min');
			return num;
		}),
	purpose: Joi.string().valid('login', 'forgot_password').optional(),
});

export const resetPasswordSchema = Joi.object({
	email: Joi.string().email().required(),
	identifier: Joi.string().required(),
	newPassword: Joi.string().required().min(6).max(50),
});
