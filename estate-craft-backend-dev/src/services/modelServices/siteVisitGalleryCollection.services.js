import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class SiteVisitGalleryCollectionServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().siteVisitGalleryCollection, 'siteVisitGalleryCollection');
	}
}

export default new SiteVisitGalleryCollectionServices();
