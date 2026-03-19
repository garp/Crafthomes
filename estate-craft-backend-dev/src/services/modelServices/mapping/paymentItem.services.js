import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class PaymentItemServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().paymentItem, 'paymentItem');
	}
}

export default new PaymentItemServices();
