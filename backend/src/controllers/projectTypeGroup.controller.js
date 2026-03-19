import { asyncHandler, transactionHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import ProjectTypeGroupServices from '../services/modelServices/projectTypeGroup.services.js';
import ProjectTypeServices from '../services/modelServices/projectType.services.js';
import ProjectTypeGroupProjectTypeServices from '../services/modelServices/mapping/projectTypeGroupProjectType.services.js';

class ProjectTypeGroupController {
	create = transactionHandler(async (req, res, _, tx) => {
		const { name, description, projectTypes } = req.body;
		const { userId } = req.user;

		// Normalize projectTypes to an array, remove duplicates while preserving order
		const seen = new Set();
		const projectTypeIds = (Array.isArray(projectTypes) ? projectTypes : []).filter(pid => {
			if (seen.has(pid)) return false;
			seen.add(pid);
			return true;
		});

		// Check if project type group with same name already exists and is ACTIVE
		const existingGroup = await tx.projectTypeGroup.findFirst({
			where: {
				name: {
					equals: name.toLowerCase(),
					mode: 'insensitive',
				},
				status: 'ACTIVE',
			},
		});
		if (existingGroup) {
			return errorHandler('E-409a', res);
		}

		// Validate all provided project type IDs exist and are ACTIVE
		if (projectTypeIds.length > 0) {
			const existingProjectTypes = await tx.projectType.findMany({
				where: { id: { in: projectTypeIds }, status: 'ACTIVE' },
			});
			if (existingProjectTypes.length !== projectTypeIds.length) {
				return errorHandler('E-405', res);
			}
		}

		// Create project type group
		const projectTypeGroup = await tx.projectTypeGroup.create({
			data: {
				name,
				description,
				createdBy: userId,
			},
		});

		// Create project type mappings and order
		if (projectTypeIds.length > 0) {
			await tx.projectTypeGroupProjectType.createMany({
				data: projectTypeIds.map(projectTypeId => ({
					projectTypeGroupId: projectTypeGroup.id,
					projectTypeId,
				})),
			});

			// Create order entries based on array index
			await tx.projectTypeGroupOrder.createMany({
				data: projectTypeIds.map((projectTypeId, index) => ({
					projectTypeGroupId: projectTypeGroup.id,
					projectTypeId,
					order: index + 1,
				})),
			});
		}

		// Fetch the created group with project types and order
		const createdGroup = await tx.projectTypeGroup.findUnique({
			where: { id: projectTypeGroup.id },
			include: {
				projectTypes: {
					include: {
						ProjectType: {
							select: {
								id: true,
								sNo: true,
								name: true,
								status: true,
							},
						},
					},
				},
				ProjectTypeGroupOrder: {
					select: {
						projectTypeId: true,
						order: true,
					},
					orderBy: { order: 'asc' },
				},
			},
		});

		// Create order map for sorting
		const orderMap = new Map();
		createdGroup.ProjectTypeGroupOrder.forEach(po => {
			orderMap.set(po.projectTypeId, po.order);
		});

		// Transform response with sorted project types
		const transformedGroup = {
			...createdGroup,
			projectTypes: createdGroup.projectTypes
				.map(junction => junction.ProjectType)
				.sort((a, b) => {
					const orderA = orderMap.get(a.id) ?? Infinity;
					const orderB = orderMap.get(b.id) ?? Infinity;
					return orderA - orderB;
				}),
		};

		// Remove order table from response
		delete transformedGroup.ProjectTypeGroupOrder;

		return responseHandler(transformedGroup, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 10, status = 'ACTIVE', sortType = 'createdAt', sortOrder = -1 } = req.query;
		const where = { status };
		const orderBy = { [sortType]: sortOrder === 1 ? 'asc' : 'desc' };

		if (id) {
			where.id = id;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}

		const totalCount = await ProjectTypeGroupServices.count({ where });
		const projectTypeGroups = await ProjectTypeGroupServices.findMany({
			where,
			select: {
				id: true,
				sNo: true,
				name: true,
				description: true,
				status: true,
				createdAt: true,
				projectTypes: {
					select: {
						ProjectType: {
							select: {
								id: true,
								sNo: true,
								name: true,
								status: true,
							},
						},
					},
				},
			},
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy,
		});

		// Transform data to include projectTypesCount
		const projectTypeGroupsWithCounts = projectTypeGroups.map(group => ({
			id: group.id,
			sNo: group.sNo,
			name: group.name,
			description: group.description,
			status: group.status,
			createdAt: group.createdAt,
			projectTypesCount: group.projectTypes.length,
		}));

		return responseHandler({ projectTypeGroups: projectTypeGroupsWithCounts, totalCount }, res, 200);
	});

	getOne = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const projectTypeGroup = await ProjectTypeGroupServices.findOne({
			where: { id },
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
				projectTypes: {
					select: {
						id: true,
						sNo: true,
						projectTypeId: true,
						ProjectType: {
							select: {
								id: true,
								sNo: true,
								name: true,
								status: true,
								createdAt: true,
								_count: {
									select: {
										masterPhases: true,
									},
								},
							},
						},
					},
				},
				ProjectTypeGroupOrder: {
					select: {
						projectTypeId: true,
						order: true,
					},
					orderBy: { order: 'asc' },
				},
			},
		});

		if (!projectTypeGroup) {
			return errorHandler('E-405', res);
		}

		// Create order map for sorting
		const orderMap = new Map();
		projectTypeGroup.ProjectTypeGroupOrder.forEach(po => {
			orderMap.set(po.projectTypeId, po.order);
		});

		// Transform to flatten junction table and sort by order
		const transformedGroup = {
			...projectTypeGroup,
			projectTypes: projectTypeGroup.projectTypes
				.map(junction => ({
					...junction.ProjectType,
					phasesCount: junction.ProjectType._count?.masterPhases || 0,
				}))
				.sort((a, b) => {
					const orderA = orderMap.get(a.id) ?? Infinity;
					const orderB = orderMap.get(b.id) ?? Infinity;
					return orderA - orderB;
				}),
		};

		// Remove _count from each projectType and order table from response
		transformedGroup.projectTypes.forEach(pt => {
			delete pt._count;
		});
		delete transformedGroup.ProjectTypeGroupOrder;

		return responseHandler(transformedGroup, res, 200);
	});

	update = transactionHandler(async (req, res, _, tx) => {
		const { id } = req.params;
		const { name, description, status, projectTypes } = req.body;
		const { userId } = req.user;

		const existingGroup = await ProjectTypeGroupServices.findOne({ where: { id } });
		if (!existingGroup) {
			return errorHandler('E-405', res);
		}

		// Check for duplicate name (if name is being updated)
		if (name !== undefined && name.toLowerCase() !== existingGroup.name.toLowerCase()) {
			const duplicateName = await tx.projectTypeGroup.findFirst({
				where: {
					name: { equals: name.toLowerCase(), mode: 'insensitive' },
					id: { not: id },
				},
			});
			if (duplicateName) {
				return errorHandler('E-409a', res);
			}
		}

		const updateBody = { updatedBy: userId };
		if (name !== undefined) updateBody.name = name;
		if (description !== undefined) updateBody.description = description;
		if (status !== undefined) updateBody.status = status;

		// If projectTypes are provided, manage the mapping table and order
		if (projectTypes !== undefined) {
			// Keep original order, remove duplicates while preserving first occurrence
			const seen = new Set();
			const uniqueProjectTypeIds = (Array.isArray(projectTypes) ? projectTypes : []).filter(pid => {
				if (seen.has(pid)) return false;
				seen.add(pid);
				return true;
			});

			// Validate all provided project type IDs exist and are ACTIVE
			if (uniqueProjectTypeIds.length > 0) {
				const existingProjectTypes = await tx.projectType.findMany({
					where: { id: { in: uniqueProjectTypeIds }, status: 'ACTIVE' },
				});
				if (uniqueProjectTypeIds.length !== existingProjectTypes.length) {
					return errorHandler('E-405', res);
				}
			}

			// Fetch current mappings
			const currentMappings = await tx.projectTypeGroupProjectType.findMany({
				where: { projectTypeGroupId: id },
			});
			const currentProjectTypeIds = currentMappings.map(m => m.projectTypeId);

			// Determine additions and deletions
			const toAdd = uniqueProjectTypeIds.filter(pid => !currentProjectTypeIds.includes(pid));
			const toRemove = currentProjectTypeIds.filter(pid => !uniqueProjectTypeIds.includes(pid));

			// Apply removals
			if (toRemove.length > 0) {
				await tx.projectTypeGroupProjectType.deleteMany({
					where: {
						projectTypeGroupId: id,
						projectTypeId: { in: toRemove },
					},
				});
				// Also remove order entries
				await tx.projectTypeGroupOrder.deleteMany({
					where: {
						projectTypeGroupId: id,
						projectTypeId: { in: toRemove },
					},
				});
			}

			// Apply additions
			if (toAdd.length > 0) {
				await tx.projectTypeGroupProjectType.createMany({
					data: toAdd.map(projectTypeId => ({
						projectTypeGroupId: id,
						projectTypeId,
					})),
				});
			}

			// Update order for all project types based on array index
			for (let i = 0; i < uniqueProjectTypeIds.length; i++) {
				const projectTypeId = uniqueProjectTypeIds[i];
				const orderRecord = await tx.projectTypeGroupOrder.findFirst({
					where: { projectTypeGroupId: id, projectTypeId },
				});

				if (orderRecord) {
					await tx.projectTypeGroupOrder.update({
						where: { id: orderRecord.id },
						data: { order: i + 1 },
					});
				} else {
					await tx.projectTypeGroupOrder.create({
						data: {
							projectTypeGroupId: id,
							projectTypeId,
							order: i + 1,
						},
					});
				}
			}
		}

		// Update basic fields
		await tx.projectTypeGroup.update({
			where: { id },
			data: updateBody,
		});

		// Fetch updated entity with relations and order
		const projectTypeGroup = await tx.projectTypeGroup.findUnique({
			where: { id },
			include: {
				projectTypes: {
					include: {
						ProjectType: {
							select: {
								id: true,
								sNo: true,
								name: true,
								status: true,
							},
						},
					},
				},
				ProjectTypeGroupOrder: {
					select: {
						projectTypeId: true,
						order: true,
					},
					orderBy: { order: 'asc' },
				},
			},
		});

		// Create order map for sorting
		const orderMap = new Map();
		projectTypeGroup.ProjectTypeGroupOrder.forEach(po => {
			orderMap.set(po.projectTypeId, po.order);
		});

		// Transform response with sorted project types
		const transformedGroup = {
			...projectTypeGroup,
			projectTypes: projectTypeGroup.projectTypes
				.map(junction => junction.ProjectType)
				.sort((a, b) => {
					const orderA = orderMap.get(a.id) ?? Infinity;
					const orderB = orderMap.get(b.id) ?? Infinity;
					return orderA - orderB;
				}),
		};

		// Remove order table from response
		delete transformedGroup.ProjectTypeGroupOrder;

		return responseHandler(transformedGroup, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existingGroup = await ProjectTypeGroupServices.findOne({ where: { id } });
		if (!existingGroup) {
			return errorHandler('E-405', res);
		}

		const projectTypeGroup = await ProjectTypeGroupServices.update({
			where: { id },
			data: { status: 'INACTIVE', updatedBy: userId },
		});

		return responseHandler(projectTypeGroup, res, 200);
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
				const existingGroup = await ProjectTypeGroupServices.findOne({
					where: { id, status: 'ACTIVE' },
				});

				if (!existingGroup) {
					results.failed.push({
						id,
						reason: 'Project type group not found or already deleted',
					});
					continue;
				}

				await ProjectTypeGroupServices.update({
					where: { id },
					data: { status: 'INACTIVE', updatedBy: userId },
				});

				results.deleted.push({ id, name: existingGroup.name });
			} catch (error) {
				results.failed.push({ id, reason: error.message });
			}
		}

		return responseHandler(results, res, 200);
	});

	rearrangeProjectTypeOrder = transactionHandler(async (req, res, _, tx) => {
		const { projectTypeGroupId, projectTypes } = req.body;

		// Validate project type group exists
		const projectTypeGroup = await tx.projectTypeGroup.findUnique({
			where: { id: projectTypeGroupId },
		});
		if (!projectTypeGroup) {
			return errorHandler('E-405', res);
		}

		// Validate all project types exist and belong to this group
		const mappings = await tx.projectTypeGroupProjectType.findMany({
			where: {
				projectTypeGroupId,
				projectTypeId: { in: projectTypes },
			},
		});

		if (mappings.length !== projectTypes.length) {
			return errorHandler('E-408', res);
		}

		// Update or create each project type order
		for (let i = 0; i < projectTypes.length; i++) {
			const orderRecord = await tx.projectTypeGroupOrder.findFirst({
				where: {
					projectTypeGroupId,
					projectTypeId: projectTypes[i],
				},
			});

			if (orderRecord) {
				await tx.projectTypeGroupOrder.update({
					where: { id: orderRecord.id },
					data: { order: i + 1 },
				});
			} else {
				await tx.projectTypeGroupOrder.create({
					data: {
						projectTypeGroupId,
						projectTypeId: projectTypes[i],
						order: i + 1,
					},
				});
			}
		}

		const updatedOrder = await tx.projectTypeGroupOrder.findMany({
			where: { projectTypeGroupId },
			orderBy: { order: 'asc' },
		});

		return responseHandler(updatedOrder, res, 200);
	});
}

export default new ProjectTypeGroupController();
