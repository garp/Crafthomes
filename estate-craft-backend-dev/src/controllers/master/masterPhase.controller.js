import MasterPhaseServices from '../../services/modelServices/master/masterPhase.services.js';
import MasterPhaseMasterTaskServices from '../../services/modelServices/mapping/masterPhaseMasterTask.services.js';
import ProjectTypeMasterPhaseMappingServices from '../../services/modelServices/mapping/projectTypeMasterPhaseMapping.services.js';
import PrismaService from '../../services/databaseServices/db.js';
import { asyncHandler, transactionHandler } from '../../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../../utils/responseHandler.js';

class MasterPhaseController {
	create = transactionHandler(async (req, res, _, tx) => {
		const { name, description, masterTasks = [], projectTypeId } = req.body;
		const { userId } = req.user;
		// Check if master phase with same name already exists and is ACTIVE
		const existingMasterPhase = await MasterPhaseServices.findFirst(
			{ where: { name: { equals: name.toLowerCase(), mode: 'insensitive' }, status: 'ACTIVE' } },
			tx
		);
		if (existingMasterPhase) {
			return errorHandler('E-501a', res);
		}
		const masterPhase = await MasterPhaseServices.create({ data: { name, description, createdBy: userId } }, tx);
		if (masterTasks && masterTasks.length > 0) {
			await MasterPhaseMasterTaskServices.createMany(
				{
					data: masterTasks.map(taskId => ({ masterPhaseId: masterPhase.id, masterTaskId: taskId })),
				},
				tx
			);
		}
		if (projectTypeId) {
			await ProjectTypeMasterPhaseMappingServices.create(
				{
					data: { projectTypeId, masterPhaseId: masterPhase.id },
				},
				tx
			);
		}
		return responseHandler(masterPhase, res);
	});

	get = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 10, masterTaskId, projectTypeId, sortType = 'createdAt', sortOrder = -1 } =
			req.query;
		const where = { status: 'ACTIVE' };
		if (id) {
			where.id = id;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		if (masterTaskId) {
			where.MasterPhaseMasterTask = {
				some: {
					MasterTask: {
						id: masterTaskId,
					},
				},
			};
		}
		if (projectTypeId) {
			where.projectType = {
				some: {
					projectTypeId,
				},
			};
		}
		const totalCount = await MasterPhaseServices.count({ where });
		const masterPhases = await MasterPhaseServices.findMany({
			where,
			select: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				status: true,
				MasterPhaseMasterTask: {
					select: {
						MasterTask: {
							select: {
								id: true,
								name: true,
								description: true,
							},
						},
					},
					orderBy: { sNo: 'asc' },
				},
				projectType: {
					select: {
						ProjectType: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
			},
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy: { [sortType]: sortOrder === 1 ? 'asc' : 'desc' },
		});
		return responseHandler({ masterPhases, totalCount }, res, 200);
	});

	getByProjectTypeId = asyncHandler(async (req, res) => {
		const { projectTypeId } = req.params;
		const prisma = PrismaService.getInstance();

		const [mappings, phaseOrderRows] = await Promise.all([
			ProjectTypeMasterPhaseMappingServices.findMany({
				where: { projectTypeId },
				orderBy: { sNo: 'asc' },
				select: {
					MasterPhase: {
						select: {
							id: true,
							name: true,
							description: true,
							createdAt: true,
							status: true,
							MasterPhaseMasterTask: {
								select: {
									MasterTask: {
										select: {
											id: true,
											name: true,
											description: true,
										},
									},
								},
								orderBy: { sNo: 'asc' },
							},
							projectType: {
								select: {
									ProjectType: {
										select: {
											id: true,
											name: true,
										},
									},
								},
							},
						},
					},
				},
			}),
			prisma.masterPhaseOrder.findMany({
				where: { projectTypeId },
				select: { masterPhaseId: true, order: true },
				orderBy: { order: 'asc' },
			}),
		]);

		const phaseOrderMap = new Map(phaseOrderRows.map((row) => [row.masterPhaseId, row.order]));
		let masterPhases = mappings.map((mapping) => mapping.MasterPhase);
		masterPhases = masterPhases.sort((a, b) => {
			const orderA = phaseOrderMap.get(a.id) ?? Infinity;
			const orderB = phaseOrderMap.get(b.id) ?? Infinity;
			return orderA - orderB;
		});

		return responseHandler(
			{
				masterPhases,
				totalCount: masterPhases.length,
			},
			res,
			200
		);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { name, description, status, masterTasks = [] } = req.body;
		const { userId } = req.user;

		const existingMasterPhase = await MasterPhaseServices.findOne({ where: { id } });
		if (!existingMasterPhase) {
			return errorHandler('E-502', res);
		}

		const updateBody = { updatedBy: userId };
		if (name !== undefined) updateBody.name = name;
		if (description !== undefined) updateBody.description = description;
		if (status !== undefined) updateBody.status = status;

		if (masterTasks && masterTasks.length > 0) {
			console.log('masterTasks updated');
			await MasterPhaseMasterTaskServices.deleteMany({ where: { masterPhaseId: id } });
			await MasterPhaseMasterTaskServices.createMany({
				data: masterTasks.map(taskId => ({ masterPhaseId: id, masterTaskId: taskId })),
			});
		}

		const masterPhase = await MasterPhaseServices.update({
			where: { id },
			data: updateBody,
			select: {
				id: true,
				name: true,
				description: true,
				createdAt: true,
				status: true,
			},
		});
		return responseHandler(masterPhase, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existingMasterPhase = await MasterPhaseServices.findOne({ where: { id } });
		if (!existingMasterPhase) {
			return errorHandler('E-502', res);
		}

		const masterPhase = await MasterPhaseServices.update({ where: { id }, data: { status: 'INACTIVE', updatedBy: userId } });
		return responseHandler(masterPhase, res, 200);
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
				const existingMasterPhase = await MasterPhaseServices.findOne({
					where: { id, status: 'ACTIVE' },
				});

				if (!existingMasterPhase) {
					results.failed.push({
						id,
						reason: 'Master phase not found or already deleted',
					});
					continue;
				}

				await MasterPhaseServices.update({
					where: { id },
					data: { status: 'INACTIVE', updatedBy: userId },
				});

				results.deleted.push({ id, name: existingMasterPhase.name });
			} catch (error) {
				results.failed.push({ id, reason: error.message });
			}
		}

		return responseHandler(results, res, 200);
	});
}

export default new MasterPhaseController();
