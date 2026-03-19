import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class MasterItemService extends Dal {
	constructor() {
		super(PrismaService.getInstance().masterItem, 'masterItem');
	}
}

export default new MasterItemService();
