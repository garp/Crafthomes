import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class SubTaskServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().subTask, 'subTask');
	}
}

export default new SubTaskServices();
