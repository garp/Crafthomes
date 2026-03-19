import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class ProjectUserServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().projectUser, 'projectUser');
	}
}

export default new ProjectUserServices();
