import { Router } from 'express';
import SiteVisitController from '../../controllers/siteVisit.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import {
	getSiteVisitSchema,
	createSiteVisitSchema,
	updateSiteVisitSchema,
	createGalleryCollectionSchema,
	updateGalleryCollectionSchema,
	getGalleryCollectionsQuerySchema,
	createGalleryAttachmentSchema,
	updateGalleryAttachmentSchema,
	getGalleryAttachmentsQuerySchema,
} from '../../validators/siteVisit.validators.js';

const router = Router();

router
	.route('/')
	.get(checkPermission(), Validator.query(getSiteVisitSchema), SiteVisitController.get)
	.post(checkPermission(), Validator.body(createSiteVisitSchema), SiteVisitController.create);

// Gallery collections (must be before /:id)
router
	.route('/gallery-collections')
	.get(checkPermission(), Validator.query(getGalleryCollectionsQuerySchema), SiteVisitController.getGalleryCollections)
	.post(checkPermission(), Validator.body(createGalleryCollectionSchema), SiteVisitController.createGalleryCollection);

router
	.route('/gallery-collections/:id')
	.get(checkPermission(), SiteVisitController.getGalleryCollectionById)
	.put(checkPermission(), Validator.body(updateGalleryCollectionSchema), SiteVisitController.updateGalleryCollection)
	.delete(checkPermission(), SiteVisitController.deleteGalleryCollection);

// Gallery attachments
router
	.route('/gallery-attachments')
	.get(checkPermission(), Validator.query(getGalleryAttachmentsQuerySchema), SiteVisitController.getGalleryAttachments)
	.post(checkPermission(), Validator.body(createGalleryAttachmentSchema), SiteVisitController.createGalleryAttachment);

router
	.route('/gallery-attachments/:id')
	.get(checkPermission(), SiteVisitController.getGalleryAttachmentById)
	.put(checkPermission(), Validator.body(updateGalleryAttachmentSchema), SiteVisitController.updateGalleryAttachment)
	.delete(checkPermission(), SiteVisitController.deleteGalleryAttachment);

router
	.route('/:id')
	.get(checkPermission(), SiteVisitController.getById)
	.put(checkPermission(), Validator.body(updateSiteVisitSchema), SiteVisitController.update)
	.delete(checkPermission(), SiteVisitController.delete);

export default router;
