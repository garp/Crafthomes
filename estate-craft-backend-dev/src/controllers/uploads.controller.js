import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { AWS_CONFIG, MEDIA_COMPRESSOR } from '../../config/server.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import AttachmentServices from '../services/modelServices/attachment.services.js';
import mediaCompressorService, { IMAGE_FORMATS } from '../services/utilServices/mediaCompressor.services.js';

const S3Client = new AWS.S3({
	accessKeyId: AWS_CONFIG.ACCESS_KEY_ID,
	secretAccessKey: AWS_CONFIG.SECRET_ACCESS_KEY,
	region: AWS_CONFIG.REGION,
});

/**
 * Check if media compression is enabled and configured
 */
const isCompressionEnabled = () => {
	return Boolean(MEDIA_COMPRESSOR.URL && MEDIA_COMPRESSOR.AES_KEY);
};

/**
 * Check if file is a compressible image
 */
const isCompressibleImage = mimetype => {
	const compressibleTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
	return compressibleTypes.includes(mimetype);
};

/**
 * Check if file is a compressible video
 */
const isCompressibleVideo = mimetype => {
	const compressibleTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
	return compressibleTypes.includes(mimetype);
};

// Helper function to get file type from mimetype
const getFileType = mimetype => {
	const mimeTypeMap = {
		// Documents
		'application/pdf': 'pdf',
		'text/plain': 'txt',
		'text/csv': 'csv',

		// Microsoft Word
		'application/msword': 'doc',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',

		// Microsoft Excel
		'application/vnd.ms-excel': 'xls',
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',

		// Microsoft PowerPoint
		'application/vnd.ms-powerpoint': 'ppt',
		'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',

		// Images
		'image/jpeg': 'jpg',
		'image/jpg': 'jpg',
		'image/png': 'png',
		'image/webp': 'webp',
		'image/gif': 'gif',
		'image/svg+xml': 'svg',

		// Videos
		'video/mp4': 'mp4',
		'video/quicktime': 'mov',
		'video/x-msvideo': 'avi',
		'video/x-ms-wmv': 'wmv',

		// Compressed files
		'application/zip': 'zip',
		'application/x-zip-compressed': 'zip',
		'application/x-rar-compressed': 'rar',
		'application/x-7z-compressed': '7z',

		// CAD files
		'application/acad': 'dwg',
		'application/x-acad': 'dwg',
		'application/autocad_dwg': 'dwg',
		'image/vnd.dwg': 'dwg',
		'image/vnd.dxf': 'dxf',
		'application/dxf': 'dxf',

		// Other formats
		'application/rtf': 'rtf',
		'application/vnd.oasis.opendocument.text': 'odt',
		'application/vnd.oasis.opendocument.spreadsheet': 'ods',
	};

	return mimeTypeMap[mimetype] || 'other';
};

class UploadController {
	upload = asyncHandler(async (req, res) => {
		const files = req.files || [];
		const { userId } = req.user;

		if (!files || files.length === 0) {
			return res.status(400).json({ message: 'No files uploaded' });
		}

		const folder = req.body.folder || 'estate';
		const compress = req.body.compress !== 'false'; // Enable compression by default
		const uploadResults = [];
		const compressionEnabled = isCompressionEnabled();

		try {
			for (const file of files) {
				const shouldCompressImage = compress && compressionEnabled && isCompressibleImage(file.mimetype);
				const shouldCompressVideo = compress && compressionEnabled && isCompressibleVideo(file.mimetype);

				let uploadResult;

				if (shouldCompressImage) {
					// Compress and upload image via media compressor service
					try {
						const compressed = await mediaCompressorService.compressImage({
							buffer: file.buffer,
							originalName: file.originalname,
							mimeType: file.mimetype,
							format: IMAGE_FORMATS.WEBP,
							directory: folder,
						});

						uploadResult = {
							url: compressed.compressedUrl,
							name: file.originalname,
							key: `${folder}/${compressed.filename}`,
							type: 'webp',
							size: file.size, // Original size (compressed size not returned by API)
							mimeType: 'image/webp',
							compressed: true,
							createdAt: new Date(),
							updatedAt: new Date(),
							createdBy: userId,
							updatedBy: userId,
						};
					} catch (compressError) {
						console.error('Image compression failed, falling back to direct upload:', compressError.message);
						// Fallback to direct S3 upload if compression fails
						uploadResult = await this.directS3Upload(file, folder, userId);
					}
				} else if (shouldCompressVideo) {
					// Compress and upload video via media compressor service
					try {
						const compressed = await mediaCompressorService.compressVideo({
							buffer: file.buffer,
							originalName: file.originalname,
							mimeType: file.mimetype,
							directory: folder,
						});

						uploadResult = {
							url: compressed.compressedUrl,
							name: file.originalname,
							key: `${folder}/${compressed.filename}`,
							type: 'webm',
							size: file.size, // Original size
							mimeType: 'video/webm',
							compressed: true,
							createdAt: new Date(),
							updatedAt: new Date(),
							createdBy: userId,
							updatedBy: userId,
						};
					} catch (compressError) {
						console.error('Video compression failed, falling back to direct upload:', compressError.message);
						// Fallback to direct S3 upload if compression fails
						uploadResult = await this.directS3Upload(file, folder, userId);
					}
				} else {
					// Direct S3 upload for non-compressible files
					uploadResult = await this.directS3Upload(file, folder, userId);
				}

				// Create Attachment record so we can reference by id (e.g. quotation item image)
				const attachment = await AttachmentServices.create({
					data: {
						name: uploadResult.name,
						url: uploadResult.url,
						key: uploadResult.key,
						mimeType: uploadResult.mimeType || null,
						size: uploadResult.size || null,
						type: uploadResult.type || null,
						createdBy: userId,
						status: 'ACTIVE',
					},
				});
				uploadResults.push({ ...uploadResult, id: attachment.id });
			}

			return responseHandler(
				{
					message: 'Upload successful',
					files: uploadResults,
					count: uploadResults.length,
				},
				res
			);
		} catch (error) {
			return res.status(500).json({
				message: 'Upload failed',
				error: error.message,
			});
		}
	});

	/**
	 * Direct upload to S3 without compression
	 */
	directS3Upload = async (file, folder, userId) => {
		const fileExtension = file.originalname.split('.').pop();
		const fileName = `${uuidv4()}-${Date.now()}.${fileExtension}`;

		const s3Params = {
			Bucket: AWS_CONFIG.BUCKET_NAME,
			Key: `${folder}/${fileName}`,
			Body: file.buffer,
			ContentType: file.mimetype,
		};

		const s3Res = await S3Client.upload(s3Params).promise();

		return {
			url: s3Res.Location,
			name: file.originalname,
			key: s3Res.Key,
			type: getFileType(file.mimetype),
			size: file.size,
			mimeType: file.mimetype,
			compressed: false,
			createdAt: new Date(),
			updatedAt: new Date(),
			createdBy: userId,
			updatedBy: userId,
		};
	};

	deleteFile = asyncHandler(async (req, res) => {
		const { key } = req.body;

		if (!key) {
			return res.status(400).json({ message: 'File key is required' });
		}

		try {
			const s3Params = {
				Bucket: AWS_CONFIG.BUCKET_NAME,
				Key: key,
			};
			await S3Client.deleteObject(s3Params).promise();
		} catch (error) {
			console.error('S3 delete error:', error.message, error.code);
			return errorHandler('E-912', res, `Failed to delete file from storage: ${error.message}`);
		}

		try {
			await AttachmentServices.deleteMany({ where: { key } });
		} catch (dbError) {
			console.error('Database delete error:', dbError.message);
			// File already deleted from S3, just log the DB error
		}

		return responseHandler(
			{
				message: 'File deleted successfully',
				key,
			},
			res
		);
	});
}

export default new UploadController();
