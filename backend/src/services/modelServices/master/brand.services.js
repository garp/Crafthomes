import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class BrandServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().subCategoryBrand, 'subCategoryBrand');
	}
}

export default new BrandServices();
