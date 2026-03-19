import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class ProjectTypePhaseRelationServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().projectTypePhaseRelation, 'projectTypePhaseRelation');
	}
}

export default new ProjectTypePhaseRelationServices();
