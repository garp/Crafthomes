import { randomUUID } from 'crypto';
import MasterTaskServices from '../../services/modelServices/master/masterTask.services.js';
import MasterPhaseMasterTaskServices from '../../services/modelServices/mapping/masterPhaseMasterTask.services.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../../utils/responseHandler.js';

const normalizeMasterSubTasks = subTasks => {
	if (!Array.isArray(subTasks)) return [];

	const normalizedSubTasks = subTasks
		.filter(subTask => subTask && subTask.name)
		.map(subTask => ({
			id: subTask.id || randomUUID(),
			name: subTask.name,
			description: subTask.description ?? '',
			duration: subTask.duration ?? null,
			predecessorTaskId: subTask.predecessorTaskId || null,
			priority: subTask.priority || 'MEDIUM',
			notes: subTask.notes ?? '',
		}));

	const validSubTaskIds = new Set(normalizedSubTasks.map(subTask => subTask.id));

	return normalizedSubTasks.map(subTask => ({
		...subTask,
		predecessorTaskId:
			subTask.predecessorTaskId && subTask.predecessorTaskId !== subTask.id && validSubTaskIds.has(subTask.predecessorTaskId)
				? subTask.predecessorTaskId
				: null,
	}));
};

class MasterTaskController {
	create = asyncHandler(async (req, res) => {
		const { name, description, masterPhaseId, duration, predecessorTaskId, priority, notes, subTasks = [] } = req.body;
		const { userId } = req.user;

		// Check if master task with same name already exists and is ACTIVE
		const existingMasterTask = await MasterTaskServices.findFirst({
			where: {
				name: { equals: name.toLowerCase(), mode: 'insensitive' },
				status: 'ACTIVE',
			},
		});
		if (existingMasterTask) {
			return errorHandler('E-501a', res);
		}

		if (predecessorTaskId) {
			const predecessorTask = await MasterTaskServices.findOne({ where: { id: predecessorTaskId, status: 'ACTIVE' } });
			if (!predecessorTask) {
				return errorHandler('E-501', res);
			}
		}

		const data = { name, createdBy: userId };
		if (description) data.description = description;
		if (duration !== undefined) data.duration = duration;
		if (predecessorTaskId !== undefined) data.predecessorTaskId = predecessorTaskId || null;
		if (priority) data.priority = priority;
		if (notes) data.notes = notes;
		data.subTasks = normalizeMasterSubTasks(subTasks);
		const masterTask = await MasterTaskServices.create({ data });

		if (masterPhaseId && Array.isArray(masterPhaseId)) {
			for (const phaseId of masterPhaseId) {
				const existingMasterPhaseMasterTask = await MasterPhaseMasterTaskServices.findFirst({
					where: {
						masterTaskId: masterTask.id,
						masterPhaseId: phaseId,
					},
				});

				if (!existingMasterPhaseMasterTask) {
					await MasterPhaseMasterTaskServices.create({
						data: {
							masterPhaseId: phaseId,
							masterTaskId: masterTask.id,
						},
					});
				}
			}
		}

		return responseHandler(masterTask, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const {
			id,
			search,
			pageNo = 0,
			pageLimit = 10,
			status = 'ACTIVE',
			sortType = 'createdAt',
			sortOrder = -1,
			masterPhaseId,
			projectTypeId,
		} = req.query;
		const where = { status };
		const and = [];
		const orderBy = {
			[sortType]: sortOrder === 1 ? 'asc' : 'desc',
		};
		if (id) {
			where.id = id;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		if (masterPhaseId) {
			and.push({
				MasterPhaseMasterTask: {
					some: {
						MasterPhase: {
							id: masterPhaseId,
						},
					},
				},
			});
		}
		if (projectTypeId) {
			and.push({
				MasterPhaseMasterTask: {
					some: {
						MasterPhase: {
							projectType: {
								some: {
									projectTypeId,
								},
							},
						},
					},
				},
			});
		}
		if (and.length > 0) {
			where.AND = and;
		}
		const totalCount = await MasterTaskServices.count({ where });
		const masterTasks = await MasterTaskServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			select: {
				id: true,
				name: true,
				description: true,
				updatedAt: true,
				status: true,
				duration: true,
				notes: true,
				subTasks: true,
				MasterPhaseMasterTask: {
					select: {
						MasterPhase: {
							select: {
								id: true,
								name: true,
								description: true,
							},
						},
					},
				},
				priority: true,
				createdAt: true,
				predecessorTaskId: true,
				predecessorTask: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy,
		});
		return responseHandler({ masterTasks, totalCount }, res, 200);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { name, description, status, masterPhaseId, duration, predecessorTaskId, priority, notes, subTasks } = req.body;
		const { userId } = req.user;

		const existingMasterTask = await MasterTaskServices.findOne({ where: { id } });
		if (!existingMasterTask) {
			return errorHandler('E-501', res);
		}

		if (predecessorTaskId) {
			if (predecessorTaskId === id) {
				return errorHandler('E-008', res, 'A master task cannot be its own predecessor');
			}
			const predecessorTask = await MasterTaskServices.findOne({
				where: { id: predecessorTaskId, status: 'ACTIVE' },
			});
			if (!predecessorTask) {
				return errorHandler('E-501', res);
			}
		}

		const updateBody = { updatedBy: userId };
		if (name !== undefined) updateBody.name = name;
		if (description !== undefined) updateBody.description = description;
		if (status !== undefined) updateBody.status = status;
		if (duration !== undefined) updateBody.duration = duration;
		if (predecessorTaskId !== undefined) updateBody.predecessorTaskId = predecessorTaskId || null;
		if (priority !== undefined) updateBody.priority = priority;
		if (notes !== undefined) updateBody.notes = notes;
		if (subTasks !== undefined) updateBody.subTasks = normalizeMasterSubTasks(subTasks);

		if (masterPhaseId && Array.isArray(masterPhaseId)) {
			await MasterPhaseMasterTaskServices.deleteMany({ where: { masterTaskId: id } });
			await MasterPhaseMasterTaskServices.createMany({
				data: masterPhaseId.map(phaseId => ({ masterPhaseId: phaseId, masterTaskId: id })),
			});
		}

		const masterTask = await MasterTaskServices.update({
			where: { id },
			data: updateBody,
		});
		return responseHandler(masterTask, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existingMasterTask = await MasterTaskServices.findOne({ where: { id } });
		if (!existingMasterTask) {
			return errorHandler('E-501', res);
		}

		const masterTask = await MasterTaskServices.update({ where: { id }, data: { status: 'INACTIVE', updatedBy: userId } });
		return responseHandler(masterTask, res, 200);
	});

	bulkDelete = asyncHandler(async (req, res) => {
		const { ids } = req.body;
		const { userId } = req.user;

		const results = {
			deleted: [],
			failed: [],
		};

		for (const id of ids) {
			try {
				const existingMasterTask = await MasterTaskServices.findOne({
					where: { id, status: 'ACTIVE' },
				});

				if (!existingMasterTask) {
					results.failed.push({
						id,
						reason: 'Master task not found or already deleted',
					});
					continue;
				}

				await MasterTaskServices.update({
					where: { id },
					data: { status: 'INACTIVE', updatedBy: userId },
				});

				results.deleted.push({ id, name: existingMasterTask.name });
			} catch (error) {
				results.failed.push({ id, reason: error.message });
			}
		}

		return responseHandler(results, res, 200);
	});
}

export default new MasterTaskController();
