import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class ProjectTypeMasterPhaseServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().projectTypeMasterPhase, 'projectTypeMasterPhase');
	}
}

export default new ProjectTypeMasterPhaseServices();
