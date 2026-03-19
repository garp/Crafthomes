import AWS from 'aws-sdk';
import { v4 as uuidv4 } from 'uuid';
import { AWS_CONFIG } from '../../../config/server.js';

const S3Client = new AWS.S3({
	accessKeyId: AWS_CONFIG.ACCESS_KEY_ID,
	secretAccessKey: AWS_CONFIG.SECRET_ACCESS_KEY,
	region: AWS_CONFIG.REGION,
});

export const uploadPdfToS3 = async (pdfBuffer, folderName, fileName = null) => {
	try {
		const generatedFileName = fileName ? `${fileName}.pdf` : `checklist-${uuidv4()}-${Date.now()}.pdf`;
		const folder = `checklists/${folderName}`;

		const s3Params = {
			Bucket: AWS_CONFIG.BUCKET_NAME,
			Key: `${folder}/${generatedFileName}`,
			Body: pdfBuffer,
			ContentType: 'application/pdf',
		};

		const s3Res = await S3Client.upload(s3Params).promise();

		return {
			url: s3Res.Location,
			key: s3Res.Key,
			fileName: generatedFileName,
		};
	} catch (error) {
		console.error('AWS S3 upload error:', error);
		throw new Error('Failed to upload PDF to AWS S3');
	}
};

export const deleteFileFromS3 = async key => {
	try {
		const s3Params = {
			Bucket: AWS_CONFIG.BUCKET_NAME,
			Key: key,
		};
		await S3Client.deleteObject(s3Params).promise();
	} catch (error) {
		console.error('AWS S3 delete error:', error);
		throw new Error('Failed to delete file from AWS S3');
	}
};

export const pseudo = 'pseudo';
