import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class MOMServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().mOM, 'mOM');
	}
}

export default new MOMServices();
