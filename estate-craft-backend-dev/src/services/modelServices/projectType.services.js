import PrismaService from '../databaseServices/db.js';
import Dal from '../databaseServices/dal.js';

class ProjectTypeServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().projectType, 'projectType');
	}
}

export default new ProjectTypeServices();
