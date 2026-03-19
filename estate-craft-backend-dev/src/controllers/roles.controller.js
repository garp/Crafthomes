import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import RoleServices from '../services/modelServices/roles.services.js';
import UserServices from '../services/modelServices/user.services.js';

class RolesController {
	get = asyncHandler(async (req, res) => {
		const { id, search, endpoint, method, filterBy } = req.query;

		const where = {};
		if (id) where.id = id;
		if (filterBy === "INTERNAL") {
			// Include all internal roles: super_admin, admin, internal_user
			// Exclude client/vendor related roles
			where.NOT = {
				name: { in: ['client', 'client_contact', 'vendor', 'vendor_contact'] }
			};
		}
		if (search) where.name = { contains: search, mode: 'insensitive' };
		if (endpoint) where.permissions = { some: { endpoint } };
		if (method) where.permissions = { some: { method } };

		const roles = await RoleServices.findMany({
			where,
			select: {
				id: true,
				name: true,
				active: true,
				permissions: true,
				sNo: true,
			},
			orderBy: { sNo: 'asc' },
		});

		return responseHandler(roles, res);
	});

	create = asyncHandler(async (req, res) => {
		const { name } = req.body;
		const existingRole = await RoleServices.findOne({
			where: {
				name,
			},
		});
		if (existingRole) return errorHandler('E-409', res);
		const role = await RoleServices.create({
			data: {
				name,
			},
		});
		return responseHandler(role, res);
	});

	updateRole = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { name } = req.body;
		const user = await UserServices.findOne({
			id,
		});
		if (!user) return errorHandler('E-404', res);
		const updatedUser = await UserServices.update({
			where: {
				id,
			},
			data: {
				role: name,
			},
		});
		return responseHandler(updatedUser, res);
	});

	updateStatus = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const role = await RoleServices.findOne({
			where: { id },
		});
		if (!role) return errorHandler('E-404', res);
		const updatedRole = await RoleServices.update({
			where: { id },
			data: { active: !role.active },
		});
		return responseHandler(updatedRole, res);
	});
}

export default new RolesController();
