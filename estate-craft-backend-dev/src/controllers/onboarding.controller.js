import UserServices from '../services/modelServices/user.services.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';

class OnboardingController {
	details = asyncHandler(async (req, res) => {
		const { userId } = req.params;
		const user = await UserServices.findFirst({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				phoneNumber: true,
				// role: true,
				inviteState: true,
			},
		});
		if (!user) return errorHandler('E-104', res);
		return responseHandler(user, res);
	});

	acceptInvite = asyncHandler(async (req, res) => {
		const { email } = req.body;
		const { userId } = req.params;

		let user = await UserServices.findFirst({
			where: { id: userId },
			select: { id: true, name: true, email: true, phoneNumber: true, inviteState: true },
		});

		if (!user) {
			user = await UserServices.findFirst({ where: { email } });
			if (!user || String(user.id) !== String(userId)) {
				return errorHandler('E-120', res);
			}
		} else if (user.email !== email) {
			return errorHandler('E-120', res);
		}

		if (user.inviteState === 'ACCEPTED' || user.inviteState === 'PASSWORD_ADDED') return errorHandler('E-117', res);
		if (user.inviteState === 'REJECTED') return errorHandler('E-118', res);
		if (user.inviteState === 'COMPLETED') return errorHandler('E-119', res);
		if (user.inviteState !== 'SENT') return errorHandler('E-120', res);

		await UserServices.update({ where: { id: user.id }, data: { inviteState: 'ACCEPTED' } });
		return responseHandler(user, res);
	});

	// rejectInvite = asyncHandler(async (req, res) => {
	//   const { email, reason } = req.body;
	//   const user = await UserServices.findFirst({ where: { email } });
	//   if (!user) return errorHandler('E-104', res);
	//   if (user.inviteState !== 'SENT') return errorHandler('E-120', res);
	//   await UserServices.update({ where: { id: user.id }, data: { inviteState: 'REJECTED', comments: reason } });
	//   return responseHandler(user, res);
	// });

	addPassword = asyncHandler(async (req, res) => {
		const { email, password } = req.body;
		const user = await UserServices.findFirst({ where: { email } });
		if (!user) return errorHandler('E-104', res);
		if (user.inviteState !== 'ACCEPTED') return errorHandler('E-105', res);
		const hashedPassword = await UserServices.encryptPassword(password);
		await UserServices.update({ where: { id: user.id }, data: { inviteState: 'PASSWORD_ADDED', password: hashedPassword } });
		return responseHandler(user, res);
	});
}

export default new OnboardingController();
