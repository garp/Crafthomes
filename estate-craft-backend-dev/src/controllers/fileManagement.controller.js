import JSZip from 'jszip';
import FolderServices from '../services/modelServices/folder.services.js';
import AttachmentServices from '../services/modelServices/attachment.services.js';
import ProjectServices from '../services/modelServices/project.services.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import { uploadFileToS3, deleteFileFromS3, downloadFileFromS3 } from '../utils/functions/fileUpload.js';
import trackActivity from '../middlewares/activities.middleware.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';

function getFileType(mimetype) {
	if (mimetype.startsWith('image/')) return 'image';
	if (mimetype.startsWith('video/')) return 'video';
	if (mimetype.includes('pdf')) return 'pdf';
	if (mimetype.includes('word') || mimetype.includes('document')) return 'document';
	if (mimetype.includes('sheet') || mimetype.includes('excel')) return 'spreadsheet';
	if (mimetype.includes('presentation') || mimetype.includes('powerpoint')) return 'presentation';
	if (mimetype.includes('zip') || mimetype.includes('rar') || mimetype.includes('7z')) return 'archive';
	return 'other';
}

class FileManagementController {
	// Helper function to get sort order based on sortBy parameter
	getSortOrder = sortBy => {
		const sortOptions = {
			sizeDesc: { size: 'desc' },
			sizeAsc: { size: 'asc' },
			modifiedDesc: { updatedAt: 'desc' },
			modifiedAsc: { updatedAt: 'asc' },
			nameAsc: { name: 'asc' },
			nameDesc: { name: 'desc' },
		};
		return sortOptions[sortBy] || { updatedAt: 'desc' };
	};

	getRootContents = asyncHandler(async (req, res) => {
		const { projectId, sortBy, search, pageNo = 0, pageLimit = 50 } = req.query;

		if (!projectId) {
			return errorHandler('E-900', res);
		}

		const project = await ProjectServices.findOne({
			where: { id: projectId, status: 'ACTIVE' },
		});

		if (!project) {
			return errorHandler('E-900', res);
		}

		// Get sort order for files
		const sortOrder = this.getSortOrder(sortBy);

		// Folders should always sort by name when size sorting is requested
		const folderSortOrder = sortBy === 'sizeAsc' || sortBy === 'sizeDesc' ? { name: 'asc' } : sortOrder;

		// Fetch root folders (no parent)
		const folders = await FolderServices.findMany({
			where: {
				projectId,
				parentFolderId: null,
				status: 'ACTIVE',
				name: {
					contains: search,
					mode: 'insensitive',
				},
			},
			orderBy: folderSortOrder,
			include: {
				_count: {
					select: {
						attachments: true,
						subfolders: true,
					},
				},
				CreatedBy: {
					select: {
						id: true,
						name: true,
					},
				},
				UpdatedBy: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
		});

		// Fetch root files with OR logic to catch all project-related attachments
		const files = await AttachmentServices.findMany({
			where: {
				folderId: null,
				status: 'ACTIVE',
				name: {
					contains: search,
					mode: 'insensitive',
				},
				OR: [
					// Direct project attachments
					{ projectId },
					// Attachments linked through tasks in phases belonging to this project
					{
						task: {
							phase: {
								projectId,
							},
						},
					},
				],
			},
			orderBy: sortOrder,
			select: {
				id: true,
				name: true,
				description: true,
				url: true,
				key: true,
				mimeType: true,
				size: true,
				type: true,
				createdAt: true,
				updatedAt: true,
				createdBy: true,
				updatedBy: true,
				task: {
					select: {
						id: true,
						name: true,
						phaseId: true,
						phase: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				CreatedBy: {
					select: {
						id: true,
						name: true,
					},
				},
				UpdatedBy: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
		});

		return responseHandler(
			{
				folders,
				files,
				totalFolders: folders.length,
				totalFiles: files.length,
			},
			res
		);
	});

	getAllFoldersByProject = asyncHandler(async (req, res) => {
		const { projectId, sortBy } = req.query;

		if (!projectId) {
			return errorHandler('E-900', res);
		}

		// Verify project exists
		const project = await ProjectServices.findOne({
			where: { id: projectId, status: 'ACTIVE' },
		});

		if (!project) {
			return errorHandler('E-900', res);
		}

		// Get sort order
		const sortOrder = this.getSortOrder(sortBy);

		// Folders should always sort by name when size sorting is requested
		const folderSortOrder = sortBy === 'sizeAsc' || sortBy === 'sizeDesc' ? { name: 'asc' } : sortOrder;

		// Fetch all folders for the project
		const folders = await FolderServices.findMany({
			where: {
				projectId,
				status: 'ACTIVE',
			},
			orderBy: folderSortOrder,
			include: {
				_count: {
					select: {
						attachments: true,
						subfolders: true,
					},
				},
				parentFolder: {
					select: {
						id: true,
						name: true,
					},
				},
				CreatedBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				UpdatedBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		return responseHandler(
			{
				folders,
				totalCount: folders.length,
			},
			res
		);
	});

	getFolderContents = asyncHandler(async (req, res) => {
		const { folderId } = req.params;
		const { sortBy, search } = req.query;

		// Verify folder exists
		const folder = await FolderServices.findOne({
			where: { id: folderId, status: 'ACTIVE' },
		});

		if (!folder) {
			return errorHandler('E-901', res);
		}

		// Get sort order for files
		const sortOrder = this.getSortOrder(sortBy);

		// Folders should always sort by name when size sorting is requested
		const folderSortOrder = sortBy === 'sizeAsc' || sortBy === 'sizeDesc' ? { name: 'asc' } : sortOrder;

		// Fetch subfolders
		const folders = await FolderServices.findMany({
			where: {
				parentFolderId: folderId,
				status: 'ACTIVE',
				name: {
					contains: search,
					mode: 'insensitive',
				},
			},
			orderBy: folderSortOrder,
			include: {
				_count: {
					select: {
						attachments: true,
						subfolders: true,
					},
				},
			},
		});

		// Fetch files in this folder
		const files = await AttachmentServices.findMany({
			where: {
				folderId,
				status: 'ACTIVE',
				name: {
					contains: search,
					mode: 'insensitive',
				},
			},
			select: {
				id: true,
				name: true,
				description: true,
				url: true,
				mimeType: true,
				size: true,
				type: true,
				createdAt: true,
				updatedAt: true,
				createdBy: true,
				updatedBy: true,
				CreatedBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				UpdatedBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy: sortOrder,
		});

		return responseHandler(
			{
				folder: {
					id: folder.id,
					name: folder.name,
					description: folder.description,
					projectId: folder.projectId,
					parentFolderId: folder.parentFolderId,
				},
				folders,
				files,
				totalFolders: folders.length,
				totalFiles: files.length,
			},
			res
		);
	});

	createFolder = asyncHandler(async (req, res) => {
		const { name, description, projectId, parentFolderId } = req.body;
		const { userId } = req.user;

		if (!projectId) {
			return errorHandler('E-900', res);
		}

		// Check if parent folder exists (if provided)
		if (parentFolderId) {
			const parentFolder = await FolderServices.findOne({
				where: { id: parentFolderId, status: 'ACTIVE' },
			});
			if (!parentFolder) {
				return errorHandler('E-901', res);
			}

			// Ensure parent folder belongs to same project
			if (parentFolder.projectId !== projectId) {
				return errorHandler('E-909', res);
			}
		}

		// Check for duplicate folder name in same location
		const existingFolder = await FolderServices.findFirst({
			where: {
				name,
				projectId,
				parentFolderId: parentFolderId || null,
				status: { not: 'DELETED' },
			},
		});

		if (existingFolder) {
			return errorHandler('E-903', res);
		}

		// Create folder
		const folder = await FolderServices.create({
			data: {
				name,
				description,
				projectId,
				parentFolderId,
				createdBy: userId,
			},
		});

		return responseHandler(folder, res, 201);
	});

	updateFolder = asyncHandler(async (req, res) => {
		const { folderId } = req.params;
		const { name, description } = req.body;

		const folder = await FolderServices.update({
			where: { id: folderId },
			data: { name, description },
		});

		return responseHandler(folder, res);
	});

	getFileDetails = asyncHandler(async (req, res) => {
		const { attachmentId } = req.params;

		const file = await AttachmentServices.findOne({
			where: { id: attachmentId },
			select: {
				id: true,
				name: true,
				description: true,
				url: true,
				key: true,
				mimeType: true,
				size: true,
				type: true,
				createdAt: true,
				updatedAt: true,
				folder: {
					select: {
						id: true,
						name: true,
						projectId: true,
					},
				},
				project: {
					select: {
						id: true,
						name: true,
					},
				},
				CreatedBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				UpdatedBy: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (!file) {
			return errorHandler('E-902', res);
		}

		return responseHandler(file, res);
	});

	updateFile = asyncHandler(async (req, res) => {
		const { attachmentId } = req.params;
		const { name, description } = req.body;

		const file = await AttachmentServices.update({
			where: { id: attachmentId },
			data: { name, description },
		});

		return responseHandler(file, res);
	});

	uploadFile = asyncHandler(async (req, res) => {
		const { folderId, projectId, description } = req.body;
		const { userId } = req.user;
		const { files } = req;

		if (!files || files.length === 0) {
			return errorHandler('E-908', res);
		}

		if (!projectId) {
			return errorHandler('E-900', res);
		}

		// Check if folder exists (if provided)
		if (folderId) {
			const folder = await FolderServices.findOne({
				where: { id: folderId, status: 'ACTIVE' },
			});
			if (!folder) {
				return errorHandler('E-901', res);
			}

			// Ensure folder belongs to same project
			if (folder.projectId !== projectId) {
				return errorHandler('E-909', res);
			}
		}

		// Upload files to S3 and create database records
		const uploadedFiles = [];
		const errors = [];

		for (const file of files) {
			try {
				// Upload to S3
				const s3Result = await uploadFileToS3(file.buffer, file.originalname, file.mimetype, projectId);

				// Create Attachment record
				const fileRecord = await AttachmentServices.create({
					data: {
						name: file.originalname,
						description,
						url: s3Result.url,
						key: s3Result.key,
						mimeType: file.mimetype,
						size: file.size,
						type: s3Result.type || getFileType(file.mimetype),
						folderId: folderId || null,
						projectId,
						createdBy: userId,
						status: 'ACTIVE',
					},
				});

				uploadedFiles.push(fileRecord);

				// Track activity for each uploaded file
				await trackActivity(userId, {
					projectId,
					entityType: ENTITY_TYPES.ATTACHMENT,
					entityId: fileRecord.id,
					entityName: file.originalname,
					activities: [`File "${file.originalname}" uploaded`],
					activityType: ACTIVITY_TYPES.CREATE,
				});
			} catch (error) {
				console.error('File upload error:', error);
				errors.push({
					fileName: file.originalname,
					error: error.message,
				});
			}
		}

		return responseHandler(
			{
				uploaded: uploadedFiles,
				errors: errors.length > 0 ? errors : undefined,
				message: `${uploadedFiles.length} file(s) uploaded successfully`,
			},
			res,
			201
		);
	});

	getFile = asyncHandler(async (req, res) => {
		const { key } = req.query;

		if (!key) {
			return errorHandler('E-900', res);
		}

		const file = await AttachmentServices.findFirst({
			where: { key, status: 'ACTIVE' },
		});

		if (!file) {
			return errorHandler('E-902', res);
		}

		return responseHandler(file, res);
	});

	move = asyncHandler(async (req, res) => {
		const { fileId, folderId, targetFolderId } = req.body;
		const userId = req.user.id;

		// Must provide either fileId or folderId
		if (!fileId && !folderId) {
			return errorHandler('E-910', res);
		}

		// Cannot provide both
		if (fileId && folderId) {
			return errorHandler('E-911', res);
		}

		// MOVE FILE
		if (fileId) {
			const file = await AttachmentServices.findOne({
				where: { id: fileId, status: 'ACTIVE' },
			});

			if (!file) {
				return errorHandler('E-902', res);
			}

			// Verify target folder exists (if provided)
			if (targetFolderId) {
				const targetFolder = await FolderServices.findOne({
					where: { id: targetFolderId, status: 'ACTIVE' },
				});

				if (!targetFolder) {
					return errorHandler('E-901', res);
				}

				// Ensure target folder belongs to same project
				if (targetFolder.projectId !== file.projectId) {
					return errorHandler('E-909', res);
				}
			}

			// Move file
			const updatedFile = await AttachmentServices.update({
				where: { id: fileId },
				data: {
					folderId: targetFolderId || null,
					updatedBy: userId,
				},
			});

			return responseHandler(
				{
					message: 'File moved successfully',
					file: updatedFile,
				},
				res
			);
		}

		// MOVE FOLDER
		if (folderId) {
			const folder = await FolderServices.findOne({
				where: { id: folderId, status: 'ACTIVE' },
			});

			if (!folder) {
				return errorHandler('E-901', res);
			}

			// Prevent moving folder to itself
			if (targetFolderId === folderId) {
				return errorHandler('E-904', res);
			}

			// Verify target parent folder exists (if provided)
			if (targetFolderId) {
				const targetParent = await FolderServices.findOne({
					where: { id: targetFolderId, status: 'ACTIVE' },
				});

				if (!targetParent) {
					return errorHandler('E-906', res);
				}

				// Ensure target folder belongs to same project
				if (targetParent.projectId !== folder.projectId) {
					return errorHandler('E-909', res);
				}

				// Prevent circular references
				let checkFolder = targetParent;
				while (checkFolder.parentFolderId) {
					if (checkFolder.parentFolderId === folderId) {
						return errorHandler('E-907', res);
					}
					checkFolder = await FolderServices.findOne({
						where: { id: checkFolder.parentFolderId },
					});
					if (!checkFolder) break;
				}
			}

			// Check for duplicate name in target location
			const existingFolder = await FolderServices.findFirst({
				where: {
					name: folder.name,
					projectId: folder.projectId,
					parentFolderId: targetFolderId || null,
					id: { not: folderId },
					status: { not: 'DELETED' },
				},
			});

			if (existingFolder) {
				return errorHandler('E-903', res);
			}

			// Move folder
			const updatedFolder = await FolderServices.update({
				where: { id: folderId },
				data: {
					parentFolderId: targetFolderId || null,
					updatedBy: userId,
				},
			});

			return responseHandler(
				{
					message: 'Folder moved successfully',
					folder: updatedFolder,
				},
				res
			);
		}
	});

	delete = asyncHandler(async (req, res) => {
		const { fileId, folderId } = req.query;

		// Must provide either fileId or folderId
		if (!fileId && !folderId) {
			return errorHandler('E-910', res);
		}

		// Cannot provide both
		if (fileId && folderId) {
			return errorHandler('E-911', res);
		}

		// DELETE FILE
		if (fileId) {
			const file = await AttachmentServices.findOne({
				where: { id: fileId, status: 'ACTIVE' },
			});

			if (!file) {
				return errorHandler('E-902', res);
			}

			// Delete from S3 if key exists
			if (file.key) {
				try {
					await deleteFileFromS3(file.key);
				} catch (s3Error) {
					console.error('S3 deletion failed:', s3Error);
					// Continue with database deletion even if S3 fails
				}
			}

			// Soft delete the file from database
			await AttachmentServices.delete({
				where: { id: fileId },
			});

			return responseHandler(
				{
					message: 'File deleted successfully',
				},
				res
			);
		}

		// DELETE FOLDER
		if (folderId) {
			const folder = await FolderServices.findOne({
				where: { id: folderId, status: 'ACTIVE' },
			});

			if (!folder) {
				return errorHandler('E-901', res);
			}

			const filesInFolder = await AttachmentServices.findMany({
				where: { folderId, status: 'ACTIVE' },
			});

			for (const file of filesInFolder) {
				if (file.key) {
					try {
						await deleteFileFromS3(file.key);
					} catch (s3Error) {
						console.error('S3 deletion failed for file:', file.key, s3Error);
					}
				}
			}

			// Soft delete the folder
			await FolderServices.delete({
				where: { id: folderId },
			});

			return responseHandler(
				{
					message: 'Folder deleted successfully',
				},
				res
			);
		}
	});

	bulkDelete = asyncHandler(async (req, res) => {
		const { fileIds, folderIds } = req.body;

		const results = {
			filesDeleted: [],
			filesFailed: [],
			foldersDeleted: [],
			foldersFailed: [],
			s3FilesDeleted: 0,
			s3FilesFailed: 0,
		};

		// DELETE MULTIPLE FILES
		if (fileIds && fileIds.length > 0) {
			for (const fileId of fileIds) {
				try {
					const file = await AttachmentServices.findOne({
						where: { id: fileId, status: 'ACTIVE' },
					});

					if (!file) {
						results.filesFailed.push({
							fileId,
							reason: 'File not found or already deleted',
						});
						continue;
					}

					// Delete from S3 if key exists
					if (file.key) {
						try {
							await deleteFileFromS3(file.key);
							results.s3FilesDeleted++;
						} catch (s3Error) {
							console.error('S3 deletion failed:', s3Error);
							results.s3FilesFailed++;
							// Continue with database deletion even if S3 fails
						}
					}

					// Soft delete the file from database
					await AttachmentServices.delete({
						where: { id: fileId },
					});

					results.filesDeleted.push({
						fileId,
						name: file.name,
					});
				} catch (error) {
					console.error(`Failed to delete file ${fileId}:`, error);
					results.filesFailed.push({
						fileId,
						reason: error.message,
					});
				}
			}
		}

		// DELETE MULTIPLE FOLDERS
		if (folderIds && folderIds.length > 0) {
			for (const folderId of folderIds) {
				try {
					const folder = await FolderServices.findOne({
						where: { id: folderId, status: 'ACTIVE' },
					});

					if (!folder) {
						results.foldersFailed.push({
							folderId,
							reason: 'Folder not found or already deleted',
						});
						continue;
					}

					// Get all files in this folder
					const filesInFolder = await AttachmentServices.findMany({
						where: { folderId, status: 'ACTIVE' },
					});

					// Delete all files from S3
					for (const file of filesInFolder) {
						if (file.key) {
							try {
								await deleteFileFromS3(file.key);
								results.s3FilesDeleted++;
							} catch (s3Error) {
								console.error('S3 deletion failed for file:', file.key, s3Error);
								results.s3FilesFailed++;
							}
						}
					}

					// Soft delete the folder
					await FolderServices.delete({
						where: { id: folderId },
					});

					results.foldersDeleted.push({
						folderId,
						name: folder.name,
						filesInFolder: filesInFolder.length,
					});
				} catch (error) {
					console.error(`Failed to delete folder ${folderId}:`, error);
					results.foldersFailed.push({
						folderId,
						reason: error.message,
					});
				}
			}
		}

		// Build success message
		const successMessages = [];
		if (results.filesDeleted.length > 0) {
			successMessages.push(`${results.filesDeleted.length} file(s)`);
		}
		if (results.foldersDeleted.length > 0) {
			successMessages.push(`${results.foldersDeleted.length} folder(s)`);
		}

		const message =
			successMessages.length > 0 ? `Successfully deleted ${successMessages.join(' and ')}` : 'No items were deleted';

		return responseHandler(
			{
				message,
				filesDeleted: results.filesDeleted,
				filesFailed: results.filesFailed.length > 0 ? results.filesFailed : undefined,
				foldersDeleted: results.foldersDeleted,
				foldersFailed: results.foldersFailed.length > 0 ? results.foldersFailed : undefined,
				s3FilesDeleted: results.s3FilesDeleted,
				s3FilesFailed: results.s3FilesFailed > 0 ? results.s3FilesFailed : undefined,
			},
			res
		);
	});

	/**
	 * Helper function to recursively get all files and subfolders in a folder
	 * @param {string} folderId - The folder ID
	 * @param {string} currentPath - Current path in the ZIP structure
	 * @returns {Promise<Array>} - Array of file objects with their paths
	 */
	async getFolderContentsRecursive(folderId, currentPath = '') {
		const files = [];

		// Get files in this folder
		const folderFiles = await AttachmentServices.findMany({
			where: { folderId, status: 'ACTIVE' },
			select: {
				id: true,
				name: true,
				key: true,
				url: true,
			},
		});

		for (const file of folderFiles) {
			files.push({
				...file,
				zipPath: currentPath ? `${currentPath}/${file.name}` : file.name,
			});
		}

		// Get subfolders and recursively fetch their contents
		const subfolders = await FolderServices.findMany({
			where: { parentFolderId: folderId, status: 'ACTIVE' },
			select: {
				id: true,
				name: true,
			},
		});

		for (const subfolder of subfolders) {
			const subfolderPath = currentPath ? `${currentPath}/${subfolder.name}` : subfolder.name;
			const subfolderFiles = await this.getFolderContentsRecursive(subfolder.id, subfolderPath);
			files.push(...subfolderFiles);
		}

		return files;
	}

	/**
	 * Download files and folders as a ZIP
	 * Supports downloading multiple files and/or folders with preserved folder structure
	 */
	download = asyncHandler(async (req, res) => {
		const { fileIds, folderIds, projectId } = req.body;

		// Verify project exists
		const project = await ProjectServices.findOne({
			where: { id: projectId, status: 'ACTIVE' },
		});

		if (!project) {
			return errorHandler('E-900', res);
		}

		const zip = new JSZip();
		const filesToDownload = [];
		const errors = [];

		// Process individual files
		if (fileIds && fileIds.length > 0) {
			for (const fileId of fileIds) {
				const file = await AttachmentServices.findOne({
					where: { id: fileId, status: 'ACTIVE' },
					select: {
						id: true,
						name: true,
						key: true,
						url: true,
						projectId: true,
					},
				});

				if (!file) {
					errors.push({ fileId, reason: 'File not found' });
					continue;
				}

				// Verify file belongs to the project
				if (file.projectId !== projectId) {
					errors.push({ fileId, reason: 'File does not belong to this project' });
					continue;
				}

				filesToDownload.push({
					...file,
					zipPath: file.name,
				});
			}
		}

		// Process folders (with recursive contents)
		if (folderIds && folderIds.length > 0) {
			for (const folderId of folderIds) {
				const folder = await FolderServices.findOne({
					where: { id: folderId, status: 'ACTIVE' },
					select: {
						id: true,
						name: true,
						projectId: true,
					},
				});

				if (!folder) {
					errors.push({ folderId, reason: 'Folder not found' });
					continue;
				}

				// Verify folder belongs to the project
				if (folder.projectId !== projectId) {
					errors.push({ folderId, reason: 'Folder does not belong to this project' });
					continue;
				}

				// Get all files in folder recursively
				const folderFiles = await this.getFolderContentsRecursive(folderId, folder.name);

				// If folder is empty, create an empty folder in ZIP
				if (folderFiles.length === 0) {
					zip.folder(folder.name);
				}

				filesToDownload.push(...folderFiles);
			}
		}

		// Check if there are any files to download
		if (filesToDownload.length === 0) {
			return errorHandler('E-912', res, 'No files to download');
		}

		// Download files from S3 and add to ZIP
		let downloadedCount = 0;
		for (const file of filesToDownload) {
			if (!file.key) {
				errors.push({ fileId: file.id, fileName: file.name, reason: 'No S3 key found' });
				continue;
			}

			try {
				const fileBuffer = await downloadFileFromS3(file.key);
				zip.file(file.zipPath, fileBuffer);
				downloadedCount++;
			} catch (downloadError) {
				console.error(`Failed to download file ${file.name}:`, downloadError);
				errors.push({ fileId: file.id, fileName: file.name, reason: 'Failed to download from S3' });
			}
		}

		// If no files were successfully downloaded
		if (downloadedCount === 0) {
			return errorHandler('E-913', res, 'Failed to download any files');
		}

		// Generate ZIP buffer
		const zipBuffer = await zip.generateAsync({
			type: 'nodebuffer',
			compression: 'DEFLATE',
			compressionOptions: { level: 6 },
		});

		// Generate filename based on content
		let zipFileName = 'download';
		if (folderIds && folderIds.length === 1 && (!fileIds || fileIds.length === 0)) {
			// Single folder download - use folder name
			const folder = await FolderServices.findOne({
				where: { id: folderIds[0] },
				select: { name: true },
			});
			if (folder) {
				zipFileName = folder.name.replace(/[^a-zA-Z0-9-_]/g, '_');
			}
		} else if (fileIds && fileIds.length === 1 && (!folderIds || folderIds.length === 0)) {
			// Single file download - use file name without extension
			const file = await AttachmentServices.findOne({
				where: { id: fileIds[0] },
				select: { name: true },
			});
			if (file) {
				const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
				zipFileName = nameWithoutExt.replace(/[^a-zA-Z0-9-_]/g, '_');
			}
		} else {
			// Multiple items - use project name
			zipFileName = project.name ? project.name.replace(/[^a-zA-Z0-9-_]/g, '_') : 'files';
		}

		// Set headers for ZIP download
		res.setHeader('Content-Type', 'application/zip');
		res.setHeader('Content-Disposition', `attachment; filename="${zipFileName}.zip"`);
		res.setHeader('Content-Length', zipBuffer.length);

		// Add error info in response header if any errors occurred
		if (errors.length > 0) {
			res.setHeader('X-Download-Errors', JSON.stringify(errors));
		}

		// Send the ZIP
		return res.send(zipBuffer);
	});
}

export default new FileManagementController();
