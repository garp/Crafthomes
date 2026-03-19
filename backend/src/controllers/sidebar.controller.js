import { asyncHandler } from '../utils/asyncHandler.js';
import { errorHandler, responseHandler } from '../utils/responseHandler.js';
import SidebarServices from '../services/modelServices/sidebar.services.js';
import RoleServices from '../services/modelServices/roles.services.js';

class SidebarController {
	create = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { name, slug, frontendName, options, roleId } = req.body;

		// Ensure role exists
		const role = await RoleServices.findOne({
			where: { id: roleId },
		});
		if (!role) return errorHandler('E-200', res);

		// Enforce one sidebar config per role
		const existingSidebar = await SidebarServices.findFirst({
			where: { roleId },
		});
		if (existingSidebar) return errorHandler('E-409', res);

		const sidebar = await SidebarServices.create({
			data: {
				name,
				slug,
				frontendName,
				options,
				status: 'ACTIVE',
				roleId,
				createdBy: userId,
			},
		});

		return responseHandler({ sidebar }, res);
	});

	get = asyncHandler(async (req, res) => {
		const { id, roleId, status, pageNo = 0, pageLimit = 10 } = req.query;

		const where = {};
		if (id) where.id = id;
		if (roleId) where.roleId = roleId;
		if (status) where.status = status;

		const skip = parseInt(pageNo, 10) * parseInt(pageLimit, 10);
		const take = parseInt(pageLimit, 10);

		const totalCount = await SidebarServices.count({ where });
		const sidebars = await SidebarServices.findMany({
			where,
			skip,
			take,
			select: {
				id: true,
				sNo: true,
				name: true,
				slug: true,
				frontendName: true,
				options: true,
				status: true,
				role: {
					select: {
						id: true,
						name: true,
					},
				},
				createdAt: true,
				updatedAt: true,
				createdBy: true,
				updatedBy: true,
			},
			orderBy: { sNo: 'asc' },
		});

		return responseHandler({ sidebars, totalCount }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const { name, slug, frontendName, options, status, roleId } = req.body;

		const existingSidebar = await SidebarServices.findOne({
			where: { id },
		});
		if (!existingSidebar) return errorHandler('E-404', res);

		const updateData = { updatedBy: userId };
		if (name !== undefined) updateData.name = name;
		if (slug !== undefined) updateData.slug = slug;
		if (frontendName !== undefined) updateData.frontendName = frontendName;
		if (options !== undefined) updateData.options = options;
		if (status !== undefined) updateData.status = status;

		// If roleId is being changed, validate and enforce uniqueness per role
		if (roleId !== undefined && roleId !== existingSidebar.roleId) {
			const role = await RoleServices.findOne({ where: { id: roleId } });
			if (!role) return errorHandler('E-200', res);

			const sidebarForRole = await SidebarServices.findFirst({
				where: { roleId },
			});
			if (sidebarForRole && sidebarForRole.id !== id) return errorHandler('E-409', res);

			updateData.roleId = roleId;
		}

		const sidebar = await SidebarServices.update({
			where: { id },
			data: updateData,
		});

		return responseHandler({ sidebar }, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;

		await SidebarServices.delete({
			where: { id },
		});

		return responseHandler({ message: 'Sidebar deleted successfully' }, res);
	});
}

export default new SidebarController();
