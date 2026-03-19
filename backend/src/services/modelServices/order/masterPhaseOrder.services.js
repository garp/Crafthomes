import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class MasterPhaseOrderServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().masterPhaseOrder, 'masterPhaseOrder');
	}
}

export default new MasterPhaseOrderServices();
