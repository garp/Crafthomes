import express from 'express';
import AreaController from '../../controllers/area.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import {
	createAreaSchema,
	updateAreaSchema,
	getAreaSchema,
} from '../../validators/area.validators.js';

const router = express.Router();

router.post('/', checkPermission(), Validator.body(createAreaSchema), AreaController.create);
router.get('/', checkPermission(), Validator.query(getAreaSchema), AreaController.get);
router.put('/:id', checkPermission(), Validator.body(updateAreaSchema), AreaController.update);
router.delete('/:id', checkPermission(), AreaController.delete);

export default router;
