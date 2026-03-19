import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class ProjectTypePhaseServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().projectTypePhase, 'projectTypePhase');
	}
}

export default new ProjectTypePhaseServices();
