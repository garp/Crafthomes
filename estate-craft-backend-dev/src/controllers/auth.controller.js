import { asyncHandler } from '../utils/asyncHandler.js';
import { errorHandler, responseHandler } from '../utils/responseHandler.js';
import UserServices from '../services/modelServices/user.services.js';
import RoleServices from '../services/modelServices/roles.services.js';
import EmailService from '../services/modelServices/email.services.js';
import OTPServices from '../services/modelServices/otp.services.js';
import SidebarServices from '../services/modelServices/sidebar.services.js';
import ModuleAccessCacheService from '../services/moduleAccessCache.service.js';

class AuthController {
	login = asyncHandler(async (req, res) => {
		const { email, password } = req.body;
		const user = await UserServices.findFirst({
			where: {
				email: {
					equals: email,
					mode: 'insensitive',
				},
			},
			select: {
				id: true,
				name: true,
				email: true,
				role: {
					select: {
						id: true,
						name: true,
						permissions: true,
					},
				},
				password: true,
				inviteState: true,
				userType: true,
				status: true,
			},
		});
		if (!user) return errorHandler('E-104', res);
		if (user.status !== 'ACTIVE') return errorHandler('E-122', res);
		if (user.password === null) return errorHandler('E-121', res);
		const isPasswordMatch = await UserServices.comparePassword(password, user.password);
		if (!isPasswordMatch) return errorHandler('E-101', res);
		const accessToken = UserServices.generateAccessToken(user.id);
		const refreshToken = UserServices.generateRefreshToken(user.id);
		const userUpdateData = {
			refreshToken: refreshToken.token,
			refreshTokenExpiresAt: refreshToken.expirationDate,
		};
		if (user.inviteState === 'PASSWORD_ADDED') {
			userUpdateData.inviteState = 'COMPLETED';
		}
		await UserServices.update({
			where: { id: user.id },
			data: userUpdateData,
		});

		// Fetch role-based sidebar configuration for the logged-in user (if available)
		let sidebar = null;
		if (user.role?.id) {
			const sidebarConfig = await SidebarServices.findFirst({
				where: {
					roleId: user.role.id,
					status: 'ACTIVE',
				},
				select: {
					options: true,
				},
			});
			if (sidebarConfig?.options) {
				sidebar = sidebarConfig.options;
			}
		}

		// Fetch module access for the role (Redis-cached)
		let moduleAccess = [];
		if (user.role?.id) {
			moduleAccess = await ModuleAccessCacheService.getModuleAccess(user.role.id);
		}

		return responseHandler(
			{
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
				},
				sidebar,
				moduleAccess,
				accessToken: accessToken.token,
				refreshToken: refreshToken.token,
			},
			res
		);
	});

	loginWithOtp = asyncHandler(async (req, res) => {
		const { email } = req.body;

		const user = await UserServices.findFirst({
			where: {
				email: {
					equals: email,
					mode: 'insensitive',
				},
			},
			select: {
				id: true,
				name: true,
				email: true,
				status: true,
			},
		});
		if (!user) return errorHandler('E-104', res);
		if (user.status !== 'ACTIVE') return errorHandler('E-122', res);

		// Check for existing non-expired OTP (resend flow)
		const existingOTP = await OTPServices.findFirst({
			where: {
				email: user.email,
				expiresAt: { gte: new Date() },
				code: { not: 0 },
			},
			orderBy: { createdAt: 'desc' },
		});

		let OTP;
		let isResend = false;

		if (existingOTP) {
			const resendResult = await OTPServices.resendOTP({ email: user.email });
			if (!resendResult.success) {
				if (resendResult.message === 'Maximum resend attempts reached') return errorHandler('E-114', res);
				return errorHandler('E-112', res);
			}
			OTP = { code: resendResult.code, id: resendResult.id };
			isResend = true;
		} else {
			const otpRecord = await OTPServices.create({
				data: {
					email: user.email,
					code: OTPServices.generateCode(),
					resendCount: 1,
				},
			});
			if (!otpRecord) return errorHandler('E-112', res);
			OTP = otpRecord;
		}

		const emailResult = await EmailService.sendOTPEmail(user.email, OTP.code, user.name, {
			otpRef: OTP.id,
			purpose: 'login',
		});
		if (!emailResult.success) return errorHandler('E-112', res);

		return responseHandler(
			{ message: isResend ? 'OTP resent to your email' : 'OTP sent to your email' },
			res
		);
	})

	refreshAccessToken = asyncHandler(async (req, res) => {
		const { refreshToken } = req.body;
		const decoded = UserServices.verifyRefreshToken(refreshToken);
		if (!decoded) return errorHandler('E-103', res);
		const { userId } = decoded;
		const user = await UserServices.findFirst({ where: { id: userId } });
		if (!user) return errorHandler('E-104', res);
		const accessToken = UserServices.generateAccessToken(user.id);
		return responseHandler({ accessToken }, res);
	});

	create = asyncHandler(async (req, res) => {
		const { email, password, name, roleId, designation, location, department, startDate, lastActive, organization, phoneNumber } =
			req.body;
		const existingUser = await UserServices.findFirst({ where: { email } });
		if (existingUser) return errorHandler('E-102', res);

		const role = await RoleServices.findOne({
			where: {
				id: roleId,
			},
		});
		if (!role) return errorHandler('E-200', res);

		const hashedPassword = await UserServices.encryptPassword(password);
		const user = await UserServices.create({
			data: {
				email,
				password: hashedPassword,
				name,
				roleId,
				designation,
				location,
				department,
				startDate,
				lastActive,
				organization,
				phoneNumber,
			},
		});

		return responseHandler({ user }, res);
	});

	forgotPassword = asyncHandler(async (req, res) => {
		const { email } = req.body;

		// Find user by email
		const user = await UserServices.findFirst({
			where: {
				email: {
					equals: email,
					mode: 'insensitive',
				},
			},
			select: {
				id: true,
				name: true,
				email: true,
			},
		});

		if (!user) return errorHandler('E-104', res);

		// Check if there's an existing non-expired OTP
		const existingOTP = await OTPServices.findFirst({
			where: {
				email: user.email,
				expiresAt: {
					gte: new Date(), // Find non-expired OTPs
				},
				code: {
					not: 0, // Exclude identifier records
				},
			},
			orderBy: {
				createdAt: 'desc',
			},
		});

		let OTP;
		let isResend = false;

		if (existingOTP) {
			// There's already a valid OTP, treat this as a resend
			const resendResult = await OTPServices.resendOTP({ email: user.email });
			if (!resendResult.success) {
				if (resendResult.message === 'Maximum resend attempts reached') {
					return errorHandler('E-114', res);
				}
				return errorHandler('E-112', res);
			}
			OTP = { code: resendResult.code, id: resendResult.id };
			isResend = true;
		} else {
			// Create new OTP
			const code = OTPServices.generateCode();
			OTP = await OTPServices.create({
				data: {
					email: user.email,
					code,
					resendCount: 1,
				},
			});

			if (!OTP) return errorHandler('E-112', res);
		}

		const emailResult = await EmailService.sendOTPEmail(user.email, OTP.code, user.name, {
			otpRef: OTP.id,
		});
		if (!emailResult.success) return errorHandler('E-112', res);

		return responseHandler(
			{ message: isResend ? 'OTP resent to your email' : 'OTP sent to your email' },
			res
		);
	});

	verifyOTP = asyncHandler(async (req, res) => {
		const { email, code, purpose } = req.body;

		const user = await UserServices.findFirst({
			where: {
				email: {
					equals: email,
					mode: 'insensitive',
				},
			},
			select: {
				id: true,
				name: true,
				email: true,
				status: true,
				role: {
					select: {
						id: true,
						name: true,
						permissions: true,
					},
				},
			},
		});

		if (!user) return errorHandler('E-104', res);

		// Use canonical email from DB so OTP lookup matches (case-insensitive flow)
		const verificationResult = await OTPServices.verifyOtp({
			email: user.email,
			code: Number(code),
		});

		if (!verificationResult.success) {
			if (verificationResult.message === 'OTP expired') return errorHandler('E-111', res);
			return errorHandler('E-110', res);
		}

		// Login flow: issue tokens and return user/sidebar/moduleAccess
		if (purpose === 'login') {
			if (user.status !== 'ACTIVE') return errorHandler('E-122', res);

			const accessToken = UserServices.generateAccessToken(user.id);
			const refreshToken = UserServices.generateRefreshToken(user.id);
			await UserServices.update({
				where: { id: user.id },
				data: {
					refreshToken: refreshToken.token,
					refreshTokenExpiresAt: refreshToken.expirationDate,
				},
			});

			let sidebar = null;
			if (user.role?.id) {
				const sidebarConfig = await SidebarServices.findFirst({
					where: { roleId: user.role.id, status: 'ACTIVE' },
					select: { options: true },
				});
				if (sidebarConfig?.options) sidebar = sidebarConfig.options;
			}

			let moduleAccess = [];
			if (user.role?.id) {
				moduleAccess = await ModuleAccessCacheService.getModuleAccess(user.role.id);
			}

			return responseHandler(
				{
					user: {
						id: user.id,
						name: user.name,
						email: user.email,
						role: user.role,
					},
					sidebar,
					moduleAccess,
					accessToken: accessToken.token,
					refreshToken: refreshToken.token,
				},
				res
			);
		}

		// Forgot-password flow: store identifier and return it for reset
		const { identifier } = verificationResult;
		const storeResult = await OTPServices.storeIdentifier({
			email: user.email,
			identifier,
		});
		if (!storeResult.success) return errorHandler('E-112', res);

		return responseHandler(
			{
				verified: true,
				identifier,
				message: 'OTP verified successfully. Use this identifier to reset your password.',
			},
			res
		);
	});

	resendOTP = asyncHandler(async (req, res) => {
		const { email } = req.body;

		// Find user by email
		const user = await UserServices.findFirst({
			where: {
				email: {
					equals: email,
					mode: 'insensitive',
				},
			},
			select: {
				id: true,
				name: true,
				email: true,
			},
		});

		if (!user) return errorHandler('E-104', res);

		const resendResult = await OTPServices.resendOTP({ email: user.email });
		if (!resendResult.success) {
			if (resendResult.message === 'Maximum resend attempts reached') return errorHandler('E-114', res);
			return errorHandler('E-112', res);
		}

		const emailResult = await EmailService.sendOTPEmail(user.email, resendResult.code, user.name, {
			otpRef: resendResult.id,
		});
		if (!emailResult.success) return errorHandler('E-112', res);

		return responseHandler({ message: 'OTP resent successfully' }, res);
	});

	getOtpByRef = asyncHandler(async (req, res) => {
		const { ref } = req.params;
		if (!ref) return errorHandler('E-110', res);

		const otpRecord = await OTPServices.findFirst({
			where: { id: ref },
			select: { code: true, expiresAt: true },
		});
		if (!otpRecord) return errorHandler('E-110', res);
		if (new Date() > otpRecord.expiresAt) return errorHandler('E-111', res);

		return responseHandler({ code: otpRecord.code }, res);
	});

	resetPassword = asyncHandler(async (req, res) => {
		const { email, identifier, newPassword } = req.body;

		// Find user by email
		const user = await UserServices.findFirst({
			where: {
				email: {
					equals: email,
					mode: 'insensitive',
				},
			},
			select: {
				id: true,
				name: true,
				email: true,
				password: true,
			},
		});

		if (!user) return errorHandler('E-104', res);

		// Verify identifier using OTPServices
		const verificationResult = await OTPServices.verifyIdentifier({
			email,
			identifier,
		});

		if (!verificationResult.success) {
			if (verificationResult.message === 'Invalid or expired identifier') {
				return errorHandler('E-110', res);
			}
			if (verificationResult.message === 'Identifier expired') {
				return errorHandler('E-111', res);
			}
			return errorHandler('E-110', res);
		}

		// Check if new password is same as old password
		const isSamePassword = await UserServices.comparePassword(newPassword, user.password);
		if (isSamePassword) return errorHandler('E-108', res);

		// Reset password
		await UserServices.resetPassword(user.id, newPassword);

		// Delete the identifier record to prevent reuse
		if (verificationResult.recordId) {
			await OTPServices.deleteIdentifier(verificationResult.recordId);
		}

		// Send password reset confirmation email
		await EmailService.sendPasswordResetConfirmationEmail(user.email, user.name);

		return responseHandler({ message: 'Password reset successful' }, res);
	});
}

export default new AuthController();
