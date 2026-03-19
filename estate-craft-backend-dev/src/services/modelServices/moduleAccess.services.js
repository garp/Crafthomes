import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class ModuleAccessServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().moduleAccess, 'moduleAccess');
	}
}

export default new ModuleAccessServices();
