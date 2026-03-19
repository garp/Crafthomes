import { Router } from 'express';
import multer from 'multer';
import UploadController from '../../controllers/uploads.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

// Multer config to handle file input
const storage = multer.memoryStorage();

// File filter for allowed extensions and size validation
const fileFilter = (req, file, cb) => {
	const allowedTypes = [
		// Documents
		'application/pdf',
		'text/plain',
		'text/csv',

		// Microsoft Word
		'application/msword', // .doc
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx

		// Microsoft Excel
		'application/vnd.ms-excel', // .xls
		'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx

		// Microsoft PowerPoint
		'application/vnd.ms-powerpoint', // .ppt
		'application/vnd.openxmlformats-officedocument.presentationml.presentation', // .pptx

		// Images
		'image/jpeg',
		'image/jpg',
		'image/png',
		'image/webp',
		'image/gif',
		'image/svg+xml',

		// Videos
		'video/mp4',
		'video/quicktime',
		'video/x-msvideo', // .avi
		'video/x-ms-wmv', // .wmv

		// Compressed files
		'application/zip',
		'application/x-zip-compressed',
		'application/x-rar-compressed',
		'application/x-7z-compressed',

		// CAD files (for construction/architectural drawings)
		'application/acad',
		'application/x-acad',
		'application/autocad_dwg',
		'image/vnd.dwg',
		'image/vnd.dxf',
		'application/dxf',

		// Other useful formats
		'application/rtf', // Rich Text Format
		'application/vnd.oasis.opendocument.text', // .odt (OpenOffice)
		'application/vnd.oasis.opendocument.spreadsheet', // .ods (OpenOffice)
	];

	if (allowedTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(
			new Error(`Invalid file type: ${file.mimetype}. Please upload supported document, image, video, or compressed files.`),
			false
		);
	}
};

const upload = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 100 * 1024 * 1024, // 100MB for video support
		files: 10,
	},
});

// Multiple files upload route - handles both single and multiple files
router.route('/').post(checkPermission(), upload.any(), UploadController.upload);

// Delete file route - deletes file from S3 based on key in request body
router.route('/').delete(checkPermission(), UploadController.deleteFile);

export default router;
