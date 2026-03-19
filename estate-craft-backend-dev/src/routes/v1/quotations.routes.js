import { Router } from 'express';
import QuotationsController from '../../controllers/quotations.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import { createQuotationSchema, updateQuotationSchema, getQuotationSchema } from '../../validators/quotation.validators.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createQuotationSchema), QuotationsController.create)
	.get(checkPermission(), Validator.query(getQuotationSchema), QuotationsController.get);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updateQuotationSchema), QuotationsController.update)
	.delete(checkPermission(), QuotationsController.delete);

export default router;
