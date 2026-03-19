import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class PincodeServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().pincode, 'pincode');
	}
}

export default new PincodeServices();
