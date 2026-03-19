import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class VendorServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().vendor, 'vendor');
	}
}

export default new VendorServices();
