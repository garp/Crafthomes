import { Router } from 'express';
import CommentController from '../../controllers/comment.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import { createCommentSchema, updateCommentSchema, getCommentSchema } from '../../validators/task.validator.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createCommentSchema), CommentController.create)
	.get(checkPermission(), Validator.query(getCommentSchema), CommentController.get);

router
	.route('/:id')
	.put(checkPermission(), Validator.body(updateCommentSchema), CommentController.update)
	.delete(checkPermission(), CommentController.delete);

export default router;
