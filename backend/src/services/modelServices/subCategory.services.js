import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class SubCategoryServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().subCategory, 'subCategory');
	}
}

export default new SubCategoryServices();
