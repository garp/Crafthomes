import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class FolderServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().folder, 'folder');
	}
}

export default new FolderServices();
