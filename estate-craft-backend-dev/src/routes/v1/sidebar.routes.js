import { Router } from 'express';
import SidebarController from '../../controllers/sidebar.controller.js';
import { getSidebarSchema, createSidebarSchema, updateSidebarSchema } from '../../validators/sidebar.validators.js';
import Validator from '../../middlewares/validators.middleware.js';
import checkPermission from '../../middlewares/auth.middleware.js';

const router = Router();

router
	.route('/')
	.get(checkPermission(), Validator.query(getSidebarSchema), SidebarController.get)
	.post(checkPermission(), Validator.body(createSidebarSchema), SidebarController.create);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updateSidebarSchema), SidebarController.update)
	.delete(checkPermission(), SidebarController.delete);

export default router;
