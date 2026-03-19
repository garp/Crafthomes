import { Router } from 'express';
import PaymentController from '../../controllers/payment.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import { createPaymentSchema, getPaymentSchema, updatePaymentSchema } from '../../validators/payment.validator.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createPaymentSchema), PaymentController.create)
	.get(checkPermission(), Validator.query(getPaymentSchema), PaymentController.get);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updatePaymentSchema), PaymentController.update)
	.delete(checkPermission(), PaymentController.delete);

export default router;
