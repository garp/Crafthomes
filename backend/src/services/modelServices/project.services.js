import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class ProjectServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().project, 'project');

		this.stats = async () => {
			const totalProjects = await this.model.findMany({
				where: {
					status: 'ACTIVE',
				},
				select: {
					id: true,
				},
			});

			const pendingPayments = await this.model.findMany({
				where: {
					status: 'ACTIVE',
					paymentStatus: 'PENDING',
				},
				select: {
					paymentStatus: true,
				},
			});
			return {
				totalProjects: totalProjects.length,
				pendingPayments: pendingPayments.length,
				progress: 0,
			};
		};
	}
}

export default new ProjectServices();
