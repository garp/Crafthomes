import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import PrismaService from '../databaseServices/db.js';
import Dal from '../databaseServices/dal.js';
import { JWT, PASSWORD } from '../../../config/server.js';

class UserServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().user, 'user');

		this.encryptPassword = async password => {
			return bcrypt.hash(password, PASSWORD.ROUND);
		};

		this.comparePassword = async (passwordToCheck, userPassword) => {
			return bcrypt.compare(passwordToCheck, userPassword);
		};

		this.generateAccessToken = id => {
			const token = jwt.sign(
				{
					id,
				},
				JWT.ACCESS_SECRET,
				{ expiresIn: JWT.ACCESS_EXPIRATION }
			);
			const expirationDate = new Date();
			expirationDate.setSeconds(expirationDate.getSeconds() + JWT.ACCESS_EXPIRATION_IN_SECONDS);
			return { token, expirationDate };
		};

		this.generateRefreshToken = id => {
			const token = jwt.sign({ id }, JWT.REFRESH_SECRET, { expiresIn: JWT.REFRESH_EXPIRATION });
			const expirationDate = new Date();
			expirationDate.setSeconds(expirationDate.getSeconds() + JWT.REFRESH_EXPIRATION_IN_SECONDS);
			return { token, expirationDate };
		};

		this.verifyAccessToken = async token => {
			try {
				const decoded = jwt.verify(token, JWT.ACCESS_SECRET);
				if (!decoded?.id) {
					return false;
				}
				return decoded;
			} catch (error) {
				console.error('Token verification failed:', error.message);
				return false;
			}
		};

		this.verifyRefreshToken = async token => {
			try {
				const decoded = jwt.verify(token, JWT.REFRESH_SECRET);
				return decoded;
			} catch (error) {
				console.error('Token verification failed:', error.message);
				return false;
			}
		};

		this.generateOTP = () => {
			// Generate a 6-digit OTP
			return crypto.randomInt(100000, 999999).toString();
		};

		this.saveOTP = async (userId, otp) => {
			const otpExpiresAt = new Date();
			// Set expiration time (default 15 minutes)
			otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + PASSWORD.FORGET_PASSWORD_EXPIRATION);

			return this.update({
				where: { id: userId },
				data: {
					otp,
					otpExpiresAt,
				},
			});
		};

		this.verifyOTP = async (userId, otp) => {
			const user = await this.findFirst({
				where: { id: userId },
				select: {
					otp: true,
					otpExpiresAt: true,
				},
			});

			if (!user || !user.otp || !user.otpExpiresAt) {
				return { valid: false, reason: 'no_otp_found' };
			}

			if (user.otp !== otp) {
				return { valid: false, reason: 'invalid_otp' };
			}

			if (new Date() > new Date(user.otpExpiresAt)) {
				return { valid: false, reason: 'expired_otp' };
			}

			return { valid: true };
		};

		this.resetPassword = async (userId, newPassword) => {
			const hashedPassword = await this.encryptPassword(newPassword);

			return this.update({
				where: { id: userId },
				data: {
					password: hashedPassword,
					otp: null,
					otpExpiresAt: null,
				},
			});
		};
	}
}

export default new UserServices();
