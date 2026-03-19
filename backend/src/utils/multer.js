import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// File storage config using UUID
const storage = multer.diskStorage({
	destination(req, file, cb) {
		const uploadPath = path.join(dirname, '../../public', 'uploads');
		if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
		cb(null, uploadPath);
	},
	filename(req, file, cb) {
		const ext = path.extname(file.originalname);
		const uuidFileName = `${uuidv4()}${ext}`;
		cb(null, uuidFileName);
	},
});

// Allowed file types
const fileFilter = (req, file, cb) => {
	const allowed = [
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
	cb(null, allowed.includes(file.mimetype));
};

const upload = multer({ storage, fileFilter });

export default upload;
