import PhaseServices from '../services/modelServices/phase.services.js';
import ProjectServices from '../services/modelServices/project.services.js';
import TimelineServices from '../services/modelServices/timeline.service.js';
import MasterPhaseServices from '../services/modelServices/master/masterPhase.services.js';
import TaskServices from '../services/modelServices/task.services.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import trackActivity from '../middlewares/activities.middleware.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';

class PhaseController {
	create = asyncHandler(async (req, res) => {
		const data = req.body;
		const { userId } = req.user;
		data.createdBy = userId;

		let projectId = null;

		if (data.projectId) {
			const project = await ProjectServices.findOne({ where: { id: data.projectId } });
			if (!project) return errorHandler('E-602', res);
			data.projectId = project.id;
			projectId = project.id;
		}
		if (data.timelineId) {
			const timeline = await TimelineServices.findOne({ where: { id: data.timelineId, projectId: data.projectId } });
			if (!timeline) return errorHandler('E-603', res);
			data.timelineId = timeline.id;
		}
		let masterPhase = null;
		if (data.masterPhaseCheck) {
			masterPhase = await MasterPhaseServices.create({
				data: { name: data.name, description: data.description, createdBy: userId },
			});
			data.masterPhaseId = masterPhase.id;
		}
		delete data.masterPhaseCheck;
		const phase = await PhaseServices.create({ data });
		phase.masterPhase = masterPhase ? { id: masterPhase.id, name: masterPhase.name, description: masterPhase.description } : null;

		// Track activity for phase creation
		if (projectId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.PHASE,
				entityId: phase.id,
				entityName: data.name,
				activities: [`Phase "${data.name}" created`],
				activityType: ACTIVITY_TYPES.CREATE,
			});
		}

		return responseHandler(phase, res);
	});

	get = asyncHandler(async (req, res) => {
		const {
			id,
			projectId,
			timelineId,
			search,
			searchText,
			pageNo = 0,
			pageLimit = 10,
			sortType = 'createdAt',
			sortOrder = -1,
		} = req.query;
		const where = { status: 'ACTIVE' };
		if (id) {
			where.id = id;
		}
		if (projectId) {
			where.projectId = projectId;
		}
		if (timelineId) {
			where.timelineId = timelineId;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		if (searchText) {
			where.OR = [
				{ name: { contains: searchText, mode: 'insensitive' } },
				{ description: { contains: searchText, mode: 'insensitive' } },
				{ project: { name: { contains: searchText, mode: 'insensitive' } } },
				{ masterPhase: { name: { contains: searchText, mode: 'insensitive' } } },
				{ timeline: { name: { contains: searchText, mode: 'insensitive' } } },
				{ Task: { name: { contains: searchText, mode: 'insensitive' } } },
			];
		}
		const totalCount = await PhaseServices.count({ where });
		const phases = await PhaseServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			select: {
				id: true,
				sNo: true,
				name: true,
				description: true,
				status: true,
				project: {
					select: {
						id: true,
						name: true,
					},
				},
				timeline: {
					select: {
						id: true,
						name: true,
					},
				},
				Task: {
					where: {
						status: 'ACTIVE',
					},
					select: {
						id: true,
						name: true,
						description: true,
						attachments: true,
						duration: true,
						priority: true,
						plannedStart: true,
						plannedEnd: true,
						taskStatus: true,
						unit: true,
						progress: true,
						notes: true,
						assignedByUser: {
							select: {
								id: true,
								name: true,
							},
						},
						assigneeUser: {
							select: {
								id: true,
								name: true,
							},
						},
						predecessors: {
							select: {
								id: true,
								predecessorTaskId: true,
								predecessorTask: {
									select: {
										id: true,
										name: true,
									},
								},
							},
						},
					},
				},
				masterPhase: true,
			},
			orderBy: {
				[sortType]: sortOrder == 1 ? 'asc' : 'desc',
			},
		});

		// When filtering by projectId, include tasks that have projectId but no phase (created without a phase)
		let tasksWithoutPhase = [];
		if (projectId) {
			tasksWithoutPhase = await TaskServices.findMany({
				where: {
					projectId,
					phaseId: null,
					status: 'ACTIVE',
				},
				select: {
					id: true,
					name: true,
					description: true,
					attachments: true,
					duration: true,
					priority: true,
					plannedStart: true,
					plannedEnd: true,
					taskStatus: true,
					unit: true,
					progress: true,
					notes: true,
					assignedByUser: {
						select: {
							id: true,
							name: true,
						},
					},
					assigneeUser: {
						select: {
							id: true,
							name: true,
						},
					},
					predecessors: {
						select: {
							id: true,
							predecessorTaskId: true,
							predecessorTask: {
								select: {
									id: true,
									name: true,
								},
							},
						},
					},
				},
			});
		}

		return responseHandler({ phases, totalCount, tasksWithoutPhase }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const data = req.body;
		const { userId } = req.user;

		// Get existing phase for activity tracking
		const existingPhase = await PhaseServices.findOne({ where: { id } });
		if (!existingPhase) return errorHandler('E-602', res);

		const projectId = existingPhase.projectId;
		const fieldUpdates = [];

		// Track changes
		if (data.name !== undefined && existingPhase.name !== data.name) {
			fieldUpdates.push(`Name updated from "${existingPhase.name}" to "${data.name}"`);
		}
		if (data.description !== undefined && existingPhase.description !== data.description) {
			fieldUpdates.push('Description updated');
		}
		if (data.status !== undefined && existingPhase.status !== data.status) {
			fieldUpdates.push(`Status changed to "${data.status}"`);
		}

		data.updatedBy = userId;
		const phase = await PhaseServices.update({ where: { id }, data });

		// Track activity for phase update
		if (fieldUpdates.length > 0 && projectId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.PHASE,
				entityId: id,
				entityName: phase.name || existingPhase.name,
				activities: fieldUpdates,
				activityType: ACTIVITY_TYPES.UPDATE,
			});
		}

		return responseHandler(phase, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		// Get existing phase for activity tracking
		const existingPhase = await PhaseServices.findOne({ where: { id } });
		if (!existingPhase) return errorHandler('E-602', res);

		const projectId = existingPhase.projectId;

		const phase = await PhaseServices.update({ where: { id }, data: { status: 'INACTIVE', updatedBy: userId } });

		// Track activity for phase deletion
		if (projectId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.PHASE,
				entityId: id,
				entityName: existingPhase.name,
				activities: [`Phase "${existingPhase.name}" deleted`],
				activityType: ACTIVITY_TYPES.DELETE,
			});
		}

		return responseHandler(phase, res);
	});
}

export default new PhaseController();
