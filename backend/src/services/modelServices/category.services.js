import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class CategoryServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().category, 'category');
	}
}

export default new CategoryServices();
