import SnagServices from '../services/modelServices/snag.services.js';
import AttachmentServices from '../services/modelServices/attachment.services.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import SnagMasterItemServices from '../services/modelServices/mapping/snagMasterItem.services.js';
import trackActivity from '../middlewares/activities.middleware.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';

class SnagController {
	create = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { attachments = [], vendorId, ...snagData } = req.body;

		// Create snag without attachments
		const snag = await SnagServices.create({
			data: {
				...snagData,
				projectId: snagData.projectId,
				vendorId: vendorId || null,
				createdBy: userId,
			},
		});

		// Create attachments separately if provided
		if (attachments.length > 0) {
			await AttachmentServices.createMany({
				data: attachments.map(att => ({ ...att, snagId: snag.id, createdBy: userId })),
			});
		}

		// Track activity for snag creation
		if (snagData.projectId) {
			await trackActivity(userId, {
				projectId: snagData.projectId,
				entityType: ENTITY_TYPES.SNAG,
				entityId: snag.id,
				entityName: snagData.title || `Snag #${snag.sNo}`,
				activities: [`Snag "${snagData.title}" created - Priority: ${snagData.priority || 'Not set'}, Location: ${snagData.location || 'Not specified'}`],
				activityType: ACTIVITY_TYPES.CREATE,
			});
		}

		return responseHandler(snag, res);
	});

	get = asyncHandler(async (req, res) => {
		const {
			id,
			search,
			pageNo = 0,
			pageLimit = 10,
			status = 'ACTIVE',
			snagStatus,
			priority,
			sortType = 'createdAt',
			sortOrder = -1,
			projectId,
			vendorId,
		} = req.query;
		const where = { status };

		if (id) {
			where.id = id;
		}

		if (search) {
			where.OR = [
				{ title: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
				{ location: { contains: search, mode: 'insensitive' } },
			];
		}

		if (snagStatus) {
			where.snagStatus = snagStatus;
		}

		if (priority) {
			where.priority = priority;
		}

		if (projectId) {
			where.projectId = projectId;
		}

		if (vendorId) {
			where.vendorId = vendorId;
		}

		console.log(where);

		const openedCount = await SnagServices.count({ where: { snagStatus: 'OPEN' } });
		// const inProgressCount = await SnagServices.count({ where: { snagStatus: 'IN_PROGRESS' } });
		const resolvedCount = await SnagServices.count({ where: { snagStatus: 'RESOLVED' } });
		// const rejectedCount = await SnagServices.count({ where: { snagStatus: 'REJECTED' } });
		const closedCount = await SnagServices.count({ where: { snagStatus: 'CLOSED' } });
		// const pendingCount = await SnagServices.count({ where: { snagStatus: 'PENDING' } });
		const deletedCount = await SnagServices.count({ where: { snagStatus: 'DELETED' } });
		const totalCount = await SnagServices.count({ where });
		const snags = await SnagServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy: { [sortType]: sortOrder === 1 ? 'asc' : 'desc' },
			select: {
				id: true,
				sNo: true,
				title: true,
				description: true,
				location: true,
				snagCategory: true,
				snagSubCategory: true,
				priority: true,
				snagStatus: true,
				expectedCloseDate: true,
				otherCategory: true,
				otherSubCategory: true,
				vendorId: true,
				vendor: {
					select: {
						id: true,
						name: true,
						email: true,
						phoneNumber: true,
					},
				},
				attachments: {
					select: {
						id: true,
						name: true,
						url: true,
						key: true,
						type: true,
						mimeType: true,
					},
				},
				assignedToUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				assignedByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				createdByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				createdAt: true,
				updatedAt: true,
				updatedByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});
		const stats = {
			openedCount,
			resolvedCount,
			closedCount,
			deletedCount,
		};
		return responseHandler({ stats, snags, totalCount }, res);
	});

	getById = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const snag = await SnagServices.findOne({
			where: { id },
			include: {
				attachments: true,
				vendor: {
					select: {
						id: true,
						name: true,
						email: true,
						phoneNumber: true,
					},
				},
				assignedToUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				assignedByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				createdByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});
		if (!snag) return errorHandler('E-1201', res);
		return responseHandler({ snag }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const {
			title,
			description,
			location,
			snagCategory,
			otherCategory,
			snagSubCategory,
			otherSubCategory,
			priority,
			status,
			snagStatus,
			expectedCloseDate,
			assignedTo,
			assignedBy,
			attachments,
			items,
			vendorId,
		} = req.body;

		// Check if snag exists
		const existingSnag = await SnagServices.findOne({ where: { id } });
		if (!existingSnag) return errorHandler('E-1201', res);

		const projectId = existingSnag.projectId;
		const fieldUpdates = [];

		// Build update data object and track changes
		const updateData = { updatedBy: userId };

		if (title !== undefined && existingSnag.title !== title) {
			updateData.title = title;
			fieldUpdates.push(`Title updated to "${title}"`);
		}
		if (description !== undefined && existingSnag.description !== description) {
			updateData.description = description;
			fieldUpdates.push('Description updated');
		}
		if (location !== undefined && existingSnag.location !== location) {
			updateData.location = location;
			fieldUpdates.push(`Location updated to "${location}"`);
		}
		if (snagCategory !== undefined && existingSnag.snagCategory !== snagCategory) {
			updateData.snagCategory = snagCategory;
			fieldUpdates.push(`Category changed to "${snagCategory}"`);
		}
		if (otherCategory !== undefined) updateData.otherCategory = otherCategory;
		if (snagSubCategory !== undefined && existingSnag.snagSubCategory !== snagSubCategory) {
			updateData.snagSubCategory = snagSubCategory;
			fieldUpdates.push(`Sub-category changed to "${snagSubCategory}"`);
		}
		if (otherSubCategory !== undefined) updateData.otherSubCategory = otherSubCategory;
		if (priority !== undefined && existingSnag.priority !== priority) {
			updateData.priority = priority;
			fieldUpdates.push(`Priority changed from "${existingSnag.priority}" to "${priority}"`);
		}
		if (status !== undefined && existingSnag.status !== status) {
			updateData.status = status;
			fieldUpdates.push(`Status changed to "${status}"`);
		}
		if (snagStatus !== undefined && existingSnag.snagStatus !== snagStatus) {
			updateData.snagStatus = snagStatus;
			fieldUpdates.push(`Snag status changed from "${existingSnag.snagStatus}" to "${snagStatus}"`);
		}
		if (expectedCloseDate !== undefined && existingSnag.expectedCloseDate !== expectedCloseDate) {
			updateData.expectedCloseDate = expectedCloseDate;
			fieldUpdates.push('Expected close date updated');
		}
		if (assignedTo !== undefined && existingSnag.assignedTo !== assignedTo) {
			updateData.assignedTo = assignedTo;
			fieldUpdates.push(assignedTo ? 'Snag assigned to user' : 'Snag assignee removed');
		}
		if (assignedBy !== undefined) updateData.assignedBy = assignedBy || userId;
		if (vendorId !== undefined && existingSnag.vendorId !== vendorId) {
			updateData.vendorId = vendorId || null;
			fieldUpdates.push(vendorId ? 'Vendor assigned to snag' : 'Vendor removed from snag');
		}

		if (items !== undefined) {
			await SnagMasterItemServices.deleteMany({ where: { snagId: id } });
			await SnagMasterItemServices.createMany({
				data: items.map(item => ({ snagId: id, masterItemId: item })),
			});
			fieldUpdates.push(`Snag items updated (${items.length} item(s))`);
		}

		// Update snag
		const snag = await SnagServices.update({
			where: { id },
			data: updateData,
		});

		// Handle attachments separately if provided
		if (attachments !== undefined) {
			// Delete existing attachments for this snag
			await AttachmentServices.deleteMany({ where: { snagId: id } });
			// Create new attachments if provided
			if (attachments.length > 0) {
				await AttachmentServices.createMany({
					data: attachments.map(att => ({ ...att, snagId: id, updatedBy: userId })),
				});
				fieldUpdates.push(`Attachments updated (${attachments.length} file(s))`);
			}
		}

		// Track activity for snag update
		if (fieldUpdates.length > 0 && projectId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.SNAG,
				entityId: id,
				entityName: snag.title || existingSnag.title || `Snag #${snag.sNo}`,
				activities: fieldUpdates,
				activityType: ACTIVITY_TYPES.UPDATE,
			});
		}

		return responseHandler(snag, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existingSnag = await SnagServices.findOne({ where: { id } });
		if (!existingSnag) return errorHandler('E-1201', res);

		const projectId = existingSnag.projectId;

		const snag = await SnagServices.update({
			where: { id },
			data: {
				status: 'INACTIVE',
				snagStatus: 'DELETED',
				updatedBy: userId,
			},
		});

		// Track activity for snag deletion
		if (projectId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.SNAG,
				entityId: id,
				entityName: existingSnag.title || `Snag #${existingSnag.sNo}`,
				activities: [`Snag "${existingSnag.title}" deleted`],
				activityType: ACTIVITY_TYPES.DELETE,
			});
		}

		return responseHandler(snag, res);
	});
}

export default new SnagController();
