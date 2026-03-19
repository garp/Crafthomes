import { Router } from 'express';
import VendorController from '../../controllers/vender.controller.js';
import {
	getVendorSchema,
	createVendorSchema,
	updateVendorSchema,
	getSpecializedSchema,
	createSpecializedSchema,
	updateSpecializedSchema,
} from '../../validators/vendor.validators.js';
import Validator from '../../middlewares/validators.middleware.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

router
	.route('/')
	.get(checkPermission(), Validator.query(getVendorSchema), VendorController.get)
	.post(checkPermission(), Validator.body(createVendorSchema), VendorController.create);

router
	.route('/specialized')
	.post(checkPermission(), Validator.body(createSpecializedSchema), VendorController.createSpecialized)
	.get(checkPermission(), Validator.query(getSpecializedSchema), VendorController.getSpecialized);

router
	.route('/specialized/:id')
	.put(checkPermission(), Validator.body(updateSpecializedSchema), VendorController.updateSpecialized)
	.delete(checkPermission(), VendorController.deleteSpecialized);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updateVendorSchema), VendorController.update)
	.delete(checkPermission(), VendorController.delete);

export default router;
