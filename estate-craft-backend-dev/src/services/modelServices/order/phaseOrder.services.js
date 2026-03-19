import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class PhaseOrderServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().phaseOrder, 'phaseOrder');
	}
}

export default new PhaseOrderServices();
