import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class AssignUserServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().assignUser, 'assignUser');
	}
}

export default new AssignUserServices();

