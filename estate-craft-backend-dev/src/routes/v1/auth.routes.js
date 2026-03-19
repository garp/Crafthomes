import { Router } from 'express';
import Validator from '../../middlewares/validators.middleware.js';
import AuthController from '../../controllers/auth.controller.js';
import {
	loginSchema,
	loginWithOtpSchema,
	refreshAccessTokenSchema,
	createUserSchema,
	forgotPasswordSchema,
	verifyOTPSchema,
	resetPasswordSchema,
} from '../../validators/auth.validators.js';

const router = Router();

router.route('/login').post(Validator.body(loginSchema), AuthController.login);
router.route('/login-with-otp').post(Validator.body(loginWithOtpSchema), AuthController.loginWithOtp);
router.route('/create').post(Validator.body(createUserSchema), AuthController.create);
router.route('/refresh-access-token').post(Validator.body(refreshAccessTokenSchema), AuthController.refreshAccessToken);
router.route('/forget-password').post(Validator.body(forgotPasswordSchema), AuthController.forgotPassword);
router.route('/verify-otp').post(Validator.body(verifyOTPSchema), AuthController.verifyOTP);
router.route('/reset-password').post(Validator.body(resetPasswordSchema), AuthController.resetPassword);
router.route('/resend-otp').post(Validator.body(forgotPasswordSchema), AuthController.resendOTP);
router.route('/otp-by-ref/:ref').get(AuthController.getOtpByRef);

export default router;
