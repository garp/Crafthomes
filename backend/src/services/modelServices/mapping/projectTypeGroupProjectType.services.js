import PrismaService from '../../databaseServices/db.js';
import Dal from '../../databaseServices/dal.js';

class ProjectTypeGroupProjectTypeServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().projectTypeGroupProjectType, 'projectTypeGroupProjectType');
	}
}

export default new ProjectTypeGroupProjectTypeServices();
