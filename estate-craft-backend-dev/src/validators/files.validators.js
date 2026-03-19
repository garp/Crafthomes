import Joi from 'joi';

export const getRootContentsQuery = Joi.object({
	projectId: Joi.string().uuid().required(),
	search: Joi.string().optional().allow('', null),
	sortBy: Joi.string()
		.valid('sizeDesc', 'sizeAsc', 'modifiedDesc', 'modifiedAsc', 'nameAsc', 'nameDesc')
		.optional()
		.default('modifiedDesc'),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(50),
});

export const getFolderContentsQuery = Joi.object({
	search: Joi.string().optional().allow('', null),
	sortBy: Joi.string()
		.valid('sizeDesc', 'sizeAsc', 'modifiedDesc', 'modifiedAsc', 'nameAsc', 'nameDesc')
		.optional()
		.default('modifiedDesc'),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(50),
});

export const getAllFoldersByProjectQuery = Joi.object({
	projectId: Joi.string().uuid().required(),
	sortBy: Joi.string()
		.valid('sizeDesc', 'sizeAsc', 'modifiedDesc', 'modifiedAsc', 'nameAsc', 'nameDesc')
		.optional()
		.default('modifiedDesc'),
});

export const createFolder = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().optional().allow('', null),
	projectId: Joi.string().uuid().required(),
	parentFolderId: Joi.string().uuid().optional().allow(null, ''),
});

export const updateFolder = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().optional().allow('', null),
});

export const updateFile = Joi.object({
	name: Joi.string().required(),
	description: Joi.string().optional().allow('', null),
});

export const uploadFile = Joi.object({
	folderId: Joi.string().uuid().optional().allow(null, ''),
	projectId: Joi.string().uuid().required(),
	description: Joi.string().optional().allow('', null),
});

export const moveItem = Joi.object({
	fileId: Joi.string().uuid().optional(),
	folderId: Joi.string().uuid().optional(),
	targetFolderId: Joi.string().uuid().optional().allow(null, ''),
}).or('fileId', 'folderId');

export const deleteItem = Joi.object({
	fileId: Joi.string().uuid().optional(),
	folderId: Joi.string().uuid().optional(),
}).or('fileId', 'folderId');

export const bulkDeleteItems = Joi.object({
	fileIds: Joi.array().items(Joi.string().uuid()).optional().messages({
		'string.guid': 'Invalid file ID format',
	}),
	folderIds: Joi.array().items(Joi.string().uuid()).optional().messages({
		'string.guid': 'Invalid folder ID format',
	}),
})
	.or('fileIds', 'folderIds')
	.messages({
		'object.missing': 'Either fileIds array or folderIds array must be provided',
	});

export const getFile = Joi.object({
	key: Joi.string().required(),
});

export const downloadItems = Joi.object({
	fileIds: Joi.array().items(Joi.string().uuid()).optional().messages({
		'string.guid': 'Invalid file ID format',
	}),
	folderIds: Joi.array().items(Joi.string().uuid()).optional().messages({
		'string.guid': 'Invalid folder ID format',
	}),
	projectId: Joi.string().uuid().required(),
})
	.or('fileIds', 'folderIds')
	.messages({
		'object.missing': 'Either fileIds array or folderIds array must be provided',
	});
