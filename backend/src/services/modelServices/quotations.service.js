import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class QuotationsService extends Dal {
	constructor() {
		super(PrismaService.getInstance().quotation, 'quotation');
	}
}

export default new QuotationsService();
