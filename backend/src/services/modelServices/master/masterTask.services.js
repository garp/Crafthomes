import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class MasterTaskServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().masterTask, 'masterTask');
	}
}

export default new MasterTaskServices();
