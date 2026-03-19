import { Router } from 'express';
import Validator from '../../middlewares/validators.middleware.js';
import UserController from '../../controllers/user.controller.js';
import {
	createSchema,
	updateSchema,
	getUserSchema,
	acceptInviteSchema,
	rejectInviteSchema,
	addPasswordSchema,
} from '../../validators/user.validators.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import addressRoutes from './address.routes.js';
import OnboardingController from '../../controllers/onboarding.controller.js';

const router = Router();

router
	.route('/')
	.post(Validator.body(createSchema), checkPermission(), UserController.create)
	.get(checkPermission(), Validator.query(getUserSchema), UserController.get);

router
	.route('/:id')
	.put(Validator.body(updateSchema), checkPermission(), UserController.update)
	.delete(checkPermission(), UserController.delete);

router.route('/me').get(checkPermission(), UserController.me);

router.use('/address', addressRoutes);

router
	.route('/onboarding/:userId')
	.get(OnboardingController.details)
	.post(Validator.body(acceptInviteSchema), OnboardingController.acceptInvite)
	// .delete(Validator.body(rejectInviteSchema), OnboardingController.rejectInvite)
	.put(Validator.body(addPasswordSchema), OnboardingController.addPassword);

export default router;
