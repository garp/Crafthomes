import UserServices from '../../services/modelServices/user.services.js';
import RoleServices from '../../services/modelServices/roles.services.js';
import EmailService from '../../services/modelServices/email.services.js';
import { asyncHandler, transactionHandler } from '../../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../../utils/responseHandler.js';
import { SERVER } from '../../../config/server.js';

class UsersController {
	get = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 10, status, projectPurpose } = req.query;

		// Always constrain to INTERNAL users
		const where = { userType: 'INTERNAL' };

		// Status filter: default ACTIVE, or ALL / ACTIVE / INACTIVE
		if (status) {
			const normalized = String(status).toUpperCase();
			if (normalized === 'ACTIVE') {
				where.status = 'ACTIVE';
			} else if (normalized === 'INACTIVE') {
				where.status = 'INACTIVE';
			} // 'ALL' => no status condition
		}

		// Filter for project assignment purpose - exclude Founder/Management and Project Manager
		if (projectPurpose === 'true' || projectPurpose === true) {
			where.designation = {
				name: {
					notIn: ['FOUNDER_MANAGEMENT', 'PROJECT_MANAGER'],
				},
			};
		}

		if (id) {
			where.id = id;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		const totalCount = await UserServices.count({ where });
		const users = await UserServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			select: {
				id: true,
				sNo: true,
				name: true,
				email: true,
				phoneNumber: true,
				role: {
					select: {
						id: true,
						name: true,
					},
				},
				// designationId: true,
				designation: {
					select: {
						id: true,
						name: true,
						displayName: true,
						meta: true,
					},
				},
				reportsToId: true,
				ReportsTo: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				profilePhoto: true,
				// location: true,
				startDate: true,
				createdAt: true,
				department: true,
				userType: true,
				inviteState: true,
				status: true,
			},
			orderBy: { createdAt: 'desc' },
		});
		return responseHandler({ users, totalCount }, res);
	});

	create = transactionHandler(async (req, res, _next, tx) => {
		const { userId } = req.user;
		let { email, name, roleId, department, phoneNumber, userType, designationId, reportsToId, profilePhoto } = req.body;

		// Force INTERNAL user type for settings onboarding
		if (userType && userType !== 'INTERNAL') {
			return errorHandler('E-200', res);
		}
		userType = 'INTERNAL';

		// Normalize roleId - treat empty string as undefined
		if (roleId === '' || roleId === null) {
			roleId = undefined;
		}

		// Normalize designationId - treat empty string as null
		if (designationId === '' || designationId === null) {
			designationId = null;
		}

		// Normalize reportsToId - treat empty string as null
		if (reportsToId === '' || reportsToId === null) {
			reportsToId = null;
		}

		// Validation: Check existing email and phone
		const existingEmail = await UserServices.findFirst({ where: { email } }, tx);
		const existingPhoneNumber = await UserServices.findFirst({ where: { phoneNumber } }, tx);
		if (existingEmail) return errorHandler('E-102a', res);
		if (existingPhoneNumber) return errorHandler('E-102b', res);

		// INTERNAL onboarding always requires a valid role
		if (!roleId) return errorHandler('E-200', res);
		const role = await RoleServices.findOne({ where: { id: roleId } }, tx);
		if (!role) return errorHandler('E-200', res);

		// Validate reportsToId if provided
		if (reportsToId) {
			const reportsToUser = await UserServices.findOne({ where: { id: reportsToId } }, tx);
			if (!reportsToUser) return errorHandler('E-104', res);
		}

		const user = await UserServices.create(
			{
				data: {
					email,
					name,
					roleId,
					department,
					phoneNumber,
					userType, // always 'INTERNAL'
					designationId,
					reportsToId,
					profilePhoto: profilePhoto || null,
					inviteState: 'SENT',
					invitedBy: userId,
					organization: SERVER.CLIENT_ORG,
					createdBy: userId,
				},
			},
			tx
		);

		// Prepare response payload
		const responsePayload = {
			user,
			// Email sending is done in the background to avoid blocking
			// the response, so this indicates the invitation has been queued.
			invitationSent: true,
		};

		// Send internal user invitation email in the background
		setImmediate(async () => {
			try {
				const emailResult = await EmailService.sendInternalUserInvitationEmail(
					email,
					name,
					user.id,
					role?.name || 'Team Member'
				);

				if (emailResult && !emailResult.success) {
					console.error('Failed to send INTERNAL user invitation email:', emailResult.error);
				}
			} catch (err) {
				console.error('Unexpected error while sending INTERNAL user invitation email:', err);
			}
		});

		return responseHandler(responsePayload, res);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const data = { ...req.body };

		// Normalize department: allow clearing with '' or null
		if (data.department === '' || data.department === null) {
			data.department = null;
		}

		// Normalize reportsToId: allow clearing with '' or null
		if (data.reportsToId === '' || data.reportsToId === null) {
			data.reportsToId = null;
		}

		// Validate reportsToId if provided and not null
		if (data.reportsToId && data.reportsToId !== null) {
			const reportsToUser = await UserServices.findOne({ where: { id: data.reportsToId } });
			if (!reportsToUser) return errorHandler('E-104', res);
		}

		// Only hash password if non-empty value provided
		if (data.password !== undefined && data.password !== null && data.password !== '') {
			const hashedPassword = await UserServices.encryptPassword(data.password);
			data.password = hashedPassword;
		} else {
			delete data.password;
		}

		const user = await UserServices.update({ where: { id }, data });
		return responseHandler({ user }, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const existingUser = await UserServices.findOne({ where: { id } });
		if (!existingUser) {
			return errorHandler('E-104', res);
		}
		// Always perform a soft delete by setting status to INACTIVE.
		// Previous behavior hard-deleted users when status was already INACTIVE.
		// That logic has been commented out to prevent hard deletes.
		const result = await UserServices.update({
			where: { id },
			data: { status: 'INACTIVE' },
			select: {
				id: true,
				name: true,
				email: true,
				phoneNumber: true,
				roleId: true,
				designationId: true,
				designation: {
					select: {
						id: true,
						name: true,
						displayName: true,
					},
				},
				startDate: true,
				organization: true,
				status: true,
			},
		});

		return responseHandler(result, res);
	});
}

export default new UsersController();
