import PrismaService from '../../databaseServices/db.js';
import Dal from '../../databaseServices/dal.js';

class SnagMasterItemServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().snagMasterItem, 'snagMasterItem');
	}
}

export default new SnagMasterItemServices();
