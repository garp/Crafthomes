import { asyncHandler, transactionHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import ProjectTypeServices from '../services/modelServices/projectType.services.js';
import MasterPhaseServices from '../services/modelServices/master/masterPhase.services.js';
import ProjectTypeMasterPhaseMappingServices from '../services/modelServices/mapping/projectTypeMasterPhaseMapping.services.js';
import PrismaService from '../services/databaseServices/db.js';

class ProjectTypeController {
	create = transactionHandler(async (req, res, _, tx) => {
		const { name, phases } = req.body;
		const { userId } = req.user;

		// Normalize phases to an array (empty if not provided)
		const phaseIds = Array.isArray(phases) ? phases : [];

		// Check if project type with same name already exists and is ACTIVE
		const existingProjectType = await tx.projectType.findFirst({
			where: {
				name: {
					equals: name.toLowerCase(),
					mode: 'insensitive',
				},
				status: 'ACTIVE',
			},
		});
		if (existingProjectType) {
			return errorHandler('E-409a', res);
		}

		// check if phases exist (only if phases are provided)
		if (phaseIds.length > 0) {
			const existingPhases = await tx.masterPhase.findMany({ where: { id: { in: phaseIds } } });
			if (existingPhases.length !== phaseIds.length) {
				return errorHandler('E-408', res);
			}
		}

		// create project type
		const projectType = await tx.projectType.create({
			data: {
				name,
				createdBy: userId,
			},
		});

		// create master phase master task mappings and phase order (preserve submitted order)
		if (phaseIds.length > 0) {
			await tx.projectTypeMasterPhase.createMany({
				data: phaseIds.map(phaseId => ({
					projectTypeId: projectType.id,
					masterPhaseId: phaseId,
				})),
			});
			await tx.masterPhaseOrder.createMany({
				data: phaseIds.map((masterPhaseId, index) => ({
					projectTypeId: projectType.id,
					masterPhaseId,
					order: index + 1,
				})),
			});
		}

		// Fetch the created projectType with masterPhases
		const createdProjectType = await tx.projectType.findUnique({
			where: { id: projectType.id },
			include: {
				masterPhases: {
					include: {
						MasterPhase: {
							select: {
								id: true,
								name: true,
								description: true,
								status: true,
								_count: {
									select: {
										MasterPhaseMasterTask: true,
									},
								},
							},
						},
					},
				},
			},
		});

		return responseHandler(createdProjectType, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 10, status = 'ACTIVE', sortType = 'createdAt', sortOrder = -1, projectTypeGroupId } = req.query;
		const where = { status };
		const orderBy = { [sortType]: sortOrder === 1 ? 'asc' : 'desc' };
		if (id) {
			where.id = id;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		if (projectTypeGroupId) {
			where.projectTypeGroups = {
				some: {
					projectTypeGroupId,
				},
			};
		}

		const totalCount = await ProjectTypeServices.count({ where });
		const projectTypes = await ProjectTypeServices.findMany({
			where,
			select: {
				id: true,
				sNo: true,
				name: true,
				status: true,
				createdAt: true,
				masterPhases: {
					select: {
						MasterPhase: {
							select: {
								id: true,
								name: true,
								description: true,
								status: true,
								MasterPhaseMasterTask: {
									select: {
										MasterTask: {
											select: {
												duration: true,
											},
										},
									},
								},
								_count: {
									select: {
										MasterPhaseMasterTask: true,
									},
								},
							},
						},
					},
				},
				projectTypeGroups: {
					select: {
						ProjectTypeGroup: {
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
			orderBy,
		});

		// Transform data to match desired structure
		const projectTypesWithCounts = projectTypes.map(projectType => ({
			id: projectType.id,
			sNo: projectType.sNo,
			name: projectType.name,
			status: projectType.status,
			createdAt: projectType.createdAt,
			phasesCount: projectType.masterPhases.length,
			tasksCount: projectType.masterPhases.reduce(
				(total, phase) => total + (phase.MasterPhase._count?.MasterPhaseMasterTask || 0),
				0
			),
			totalDuration: projectType.masterPhases.reduce(
				(total, phase) =>
					total + phase.MasterPhase.MasterPhaseMasterTask.reduce(
						(phaseTotal, taskMapping) => phaseTotal + (taskMapping.MasterTask?.duration || 0),
						0
					),
				0
			),
			projectTypeGroups: projectType.projectTypeGroups.map(g => ({
				id: g.ProjectTypeGroup.id,
				name: g.ProjectTypeGroup.name,
			})),
		}));

		return responseHandler({ projectTypes: projectTypesWithCounts, totalCount }, res, 200);
	});

	getOne = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const projectType = await ProjectTypeServices.findOne(
			{
				where: { id },
				select: {
					id: true,
					sNo: true,
					name: true,
					createdAt: true,
					updatedAt: true,
					createdBy: true,
					status: true,
					updatedBy: true,
					masterPhases: {
						orderBy: { sNo: 'asc' },
						select: {
							id: true,
							sNo: true,
							masterPhaseId: true,
							MasterPhase: {
								select: {
									id: true,
									sNo: true,
									name: true,
									description: true,
									createdAt: true,
									updatedAt: true,
									createdBy: true,
									status: true,
									updatedBy: true,
									MasterPhaseMasterTask: {
										select: {
											id: true,
											sNo: true,
											masterTaskId: true,
											MasterTask: {
												select: {
													id: true,
													sNo: true,
													name: true,
													description: true,
													createdAt: true,
													updatedAt: true,
													createdBy: true,
													status: true,
													updatedBy: true,
													priority: true,
													notes: true,
													duration: true,
													predecessorTaskId: true,
													predecessorTask: {
														select: {
															id: true,
															name: true,
														},
													},
												}
											}
										}
									}
								}
							}
						}
					},
					MasterPhaseOrder: {
						select: {
							masterPhaseId: true,
							order: true
						},
						orderBy: { order: 'asc' }
					},
					MasterTaskOrder: {
						select: {
							masterPhaseId: true,
							masterTaskId: true,
							order: true
						},
						orderBy: { order: 'asc' }
					}
				}
			});
		if (!projectType) {
			return errorHandler('E-405', res);
		}

		// Create order maps for sorting
		const phaseOrderMap = new Map();
		projectType.MasterPhaseOrder.forEach(po => {
			phaseOrderMap.set(po.masterPhaseId, po.order);
		});

		const taskOrderMap = new Map();
		projectType.MasterTaskOrder.forEach(to => {
			const key = `${to.masterPhaseId}_${to.masterTaskId}`;
			taskOrderMap.set(key, to.order);
		});

		// Transform to flatten junction tables
		const transformedProjectType = {
			...projectType,
			masterPhases: projectType.masterPhases.map(junction => ({
				...junction.MasterPhase,
				masterTasks: junction.MasterPhase.MasterPhaseMasterTask.map(
					taskJunction => taskJunction.MasterTask
				).sort((a, b) => {
					const orderA = taskOrderMap.get(`${junction.masterPhaseId}_${a.id}`) ?? Infinity;
					const orderB = taskOrderMap.get(`${junction.masterPhaseId}_${b.id}`) ?? Infinity;
					return orderA - orderB;
				})
			})).sort((a, b) => {
				const orderA = phaseOrderMap.get(a.id) ?? Infinity;
				const orderB = phaseOrderMap.get(b.id) ?? Infinity;
				return orderA - orderB;
			})
		};

		// Remove MasterPhaseMasterTask from each masterPhase (already flattened to masterTasks)
		transformedProjectType.masterPhases.forEach(phase => {
			delete phase.MasterPhaseMasterTask;
		});

		// Remove order tables from response
		delete transformedProjectType.MasterPhaseOrder;
		delete transformedProjectType.MasterTaskOrder;

		return responseHandler(transformedProjectType, res, 200);
	})

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { name, phases, status } = req.body;
		const { userId } = req.user;

		const existingProjectType = await ProjectTypeServices.findOne({ where: { id } });
		if (!existingProjectType) {
			return errorHandler('E-405', res);
		}

		const updateBody = { updatedBy: userId };
		if (name !== undefined) updateBody.name = name;
		if (status !== undefined) updateBody.status = status;

		// If phases are provided, explicitly manage the mapping table
		if (phases !== undefined) {
			const uniquePhaseIds = Array.isArray(phases) ? Array.from(new Set(phases)) : [];

			// Validate all provided master phase IDs exist and are ACTIVE
			const existingPhases = uniquePhaseIds.length
				? await MasterPhaseServices.findMany({
					where: { id: { in: uniquePhaseIds }, status: 'ACTIVE' },
				})
				: [];
			if (uniquePhaseIds.length !== existingPhases.length) {
				return errorHandler('E-408', res);
			}

			// Fetch current mappings
			const currentMappings = await ProjectTypeMasterPhaseMappingServices.findMany({
				where: { projectTypeId: id },
			});
			const currentPhaseIds = currentMappings.map(m => m.masterPhaseId);

			// Determine additions and deletions
			const phasesToAdd = uniquePhaseIds.filter(pid => !currentPhaseIds.includes(pid));
			const phasesToRemove = currentPhaseIds.filter(pid => !uniquePhaseIds.includes(pid));

			// Apply removals
			if (phasesToRemove.length > 0) {
				await ProjectTypeMasterPhaseMappingServices.deleteMany({
					where: {
						projectTypeId: id,
						masterPhaseId: { in: phasesToRemove },
					},
				});
			}

			// Apply additions
			if (phasesToAdd.length > 0) {
				await ProjectTypeMasterPhaseMappingServices.createMany({
					data: phasesToAdd.map(phaseId => ({ projectTypeId: id, masterPhaseId: phaseId })),
				});
			}

			// Sync MasterPhaseOrder to match submitted phase order (keeps timeline template order consistent)
			const prisma = PrismaService.getInstance();
			await prisma.masterPhaseOrder.deleteMany({ where: { projectTypeId: id } });
			if (uniquePhaseIds.length > 0) {
				await prisma.masterPhaseOrder.createMany({
					data: uniquePhaseIds.map((masterPhaseId, index) => ({
						projectTypeId: id,
						masterPhaseId,
						order: index + 1,
					})),
				});
			}
		}

		// Update basic fields on projectType
		await ProjectTypeServices.update({ where: { id }, data: updateBody });

		// Fetch updated entity with relations
		const projectType = await ProjectTypeServices.findOne({
			where: { id },
			include: {
				masterPhases: {
					include: {
						MasterPhase: {
							select: {
								id: true,
								name: true,
								description: true,
								status: true,
								_count: { select: { MasterPhaseMasterTask: true } },
							},
						},
					},
				},
			},
		});

		return responseHandler(projectType, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existingProjectType = await ProjectTypeServices.findOne({ where: { id } });
		if (!existingProjectType) {
			return errorHandler('E-405', res);
		}

		const projectType = await ProjectTypeServices.update({ where: { id }, data: { status: 'INACTIVE', updatedBy: userId } });
		return responseHandler(projectType, res, 200);
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
				const existingProjectType = await ProjectTypeServices.findOne({
					where: { id, status: 'ACTIVE' },
				});

				if (!existingProjectType) {
					results.failed.push({
						id,
						reason: 'Project type not found or already deleted',
					});
					continue;
				}

				await ProjectTypeServices.update({
					where: { id },
					data: { status: 'INACTIVE', updatedBy: userId },
				});

				results.deleted.push({ id, name: existingProjectType.name });
			} catch (error) {
				results.failed.push({ id, reason: error.message });
			}
		}

		return responseHandler(results, res, 200);
	});

	rearrangeMasterPhaseOrder = transactionHandler(async (req, res, _, tx) => {
		const { projectTypeId, masterPhases } = req.body;

		// Validate project type exists
		const projectType = await tx.projectType.findUnique({ where: { id: projectTypeId } });
		if (!projectType) return errorHandler('E-405', res);

		// Validate all master phases exist and belong to this project type
		for (const masterPhaseId of masterPhases) {
			const mapping = await tx.projectTypeMasterPhase.findFirst({
				where: { projectTypeId, masterPhaseId },
			});
			if (!mapping) return errorHandler('E-408', res);
		}

		// Update or create each master phase order sequentially
		for (let i = 0; i < masterPhases.length; i++) {
			const masterPhaseOrderRecord = await tx.masterPhaseOrder.findFirst({
				where: {
					projectTypeId,
					masterPhaseId: masterPhases[i],
				},
			});

			if (masterPhaseOrderRecord) {
				// Update existing record
				await tx.masterPhaseOrder.update({
					where: { id: masterPhaseOrderRecord.id },
					data: { order: i + 1 },
				});
			} else {
				// Create new record if it doesn't exist
				await tx.masterPhaseOrder.create({
					data: {
						projectTypeId,
						masterPhaseId: masterPhases[i],
						order: i + 1,
					},
				});
			}
		}

		const updatedOrder = await tx.masterPhaseOrder.findMany({
			where: { projectTypeId },
			orderBy: { order: 'asc' },
		});

		return responseHandler(updatedOrder, res, 200);
	});

	rearrangeMasterTaskOrder = transactionHandler(async (req, res, _, tx) => {
		const { projectTypeId, masterPhaseId, masterTasks } = req.body;

		// Validate project type exists
		const projectType = await tx.projectType.findUnique({ where: { id: projectTypeId } });
		if (!projectType) return errorHandler('E-405', res);

		// Validate master phase exists and belongs to this project type
		const phaseMapping = await tx.projectTypeMasterPhase.findFirst({
			where: { projectTypeId, masterPhaseId },
		});
		if (!phaseMapping) return errorHandler('E-408', res);

		// Validate all master tasks exist and belong to this master phase
		for (const masterTaskId of masterTasks) {
			const taskMapping = await tx.masterPhaseMasterTask.findFirst({
				where: { masterPhaseId, masterTaskId },
			});
			if (!taskMapping) return errorHandler('E-408', res);
		}

		// Update or create each master task order sequentially
		for (let i = 0; i < masterTasks.length; i++) {
			const masterTaskOrderRecord = await tx.masterTaskOrder.findFirst({
				where: {
					projectTypeId,
					masterPhaseId,
					masterTaskId: masterTasks[i],
				},
			});

			if (masterTaskOrderRecord) {
				// Update existing record
				await tx.masterTaskOrder.update({
					where: { id: masterTaskOrderRecord.id },
					data: { order: i + 1 },
				});
			} else {
				// Create new record if it doesn't exist
				await tx.masterTaskOrder.create({
					data: {
						projectTypeId,
						masterPhaseId,
						masterTaskId: masterTasks[i],
						order: i + 1,
					},
				});
			}
		}

		const updatedOrder = await tx.masterTaskOrder.findMany({
			where: { projectTypeId, masterPhaseId },
			orderBy: { order: 'asc' },
		});

		return responseHandler(updatedOrder, res, 200);
	});

	removeMasterPhase = transactionHandler(async (req, res, _, tx) => {
		const { projectTypeId, masterPhaseId } = req.params;

		// Validate project type exists
		const projectType = await tx.projectType.findUnique({ where: { id: projectTypeId } });
		if (!projectType) return errorHandler('E-405', res);

		// Check if the mapping exists
		const mapping = await tx.projectTypeMasterPhase.findFirst({
			where: { projectTypeId, masterPhaseId },
		});
		if (!mapping) return errorHandler('E-408', res);

		// Delete the mapping
		await tx.projectTypeMasterPhase.delete({
			where: { id: mapping.id },
		});

		// Also clean up the MasterPhaseOrder for this project type
		await tx.masterPhaseOrder.deleteMany({
			where: { projectTypeId, masterPhaseId },
		});

		// Also clean up the MasterTaskOrder for this project type and phase
		await tx.masterTaskOrder.deleteMany({
			where: { projectTypeId, masterPhaseId },
		});

		return responseHandler({ message: 'Master phase removed successfully' }, res, 200);
	});

	removeMasterTask = transactionHandler(async (req, res, _, tx) => {
		const { projectTypeId, masterPhaseId, masterTaskId } = req.params;

		// Validate project type exists
		const projectType = await tx.projectType.findUnique({ where: { id: projectTypeId } });
		if (!projectType) return errorHandler('E-405', res);

		// Validate master phase exists and belongs to this project type
		const phaseMapping = await tx.projectTypeMasterPhase.findFirst({
			where: { projectTypeId, masterPhaseId },
		});
		if (!phaseMapping) return errorHandler('E-408', res);

		// Check if the task mapping exists
		const taskMapping = await tx.masterPhaseMasterTask.findFirst({
			where: { masterPhaseId, masterTaskId },
		});
		if (!taskMapping) return errorHandler('E-408', res);

		// Delete the task mapping from the phase
		await tx.masterPhaseMasterTask.delete({
			where: { id: taskMapping.id },
		});

		// Also clean up the MasterTaskOrder for this project type, phase, and task
		await tx.masterTaskOrder.deleteMany({
			where: { projectTypeId, masterPhaseId, masterTaskId },
		});

		return responseHandler({ message: 'Master task removed successfully' }, res, 200);
	});
}
export default new ProjectTypeController();
