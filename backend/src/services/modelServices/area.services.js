import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class AreaServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().area, 'area');
	}
}

export default new AreaServices();
