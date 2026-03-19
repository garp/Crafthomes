import { Router } from 'express';
import ClientController from '../../controllers/client.controller.js';
import { getClientSchema, createClientSchema, updateClientSchema } from '../../validators/client.validators.js';
import Validator from '../../middlewares/validators.middleware.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import addressRoutes from './address.routes.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createClientSchema), ClientController.create)
	.get(checkPermission(), Validator.query(getClientSchema), ClientController.get);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updateClientSchema), ClientController.update)
	.delete(checkPermission(), ClientController.delete);

router.use('/address', addressRoutes);

export default router;
