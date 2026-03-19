import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class SnagServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().snag, 'snag');
	}
}

export default new SnagServices();
