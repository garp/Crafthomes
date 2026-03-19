import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class AttachmentServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().attachment, 'attachment');
	}
}

export default new AttachmentServices();
