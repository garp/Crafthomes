import Joi from 'joi';
import { fileSchema } from './master/masterItem.validator.js';

export const getCategorySchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'name'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const getSubCategorySchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	categoryId: Joi.string().uuid().optional(),
	brandId: Joi.string().uuid().optional(),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'name'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const getBrandSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	search: Joi.string().optional().min(1).max(100),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'name'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const createCategorySchema = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().optional().allow(''),
	media: Joi.array().items(fileSchema).optional(),
});

export const updateCategorySchema = Joi.object({
	name: Joi.string().optional(),
	description: Joi.string().optional().allow(''),
	media: Joi.array().items(fileSchema).optional().allow(''),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE').allow(''),
});

export const createSubCategorySchema = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().optional().allow(''),
	categoryId: Joi.string().required(),
	brandId: Joi.string().optional(),
	media: Joi.array().items(fileSchema).optional(),
});

export const updateSubCategorySchema = Joi.object({
	name: Joi.string().optional(),
	description: Joi.string().optional().allow(''),
	brand: Joi.string().optional().allow(''),
	media: Joi.array().items(fileSchema).optional(),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
	categoryId: Joi.string().optional(),
});

export const createBrandSchema = Joi.object({
	name: Joi.string().required(),
});

export const updateBrandSchema = Joi.object({
	name: Joi.string().optional(),
	status: Joi.string().optional().valid('ACTIVE', 'INACTIVE'),
});
