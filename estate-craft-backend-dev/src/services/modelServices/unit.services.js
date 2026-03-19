import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class UnitServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().unit, 'unit');
	}
}

export default new UnitServices();
