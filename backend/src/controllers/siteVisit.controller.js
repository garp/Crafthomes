import SiteVisitServices from '../services/modelServices/siteVisit.services.js';
import AttachmentServices from '../services/modelServices/attachment.services.js';
import SiteVisitGalleryCollectionServices from '../services/modelServices/siteVisitGalleryCollection.services.js';
import SiteVisitGalleryAttachmentServices from '../services/modelServices/siteVisitGalleryAttachment.services.js';
import TaskServices from '../services/modelServices/task.services.js';
import { asyncHandler, transactionHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import trackActivity from '../middlewares/activities.middleware.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';
const COMPLETED_STATUS = 'COMPLETED';

function computeSiteVisitProgress(taskSnapshots) {
	if (!taskSnapshots?.length) return null;
	const completed = taskSnapshots.filter(s => s.statusAtVisit === COMPLETED_STATUS).length;
	return Math.round((completed / taskSnapshots.length) * 100);
}

const siteVisitSelect = {
	id: true,
	projectId: true,
	status: true,
	priority: true,
	progress: true,
	startedAt: true,
	submittedAt: true,
	reviewedAt: true,
	summaryText: true,
	clientSignatureUrl: true,
	createdAt: true,
	updatedAt: true,
	engineers: {
		select: {
			id: true,
			siteVisitId: true,
			engineerId: true,
			createdAt: true,
			engineer: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
		},
	},
	taskSnapshots: {
		include: {
			attachments: {
				select: { id: true, name: true, url: true, key: true, type: true },
			},
		},
	},
	attachments: {
		select: {
			id: true,
			name: true,
			url: true,
			key: true,
			type: true,
		},
	},
	project: {
		select: {
			id: true,
			name: true,
		},
	},
};

const galleryCollectionSelect = {
	id: true,
	siteVisitId: true,
	name: true,
	notes: true,
	createdBy: true,
	displayOrder: true,
	capturedAt: true,
	area: true,
	createdAt: true,
	createdByUser: {
		select: { id: true, name: true, email: true },
	},
	siteVisitGalleryAttachments: {
		orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
		select: {
			id: true,
			siteVisitGalleryCollectionId: true,
			attachmentId: true,
			displayOrder: true,
			caption: true,
			takenAt: true,
			taskId: true,
			createdAt: true,
			attachment: {
				select: { id: true, name: true, url: true, key: true, type: true },
			},
			task: {
				select: { id: true, name: true },
			},
		},
	},
};

const galleryAttachmentSelect = {
	id: true,
	siteVisitGalleryCollectionId: true,
	attachmentId: true,
	displayOrder: true,
	caption: true,
	takenAt: true,
	taskId: true,
	createdAt: true,
	attachment: {
		select: { id: true, name: true, url: true, key: true, type: true },
	},
	task: {
		select: { id: true, name: true },
	},
};

class SiteVisitController {

	// -- Site Visits --

	get = asyncHandler(async (req, res) => {
		const { projectId, status, pageNo = 0, pageLimit = 10, sortType = 'createdAt', sortOrder = -1 } = req.query;

		const where = { projectId };
		if (status) {
			where.status = status;
		}

		const totalCount = await SiteVisitServices.count({ where });
		const siteVisits = await SiteVisitServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy: { [sortType]: sortOrder === 1 ? 'asc' : 'desc' },
			select: siteVisitSelect,
		});

		return responseHandler({ siteVisits, totalCount }, res);
	});

	getById = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const siteVisit = await SiteVisitServices.findOne({
			where: { id },
			select: siteVisitSelect,
		});
		if (!siteVisit) return errorHandler('E-1801', res);
		return responseHandler(siteVisit, res);
	});

	create = transactionHandler(async (req, res, _next, tx) => {
		const { userId } = req.user;
		const {
			projectId,
			status,
			priority,
			startedAt,
			engineerIds,
			taskSnapshots = [],
			summaryText,
			attachments: attachmentsPayload = [],
		} = req.body;

		const progress = computeSiteVisitProgress(taskSnapshots);

		// Create site visit with progress upfront
		const siteVisit = await SiteVisitServices.create(
			{
				data: {
					projectId,
					status,
					priority: priority || null,
					startedAt: new Date(startedAt),
					summaryText: summaryText || null,
					progress: progress ?? 0,
				},
			},
			tx
		);

		// Batch create engineers
		if (engineerIds?.length > 0) {
			await tx.siteVisitEngineer.createMany({
				data: engineerIds.map(engineerId => ({
					siteVisitId: siteVisit.id,
					engineerId,
				})),
			});
		}

		// Batch create task snapshots first (without attachments)
		const snapshotsWithAttachments = [];
		if (taskSnapshots?.length > 0) {
			// Create all snapshots in one batch
			await tx.siteVisitTaskSnapshot.createMany({
				data: taskSnapshots.map(s => ({
					siteVisitId: siteVisit.id,
					originalTaskId: s.originalTaskId || null,
					taskTitle: s.taskTitle,
					statusAtVisit: s.statusAtVisit,
					notes: s.notes ?? null,
					completionPercentage: s.completionPercentage ?? null,
				})),
			});

			// Fetch created snapshots to get IDs
			const createdSnapshots = await tx.siteVisitTaskSnapshot.findMany({
				where: { siteVisitId: siteVisit.id },
				orderBy: { createdAt: 'asc' },
			});

			// Collect all snapshot attachments for batch creation
			const allSnapshotAttachments = [];
			createdSnapshots.forEach((snapshot, idx) => {
				const originalSnapshot = taskSnapshots[idx];
				if (originalSnapshot?.attachments?.length > 0) {
					originalSnapshot.attachments.forEach(att => {
						allSnapshotAttachments.push({
							...att,
							siteVisitTaskSnapshotId: snapshot.id,
							projectId,
							createdBy: userId,
						});
					});
				}
				// Collect data for task progress updates
				if (originalSnapshot?.originalTaskId) {
					snapshotsWithAttachments.push({
						originalTaskId: originalSnapshot.originalTaskId,
						taskTitle: originalSnapshot.taskTitle,
						statusAtVisit: originalSnapshot.statusAtVisit,
						completionPercentage: originalSnapshot.completionPercentage,
					});
				}
			});

			// Batch create all snapshot attachments
			if (allSnapshotAttachments.length > 0) {
				await AttachmentServices.createMany({ data: allSnapshotAttachments }, tx);
			}

			// Batch update task progress using Promise.all
			if (snapshotsWithAttachments.length > 0) {
				await Promise.all(
					snapshotsWithAttachments.map(s => {
						const taskProgress =
							s.completionPercentage != null
								? s.completionPercentage
								: s.statusAtVisit === COMPLETED_STATUS
									? 100
									: 0;
						return tx.task.update({
							where: { id: s.originalTaskId },
							data: { progress: taskProgress },
						});
					})
				);
			}
		}

		// Batch create site visit attachments
		if (attachmentsPayload?.length > 0) {
			await AttachmentServices.createMany(
				{
					data: attachmentsPayload.map(att => ({
						...att,
						siteVisitId: siteVisit.id,
						projectId,
						createdBy: userId,
					})),
				},
				tx
			);
		}

		// Fetch the complete site visit
		const created = await SiteVisitServices.findOne(
			{
				where: { id: siteVisit.id },
				select: siteVisitSelect,
			},
			tx
		);

		// Return data for response (sent AFTER transaction commits)
		// Activity tracking happens after successful commit to avoid timeout
		const activityData = {
			userId,
			projectId,
			siteVisitId: siteVisit.id,
			startedAt,
			status,
			engineerIds,
			snapshotsWithAttachments,
		};

		// Schedule activity tracking after transaction (non-blocking)
		setImmediate(async () => {
			try {
				const visitDateStr = new Date(startedAt).toLocaleDateString();
				// Track task activities
				for (const s of snapshotsWithAttachments) {
					await trackActivity(activityData.userId, {
						projectId: activityData.projectId,
						entityType: ENTITY_TYPES.TASK,
						entityId: s.originalTaskId,
						entityName: s.taskTitle,
						activities: [`Assigned to site visit - ${visitDateStr}`],
						activityType: ACTIVITY_TYPES.ASSIGNMENT,
					});
				}
				// Track site visit creation
				await trackActivity(activityData.userId, {
					projectId: activityData.projectId,
					entityType: ENTITY_TYPES.SITE_VISIT,
					entityId: activityData.siteVisitId,
					entityName: `Site Visit ${visitDateStr}`,
					activities: [`Site visit created - Status: ${activityData.status}, Engineers: ${activityData.engineerIds?.length ?? 0}`],
					activityType: ACTIVITY_TYPES.CREATE,
				});
			} catch (err) {
				console.error('Activity tracking failed (non-critical):', err);
			}
		});

		return { data: created };
	});

	update = transactionHandler(async (req, res, _next, tx) => {
		const { id } = req.params;
		const { userId } = req.user;
		const {
			status,
			priority,
			startedAt,
			submittedAt,
			reviewedAt,
			summaryText,
			clientSignatureUrl,
			engineerIds,
			taskSnapshots,
			attachments: attachmentsPayload,
		} = req.body;

		const existing = await SiteVisitServices.findOne({ where: { id } }, tx);
		if (!existing) {
			throw new Error('E-1801');
		}

		const updateData = {};
		if (status !== undefined) updateData.status = status;
		if (priority !== undefined) updateData.priority = priority || null;
		if (startedAt !== undefined) updateData.startedAt = new Date(startedAt);
		if (submittedAt !== undefined) updateData.submittedAt = submittedAt ? new Date(submittedAt) : null;
		if (reviewedAt !== undefined) updateData.reviewedAt = reviewedAt ? new Date(reviewedAt) : null;
		if (summaryText !== undefined) updateData.summaryText = summaryText || null;
		if (clientSignatureUrl !== undefined) updateData.clientSignatureUrl = clientSignatureUrl || null;

		// Compute progress upfront if taskSnapshots provided
		if (taskSnapshots !== undefined && taskSnapshots.length > 0) {
			updateData.progress = computeSiteVisitProgress(taskSnapshots) ?? 0;
		} else if (taskSnapshots !== undefined && taskSnapshots.length === 0) {
			updateData.progress = null;
		}

		if (Object.keys(updateData).length > 0) {
			await SiteVisitServices.update({ where: { id }, data: updateData }, tx);
		}

		if (engineerIds !== undefined) {
			await tx.siteVisitEngineer.deleteMany({ where: { siteVisitId: id } });
			if (engineerIds.length > 0) {
				await tx.siteVisitEngineer.createMany({
					data: engineerIds.map(engineerId => ({ siteVisitId: id, engineerId })),
				});
			}
		}

		const snapshotsWithAttachments = [];
		if (taskSnapshots !== undefined) {
			// Delete existing snapshots (cascade will handle attachments)
			await tx.siteVisitTaskSnapshot.deleteMany({ where: { siteVisitId: id } });

			if (taskSnapshots.length > 0) {
				// Batch create all snapshots
				await tx.siteVisitTaskSnapshot.createMany({
					data: taskSnapshots.map(s => ({
						siteVisitId: id,
						originalTaskId: s.originalTaskId || null,
						taskTitle: s.taskTitle,
						statusAtVisit: s.statusAtVisit,
						notes: s.notes ?? null,
						completionPercentage: s.completionPercentage ?? null,
					})),
				});

				// Fetch created snapshots to get IDs
				const createdSnapshots = await tx.siteVisitTaskSnapshot.findMany({
					where: { siteVisitId: id },
					orderBy: { createdAt: 'asc' },
				});

				// Collect all snapshot attachments for batch creation
				const allSnapshotAttachments = [];
				createdSnapshots.forEach((snapshot, idx) => {
					const originalSnapshot = taskSnapshots[idx];
					if (originalSnapshot?.attachments?.length > 0) {
						originalSnapshot.attachments.forEach(att => {
							allSnapshotAttachments.push({
								...att,
								siteVisitTaskSnapshotId: snapshot.id,
								projectId: existing.projectId,
								createdBy: userId,
							});
						});
					}
					// Collect data for task progress updates
					if (originalSnapshot?.originalTaskId) {
						snapshotsWithAttachments.push({
							originalTaskId: originalSnapshot.originalTaskId,
							taskTitle: originalSnapshot.taskTitle,
							statusAtVisit: originalSnapshot.statusAtVisit,
							completionPercentage: originalSnapshot.completionPercentage,
						});
					}
				});

				// Batch create all snapshot attachments
				if (allSnapshotAttachments.length > 0) {
					await AttachmentServices.createMany({ data: allSnapshotAttachments }, tx);
				}

				// Batch update task progress using Promise.all
				if (snapshotsWithAttachments.length > 0) {
					await Promise.all(
						snapshotsWithAttachments.map(s => {
							const taskProgress =
								s.completionPercentage != null
									? s.completionPercentage
									: s.statusAtVisit === COMPLETED_STATUS
										? 100
										: 0;
							return tx.task.update({
								where: { id: s.originalTaskId },
								data: { progress: taskProgress },
							});
						})
					);
				}
			}
		}

		if (attachmentsPayload !== undefined) {
			await AttachmentServices.deleteMany({ where: { siteVisitId: id } }, tx);
			if (attachmentsPayload.length > 0) {
				await AttachmentServices.createMany(
					{
						data: attachmentsPayload.map(att => ({
							...att,
							siteVisitId: id,
							projectId: existing.projectId,
							createdBy: userId,
						})),
					},
					tx
				);
			}
		}

		const updated = await SiteVisitServices.findOne(
			{ where: { id }, select: siteVisitSelect },
			tx
		);

		// Schedule activity tracking after transaction (non-blocking)
		const activityData = {
			userId,
			projectId: existing.projectId,
			siteVisitId: id,
			existingStartedAt: existing.startedAt,
			snapshotsWithAttachments,
		};

		setImmediate(async () => {
			try {
				const visitDateStr = activityData.existingStartedAt
					? new Date(activityData.existingStartedAt).toLocaleDateString()
					: 'site visit';

				// Track task activities
				for (const s of activityData.snapshotsWithAttachments) {
					await trackActivity(activityData.userId, {
						projectId: activityData.projectId,
						entityType: ENTITY_TYPES.TASK,
						entityId: s.originalTaskId,
						entityName: s.taskTitle,
						activities: [`Site visit updated - task included (${visitDateStr})`],
						activityType: ACTIVITY_TYPES.UPDATE,
					});
				}

				// Track site visit update
				await trackActivity(activityData.userId, {
					projectId: activityData.projectId,
					entityType: ENTITY_TYPES.SITE_VISIT,
					entityId: activityData.siteVisitId,
					entityName: `Site Visit ${visitDateStr}`,
					activities: ['Site visit updated'],
					activityType: ACTIVITY_TYPES.UPDATE,
				});
			} catch (err) {
				console.error('Activity tracking failed (non-critical):', err);
			}
		});

		return { data: updated };
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existing = await SiteVisitServices.findOne({ where: { id } });
		if (!existing) return errorHandler('E-1801', res);

		await SiteVisitServices.delete({ where: { id } });

		await trackActivity(userId, {
			projectId: existing.projectId,
			entityType: ENTITY_TYPES.SITE_VISIT,
			entityId: id,
			entityName: `Site Visit ${existing.startedAt?.toLocaleDateString?.() ?? id}`,
			activities: ['Site visit deleted'],
			activityType: ACTIVITY_TYPES.DELETE,
		});

		return responseHandler({ success: true }, res);
	});

	// -- Gallery Collections --

	createGalleryCollection = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { siteVisitId, name, notes, displayOrder, capturedAt, area } = req.body;

		if (!siteVisitId) return errorHandler('E-1801', res);

		const existing = await SiteVisitServices.findOne({ where: { id: siteVisitId } });
		if (!existing) return errorHandler('E-1801', res);

		const capturedAtDate = capturedAt ? new Date(capturedAt) : undefined;
		if (capturedAt && Number.isNaN(capturedAtDate.getTime())) return errorHandler('E-001', res);

		const order = displayOrder != null && displayOrder !== '' ? parseInt(displayOrder, 10) : null;
		if (order !== null && (Number.isNaN(order) || order < 0)) return errorHandler('E-001', res);

		const galleryCollection = await SiteVisitGalleryCollectionServices.create({
			data: {
				siteVisitId,
				name: name ?? null,
				notes: notes ?? null,
				displayOrder: order,
				capturedAt: capturedAtDate,
				area: area ?? null,
				createdBy: userId,
			},
		});

		await trackActivity(userId, {
			projectId: existing.projectId,
			entityType: ENTITY_TYPES.SITE_VISIT,
			entityId: siteVisitId,
			entityName: galleryCollection.name ?? 'Gallery collection',
			activities: ['Gallery collection created'],
			activityType: ACTIVITY_TYPES.CREATE,
		});

		return responseHandler(galleryCollection, res);
	});

	getGalleryCollections = asyncHandler(async (req, res) => {
		const { siteVisitId } = req.query;
		if (!siteVisitId) return errorHandler('E-1801', res);

		const existing = await SiteVisitServices.findOne({ where: { id: siteVisitId }, select: { id: true } });
		if (!existing) return errorHandler('E-1801', res);

		const collections = await SiteVisitGalleryCollectionServices.findMany({
			where: { siteVisitId },
			orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
			select: galleryCollectionSelect,
		});

		return responseHandler(collections, res);
	});

	getGalleryCollectionById = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const collection = await SiteVisitGalleryCollectionServices.findOne({
			where: { id },
			select: galleryCollectionSelect,
		});
		if (!collection) return errorHandler('E-1801', res);
		return responseHandler(collection, res);
	});

	updateGalleryCollection = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { id } = req.params;
		const { name, notes, displayOrder, capturedAt, area } = req.body;

		const existing = await SiteVisitGalleryCollectionServices.findOne({
			where: { id },
			include: { siteVisit: { select: { projectId: true } } },
		});
		if (!existing) return errorHandler('E-1801', res);

		const capturedAtDate = capturedAt !== undefined ? (capturedAt ? new Date(capturedAt) : null) : undefined;
		if (capturedAt !== undefined && capturedAt != null && capturedAt !== '' && (!capturedAtDate || Number.isNaN(capturedAtDate.getTime()))) {
			return errorHandler('E-001', res);
		}

		const order = displayOrder !== undefined && displayOrder !== null && displayOrder !== ''
			? parseInt(displayOrder, 10)
			: undefined;
		if (order !== undefined && (Number.isNaN(order) || order < 0)) return errorHandler('E-001', res);

		const updateData = {};
		if (name !== undefined) updateData.name = name ?? null;
		if (notes !== undefined) updateData.notes = notes ?? null;
		if (displayOrder !== undefined) updateData.displayOrder = order ?? null;
		if (capturedAt !== undefined) updateData.capturedAt = capturedAtDate;
		if (area !== undefined) updateData.area = area ?? null;

		if (Object.keys(updateData).length === 0) {
			const current = await SiteVisitGalleryCollectionServices.findOne({ where: { id }, select: galleryCollectionSelect });
			return responseHandler(current, res);
		}

		await SiteVisitGalleryCollectionServices.update({ where: { id }, data: updateData });
		const updated = await SiteVisitGalleryCollectionServices.findOne({ where: { id }, select: galleryCollectionSelect });

		await trackActivity(userId, {
			projectId: existing.siteVisit.projectId,
			entityType: ENTITY_TYPES.SITE_VISIT,
			entityId: existing.siteVisitId,
			entityName: updated.name ?? 'Gallery collection',
			activities: ['Gallery collection updated'],
			activityType: ACTIVITY_TYPES.UPDATE,
		});

		return responseHandler(updated, res);
	});

	deleteGalleryCollection = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { id } = req.params;

		const existing = await SiteVisitGalleryCollectionServices.findOne({
			where: { id },
			include: { siteVisit: { select: { projectId: true, id: true } } },
		});
		if (!existing) return errorHandler('E-1801', res);

		await SiteVisitGalleryCollectionServices.delete({ where: { id } });

		await trackActivity(userId, {
			projectId: existing.siteVisit.projectId,
			entityType: ENTITY_TYPES.SITE_VISIT,
			entityId: existing.siteVisitId,
			entityName: existing.name ?? 'Gallery collection',
			activities: ['Gallery collection deleted'],
			activityType: ACTIVITY_TYPES.DELETE,
		});

		return responseHandler({ success: true }, res);
	});

	// --- Gallery Attachments ---

	createGalleryAttachment = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { siteVisitGalleryCollectionId, attachmentId, displayOrder, caption, takenAt, taskId } = req.body;

		if (!siteVisitGalleryCollectionId || !attachmentId) return errorHandler('E-001', res);

		const collection = await SiteVisitGalleryCollectionServices.findOne({
			where: { id: siteVisitGalleryCollectionId },
			include: { siteVisit: { select: { projectId: true } } },
		});
		if (!collection) return errorHandler('E-1801', res);

		const attachmentExists = await AttachmentServices.findOne({ where: { id: attachmentId }, select: { id: true } });
		if (!attachmentExists) return errorHandler('E-001', res);

		const takenAtDate = takenAt ? new Date(takenAt) : undefined;
		if (takenAt && Number.isNaN(takenAtDate.getTime())) return errorHandler('E-001', res);

		const order = displayOrder != null && displayOrder !== '' ? parseInt(displayOrder, 10) : null;
		if (order !== null && (Number.isNaN(order) || order < 0)) return errorHandler('E-001', res);

		if (taskId) {
			const taskExists = await TaskServices.findOne({ where: { id: taskId }, select: { id: true } });
			if (!taskExists) return errorHandler('E-001', res);
		}

		const galleryAttachment = await SiteVisitGalleryAttachmentServices.create({
			data: {
				siteVisitGalleryCollectionId,
				attachmentId,
				displayOrder: order,
				caption: caption ?? null,
				takenAt: takenAtDate,
				taskId: taskId || null,
			},
		});

		const created = await SiteVisitGalleryAttachmentServices.findOne({
			where: { id: galleryAttachment.id },
			select: galleryAttachmentSelect,
		});

		await trackActivity(userId, {
			projectId: collection.siteVisit.projectId,
			entityType: ENTITY_TYPES.SITE_VISIT,
			entityId: collection.siteVisitId,
			entityName: 'Gallery photo added',
			activities: ['Gallery attachment created'],
			activityType: ACTIVITY_TYPES.CREATE,
		});

		return responseHandler(created, res);
	});

	getGalleryAttachments = asyncHandler(async (req, res) => {
		const { siteVisitGalleryCollectionId } = req.query;
		if (!siteVisitGalleryCollectionId) return errorHandler('E-001', res);

		const collection = await SiteVisitGalleryCollectionServices.findOne({
			where: { id: siteVisitGalleryCollectionId },
			select: { id: true },
		});
		if (!collection) return errorHandler('E-1801', res);

		const attachments = await SiteVisitGalleryAttachmentServices.findMany({
			where: { siteVisitGalleryCollectionId },
			orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
			select: galleryAttachmentSelect,
		});

		return responseHandler(attachments, res);
	});

	getGalleryAttachmentById = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const attachment = await SiteVisitGalleryAttachmentServices.findOne({
			where: { id },
			select: galleryAttachmentSelect,
		});
		if (!attachment) return errorHandler('E-1801', res);
		return responseHandler(attachment, res);
	});

	updateGalleryAttachment = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { id } = req.params;
		const { displayOrder, caption, takenAt, taskId } = req.body;

		const existing = await SiteVisitGalleryAttachmentServices.findOne({
			where: { id },
			include: {
				siteVisitGalleryCollection: {
					include: { siteVisit: { select: { projectId: true } } },
				},
			},
		});
		if (!existing) return errorHandler('E-1801', res);

		const takenAtDate = takenAt !== undefined ? (takenAt ? new Date(takenAt) : null) : undefined;
		if (takenAt !== undefined && takenAt != null && takenAt !== '' && (!takenAtDate || Number.isNaN(takenAtDate.getTime()))) {
			return errorHandler('E-001', res);
		}

		const order = displayOrder !== undefined && displayOrder !== null && displayOrder !== ''
			? parseInt(displayOrder, 10)
			: undefined;
		if (order !== undefined && (Number.isNaN(order) || order < 0)) return errorHandler('E-001', res);

		if (taskId !== undefined && taskId != null && taskId !== '') {
			const taskExists = await TaskServices.findOne({ where: { id: taskId }, select: { id: true } });
			if (!taskExists) return errorHandler('E-001', res);
		}

		const updateData = {};
		if (displayOrder !== undefined) updateData.displayOrder = order ?? null;
		if (caption !== undefined) updateData.caption = caption ?? null;
		if (takenAt !== undefined) updateData.takenAt = takenAtDate;
		if (taskId !== undefined) updateData.taskId = taskId || null;

		if (Object.keys(updateData).length === 0) {
			const current = await SiteVisitGalleryAttachmentServices.findOne({ where: { id }, select: galleryAttachmentSelect });
			return responseHandler(current, res);
		}

		await SiteVisitGalleryAttachmentServices.update({ where: { id }, data: updateData });
		const updated = await SiteVisitGalleryAttachmentServices.findOne({ where: { id }, select: galleryAttachmentSelect });

		await trackActivity(userId, {
			projectId: existing.siteVisitGalleryCollection.siteVisit.projectId,
			entityType: ENTITY_TYPES.SITE_VISIT,
			entityId: existing.siteVisitGalleryCollection.siteVisitId,
			entityName: 'Gallery attachment',
			activities: ['Gallery attachment updated'],
			activityType: ACTIVITY_TYPES.UPDATE,
		});

		return responseHandler(updated, res);
	});

	deleteGalleryAttachment = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { id } = req.params;

		const existing = await SiteVisitGalleryAttachmentServices.findOne({
			where: { id },
			include: {
				siteVisitGalleryCollection: { include: { siteVisit: { select: { projectId: true } } } },
			},
		});
		if (!existing) return errorHandler('E-1801', res);

		await SiteVisitGalleryAttachmentServices.delete({ where: { id } });

		await trackActivity(userId, {
			projectId: existing.siteVisitGalleryCollection.siteVisit.projectId,
			entityType: ENTITY_TYPES.SITE_VISIT,
			entityId: existing.siteVisitGalleryCollection.siteVisitId,
			entityName: 'Gallery attachment',
			activities: ['Gallery attachment deleted'],
			activityType: ACTIVITY_TYPES.DELETE,
		});

		return responseHandler({ success: true }, res);
	});
}

export default new SiteVisitController();
