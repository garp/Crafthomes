import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class DesignationServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().designation, 'designation');
	}
}

export default new DesignationServices();
