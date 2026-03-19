import Joi from 'joi';
import { attachmentSchema } from './task.validator.js';

const SITE_VISIT_STATUS = ['SCHEDULED', 'IN_PROGRESS', 'SUBMITTED', 'REVIEWED'];
const PRIORITY_VALUES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

const taskSnapshotSchema = Joi.object({
	originalTaskId: Joi.string().uuid().optional().allow(null, ''),
	taskTitle: Joi.string().required(),
	statusAtVisit: Joi.string().required(),
	notes: Joi.string().max(500).optional().allow(null, ''),
	completionPercentage: Joi.number().integer().min(0).max(100).optional().allow(null),
	attachments: Joi.array().items(attachmentSchema).optional().max(5),
});

export const getSiteVisitSchema = Joi.object({
	projectId: Joi.string().uuid().required(),
	status: Joi.string()
		.valid(...SITE_VISIT_STATUS)
		.optional()
		.allow(null, ''),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'startedAt').default('createdAt'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const createSiteVisitSchema = Joi.object({
	projectId: Joi.string().uuid().required(),
	status: Joi.string()
		.valid(...SITE_VISIT_STATUS)
		.required(),
	priority: Joi.string()
		.valid(...PRIORITY_VALUES)
		.optional()
		.allow(null, ''),
	startedAt: Joi.date().iso().required(),
	engineerIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
	taskSnapshots: Joi.array().items(taskSnapshotSchema).optional().default([]),
	summaryText: Joi.string().max(1000).optional().allow(null, ''),
	attachments: Joi.array().items(attachmentSchema).optional().max(10),
});

export const updateSiteVisitSchema = Joi.object({
	status: Joi.string()
		.valid(...SITE_VISIT_STATUS)
		.optional(),
	priority: Joi.string()
		.valid(...PRIORITY_VALUES)
		.optional()
		.allow(null, ''),
	startedAt: Joi.date().iso().optional(),
	submittedAt: Joi.date().iso().optional().allow(null),
	reviewedAt: Joi.date().iso().optional().allow(null),
	summaryText: Joi.string().max(1000).optional().allow(null, ''),
	clientSignatureUrl: Joi.string().uri().optional().allow(null, ''),
	engineerIds: Joi.array().items(Joi.string().uuid()).optional(),
	taskSnapshots: Joi.array().items(taskSnapshotSchema).optional(),
	attachments: Joi.array().items(attachmentSchema).optional(),
});

// Gallery collection
export const createGalleryCollectionSchema = Joi.object({
	siteVisitId: Joi.string().uuid().required(),
	name: Joi.string().max(200).optional().allow(null, ''),
	notes: Joi.string().max(500).optional().allow(null, ''),
	displayOrder: Joi.number().integer().min(0).optional().allow(null),
	capturedAt: Joi.date().iso().optional().allow(null),
	area: Joi.string().max(100).optional().allow(null, ''),
});

export const updateGalleryCollectionSchema = Joi.object({
	name: Joi.string().max(200).optional().allow(null, ''),
	notes: Joi.string().max(500).optional().allow(null, ''),
	displayOrder: Joi.number().integer().min(0).optional().allow(null),
	capturedAt: Joi.date().iso().optional().allow(null),
	area: Joi.string().max(100).optional().allow(null, ''),
});

export const getGalleryCollectionsQuerySchema = Joi.object({
	siteVisitId: Joi.string().uuid().required(),
});

// Gallery attachment
export const createGalleryAttachmentSchema = Joi.object({
	siteVisitGalleryCollectionId: Joi.string().uuid().required(),
	attachmentId: Joi.string().uuid().required(),
	displayOrder: Joi.number().integer().min(0).optional().allow(null),
	caption: Joi.string().max(500).optional().allow(null, ''),
	takenAt: Joi.date().iso().optional().allow(null),
	taskId: Joi.string().uuid().optional().allow(null, ''),
});

export const updateGalleryAttachmentSchema = Joi.object({
	displayOrder: Joi.number().integer().min(0).optional().allow(null),
	caption: Joi.string().max(500).optional().allow(null, ''),
	takenAt: Joi.date().iso().optional().allow(null),
	taskId: Joi.string().uuid().optional().allow(null, ''),
});

export const getGalleryAttachmentsQuerySchema = Joi.object({
	siteVisitGalleryCollectionId: Joi.string().uuid().required(),
});
