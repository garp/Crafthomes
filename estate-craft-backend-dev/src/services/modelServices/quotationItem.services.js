import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class QuotationItemServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().quotationItem, 'quotationItem');
	}
}

export default new QuotationItemServices();
