import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class DeliverableServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().deliverable, 'deliverable');
	}
}

export default new DeliverableServices();
