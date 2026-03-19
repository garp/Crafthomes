import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class ClientServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().client, 'client');
	}
}

export default new ClientServices();
