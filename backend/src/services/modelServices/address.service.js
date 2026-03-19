import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class AddressService extends Dal {
	constructor() {
		super(PrismaService.getInstance().address, 'address');
	}
}

export default new AddressService();
