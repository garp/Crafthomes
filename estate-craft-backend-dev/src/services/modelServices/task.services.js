import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class TaskServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().task, 'task');
	}
}

export default new TaskServices();
