import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class SidebarServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().sidebar, 'sidebar');
	}
}

export default new SidebarServices();
