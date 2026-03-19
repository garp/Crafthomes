import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class TaskPredecessorServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().taskPredecessor, 'taskPredecessor');
	}
}

export default new TaskPredecessorServices();
