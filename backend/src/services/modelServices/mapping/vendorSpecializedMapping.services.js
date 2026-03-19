import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class VendorSpecializedMappingServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().vendorSpecialized, 'vendorSpecialized');
	}
}

export default new VendorSpecializedMappingServices();
