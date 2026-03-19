import DeliverableServices from '../services/modelServices/deliverable.services.js';
import TaskServices from '../services/modelServices/task.services.js';
import { asyncHandler, transactionHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';

class DeliverableController {
	create = transactionHandler(async (req, res, _, tx) => {
		const { projectId, taskId, dueDate, priority } = req.body;
		const { userId } = req.user;

		const task = await TaskServices.update({ where: { id: taskId }, data: { dueDate, priority } }, tx);
		if (!task) return errorHandler('E-603', res);

		const deliverable = await DeliverableServices.create({ data: { projectId, taskId, createdBy: userId } }, tx);
		return responseHandler(deliverable, res);
	});

	get = asyncHandler(async (req, res) => {
		const { id, projectId, taskId, pageNo = 0, pageLimit = 10, sortType = 'createdAt', sortOrder = -1 } = req.query;
		const where = { status: 'ACTIVE' };

		const orderBy = {
			[sortType]: sortOrder === 1 ? 'asc' : 'desc',
		};

		if (id) where.id = id;
		if (projectId) where.projectId = projectId;
		if (taskId) where.taskId = taskId;

		const deliverable = await DeliverableServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy,
		});
		return responseHandler(deliverable, res);
	});

	update = transactionHandler(async (req, res, _, tx) => {
		const { id } = req.params;
		const { dueDate, priority, deliverableStatus, status } = req.body;
		const deliverable = await DeliverableServices.update(
			{ where: { id }, data: { dueDate, priority, deliverableStatus, status } },
			tx
		);
		return responseHandler(deliverable, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const deliverable = await DeliverableServices.delete({ where: { id } });
		return responseHandler(deliverable, res);
	});
}

export default new DeliverableController();
