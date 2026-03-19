import { Router } from 'express';
import CategoryController from '../../controllers/category.controller.js';
import SubCategoryController from '../../controllers/subCategory.controller.js';
import BrandController from '../../controllers/master/brand.controller.js';
import Validator from '../../middlewares/validators.middleware.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import {
	createCategorySchema,
	createSubCategorySchema,
	updateCategorySchema,
	updateSubCategorySchema,
	createBrandSchema,
	updateBrandSchema,
	getCategorySchema,
	getSubCategorySchema,
	getBrandSchema,
} from '../../validators/category.validators.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createCategorySchema), CategoryController.create)
	.get(checkPermission(), Validator.query(getCategorySchema), CategoryController.get);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updateCategorySchema), CategoryController.update)
	.delete(checkPermission(), CategoryController.delete);

router
	.route('/sub')
	.post(checkPermission(), Validator.body(createSubCategorySchema), SubCategoryController.create)
	.get(checkPermission(), Validator.query(getSubCategorySchema), SubCategoryController.get);

router
	.route('/sub/:subId')
	.put(checkPermission(), Validator.body(updateSubCategorySchema), SubCategoryController.update)
	.delete(checkPermission(), SubCategoryController.delete);

router
	.route('/brand')
	.post(checkPermission(), Validator.body(createBrandSchema), BrandController.create)
	.get(checkPermission(), Validator.query(getBrandSchema), BrandController.get);

router
	.route('/brand/:brandId')
	.put(checkPermission(), Validator.body(updateBrandSchema), BrandController.update)
	.delete(checkPermission(), BrandController.delete);
export default router;
