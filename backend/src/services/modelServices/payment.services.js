import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class PaymentServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().payment, 'payment');
	}
}

export default new PaymentServices();
