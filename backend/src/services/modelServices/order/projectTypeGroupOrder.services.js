import PrismaService from '../../databaseServices/db.js';
import Dal from '../../databaseServices/dal.js';

class ProjectTypeGroupOrderServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().projectTypeGroupOrder, 'projectTypeGroupOrder');
	}
}

export default new ProjectTypeGroupOrderServices();
