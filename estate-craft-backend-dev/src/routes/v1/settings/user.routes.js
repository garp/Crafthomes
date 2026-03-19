import { Router } from 'express';
import UsersController from '../../../controllers/settings/users.controller.js';
import Validator from '../../../middlewares/validators.middleware.js';
import { getInternalUserSchema, createInternalUserSchema, updateInternalUserSchema } from '../../../validators/user.validators.js';
import checkPermission from '../../../middlewares/auth.middleware.js';

const router = Router();

router.route('/')
    .get(checkPermission(), Validator.query(getInternalUserSchema), UsersController.get)
    .post(checkPermission(), Validator.body(createInternalUserSchema), UsersController.create);

router.route('/:id')
    .put(checkPermission(), Validator.body(updateInternalUserSchema), UsersController.update)
    .delete(checkPermission(), UsersController.delete);

export default router;
