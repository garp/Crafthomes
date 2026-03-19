import UserServices from '../../services/modelServices/user.services.js';
import ProjectUserServices from '../../services/modelServices/projectUser.services.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../../utils/responseHandler.js';

const orgUserSelect = {
	id: true,
	name: true,
	email: true,
	profilePhoto: true,
	department: true,
	reportsToId: true,
	designation: {
		select: {
			id: true,
			name: true,
			displayName: true,
		},
	},
};

class OrganizationController {
	get = asyncHandler(async (req, res) => {
		const { userId: loggedInUserId } = req.user;
		const targetUserId = req.params.userId || loggedInUserId;

		// Fetch the target user
		const user = await UserServices.findOne({
			where: { id: targetUserId, status: 'ACTIVE' },
			select: {
				...orgUserSelect,
				ReportsTo: {
					select: orgUserSelect,
				},
			},
		});

		if (!user) {
			return errorHandler('E-104', res);
		}

		// Fetch direct reports (users who report to this user)
		const directReports = await UserServices.findMany({
			where: {
				reportsToId: targetUserId,
				status: 'ACTIVE',
				userType: 'INTERNAL',
			},
			select: orgUserSelect,
			orderBy: { name: 'asc' },
		});

		// Fetch "also works with" - users who share common projects
		// with the target user, excluding admins, reportsTo, and direct reports
		const directReportIds = directReports.map((dr) => dr.id);
		const excludeIds = [targetUserId, ...directReportIds];
		if (user.reportsToId) {
			excludeIds.push(user.reportsToId);
		}

		// Step 1: Get the target user's assigned project IDs
		const targetUserProjects = await ProjectUserServices.findMany({
			where: { userId: targetUserId },
			select: { projectId: true },
		});
		const targetProjectIds = targetUserProjects.map((p) => p.projectId);

		// Step 2: Find users who share those projects
		let alsoWorksWith = [];
		if (targetProjectIds.length > 0) {
			const coProjectUsers = await ProjectUserServices.findMany({
				where: {
					projectId: { in: targetProjectIds },
					userId: { notIn: excludeIds },
				},
				select: { userId: true },
			});
			const coWorkerIds = [...new Set(coProjectUsers.map((pu) => pu.userId))];

			if (coWorkerIds.length > 0) {
				alsoWorksWith = await UserServices.findMany({
					where: {
						id: { in: coWorkerIds },
						status: 'ACTIVE',
						userType: 'INTERNAL',
						role: {
							name: { notIn: ['super_admin', 'admin'] },
						},
					},
					select: orgUserSelect,
					orderBy: { name: 'asc' },
				});
			}
		}

		return responseHandler(
			{
				user,
				directReports,
				alsoWorksWith,
			},
			res
		);
	});
}

export default new OrganizationController();
