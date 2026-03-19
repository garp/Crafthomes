import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class RoleServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().role, 'role');
	}
}

export default new RoleServices();
