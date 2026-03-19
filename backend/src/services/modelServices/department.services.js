import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class DepartmentServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().department, 'department');
	}
}

export default new DepartmentServices();
