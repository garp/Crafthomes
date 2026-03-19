import { asyncHandler, transactionHandler } from '../utils/asyncHandler.js';
import { errorHandler, responseHandler } from '../utils/responseHandler.js';
import UserServices from '../services/modelServices/user.services.js';
import RoleServices from '../services/modelServices/roles.services.js';
import EmailService from '../services/modelServices/email.services.js';
import ClientServices from '../services/modelServices/client.services.js';
import VendorServices from '../services/modelServices/vendor.services.js';

class UserController {
	create = transactionHandler(async (req, res, _, tx) => {
		const { userId, userType: loggedInUserType } = req.user;
		let {
			email,
			name,
			roleId,
			designationId,
			location,
			phoneNumber,
			department,
			userType,
			clientId: reqClientId,
			vendorId: reqVendorId,
		} = req.body;

		// Normalize roleId - treat empty string as undefined
		if (roleId === '' || roleId === null) {
			roleId = undefined;
		}

		// Fallback: If userType is missing but clientId or vendorId is provided, auto-set userType
		if (!userType && loggedInUserType === 'INTERNAL') {
			if (reqClientId && reqClientId !== '' && reqClientId !== null) {
				userType = 'CLIENT_CONTACT';
			} else if (reqVendorId && reqVendorId !== '' && reqVendorId !== null) {
				userType = 'VENDOR_CONTACT';
			}
		}

		// Validation: Check existing email and phone
		const existingEmail = await UserServices.findFirst({ where: { email } }, tx);
		const existingPhoneNumber = await UserServices.findFirst({ where: { phoneNumber } }, tx);
		if (existingEmail) return errorHandler('E-102a', res);
		if (existingPhoneNumber) return errorHandler('E-102b', res);

		// Determine userType and roleId
		let newUserType;
		let finalRoleId;
		let clientId = null;
		let vendorId = null;
		// For INTERNAL users, capture role name once so we can
		// send the email later without additional DB calls.
		let internalRoleNameForEmail = null;

		if (['CLIENT', 'CLIENT_CONTACT'].includes(loggedInUserType)) {
			newUserType = 'CLIENT_CONTACT';

			// Get logged-in user's clientId for the new user
			const loggedInUser = await UserServices.findOne(
				{
					where: { id: userId },
					select: { roleId: true, clientId: true },
				},
				tx
			);
			// CLIENT_CONTACT users share the same clientId (no unique constraint)
			clientId = loggedInUser.clientId;

			if (roleId) {
				// Use provided roleId from req.body
				finalRoleId = roleId;
				const role = await RoleServices.findOne({ where: { id: finalRoleId } }, tx);
				if (!role) return errorHandler('E-200', res);
			} else {
				// No roleId provided, determine based on creator's role
				if (loggedInUserType === 'CLIENT') {
					// Creator is CLIENT → find "client_contact" role
					const clientContactRole = await RoleServices.findFirst(
						{
							where: { name: 'client_contact' },
						},
						tx
					);
					if (!clientContactRole) {
						return errorHandler('E-200', res); // Role "client_contact" not found
					}
					finalRoleId = clientContactRole.id;
				} else {
					// Creator is CLIENT_CONTACT → use creator's roleId
					finalRoleId = loggedInUser.roleId;
				}
			}
		} else if (['VENDOR', 'VENDOR_CONTACT'].includes(loggedInUserType)) {
			newUserType = 'VENDOR_CONTACT';

			// Get logged-in user's vendorId for the new user
			const loggedInUser = await UserServices.findOne(
				{
					where: { id: userId },
					select: { roleId: true, vendorId: true },
				},
				tx
			);
			// VENDOR_CONTACT users share the same vendorId (no unique constraint)
			vendorId = loggedInUser.vendorId;

			if (roleId) {
				// Use provided roleId from req.body
				finalRoleId = roleId;
				const role = await RoleServices.findOne({ where: { id: finalRoleId } }, tx);
				if (!role) return errorHandler('E-200', res);
			} else {
				// No roleId provided, determine based on creator's role
				if (loggedInUserType === 'VENDOR') {
					// Creator is VENDOR → find "vendor_contact" role
					const vendorContactRole = await RoleServices.findFirst(
						{
							where: { name: 'vendor_contact' },
						},
						tx
					);
					if (!vendorContactRole) {
						return errorHandler('E-200', res); // Role "vendor_contact" not found
					}
					finalRoleId = vendorContactRole.id;
				} else {
					// Creator is VENDOR_CONTACT → use creator's roleId
					finalRoleId = loggedInUser.roleId;
				}
			}
		} else {
			// INTERNAL user (including super_admin) creation
			newUserType = userType || 'INTERNAL';
			finalRoleId = roleId; // Use roleId from req.body

			// Prevent direct creation of CLIENT and VENDOR users through user controller
			if (newUserType === 'CLIENT') {
				return errorHandler('E-303', res); // Use /api/v1/client endpoint to create CLIENT users
			}
			if (newUserType === 'VENDOR') {
				return errorHandler('E-703', res); // Use /api/v1/vendor endpoint to create VENDOR users
			}

			// Handle CLIENT_CONTACT creation
			if (newUserType === 'CLIENT_CONTACT') {
				clientId = reqClientId || null;
				vendorId = null;

				// Validate clientId exists if provided
				if (clientId) {
					const client = await tx.client.findUnique({ where: { id: clientId } });
					if (!client) return errorHandler('E-301', res); // Client not found
				}

				// clientId is recommended but not required for CLIENT_CONTACT
				// They can be created and assigned to a client later
			} else if (newUserType === 'VENDOR_CONTACT') {
				// VENDOR_CONTACT users can have vendorId (same as CLIENT_CONTACT with clientId)
				vendorId = reqVendorId || null;
				clientId = null;

				// Validate vendorId exists if provided
				if (vendorId) {
					const vendor = await tx.vendor.findUnique({ where: { id: vendorId } });
					if (!vendor) return errorHandler('E-701', res); // Vendor not found
				}

				// vendorId is recommended but not required for VENDOR_CONTACT
				// They can be created and assigned to a vendor later
			} else {
				// INTERNAL user type
				clientId = null;
				vendorId = null;
			}

			// Validate role exists
			if (!finalRoleId) return errorHandler('E-200', res);
			const role = await RoleServices.findOne({ where: { id: finalRoleId } }, tx);
			if (!role) return errorHandler('E-200', res);
			internalRoleNameForEmail = role.name || null;
		}

		const user = await UserServices.create(
			{
				data: {
					email,
					name,
					roleId: finalRoleId,
					designationId: designationId || null,
					location,
					phoneNumber,
					department,
					userType: newUserType,
					inviteState: 'SENT',
					invitedBy: userId,
					clientId,
					vendorId,
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

		// Send invitation email based on user type in the background
		setImmediate(async () => {
			try {
				let emailResult;

				if (newUserType === 'INTERNAL') {
					emailResult = await EmailService.sendInternalUserInvitationEmail(
						email,
						name,
						user.id,
						internalRoleNameForEmail || 'Team Member'
					);
				} else if (newUserType === 'CLIENT' || newUserType === 'CLIENT_CONTACT') {
					emailResult = await EmailService.sendClientContactInvitationEmail(email, name, user.id);
				} else if (newUserType === 'VENDOR' || newUserType === 'VENDOR_CONTACT') {
					emailResult = await EmailService.sendVendorContactInvitationEmail(email, name, user.id);
				}

				if (emailResult && !emailResult.success) {
					console.error(`Failed to send ${newUserType} invitation email:`, emailResult.error);
				}
			} catch (err) {
				console.error(`Unexpected error while sending ${newUserType} invitation email:`, err);
			}
		});

		return responseHandler(responsePayload, res);
	});

	get = asyncHandler(async (req, res) => {
		const { user } = req;
		const {
			type,
			search,
			pageNo = 0,
			pageLimit = 10,
			searchText,
			id,
			inviteState,
			clientId,
			vendorId,
			userType,
			filterBy,
			status,
			sortType = 'createdAt',
			sortOrder = -1,
			designationId,
		} = req.query;

		const validFields = ['name', 'email', 'designationId', 'organization', 'department', 'phoneNumber', 'status'];

		const where = {};

		// Status filter: active (default), inactive, all
		if (status) {
			const normalizedStatus = String(status).toLowerCase();
			if (normalizedStatus === 'active') {
				where.status = 'ACTIVE';
			} else if (normalizedStatus === 'inactive') {
				where.status = 'INACTIVE';
			} // 'all' => no status condition
		}
		if (designationId) {
			where.designationId = designationId;
		}

		if (inviteState) {
			where.inviteState = inviteState;
		}

		// SUPER_ADMIN and INTERNAL users can use advanced filters
		if (user.userType === 'INTERNAL' || user.role?.name === 'super_admin') {
			// Filter 1: Get all users of a specific client (by clientId)
			// This includes the main CLIENT and all CLIENT_CONTACT users with that clientId
			if (clientId) {
				where.clientId = clientId;
			}
			// Filter 2: Get all users of a specific vendor (by vendorId)
			// This includes the main VENDOR and all VENDOR_CONTACT users with that vendorId
			else if (vendorId) {
				where.vendorId = vendorId;
			}
			// Filter 3: Filter by user type category (client or vendor)
			else if (filterBy === 'client' || filterBy === 'vendor') {
				if (filterBy === 'client') {
					where.userType = { in: ['CLIENT', 'CLIENT_CONTACT'] };
				} else if (filterBy === 'vendor') {
					where.userType = { in: ['VENDOR', 'VENDOR_CONTACT'] };
				}
			}
			// Filter 4: Filter by specific userType if provided
			// (also allow narrowing even when filterBy/clientId/vendorId is present)
			if (userType) {
				where.userType = userType;
			}
			// No filters: show all users
		}
		// CLIENT and CLIENT_CONTACT users: see only their organization's users
		else if (user.userType === 'CLIENT' || user.userType === 'CLIENT_CONTACT') {
			// Get the logged-in user's details
			const loggedInUser = await UserServices.findOne({
				where: { id: user.userId },
				select: { id: true, clientId: true, userType: true },
			});

			// Filter by clientId - all CLIENT and CLIENT_CONTACT users share the same clientId
			if (loggedInUser.clientId) {
				where.clientId = loggedInUser.clientId;
			}

			// If the logged-in user is a CLIENT_CONTACT, restrict list to CLIENT_CONTACT only
			if (loggedInUser.userType === 'CLIENT_CONTACT') {
				where.userType = 'CLIENT_CONTACT';
			}
			// If CLIENT is requesting explicitly, allow narrowing within org scope
			else if (userType && ['CLIENT', 'CLIENT_CONTACT'].includes(userType)) {
				where.userType = userType;
			}
		}
		// VENDOR and VENDOR_CONTACT users: see only their organization's users
		else if (user.userType === 'VENDOR' || user.userType === 'VENDOR_CONTACT') {
			// Get the logged-in user's details
			const loggedInUser = await UserServices.findOne({
				where: { id: user.userId },
				select: { id: true, vendorId: true, userType: true },
			});

			// Filter by vendorId - all VENDOR and VENDOR_CONTACT users share the same vendorId
			if (loggedInUser.vendorId) {
				where.vendorId = loggedInUser.vendorId;
			}

			// If the logged-in user is a VENDOR_CONTACT, restrict list to VENDOR_CONTACT only
			if (loggedInUser.userType === 'VENDOR_CONTACT') {
				where.userType = 'VENDOR_CONTACT';
			}
			// If VENDOR is requesting explicitly, allow narrowing within org scope
			else if (userType && ['VENDOR', 'VENDOR_CONTACT'].includes(userType)) {
				where.userType = userType;
			}
		}

		// By default, do not return INTERNAL users in the list response
		// (unless a specific userType filter has already been applied above)
		if (!where.userType) {
			where.userType = { not: 'INTERNAL' };
		}

		if (id) {
			where.id = id;
		}

		if (search && type) {
			if (validFields.includes(type)) {
				if (['designationId', 'status'].includes(type)) {
					where[type] = { equals: search };
				} else {
					where[type] = { contains: search, mode: 'insensitive' };
				}
			}
		}

		if (searchText || search) {
			if (!where.AND) {
				where.AND = [];
			}
			where.AND.push({
				OR: [
					{ name: { contains: String(searchText || search), mode: 'insensitive' } },
					{ email: { contains: String(searchText || search), mode: 'insensitive' } },
					{ phoneNumber: { contains: String(searchText || search), mode: 'insensitive' } },
					{ organization: { contains: String(searchText || search), mode: 'insensitive' } },
					{ department: { contains: String(searchText || search), mode: 'insensitive' } },
				],
			});
		}

		const pn = Math.max(0, pageNo || 0);
		const limit = Math.min(100, Math.max(1, pageLimit || 10));
		const skip = pn * limit;
		const take = limit;

		const totalCount = await UserServices.count({ where });
		const users = await UserServices.findMany({
			where,
			skip,
			take,
			select: {
				id: true,
				name: true,
				email: true,
				designationId: true,
				designation: {
					select: {
						id: true,
						name: true,
						displayName: true,
					},
				},
				organization: true,
				department: true,
				phoneNumber: true,
				// clientId: true,
				client: {
					select: {
						id: true,
						name: true,
					},
				},
				// vendorId: true,
				vendor: {
					select: {
						id: true,
						name: true,
					},
				},
				inviteState: true,
				role: {
					select: {
						id: true,
						name: true,
						active: true,
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
				status: true,
				startDate: true,
				lastActive: true,
				sNo: true,
				userType: true,
			},
			orderBy: {
				[sortType]: sortOrder === 1 ? 'asc' : 'desc',
			},
		});

		// const totalPages = Math.ceil(totalCount / take);
		return responseHandler(
			{
				users,
				totalCount,
			},
			res
		);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const {
			name,
			phoneNumber,
			roleId,
			designationId,
			department,
			startDate,
			organization,
			status,
			clientId,
			vendorId,
			password,
		} = req.body;
		const { userId } = req.user;

		const existingUser = await UserServices.findOne({ where: { id } });
		if (!existingUser) {
			return errorHandler('E-104', res);
		}

		const updateData = { updatedBy: userId };

		// Only update password if a non-empty value is provided
		if (password !== undefined && password !== null && password !== '') {
			const hashedPassword = await UserServices.encryptPassword(password);
			updateData.password = hashedPassword;
		}

		if (name !== undefined) updateData.name = name;
		if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
		if (roleId !== undefined) {
			const role = await RoleServices.findOne({ where: { id: roleId } });
			if (!role) return errorHandler('E-200', res);
			updateData.roleId = roleId;
		}
		if (designationId !== undefined) {
			// Allow clearing designation by sending empty string or null
			updateData.designationId = designationId === '' || designationId === null ? null : designationId;
		}
		if (department !== undefined) {
			// Allow clearing department by sending empty string or null
			updateData.department = department === '' || department === null ? null : department;
		}
		if (startDate !== undefined) updateData.startDate = startDate;
		if (organization !== undefined) updateData.organization = organization;
		if (status !== undefined) updateData.status = status;

		// Handle clientId update
		if (clientId !== undefined) {
			// Allow null or empty string to clear the clientId
			if (clientId === '' || clientId === null) {
				updateData.clientId = null;
			} else {
				// Validate client exists
				const client = await ClientServices.findOne({ where: { id: clientId } });
				if (!client) return errorHandler('E-301', res); // Client not found
				updateData.clientId = clientId;
			}
		}

		// Handle vendorId update
		if (vendorId !== undefined) {
			// Allow null or empty string to clear the vendorId
			if (vendorId === '' || vendorId === null) {
				updateData.vendorId = null;
			} else {
				// Validate vendor exists
				const vendor = await VendorServices.findOne({ where: { id: vendorId } });
				if (!vendor) return errorHandler('E-701', res); // Vendor not found
				updateData.vendorId = vendorId;
			}
		}

		const user = await UserServices.update({
			where: { id },
			data: updateData,
		});

		return responseHandler(
			{
				message: 'User updated successfully',
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					phoneNumber: user.phoneNumber,
					roleId: user.roleId,
					designationId: user.designationId,
					department: user.department,
					startDate: user.startDate,
					organization: user.organization,
				},
			},
			res
		);
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

	me = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const user = await UserServices.findOne({
			where: { id: userId },
			select: {
				id: true,
				sNo: true,
				name: true,
				email: true,
				phoneNumber: true,
				department: true,
				organization: true,
				role: true,
				designationId: true,
				designation: {
					select: {
						id: true,
						name: true,
						displayName: true,
					},
				},
				status: true,
			},
		});
		return responseHandler(user, res);
	});
}

export default new UserController();
