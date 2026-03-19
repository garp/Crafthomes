import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class SiteVisitServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().siteVisit, 'siteVisit');
	}
}

export default new SiteVisitServices();
