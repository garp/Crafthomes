import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class TaskAssigneeServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().taskAssignee, 'taskAssignee');
	}
}

export default new TaskAssigneeServices();
