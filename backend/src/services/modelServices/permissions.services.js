import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class PermissionServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().permission, 'permission');
	}
}

export default new PermissionServices();
