import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class PolicyServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().policy, 'policy');
	}
}

export default new PolicyServices();

