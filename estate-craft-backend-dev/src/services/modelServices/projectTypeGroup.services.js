import PrismaService from '../databaseServices/db.js';
import Dal from '../databaseServices/dal.js';

class ProjectTypeGroupServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().projectTypeGroup, 'projectTypeGroup');
	}
}

export default new ProjectTypeGroupServices();
