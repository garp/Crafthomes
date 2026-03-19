import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class SpecializedServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().specialized, 'specialized');
	}
}

export default new SpecializedServices();
