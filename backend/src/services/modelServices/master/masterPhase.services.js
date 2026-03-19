import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class MasterPhaseServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().masterPhase, 'masterPhase');
	}
}

export default new MasterPhaseServices();
