import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class MasterPhaseMasterTaskServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().masterPhaseMasterTask, 'masterPhaseMasterTask');
	}
}

export default new MasterPhaseMasterTaskServices();
