import QuotationsService from '../services/modelServices/quotations.service.js';
import ClientService from '../services/modelServices/client.services.js';
import QuotationItemService from '../services/modelServices/quotationItem.services.js';
import MasterItemService from '../services/modelServices/master/masterItem.service.js';
import PolicyServices from '../services/modelServices/policy.services.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import { formatQuoteId } from '../utils/functions/timeFunction.js';
import trackActivity from '../middlewares/activities.middleware.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';

class QuotationsController {
	create = asyncHandler(async (req, res) => {
		const { name, description, clientId, discount, paidAmount, items, projectId, totalAmount, startDate, remainingAmount, policyId } =
			req.body;
		const { userId } = req.user;

		// Validate client exists
		const client = await ClientService.findOne({ where: { id: clientId } });
		if (!client) return errorHandler('E-301', res);

		// Validate policy exists
		const policy = await PolicyServices.findOne({ where: { id: policyId } });
		if (!policy) return errorHandler('E-1501', res);

		const quotation = await QuotationsService.create({
			data: {
				name,
				description,
				clientId,
				discount,
				paidAmount,
				totalAmount,
				remainingAmount,
				createdBy: userId,
				projectId,
				startDate,
				policyId,
			},
		});

		await QuotationItemService.createMany({
			data: items.map(item => ({
				masterItemId: item.masterItemId,
				quotationId: quotation.id,
				mrp: item.mrp,
				quantity: item.quantity,
				discount: item.discount,
				total: item.total,
				gst: item.gst ?? 18,
				attachmentId: item.attachmentId,
				area: item.area != null && String(item.area).trim() !== '' ? String(item.area) : undefined,
				areaId: item.areaId || undefined,
				unitId: item.unitId || undefined,
			})),
		});

		// Track activity for quotation creation
		await trackActivity(userId, {
			projectId,
			entityType: ENTITY_TYPES.QUOTATION,
			entityId: quotation.id,
			entityName: name || 'Quotation',
			activities: [`Quotation "${name}" created with total amount ${totalAmount}`],
			activityType: ACTIVITY_TYPES.CREATE,
		});

		return responseHandler(quotation, res);
	});

	get = asyncHandler(async (req, res) => {
		const {
			id,
			clientId,
			pageNo = 0,
			pageLimit = 10,
			search,
			quotationStatus,
			projectId,
			sortType = 'createdAt',
			sortOrder = -1,
		} = req.query;
		// const { userId } = req.user;

		const where = {};
		if (quotationStatus) where.quotationStatus = quotationStatus;
		else where.quotationStatus = { not: 'CANCELLED' };
		if (id) where.id = id;
		if (clientId) where.clientId = clientId;
		if (search) {
			const or = [
				{ name: { contains: search, mode: 'insensitive' } },
				// { description: { contains: search, mode: 'insensitive' } }, // if you ever re-enable this
			];

			const sNoAsNumber = Number(search);
			if (!Number.isNaN(sNoAsNumber)) {
				or.push({ sNo: { equals: sNoAsNumber } });
			}

			where.OR = or;
		}
		if (projectId) where.projectId = projectId;
		const totalCount = await QuotationsService.count({ where });
		const quotations = await QuotationsService.findMany({
			where,
			select: {
				id: true,
				sNo: true,
				name: true,
				description: true,
				totalAmount: true,
				remainingAmount: true,
				project: {
					select: {
						id: true,
						name: true,
						address: true,
						city: true,
						state: true,
					},
				},
				client: {
					select: {
						id: true,
						name: true,
					},
				},
				policy: {
					select: {
						id: true,
						sNo: true,
						logo: true,
						companyName: true,
						address: true,
						pincode: true,
						city: true,
						state: true,
						country: true,
						website: true,
						termsAndConditions: true,
						gstIn: true,
						taxId: true,
						bankAccountNumber: true,
						bankAccountName: true,
						bankName: true,
						bankBranch: true,
						bankIFSC: true,
					},
				},
				quotationItem: {
					select: {
						id: true,
						masterItem: {
							select: {
								id: true,
								name: true,
								description: true,
								primaryFile: true,
								mrp: true,
							},
						},
						mrp: true,
						quantity: true,
						gst: true,
						discount: true,
						total: true,
						area: true,
						areaId: true,
						unitId: true,
						attachmentId: true,
						attachment: {
							select: {
								id: true,
								url: true,
								key: true,
							},
						},
						areaRef: {
							select: {
								id: true,
								name: true,
							},
						},
						unit: {
							select: {
								id: true,
								name: true,
								displayName: true,
							},
						},
					},
				},
				quotationStatus: true,
				createdAt: true,
				createdByUser: {
					select: {
						id: true,
						name: true,
					},
				},
				updatedAt: true,
				updatedByUser: {
					select: {
						id: true,
						name: true,
					},
				},
				paidAmount: true,
			},
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy: { [sortType]: sortOrder === 1 ? 'asc' : 'desc' },
		});

		const quotationsWithQuoteId = quotations.map(quotation => ({
			...quotation,
			quoteId: formatQuoteId(quotation.createdAt, quotation.sNo),
			client: {
				...quotation.client,
				// Include project address in client object
				address: quotation.project?.address || null,
				city: quotation.project?.city || null,
				state: quotation.project?.state || null,
			},
		}));

		return responseHandler({ quotations: quotationsWithQuoteId, totalCount }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const {
			quotationStatus,
			discount,
			paidAmount,
			items,
			clientId,
			totalAmount,
			projectId,
			startDate,
			name,
			description,
			remainingAmount,
			policyId,
		} = req.body;

		// Check if quotation exists
		console.log(id);
		const existingQuotation = await QuotationsService.findOne({ where: { id } });
		if (!existingQuotation) return errorHandler('E-801', res);

		// Track field changes for activity
		const fieldUpdates = [];

		// Build update data and track changes
		const updateData = { updatedBy: userId };

		if (quotationStatus !== undefined && existingQuotation.quotationStatus !== quotationStatus) {
			updateData.quotationStatus = quotationStatus;
			fieldUpdates.push(`Status changed from "${existingQuotation.quotationStatus}" to "${quotationStatus}"`);
		}
		if (discount !== undefined && existingQuotation.discount !== discount) {
			updateData.discount = discount;
			fieldUpdates.push(`Discount updated from ${existingQuotation.discount || 0}% to ${discount}%`);
		}
		if (paidAmount !== undefined && existingQuotation.paidAmount !== paidAmount) {
			updateData.paidAmount = paidAmount;
			fieldUpdates.push(`Paid amount updated from ${existingQuotation.paidAmount || 0} to ${paidAmount}`);
		}
		if (totalAmount !== undefined && existingQuotation.totalAmount !== totalAmount) {
			updateData.totalAmount = totalAmount;
			fieldUpdates.push(`Total amount updated from ${existingQuotation.totalAmount || 0} to ${totalAmount}`);
		}
		if (projectId !== undefined && existingQuotation.projectId !== projectId) {
			updateData.projectId = projectId;
			fieldUpdates.push('Project updated');
		}
		if (startDate !== undefined && existingQuotation.startDate !== startDate) {
			updateData.startDate = startDate;
			fieldUpdates.push('Start date updated');
		}
		if (name !== undefined && existingQuotation.name !== name) {
			updateData.name = name;
			fieldUpdates.push(`Name updated from "${existingQuotation.name}" to "${name}"`);
		}
		if (description !== undefined && existingQuotation.description !== description) {
			updateData.description = description;
			fieldUpdates.push('Description updated');
		}
		if (remainingAmount !== undefined && existingQuotation.remainingAmount !== remainingAmount) {
			updateData.remainingAmount = remainingAmount;
			fieldUpdates.push(`Remaining amount updated to ${remainingAmount}`);
		}

		// Validate client if provided
		if (clientId && existingQuotation.clientId !== clientId) {
			const client = await ClientService.findOne({ where: { id: clientId } });
			if (!client) return errorHandler('E-301', res);
			updateData.clientId = clientId;
			fieldUpdates.push('Client updated');
		}

		// Validate policy if provided
		if (policyId && existingQuotation.policyId !== policyId) {
			const policy = await PolicyServices.findOne({ where: { id: policyId } });
			if (!policy) return errorHandler('E-1501', res);
			updateData.policyId = policyId;
			fieldUpdates.push('Policy updated');
		}

		// Update quotation
		const quotation = await QuotationsService.update({
			where: { id },
			data: updateData,
		});

		// Handle items update if provided
		if (items && items.length > 0) {
			// Validate all master items exist
			const masterItemIds = items.map(item => item.masterItemId);
			const masterItems = await MasterItemService.findMany({
				where: { id: { in: masterItemIds } },
			});

			if (masterItems.length !== masterItemIds.length) {
				return errorHandler('E-1103', res);
			}

			// Delete existing quotation items
			await QuotationItemService.deleteMany({
				where: { quotationId: id },
			});

			// Create new quotation items
			await QuotationItemService.createMany({
				data: items.map(item => ({
					masterItemId: item.masterItemId,
					quotationId: quotation.id,
					mrp: item.mrp,
					quantity: item.quantity,
					discount: item.discount,
					total: item.total,
					gst: item.gst ?? 18,
					attachmentId: item.attachmentId,
					area: item.area != null && String(item.area).trim() !== '' ? String(item.area) : undefined,
					areaId: item.areaId || undefined,
					unitId: item.unitId || undefined,
				})),
			});

			fieldUpdates.push(`Quotation items updated (${items.length} item(s))`);
		}

		// Track activity for quotation update (use existing projectId or updated one)
		const effectiveProjectId = projectId || existingQuotation.projectId;
		if (fieldUpdates.length > 0 && effectiveProjectId) {
			await trackActivity(userId, {
				projectId: effectiveProjectId,
				entityType: ENTITY_TYPES.QUOTATION,
				entityId: id,
				entityName: quotation.name || existingQuotation.name || 'Quotation',
				activities: fieldUpdates,
				activityType: ACTIVITY_TYPES.UPDATE,
			});
		}

		return responseHandler(quotation, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const quotation = await QuotationsService.findOne({ where: { id } });
		if (!quotation) return errorHandler('E-801', res);

		const projectId = quotation.projectId;

		if (quotation.quotationStatus === 'CANCELLED') {
			await QuotationsService.delete({ where: { id } });
		} else {
			await QuotationsService.update({
				where: { id },
				data: { quotationStatus: 'CANCELLED', updatedBy: userId },
			});
		}

		// Track activity for quotation deletion/cancellation
		if (projectId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.QUOTATION,
				entityId: id,
				entityName: quotation.name || 'Quotation',
				activities: [
					quotation.quotationStatus === 'CANCELLED'
						? `Quotation "${quotation.name}" permanently deleted`
						: `Quotation "${quotation.name}" cancelled`,
				],
				activityType: ACTIVITY_TYPES.DELETE,
			});
		}

		return responseHandler(quotation, res);
	});
}

export default new QuotationsController();
