import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class PhaseServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().phase, 'phase');
	}
}

export default new PhaseServices();
