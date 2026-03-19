import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class ProjectTypeTaskServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().projectTypeTask, 'projectTypeTask');
	}
}

export default new ProjectTypeTaskServices();
