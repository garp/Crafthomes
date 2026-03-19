import ProjectServices from '../services/modelServices/project.services.js';
import ProjectTypeServices from '../services/modelServices/projectType.services.js';
import ProjectTypeGroupServices from '../services/modelServices/projectTypeGroup.services.js';
import { asyncHandler, transactionHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import ClientServices from '../services/modelServices/client.services.js';
import PhaseServices from '../services/modelServices/phase.services.js';
import TaskServices from '../services/modelServices/task.services.js';
import TimelineService from '../services/modelServices/timeline.service.js';
import trackActivity from '../middlewares/activities.middleware.js';
import AttachmentServices from '../services/modelServices/attachment.services.js';
import QuotationServices from '../services/modelServices/quotations.service.js';
import UserServices from '../services/modelServices/user.services.js';
import ProjectUserServices from '../services/modelServices/projectUser.services.js';
import { startDateToDuration } from '../utils/functions/timeFunction.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';
import { sendNotification, sendNotificationBatch, NOTIFICATION_TYPES } from '../socket/emitters/notification.emitter.js';
import MOMServices from '../services/modelServices/mom.services.js';
import SnagServices from '../services/modelServices/snag.services.js';
import PaymentServices from '../services/modelServices/payment.services.js';
import DeliverableServices from '../services/modelServices/deliverable.services.js';
import FolderServices from '../services/modelServices/folder.services.js';
import CommentServices from '../services/modelServices/comment.services.js';
import SubTaskServices from '../services/modelServices/subTask.services.js';

/**
 * Check if the logged-in user can access the given project.
 * Used for by-id endpoints (summary, getAssignedUsers, getLinkedData, update, delete).
 * Mirrors the same rules as the project list (get): INTERNAL non–full-access users
 * only see projects they're assigned to, or created, or manage.
 * @param {object} loggedInUser - req.user (userId, userType, role?, designation?)
 * @param {object|string} projectOrId - project object (with id, optional createdBy, assignProjectManager, clientId) or projectId string
 * @returns {Promise<boolean>}
 */
async function canAccessProject(loggedInUser, projectOrId) {
	if (!loggedInUser?.userId) return false;
	const projectId = typeof projectOrId === 'string' ? projectOrId : projectOrId?.id;
	if (!projectId) return false;

	let project = typeof projectOrId === 'object' && projectOrId !== null ? projectOrId : null;
	if (!project || project.createdBy === undefined || project.assignProjectManager === undefined || (loggedInUser.userType !== 'INTERNAL' && project.clientId === undefined)) {
		project = await ProjectServices.findOne({
			where: { id: projectId },
			select: { id: true, createdBy: true, assignProjectManager: true, clientId: true },
		});
	}
	if (!project) return false;

	// INTERNAL: full access (super_admin or Founder/Management) or assigned/creator/PM
	if (loggedInUser.userType === 'INTERNAL') {
		const designationName = loggedInUser.designation?.name || '';
		const designationKey = designationName.toUpperCase();
		const fullAccessDesignationKeys = new Set(['FOUNDER_MANAGEMENT', 'FOUNDER']);
		const hasFullAccess =
			loggedInUser?.role?.name === 'super_admin' || fullAccessDesignationKeys.has(designationKey);
		if (hasFullAccess) return true;

		const assigned = await ProjectUserServices.findMany({
			where: { userId: loggedInUser.userId, projectId },
			select: { id: true },
		});
		if (assigned.length > 0) return true;
		if (project.createdBy === loggedInUser.userId) return true;
		if (project.assignProjectManager === loggedInUser.userId) return true;
		return false;
	}

	// CLIENT: only projects assigned to their organization (project.clientId = user.clientId)
	if (loggedInUser.userType === 'CLIENT') {
		const fullUser = await UserServices.findOne({
			where: { id: loggedInUser.userId },
			select: { clientId: true },
		});
		if (!fullUser?.clientId) return false;
		return project.clientId === fullUser.clientId;
	}

	// CLIENT_CONTACT: same client and assigned via ProjectUser
	if (loggedInUser.userType === 'CLIENT_CONTACT') {
		const fullUser = await UserServices.findOne({
			where: { id: loggedInUser.userId },
			select: { clientId: true },
		});
		if (!fullUser?.clientId || project.clientId !== fullUser.clientId) return false;
		const assigned = await ProjectUserServices.findMany({
			where: { userId: loggedInUser.userId, projectId, userType: 'CLIENT_CONTACT' },
			select: { id: true },
		});
		return assigned.length > 0;
	}

	return false;
}

class ProjectController {
	summary = asyncHandler(async (req, res) => {
		const { projectId } = req.params;
		const project = await ProjectServices.findOne({
			where: { id: projectId },
			select: {
				id: true,
				sNo: true,
				name: true,
				paymentStatus: true,
				createdBy: true,
				assignProjectManager: true,
				clientId: true,
				client: {
					select: {
						id: true,
						name: true,
					},
				},
				projectManager: {
					select: {
						id: true,
						name: true,
					},
				},
				startDate: true,
				endDate: true,
			},
		});

		if (!project) return errorHandler('E-404', res);
		const canAccess = await canAccessProject(req.user, project);
		if (!canAccess) return errorHandler('E-007', res, 'You do not have access to this project.');

		const totalTasks = await TaskServices.count({
			where: { phase: { projectId } },
		});

		const timelines = await TimelineService.findMany({
			where: { projectId },
			select: {
				id: true,
				name: true,
				timelineStatus: true,
				Phase: {
					select: {
						id: true,
						name: true,
						Task: {
							select: {
								id: true,
								name: true,
								taskStatus: true,
							},
						},
					},
				},
			},
		});

		// Process timeline data
		const allPhases = [];
		let totalPhases = 0;

		timelines.forEach(timeline => {
			timeline.Phase.forEach(phase => {
				const totalPhaseTasks = phase.Task.length;
				const completedTasks = phase.Task.filter(task => task.taskStatus === 'COMPLETED').length;

				// Calculate completion percentage
				const completionPercentage = totalPhaseTasks > 0 ? Math.round((completedTasks / totalPhaseTasks) * 100) : 0;

				allPhases.push({
					id: phase.id,
					name: phase.name,
					timelineId: timeline.id,
					totalTasks: totalPhaseTasks,
					completionPercentage,
				});

				totalPhases++;
			});
		});

		const timelineDetails = {
			totalTimelines: timelines.length,
			totalPhases,
			phases: allPhases,
		};

		const data = {
			id: project.id,
			sNo: project.sNo,
			name: project.name,
			paymentStatus: project.paymentStatus,
			quotation: 'PENDING',
			totalTasks,
			client: project.client,
			projectManager: project.projectManager,
			startDate: project.startDate,
			endDate: project.endDate,
			projectType: 'INDIVIDUAL',
			timelineDetails,
		};

		return responseHandler(data, res);
	});

	create = transactionHandler(async (req, res, _next, tx) => {
		const {
			name,
			clientId,
			projectTypeId,
			projectTypeGroupId,
			projectTypeIds = [],
			estimatedBudget,
			currency = 'INR',
			paymentStatus = 'PENDING',
			city,
			state,
			address,
			startDate,
			endDate,
			assignProjectManager,
			assignClientContact = [],
			assignedInternalUsersId = [],
			description,
			projectDescription,
			attachments = [],
		} = req.body;
		const normalizedDescription = description ?? projectDescription ?? null;
		const { userId } = req.user;

		// Check if client exists (only if clientId is provided)
		if (clientId) {
			const clientExists = await ClientServices.findOne(
				{
					where: { id: clientId },
				},
				tx
			);
			if (!clientExists) {
				return errorHandler('E-301', res);
			}
		}

		// Validate project type group exists (if provided)
		if (projectTypeGroupId) {
			const projectTypeGroupExists = await ProjectTypeGroupServices.findOne(
				{
					where: { id: projectTypeGroupId },
				},
				tx
			);
			if (!projectTypeGroupExists) {
				return errorHandler('E-405', res);
			}
		}

		// Validate all project types exist (if projectTypeIds provided)
		let validatedProjectTypes = [];
		if (projectTypeIds && projectTypeIds.length > 0) {
			validatedProjectTypes = await ProjectTypeServices.findMany(
				{
					where: { id: { in: projectTypeIds }, status: 'ACTIVE' },
					select: { id: true },
				},
				tx
			);

			if (validatedProjectTypes.length !== projectTypeIds.length) {
				return errorHandler('E-405', res);
			}

			// Validate project types belong to the group (if group is provided)
			if (projectTypeGroupId) {
				const groupMappings = await tx.projectTypeGroupProjectType.findMany({
					where: {
						projectTypeGroupId,
						projectTypeId: { in: projectTypeIds },
					},
				});
				if (groupMappings.length !== projectTypeIds.length) {
					return errorHandler('E-405', res);
				}
			}
		}

		// Check if legacy single project type exists (if provided and no projectTypeIds)
		if (projectTypeId && (!projectTypeIds || projectTypeIds.length === 0)) {
			const projectTypeExists = await ProjectTypeServices.findOne(
				{
					where: { id: projectTypeId },
				},
				tx
			);
			if (!projectTypeExists) {
				return errorHandler('E-405', res);
			}
		}

		// Calculate duration if both start and end dates are provided
		const duration = (startDate && endDate) ? startDateToDuration(startDate, endDate) : null;

		// Determine which projectTypeId to store on the project (first one if multiple, or legacy single)
		const primaryProjectTypeId = (projectTypeIds && projectTypeIds.length > 0) ? projectTypeIds[0] : projectTypeId;

		// Create the project first
		const project = await ProjectServices.create(
			{
				data: {
					name,
					clientId,
					projectTypeId: primaryProjectTypeId,
					estimatedBudget,
					currency,
					paymentStatus,
					city,
					state,
					address,
					startDate: new Date(startDate),
					endDate: endDate ? new Date(endDate) : null,
					duration,
					assignProjectManager,
					assignClientContact,
					description: normalizedDescription,
					status: 'ACTIVE',
					projectStatus: 'NOT_STARTED',
					createdBy: userId,
				},
			},
			tx
		);

		// Create ProjectUser records for client contacts
		if (Array.isArray(assignClientContact) && assignClientContact.length > 0) {
			await ProjectUserServices.createMany(
				{
					data: assignClientContact.map(contactId => ({
						userId: contactId,
						projectId: project.id,
						userType: 'CLIENT_CONTACT',
						createdBy: userId,
					})),
				},
				tx
			);
		}

		// Create ProjectUser records for assigned internal users
		if (Array.isArray(assignedInternalUsersId) && assignedInternalUsersId.length > 0) {
			await ProjectUserServices.createMany(
				{
					data: assignedInternalUsersId.map(assignedUserId => ({
						userId: assignedUserId,
						projectId: project.id,
						userType: 'INTERNAL',
						createdBy: userId,
					})),
				},
				tx
			);
		}

		// Handle attachments if provided (relation field)
		if (attachments && attachments.length > 0) {
			await AttachmentServices.createMany(
				{
					data: attachments.map(att => ({ ...att, projectId: project.id, createdBy: userId })),
				},
				tx
			);
		}

		// Track activity for project creation
		await trackActivity(
			userId,
			{
				projectId: project.id,
				entityType: ENTITY_TYPES.PROJECT,
				entityId: project.id,
				entityName: name,
				activities: [`Project "${name}" created`],
				activityType: ACTIVITY_TYPES.CREATE,
			},
			tx
		);

		// Send in-app notifications for project assignments (non-blocking)
		const projectAssigneeIds = [];
		if (assignProjectManager) projectAssigneeIds.push(assignProjectManager);
		if (Array.isArray(assignedInternalUsersId)) projectAssigneeIds.push(...assignedInternalUsersId);
		if (Array.isArray(assignClientContact)) projectAssigneeIds.push(...assignClientContact);

		if (projectAssigneeIds.length > 0) {
			sendNotificationBatch(projectAssigneeIds, {
				actorId: userId,
				type: NOTIFICATION_TYPES.PROJECT_ASSIGNED,
				title: `You were added to project "${name}"`,
				metadata: { projectId: project.id },
			});
		}

		return responseHandler(project, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const loggedInUser = req.user;
		const {
			id,
			search,
			pageNo = 0,
			pageLimit = 10,
			status = 'ACTIVE',
			projectStatus,
			searchText,
			sortType = 'sNo',
			sortOrder = 0,
		} = req.query;
		const where = {};
		const orderBy = {};
		if (sortType) {
			orderBy[sortType] = sortOrder === 0 ? 'asc' : 'desc';
		}

		// Access control for INTERNAL users based on designation:
		// - super_admin role OR FOUNDER_MANAGEMENT/Founder designation: can see ALL projects
		// - Other designations: can only see projects where they are assigned via ProjectUser
		//   plus projects they created / manage (createdBy / assignProjectManager)
		if (loggedInUser?.userType === 'INTERNAL') {
			const designationName = loggedInUser.designation?.name || '';
			const designationKey = designationName.toUpperCase();

			// Designations that can see all projects (case-insensitive)
			const fullAccessDesignationKeys = new Set(['FOUNDER_MANAGEMENT', 'FOUNDER']);
			const hasFullAccess =
				loggedInUser?.role?.name === 'super_admin' || fullAccessDesignationKeys.has(designationKey);

			// If NOT Founder/Management, restrict to assigned projects only
			if (!hasFullAccess) {
				const assignedProjects = await ProjectUserServices.findMany({
					where: { userId: loggedInUser.userId },
					select: { projectId: true },
				});

				const projectIds = assignedProjects.map(ap => ap.projectId).filter(Boolean);

				if (!where.AND) {
					where.AND = [];
				}

				// Visibility for non-full-access internal users:
				// - assigned via ProjectUser OR
				// - project created by them OR
				// - project managed by them
				const visibilityOr = [
					{ createdBy: loggedInUser.userId },
					{ assignProjectManager: loggedInUser.userId },
				];
				if (projectIds.length > 0) {
					visibilityOr.unshift({ id: { in: projectIds } });
				}

				where.AND.push({ OR: visibilityOr });
			}
			// Founder/Management sees all projects - no filter needed
		}

		// Access control:
		// - CLIENT: can see only projects assigned to their organization (project.clientId = user.clientId)
		// - CLIENT_CONTACT: same client AND only projects where they are assigned via ProjectUser
		if (loggedInUser?.userType === 'CLIENT' || loggedInUser?.userType === 'CLIENT_CONTACT') {
			const fullUser = await UserServices.findOne({
				where: { id: loggedInUser.userId },
				select: { clientId: true },
			});

			if (!fullUser?.clientId) {
				// No clientId: ensure they see no projects (safe default)
				if (!where.AND) where.AND = [];
				where.AND.push({ id: { in: [] } });
			} else {
				// Restrict to projects of their client organization
				where.clientId = fullUser.clientId;

				// CLIENT_CONTACT: further restrict to only projects where this user is assigned via ProjectUser
				if (loggedInUser.userType === 'CLIENT_CONTACT') {
					const assignedProjects = await ProjectUserServices.findMany({
						where: { userId: loggedInUser.userId, userType: 'CLIENT_CONTACT' },
						select: { projectId: true },
					});

					const projectIds = assignedProjects.map(ap => ap.projectId).filter(Boolean);

					if (!where.AND) where.AND = [];
					where.AND.push({
						id: { in: projectIds.length > 0 ? projectIds : [] },
					});
				}
			}
		}

		// Filter by ID if provided
		if (id) {
			where.id = id;
		}

		// Filter by status if provided
		if (status) {
			where.status = status;
		}

		// Filter by project status if provided
		if (projectStatus) {
			where.projectStatus = projectStatus;
		}

		// Search by name if provided
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}

		if (searchText) {
			where.OR = [
				{ name: { contains: searchText, mode: 'insensitive' } },
				{ client: { name: { contains: searchText, mode: 'insensitive' } } },
				{ projectType: { name: { contains: searchText, mode: 'insensitive' } } },
			];
		}

		// Get total count
		const totalCount = await ProjectServices.count({ where });
		const totalClients = await ClientServices.count({ where: { status: 'ACTIVE' } });

		// Get projects with pagination
		const projects = await ProjectServices.findMany({
			where,
			select: {
				id: true,
				sNo: true,
				name: true,
				description: true,
				estimatedBudget: true,
				currency: true,
				paymentStatus: true,
				projectStatus: true,
				city: true,
				state: true,
				address: true,
				startDate: true,
				endDate: true,
				duration: true,
				attachments: true,
				status: true,
				updatedAt: true,
				client: {
					select: {
						id: true,
						name: true,
						email: true,
						phoneNumber: true,
					},
				},
				projectType: {
					select: {
						id: true,
						name: true,
					},
				},
				projectManager: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				phases: {
					select: {
						id: true,
						name: true,
						description: true,
						masterPhaseId: true,
					},
				},
				teamMembers: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				projectUsers: {
					select: {
						id: true,
						userId: true,
						userType: true,
						user: {
							select: {
								id: true,
								name: true,
								email: true,
								phoneNumber: true,
								designation: {
									select: {
										id: true,
										name: true,
										displayName: true,
									},
								},
							},
						},
					},
				},
				timeline: {
					select: {
						id: true,
						name: true,
						order: true,
					},
					orderBy: { order: 'asc' },
				},
			},
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy,
		});

		// Get project IDs to calculate progress for each project
		const projectIds = projects.map(p => p.id);

		// Get task counts for all projects in one query (total and completed)
		const taskCountsPromises = projectIds.map(async projectId => {
			const [totalTasks, completedTasks] = await Promise.all([
				TaskServices.count({ where: { phase: { projectId }, status: 'ACTIVE' } }),
				TaskServices.count({ where: { phase: { projectId }, status: 'ACTIVE', taskStatus: 'COMPLETED' } }),
			]);
			return {
				projectId,
				totalTasks,
				completedTasks,
				progress: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
			};
		});

		const taskCountsResults = await Promise.all(taskCountsPromises);
		const progressMap = new Map(taskCountsResults.map(tc => [tc.projectId, tc]));

		// Get all project types with their groups for matching timelines
		const allProjectTypes = await ProjectTypeServices.findMany({
			where: { status: 'ACTIVE' },
			select: {
				id: true,
				name: true,
				projectTypeGroups: {
					select: {
						projectTypeGroupId: true,
					},
				},
			},
		});

		// Create a map of project type name to project type data (case-insensitive)
		const projectTypeByName = new Map(
			allProjectTypes.map(pt => [pt.name.toLowerCase().trim(), pt])
		);

		// Compute assignClientContactDetails from projectUsers where userType='CLIENT_CONTACT'
		// This maintains backward compatibility with existing response format
		const projectsWithContacts = projects.map(project => {
			// Extract client contacts from projectUsers
			const clientContactUsers = (project.projectUsers || [])
				.filter(pu => pu.userType === 'CLIENT_CONTACT')
				.map(pu => ({
					id: pu.user.id,
					name: pu.user.name,
					email: pu.user.email,
					phoneNumber: pu.user.phoneNumber,
				}));

			// Build assignClientContact array (just IDs) for backward compatibility
			const assignClientContact = clientContactUsers.map(u => u.id);

			// Get progress data for this project
			const progressData = progressMap.get(project.id) || { totalTasks: 0, completedTasks: 0, progress: 0 };

			// Derive projectTypes from timelines by matching timeline names to project type names
			const projectTypes = [];
			const projectTypeIds = [];
			if (project.timeline && project.timeline.length > 0) {
				for (const tl of project.timeline) {
					// Timeline name matches project type name
					const matchedType = projectTypeByName.get(tl.name.toLowerCase().trim());
					if (matchedType) {
						projectTypes.push({ id: matchedType.id, name: matchedType.name });
						projectTypeIds.push(matchedType.id);
					}
				}
			}

			// Derive projectTypeGroupId from the first project type's groups
			let projectTypeGroupId = null;
			if (project.projectType?.id) {
				const primaryType = allProjectTypes.find(pt => pt.id === project.projectType.id);
				if (primaryType && primaryType.projectTypeGroups && primaryType.projectTypeGroups.length > 0) {
					projectTypeGroupId = primaryType.projectTypeGroups[0].projectTypeGroupId;
				}
			}

			return {
				...project,
				assignClientContact, // Override with computed value from ProjectUser
				assignClientContactDetails: clientContactUsers,
				totalTasks: progressData.totalTasks,
				completedTasks: progressData.completedTasks,
				progress: progressData.progress,
				projectTypes, // Array of { id, name } for timeline templates
				projectTypeIds, // Array of project type IDs
				projectTypeGroupId, // First project type group ID
			};
		});

		// Calculate average progress across all projects
		const allProgressValues = taskCountsResults.map(tc => tc.progress);
		const avgProgress = allProgressValues.length > 0
			? Math.round(allProgressValues.reduce((sum, p) => sum + p, 0) / allProgressValues.length)
			: 0;

		// Call analytics service
		const stats = await ProjectServices.stats();
		stats.totalClients = totalClients;
		stats.avgProgress = avgProgress;
		// Return response with analytics
		return responseHandler({ projects: projectsWithContacts, totalCount, stats }, res);
	});

	update = transactionHandler(async (req, res, _, tx) => {
		const { projectId } = req.params;
		const { userId } = req.user;
		const { attachments, clientId, projectTypeId, assignProjectManager, assignedInternalUsersId, assignClientContact } = req.body;
		const normalizedDescription = req.body.description ?? req.body.projectDescription;

		const existingProject = await ProjectServices.findOne({ where: { id: projectId } }, tx);
		if (!existingProject) return errorHandler('E-404', res);
		const canAccess = await canAccessProject(req.user, existingProject);
		if (!canAccess) return errorHandler('E-007', res, 'You do not have access to this project.');

		const fieldUpdates = [];
		const updateData = { updatedBy: userId };
		const allowedFields = [
			'name',
			'estimatedBudget',
			'currency',
			'paymentStatus',
			'city',
			'state',
			'address',
			'startDate',
			'endDate',
			'status',
			'projectStatus',
			'addressId',
		];

		allowedFields.forEach(field => {
			if (req.body[field] !== undefined && existingProject[field] !== req.body[field]) {
				updateData[field] = req.body[field];
				// Track changes
				if (field === 'name') {
					fieldUpdates.push(`Name updated from "${existingProject.name}" to "${req.body[field]}"`);
				} else if (field === 'projectStatus') {
					fieldUpdates.push(`Project status changed from "${existingProject.projectStatus}" to "${req.body[field]}"`);
				} else if (field === 'paymentStatus') {
					fieldUpdates.push(`Payment status changed to "${req.body[field]}"`);
				} else if (field === 'estimatedBudget') {
					fieldUpdates.push(`Estimated budget updated to ${req.body[field]}`);
				} else if (field === 'startDate' || field === 'endDate') {
					fieldUpdates.push(`${field === 'startDate' ? 'Start' : 'End'} date updated`);
				} else if (field === 'city' || field === 'state' || field === 'address') {
					fieldUpdates.push(`Location details updated`);
				}
			} else if (req.body[field] !== undefined) {
				updateData[field] = req.body[field];
			}
		});

		if (normalizedDescription !== undefined && existingProject.description !== normalizedDescription) {
			updateData.description = normalizedDescription;
			fieldUpdates.push('Description updated');
		} else if (normalizedDescription !== undefined) {
			updateData.description = normalizedDescription;
		}

		// Recalculate duration if startDate or endDate are being updated
		const isStartDateUpdated = req.body.startDate !== undefined;
		const isEndDateUpdated = req.body.endDate !== undefined;
		if (isStartDateUpdated || isEndDateUpdated) {
			const newStartDate = isStartDateUpdated ? req.body.startDate : existingProject.startDate;
			const newEndDate = isEndDateUpdated ? req.body.endDate : existingProject.endDate;
			updateData.duration = (newStartDate && newEndDate) ? startDateToDuration(newStartDate, newEndDate) : null;
		}

		if (clientId !== undefined) {
			if (clientId) {
				const clientExists = await ClientServices.findOne({ where: { id: clientId } }, tx);
				if (!clientExists) {
					return errorHandler('E-301', res);
				}
				updateData.client = { connect: { id: clientId } };
				if (existingProject.clientId !== clientId) {
					fieldUpdates.push('Client updated');
				}
			} else {
				updateData.client = { disconnect: true };
				fieldUpdates.push('Client removed');
			}
		}

		if (projectTypeId !== undefined) {
			if (projectTypeId) {
				const projectTypeExists = await ProjectTypeServices.findOne({ where: { id: projectTypeId } }, tx);
				if (!projectTypeExists) {
					return errorHandler('E-405', res);
				}
				updateData.projectType = { connect: { id: projectTypeId } };
				if (existingProject.projectTypeId !== projectTypeId) {
					fieldUpdates.push('Project type updated');
				}
			} else {
				updateData.projectType = { disconnect: true };
				fieldUpdates.push('Project type removed');
			}
		}

		if (assignProjectManager !== undefined) {
			if (assignProjectManager) {
				const managerExists = await UserServices.findOne({ where: { id: assignProjectManager } }, tx);
				if (!managerExists) {
					return errorHandler('E-104', res);
				}
				updateData.projectManager = { connect: { id: assignProjectManager } };
				if (existingProject.assignProjectManager !== assignProjectManager) {
					fieldUpdates.push('Project manager updated');

					// Notify new PM (non-blocking)
					sendNotification({
						userId: assignProjectManager,
						actorId: userId,
						type: NOTIFICATION_TYPES.PROJECT_ASSIGNED,
						title: `You were assigned as project manager for "${existingProject.name}"`,
						metadata: { projectId },
					});
				}
			} else {
				updateData.projectManager = { disconnect: true };
				fieldUpdates.push('Project manager removed');
			}
		}

		const project = await ProjectServices.update(
			{
				where: { id: projectId },
				data: updateData,
			},
			tx
		);

		if (attachments !== undefined && Array.isArray(attachments) && attachments.length > 0) {
			const attachmentKeys = attachments.map(att => att.key).filter(Boolean);

			let existingAttachments = [];
			if (attachmentKeys.length > 0) {
				existingAttachments = await AttachmentServices.findMany(
					{
						where: {
							projectId,
							key: { in: attachmentKeys },
						},
					},
					tx
				);
			}

			const nonExistingAttachments = attachments.filter(
				att => !existingAttachments.some(existing => existing.key === att.key)
			);

			if (nonExistingAttachments.length > 0) {
				await AttachmentServices.createMany(
					{
						data: nonExistingAttachments.map(att => ({
							...att,
							projectId,
							createdBy: userId,
							updatedBy: userId,
						})),
					},
					tx
				);
				fieldUpdates.push(`${nonExistingAttachments.length} attachment(s) added`);
			}
		}

		// Handle assignedInternalUsersId update (replace strategy for INTERNAL users)
		if (assignedInternalUsersId !== undefined && Array.isArray(assignedInternalUsersId)) {
			// Delete existing INTERNAL ProjectUser records for this project
			await ProjectUserServices.deleteMany(
				{
					where: { projectId, userType: 'INTERNAL' },
				},
				tx
			);

			// Create new ProjectUser records if array is not empty
			if (assignedInternalUsersId.length > 0) {
				await ProjectUserServices.createMany(
					{
						data: assignedInternalUsersId.map(assignedUserId => ({
							userId: assignedUserId,
							projectId,
							userType: 'INTERNAL',
							createdBy: userId,
						})),
					},
					tx
				);
			}
			fieldUpdates.push('Assigned internal users updated');
		}

		// Handle assignClientContact update (replace strategy for CLIENT_CONTACT users)
		if (assignClientContact !== undefined && Array.isArray(assignClientContact)) {
			// Delete existing CLIENT_CONTACT ProjectUser records for this project
			await ProjectUserServices.deleteMany(
				{
					where: { projectId, userType: 'CLIENT_CONTACT' },
				},
				tx
			);

			// Create new ProjectUser records if array is not empty
			if (assignClientContact.length > 0) {
				await ProjectUserServices.createMany(
					{
						data: assignClientContact.map(contactId => ({
							userId: contactId,
							projectId,
							userType: 'CLIENT_CONTACT',
							createdBy: userId,
						})),
					},
					tx
				);
			}
			fieldUpdates.push('Client contacts updated');
		}

		// Track activity for project update
		if (fieldUpdates.length > 0) {
			await trackActivity(
				userId,
				{
					projectId,
					entityType: ENTITY_TYPES.PROJECT,
					entityId: projectId,
					entityName: project.name || existingProject.name,
					activities: fieldUpdates,
					activityType: ACTIVITY_TYPES.UPDATE,
				},
				tx
			);
		}

		return responseHandler(project, res);
	});

	delete = transactionHandler(async (req, res, _, tx) => {
		const { projectId } = req.params;
		const { userId } = req.user;

		// Check if project exists
		const existingProject = await ProjectServices.findOne({
			where: { id: projectId },
		});

		if (!existingProject) return errorHandler('E-404', res);
		const canAccess = await canAccessProject(req.user, existingProject);
		if (!canAccess) return errorHandler('E-007', res, 'You do not have access to this project.');

		// Soft delete - update status for all linked entities (each model may use different field/enum)
		const updateData = { status: 'INACTIVE', updatedBy: userId };
		const quotationUpdateData = { quotationStatus: 'CANCELLED', updatedBy: userId };
		const attachmentUpdateData = { status: 'DELETED', updatedBy: userId };
		const folderUpdateData = { status: 'DELETED', updatedBy: userId };

		// 1. Update project status
		await ProjectServices.update(
			{
				where: { id: projectId },
				data: updateData,
			},
			tx
		);

		// 2. Update all phases linked to this project
		await PhaseServices.updateMany(
			{
				where: { projectId },
				data: updateData,
			},
			tx
		);

		// 3. Update all tasks linked to this project (via phases)
		await TaskServices.updateMany(
			{
				where: { phase: { projectId } },
				data: updateData,
			},
			tx
		);

		// 4. Update all timelines linked to this project
		await TimelineService.updateMany(
			{
				where: { projectId },
				data: updateData,
			},
			tx
		);

		// 5. Update all payments linked to this project
		await PaymentServices.updateMany(
			{
				where: { projectId },
				data: updateData,
			},
			tx
		);

		// 6. Update all quotations linked to this project (Quotation uses quotationStatus, not status)
		await QuotationServices.updateMany(
			{
				where: { projectId },
				data: quotationUpdateData,
			},
			tx
		);

		// 7. Update all attachments/files linked to this project (Attachment uses AttachmentStatus: DELETED)
		await AttachmentServices.updateMany(
			{
				where: { projectId },
				data: attachmentUpdateData,
			},
			tx
		);

		// 8. Update all folders linked to this project (Folder uses FolderStatus: DELETED)
		await FolderServices.updateMany(
			{
				where: { projectId },
				data: folderUpdateData,
			},
			tx
		);

		// 9. Update all snags linked to this project
		await SnagServices.updateMany(
			{
				where: { projectId },
				data: updateData,
			},
			tx
		);

		// 10. Update all MOMs linked to this project
		await MOMServices.updateMany(
			{
				where: { projectId },
				data: updateData,
			},
			tx
		);

		// 11. Update all deliverables linked to this project
		await DeliverableServices.updateMany(
			{
				where: { projectId },
				data: updateData,
			},
			tx
		);

		// Track activity for project deletion
		await trackActivity(
			userId,
			{
				projectId,
				entityType: ENTITY_TYPES.PROJECT,
				entityId: projectId,
				entityName: existingProject.name,
				activities: [`Project "${existingProject.name}" deleted`],
				activityType: ACTIVITY_TYPES.DELETE,
			},
			tx
		);

		return responseHandler({ message: 'Project deleted successfully' }, res, 200);
	});

	/**
	 * Get all users assigned to a project
	 * Returns flat list of users in same format as internal-user API
	 */
	getAssignedUsers = asyncHandler(async (req, res) => {
		const { projectId } = req.params;
		const { search } = req.query;

		// User select fields - consistent with internal-user API
		const userSelect = {
			id: true,
			sNo: true,
			name: true,
			email: true,
			phoneNumber: true,
			role: {
				select: {
					id: true,
					name: true,
				},
			},
			designation: {
				select: {
					id: true,
					name: true,
					displayName: true,
					meta: true,
				},
			},
			startDate: true,
			createdAt: true,
			department: true,
			userType: true,
			inviteState: true,
			status: true,
		};

		// Get project with all related user data
		const project = await ProjectServices.findOne({
			where: { id: projectId },
			select: {
				id: true,
				name: true,
				clientId: true,
				createdBy: true,
				assignProjectManager: true,
				assignClientContact: true, // Legacy array of user IDs
				// All ProjectUser entries (both INTERNAL and CLIENT_CONTACT)
				projectUsers: {
					select: {
						id: true,
						userType: true,
						user: {
							select: userSelect,
						},
					},
				},
			},
		});

		if (!project) return errorHandler('E-404', res);
		const canAccess = await canAccessProject(req.user, project);
		if (!canAccess) return errorHandler('E-007', res, 'You do not have access to this project.');

		// Collect all users
		const usersMap = new Map();

		// 1. Add project manager if exists
		if (project.assignProjectManager) {
			const projectManager = await UserServices.findOne({
				where: { id: project.assignProjectManager },
				select: userSelect,
			});
			if (projectManager) {
				usersMap.set(projectManager.id, projectManager);
			}
		}

		// 2. Add CLIENT users (users with userType='CLIENT' who belong to this client)
		if (project.clientId) {
			const clientUsers = await UserServices.findMany({
				where: {
					clientId: project.clientId,
					userType: 'CLIENT',
					status: 'ACTIVE',
				},
				select: userSelect,
			});
			clientUsers.forEach(user => {
				if (!usersMap.has(user.id)) {
					usersMap.set(user.id, user);
				}
			});
		}

		// 3. Add all projectUsers (internal + client contacts from new ProjectUser table)
		(project.projectUsers || []).forEach(pu => {
			if (pu.user && !usersMap.has(pu.user.id)) {
				usersMap.set(pu.user.id, pu.user);
			}
		});

		// 4. Add legacy assignClientContact users (for backward compatibility with old data)
		if (Array.isArray(project.assignClientContact) && project.assignClientContact.length > 0) {
			const legacyClientContacts = await UserServices.findMany({
				where: {
					id: { in: project.assignClientContact },
				},
				select: userSelect,
			});
			legacyClientContacts.forEach(user => {
				if (!usersMap.has(user.id)) {
					usersMap.set(user.id, user);
				}
			});
		}

		// Convert map to array
		let users = Array.from(usersMap.values());

		// Apply search filter if provided
		if (search) {
			const searchLower = search.toLowerCase();
			users = users.filter(user =>
				user.name?.toLowerCase().includes(searchLower) ||
				user.email?.toLowerCase().includes(searchLower)
			);
		}

		return responseHandler({ users, totalCount: users.length }, res);
	});

	/**
	 * Get all linked data for a project before deletion
	 * Returns counts and details of all associated entities
	 */
	getLinkedData = asyncHandler(async (req, res) => {
		const { projectId } = req.params;

		// Check if project exists
		const project = await ProjectServices.findOne({
			where: { id: projectId },
			select: {
				id: true,
				name: true,
				status: true,
				projectStatus: true,
				createdBy: true,
				assignProjectManager: true,
				clientId: true,
			},
		});

		if (!project) return errorHandler('E-404', res);
		const canAccess = await canAccessProject(req.user, project);
		if (!canAccess) return errorHandler('E-007', res, 'You do not have access to this project.');

		// Fetch all linked data counts and details in parallel
		const [
			phases,
			tasks,
			incompleteTasks,
			completedTasks,
			attachments,
			folders,
			snags,
			openSnags,
			moms,
			quotations,
			payments,
			deliverables,
			pendingDeliverables,
			subTasks,
			assignedUsers,
		] = await Promise.all([
			// Phases count
			PhaseServices.count({ where: { projectId, status: 'ACTIVE' } }),
			// Total tasks count
			TaskServices.count({ where: { phase: { projectId }, status: 'ACTIVE' } }),
			// Incomplete tasks (not COMPLETED)
			TaskServices.findMany({
				where: {
					phase: { projectId },
					status: 'ACTIVE',
					taskStatus: { not: 'COMPLETED' },
				},
				select: {
					id: true,
					name: true,
					taskStatus: true,
					priority: true,
					dueDate: true,
					phase: { select: { name: true } },
				},
				take: 10, // Limit to first 10 for preview
			}),
			// Completed tasks count
			TaskServices.count({
				where: { phase: { projectId }, status: 'ACTIVE', taskStatus: 'COMPLETED' },
			}),
			// Attachments count
			AttachmentServices.count({ where: { projectId } }),
			// Folders count
			FolderServices.count({ where: { projectId } }),
			// Snags count
			SnagServices.count({ where: { projectId } }),
			// Open snags (not resolved)
			SnagServices.findMany({
				where: { projectId, snagStatus: { not: 'RESOLVED' } },
				select: { id: true, title: true, snagStatus: true, priority: true },
				take: 10,
			}),
			// MOMs count
			MOMServices.count({ where: { projectId } }),
			// Quotations count
			QuotationServices.count({ where: { projectId } }),
			// Payments count
			PaymentServices.count({ where: { projectId } }),
			// Deliverables count
			DeliverableServices.count({ where: { projectId } }),
			// Pending deliverables (not COMPLETED)
			DeliverableServices.findMany({
				where: { projectId, deliverableStatus: { not: 'COMPLETED' } },
				select: { id: true, taskId: true, deliverableStatus: true, task: { select: { name: true } } },
				take: 10,
			}),
			// SubTasks count (via tasks -> phases)
			SubTaskServices.count({
				where: { parentTask: { phase: { projectId } } },
			}),
			// Assigned users count
			ProjectUserServices.count({ where: { projectId } }),
		]);

		// Calculate incomplete tasks count
		const incompleteTasksCount = await TaskServices.count({
			where: { phase: { projectId }, status: 'ACTIVE', taskStatus: { not: 'COMPLETED' } },
		});

		// Calculate open snags count
		const openSnagsCount = await SnagServices.count({
			where: { projectId, snagStatus: { not: 'RESOLVED' } },
		});

		// Calculate pending deliverables count (not COMPLETED)
		const pendingDeliverablesCount = await DeliverableServices.count({
			where: { projectId, deliverableStatus: { not: 'COMPLETED' } },
		});

		const linkedData = {
			project: {
				id: project.id,
				name: project.name,
				status: project.status,
				projectStatus: project.projectStatus,
			},
			summary: {
				totalPhases: phases,
				totalTasks: tasks,
				completedTasks,
				incompleteTasks: incompleteTasksCount,
				totalAttachments: attachments,
				totalFolders: folders,
				totalSnags: snags,
				openSnags: openSnagsCount,
				totalMOMs: moms,
				totalQuotations: quotations,
				totalPayments: payments,
				totalDeliverables: deliverables,
				pendingDeliverables: pendingDeliverablesCount,
				totalSubTasks: subTasks,
				assignedUsers,
			},
			// Preview of items that might need attention before deletion
			attention: {
				incompleteTasks: incompleteTasks.map(task => ({
					id: task.id,
					name: task.name,
					status: task.taskStatus,
					priority: task.priority,
					dueDate: task.dueDate,
					phaseName: task.phase?.name,
				})),
				openSnags: openSnags.map(snag => ({
					id: snag.id,
					title: snag.title,
					status: snag.snagStatus,
					priority: snag.priority,
				})),
				pendingDeliverables: pendingDeliverables.map(d => ({
					id: d.id,
					taskName: d.task?.name,
					status: d.deliverableStatus,
				})),
			},
			// Warning message based on linked data
			warnings: [],
		};

		// Add warnings based on linked data
		if (incompleteTasksCount > 0) {
			linkedData.warnings.push(`${incompleteTasksCount} incomplete task(s) will be affected`);
		}
		if (openSnagsCount > 0) {
			linkedData.warnings.push(`${openSnagsCount} open snag(s) will be affected`);
		}
		if (pendingDeliverablesCount > 0) {
			linkedData.warnings.push(`${pendingDeliverablesCount} pending deliverable(s) will be affected`);
		}
		if (payments > 0) {
			linkedData.warnings.push(`${payments} payment record(s) are linked to this project`);
		}
		if (quotations > 0) {
			linkedData.warnings.push(`${quotations} quotation(s) are linked to this project`);
		}
		if (attachments > 0) {
			linkedData.warnings.push(`${attachments} file(s) are attached to this project`);
		}

		return responseHandler(linkedData, res);
	});
}

export default new ProjectController();
