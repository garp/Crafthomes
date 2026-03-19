import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { AWS_CONFIG } from '../../../config/server.js';

const S3Client = new AWS.S3({
	accessKeyId: AWS_CONFIG.ACCESS_KEY_ID,
	secretAccessKey: AWS_CONFIG.SECRET_ACCESS_KEY,
	region: AWS_CONFIG.REGION,
});

/**
 * Upload a file to AWS S3
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} originalFileName - Original filename
 * @param {string} mimeType - File MIME type
 * @param {string} folderPath - Optional folder path in S3
 * @returns {Promise<{url: string, key: string, fileName: string}>}
 */
export const uploadFileToS3 = async (fileBuffer, originalFileName, mimeType, folderPath = 'files') => {
	try {
		const ext = path.extname(originalFileName);
		const generatedFileName = `${uuidv4()}${ext}`;
		const key = `${folderPath}/${generatedFileName}`;

		const s3Params = {
			Bucket: AWS_CONFIG.BUCKET_NAME,
			Key: key,
			Body: fileBuffer,
			ContentType: mimeType,
		};

		const s3Res = await S3Client.upload(s3Params).promise();

		return {
			url: s3Res.Location,
			key: s3Res.Key,
			fileName: generatedFileName,
		};
	} catch (error) {
		console.error('AWS S3 upload error:', error);
		throw new Error('Failed to upload file to AWS S3');
	}
};

/**
 * Delete a file from AWS S3
 * @param {string} fileKey - The S3 key of the file to delete
 * @returns {Promise<void>}
 */
export const deleteFileFromS3 = async fileKey => {
	try {
		const s3Params = {
			Bucket: AWS_CONFIG.BUCKET_NAME,
			Key: fileKey,
		};

		await S3Client.deleteObject(s3Params).promise();
	} catch (error) {
		console.error('AWS S3 delete error:', error);
		throw new Error('Failed to delete file from AWS S3');
	}
};

/**
 * Upload multiple files to AWS S3
 * @param {Array} files - Array of file objects with buffer, originalname, and mimetype
 * @param {string} folderPath - Optional folder path in S3
 * @returns {Promise<Array>}
 */
export const uploadMultipleFilesToS3 = async (files, folderPath = 'files') => {
	try {
		const uploadPromises = files.map(file => uploadFileToS3(file.buffer, file.originalname, file.mimetype, folderPath));
		return await Promise.all(uploadPromises);
	} catch (error) {
		console.error('AWS S3 multiple upload error:', error);
		throw new Error('Failed to upload files to AWS S3');
	}
};

/**
 * Download a file from AWS S3
 * @param {string} fileKey - The S3 key of the file to download
 * @returns {Promise<Buffer>} - The file buffer
 */
export const downloadFileFromS3 = async fileKey => {
	try {
		const s3Params = {
			Bucket: AWS_CONFIG.BUCKET_NAME,
			Key: fileKey,
		};

		const data = await S3Client.getObject(s3Params).promise();
		return data.Body;
	} catch (error) {
		console.error('AWS S3 download error:', error);
		throw new Error('Failed to download file from AWS S3');
	}
};

/**
 * Get a signed URL for downloading a file from S3
 * @param {string} fileKey - The S3 key of the file
 * @param {number} expiresIn - URL expiration time in seconds (default: 3600)
 * @returns {Promise<string>} - The signed URL
 */
export const getSignedDownloadUrl = async (fileKey, expiresIn = 3600) => {
	try {
		const s3Params = {
			Bucket: AWS_CONFIG.BUCKET_NAME,
			Key: fileKey,
			Expires: expiresIn,
		};

		return S3Client.getSignedUrlPromise('getObject', s3Params);
	} catch (error) {
		console.error('AWS S3 signed URL error:', error);
		throw new Error('Failed to generate signed URL');
	}
};
