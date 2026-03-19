import { Router } from 'express';
import multer from 'multer';
import FileManagementController from '../../controllers/fileManagement.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import {
	getRootContentsQuery,
	getFolderContentsQuery,
	getAllFoldersByProjectQuery,
	createFolder,
	uploadFile,
	moveItem,
	deleteItem,
	bulkDeleteItems,
	updateFolder,
	updateFile,
	getFile,
	downloadItems,
} from '../../validators/files.validators.js';

const router = Router();

// Configure multer for memory storage
const upload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: 50 * 1024 * 1024, // 50MB limit
	},
	fileFilter: (req, file, cb) => {
		const allowed = [
			// Documents
			'application/pdf',
			'text/plain',
			'text/csv',
			'application/msword',
			'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			'application/vnd.ms-excel',
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
			'application/vnd.ms-powerpoint',
			'application/vnd.openxmlformats-officedocument.presentationml.presentation',
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
			'video/x-msvideo',
			'video/x-ms-wmv',
			// Compressed
			'application/zip',
			'application/x-zip-compressed',
			'application/x-rar-compressed',
			'application/x-7z-compressed',
			// CAD files
			'application/acad',
			'application/x-acad',
			'application/autocad_dwg',
			'image/vnd.dwg',
			'image/vnd.dxf',
			'application/dxf',
			// Other
			'application/rtf',
			'application/vnd.oasis.opendocument.text',
			'application/vnd.oasis.opendocument.spreadsheet',
		];
		cb(null, allowed.includes(file.mimetype));
	},
});

router
	.route('/')
	.get(checkPermission(), Validator.query(getRootContentsQuery), FileManagementController.getRootContents)
	.delete(checkPermission(), Validator.query(deleteItem), FileManagementController.delete);

router
	.route('/folder/:folderId')
	.get(checkPermission(), Validator.query(getFolderContentsQuery), FileManagementController.getFolderContents)
	.put(checkPermission(), Validator.body(updateFolder), FileManagementController.updateFolder);

router
	.route('/file/:attachmentId')
	.get(checkPermission(), FileManagementController.getFileDetails)
	.put(checkPermission(), Validator.body(updateFile), FileManagementController.updateFile);

router
	.route('/folders')
	.get(checkPermission(), Validator.query(getAllFoldersByProjectQuery), FileManagementController.getAllFoldersByProject);

router.route('/folder').post(checkPermission(), Validator.body(createFolder), FileManagementController.createFolder);

router
	.route('/file')
	.post(checkPermission(), upload.array('files', 10), Validator.body(uploadFile), FileManagementController.uploadFile)
	.get(checkPermission(), Validator.query(getFile), FileManagementController.getFile);

router.route('/move').put(checkPermission(), Validator.body(moveItem), FileManagementController.move);

router.route('/bulk').delete(checkPermission(), Validator.body(bulkDeleteItems), FileManagementController.bulkDelete);

router.route('/download').post(checkPermission(), Validator.body(downloadItems), FileManagementController.download);

export default router;
