import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class SiteVisitGalleryAttachmentServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().siteVisitGalleryAttachment, 'siteVisitGalleryAttachment');
	}
}

export default new SiteVisitGalleryAttachmentServices();
