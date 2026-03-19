import crypto from 'crypto';
import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class OTPServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().oTP, 'oTP');

		this.generateCode = () => {
			return crypto.randomInt(100000, 999999);
		};

		this.generateIdentifier = () => {
			return crypto.randomUUID();
		};
	}

	async create(data) {
		// Only generate identifier if not provided
		const identifier = data.data?.identifier || this.generateIdentifier();
		const otpData = {
			...data,
			data: {
				...data.data,
				identifier,
				expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
			},
		};
		return super.create(otpData);
	}

	async verifyOtp({ email, code }) {
		try {
			// Find the most recent OTP for this email
			const otpRecord = await this.findFirst({
				where: {
					email,
					code: Number(code),
				},
			});

			if (!otpRecord) {
				return { success: false, message: 'Invalid OTP' };
			}

			// Check if OTP has expired
			if (new Date() > otpRecord.expiresAt) {
				// Delete expired OTP
				await this.delete({
					where: { id: otpRecord.id },
				});
				return { success: false, message: 'OTP expired' };
			}

			// OTP is valid - return identifier and delete the OTP record
			const { identifier } = otpRecord;

			// Delete the OTP record after successful verification to prevent reuse
			await this.delete({
				where: { id: otpRecord.id },
			});

			return {
				success: true,
				identifier,
				message: 'OTP verified successfully',
			};
		} catch (error) {
			console.error('Error verifying OTP:', error);
			return { success: false, message: 'Error verifying OTP' };
		}
	}

	async resendOTP({ email }) {
		try {
			// Find the most recent non-expired OTP for this email
			const existingOTP = await this.findFirst({
				where: {
					email,
					expiresAt: {
						gte: new Date(), // Find non-expired OTPs
					},
				},
				orderBy: {
					createdAt: 'desc',
				},
			});

			// If no existing valid OTP, create a new one
			if (!existingOTP) {
				const newOTP = await this.create({
					data: {
						email,
						code: this.generateCode(),
						resendCount: 1,
					},
				});
				if (!newOTP) {
					return { success: false, message: 'Failed to create OTP' };
				}
				return { success: true, code: newOTP.code, id: newOTP.id };
			}

			// Check if maximum resend attempts (3) have been reached
			if (existingOTP.resendCount >= 3) {
				return { success: false, message: 'Maximum resend attempts reached' };
			}

			// Increment resend count
			const updatedOTP = await this.update({
				where: { id: existingOTP.id },
				data: {
					resendCount: existingOTP.resendCount + 1,
					// Extend expiry time on resend
					expiresAt: new Date(Date.now() + 10 * 60 * 1000),
				},
			});

			if (!updatedOTP) {
				return { success: false, message: 'Failed to resend OTP' };
			}

			return {
				success: true,
				code: updatedOTP.code,
				id: updatedOTP.id,
			};
		} catch (error) {
			console.error('Error resending OTP:', error);
			return { success: false, message: 'Error resending OTP' };
		}
	}

	async storeIdentifier({ email, identifier }) {
		try {
			// Store identifier separately for password reset verification
			// Create a new OTP record with just the identifier (no code needed)
			const identifierRecord = await this.create({
				data: {
					email,
					code: 0, // Placeholder, not used for identifier verification
					identifier,
					resendCount: 0,
				},
			});

			if (!identifierRecord) {
				return { success: false, message: 'Failed to store identifier' };
			}

			return { success: true, message: 'Identifier stored successfully' };
		} catch (error) {
			console.error('Error storing identifier:', error);
			return { success: false, message: 'Error storing identifier' };
		}
	}

	async verifyIdentifier({ email, identifier }) {
		try {
			// Find the identifier record for this email
			const identifierRecord = await this.findFirst({
				where: {
					email,
					identifier,
					code: 0, // Identifier records have code = 0
				},
				orderBy: {
					createdAt: 'desc',
				},
			});

			if (!identifierRecord) {
				return { success: false, message: 'Invalid or expired identifier' };
			}

			// Check if identifier has expired (10 minutes)
			if (new Date() > identifierRecord.expiresAt) {
				// Delete expired identifier
				await this.delete({
					where: { id: identifierRecord.id },
				});
				return { success: false, message: 'Identifier expired' };
			}

			return { success: true, message: 'Identifier verified successfully', recordId: identifierRecord.id };
		} catch (error) {
			console.error('Error verifying identifier:', error);
			return { success: false, message: 'Error verifying identifier' };
		}
	}

	async deleteIdentifier(recordId) {
		try {
			await this.delete({
				where: { id: recordId },
			});
		} catch (error) {
			console.error('Error deleting identifier:', error);
		}
	}

	async deleteExpiredOTPs() {
		try {
			// Clean up expired OTPs
			await this.deleteMany({
				where: {
					expiresAt: {
						lt: new Date(),
					},
				},
			});
		} catch (error) {
			console.error('Error deleting expired OTPs:', error);
		}
	}
}

export default new OTPServices();
