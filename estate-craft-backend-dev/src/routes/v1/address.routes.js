import { Router } from 'express';
import AddressController from '../../controllers/address.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import { createAddressSchema, getAddressSchema, updateAddressSchema } from '../../validators/address.validators.js';

const router = Router();

router.route('/')
	.post(checkPermission(), Validator.body(createAddressSchema), AddressController.create)
	.get(checkPermission(), Validator.query(getAddressSchema), AddressController.get);

router.route('/:id')
	.put(checkPermission(), Validator.body(updateAddressSchema), AddressController.update)
	.delete(checkPermission(), Validator.params(getAddressSchema), AddressController.delete);

export default router;
