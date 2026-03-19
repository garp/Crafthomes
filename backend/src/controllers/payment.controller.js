import PaymentServices from '../services/modelServices/payment.services.js';
import PaymentItemServices from '../services/modelServices/mapping/paymentItem.services.js';
import ProjectServices from '../services/modelServices/project.services.js';
import ClientServices from '../services/modelServices/client.services.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import trackActivity from '../middlewares/activities.middleware.js';
import { ENTITY_TYPES, ACTIVITY_TYPES } from '../constants/activityTypes.js';

class PaymentController {
	create = asyncHandler(async (req, res) => {
		const { items, projectId, clientId, ...paymentData } = req.body;
		const { userId } = req.user;

		const project = await ProjectServices.findOne({ where: { id: projectId } });
		if (!project) {
			return errorHandler('E-1401', res);
		}
		const client = await ClientServices.findOne({ where: { id: clientId } });
		if (!client) {
			return errorHandler('E-1401', res);
		}

		const payment = await PaymentServices.create({
			data: {
				...paymentData,
				paymentType: paymentData.paymentType || 'NA',
				paymentMethod: paymentData.paymentMethod || 'NA',
				projectId: project.id,
				clientId: client.id,
				createdBy: userId,
			},
		});

		if (items && items.length > 0) {
			await PaymentItemServices.createMany({
				data: items.map(item => ({ ...item, paymentId: payment.id })),
			});
		}

		// Track activity for payment creation
		await trackActivity(userId, {
			projectId,
			entityType: ENTITY_TYPES.PAYMENT,
			entityId: payment.id,
			entityName: `Payment #${payment.sNo}`,
			activities: [`Payment created - Amount: ${paymentData.totalAmount || 0}, Type: ${paymentData.paymentType || 'NA'}`],
			activityType: ACTIVITY_TYPES.CREATE,
		});

		return responseHandler(payment, res);
	});

	get = asyncHandler(async (req, res) => {
		const { query } = req;
		const where = {};
		if (query.projectId) {
			where.projectId = query.projectId;
		}
		if (query.clientId) {
			where.clientId = query.clientId;
		}
		if (query.paymentType) {
			where.paymentType = query.paymentType;
		}
		if (query.paymentStatus) {
			where.paymentStatus = query.paymentStatus;
		}
		if (query.paymentMethod) {
			where.paymentMethod = query.paymentMethod;
		}
		if (query.search) {
			where.OR = [
				{ project: { name: { contains: query.search, mode: 'insensitive' } } },
				{ client: { name: { contains: query.search, mode: 'insensitive' } } },
			];
		}

		// Only create orderBy if sortType is provided
		const orderBy = query.sortType ? { [query.sortType]: query.sortOrder == 1 ? 'asc' : 'desc' } : { createdAt: 'desc' };
		const totalCount = await PaymentServices.count({ where });
		const payments = await PaymentServices.findMany({
			where,
			select: {
				id: true,
				sNo: true,
				project: {
					select: {
						id: true,
						name: true,
					},
				},
				client: {
					select: {
						id: true,
						name: true,
					},
				},
				paymentType: true,
				paymentStatus: true,
				paymentDate: true,
				referenceId: true,
				paymentMethod: true,
				otherPaymentMethod: true,
				subTotalAmount: true,
				discount: true,
				tax: true,
				totalAmount: true,
				createdAt: true,
				updatedAt: true,
				createdBy: true,
				updatedBy: true,
				status: true,
				paymentItems: {
					select: {
						id: true,
						name: true,
						quantity: true,
						price: true,
					},
				},
				createdByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				updatedByUser: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
			orderBy,
			skip: parseInt(query.pageNo, 10) * parseInt(query.pageLimit, 10),
			take: parseInt(query.pageLimit, 10),
		});
		return responseHandler({ payments, totalCount }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { items, ...paymentData } = req.body;
		const { userId } = req.user;

		// Get existing payment for activity tracking
		const existingPayment = await PaymentServices.findOne({ where: { id } });
		if (!existingPayment) {
			return errorHandler('E-1401', res);
		}

		const fieldUpdates = [];

		if (paymentData.projectId) {
			const project = await ProjectServices.findOne({ where: { id: paymentData.projectId } });
			if (!project) {
				return errorHandler('E-1401', res);
			}
		}
		if (paymentData.clientId) {
			const client = await ClientServices.findOne({ where: { id: paymentData.clientId } });
			if (!client) {
				return errorHandler('E-1401', res);
			}
		}

		// Track changes
		if (paymentData.paymentStatus !== undefined && existingPayment.paymentStatus !== paymentData.paymentStatus) {
			fieldUpdates.push(`Payment status changed from "${existingPayment.paymentStatus}" to "${paymentData.paymentStatus}"`);
		}
		if (paymentData.paymentType !== undefined && existingPayment.paymentType !== paymentData.paymentType) {
			fieldUpdates.push(`Payment type changed to "${paymentData.paymentType}"`);
		}
		if (paymentData.paymentMethod !== undefined && existingPayment.paymentMethod !== paymentData.paymentMethod) {
			fieldUpdates.push(`Payment method changed to "${paymentData.paymentMethod}"`);
		}
		if (paymentData.totalAmount !== undefined && existingPayment.totalAmount !== paymentData.totalAmount) {
			fieldUpdates.push(`Total amount updated from ${existingPayment.totalAmount || 0} to ${paymentData.totalAmount}`);
		}
		if (paymentData.paidAmount !== undefined && existingPayment.paidAmount !== paymentData.paidAmount) {
			fieldUpdates.push(`Paid amount updated to ${paymentData.paidAmount}`);
		}
		if (paymentData.discount !== undefined && existingPayment.discount !== paymentData.discount) {
			fieldUpdates.push(`Discount updated to ${paymentData.discount}`);
		}

		const payment = await PaymentServices.update({ where: { id }, data: { ...paymentData, updatedBy: userId } });

		if (items && items.length > 0) {
			await PaymentItemServices.deleteMany({ where: { paymentId: id } });
			await PaymentItemServices.createMany({ data: items.map(item => ({ ...item, paymentId: id })) });
			fieldUpdates.push(`Payment items updated (${items.length} item(s))`);
		}

		// Track activity for payment update
		const projectId = paymentData.projectId || existingPayment.projectId;
		if (fieldUpdates.length > 0 && projectId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.PAYMENT,
				entityId: id,
				entityName: `Payment #${payment.sNo}`,
				activities: fieldUpdates,
				activityType: ACTIVITY_TYPES.UPDATE,
			});
		}

		return responseHandler(payment, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existingPayment = await PaymentServices.findOne({ where: { id } });
		if (!existingPayment) {
			return errorHandler('E-1401', res);
		}

		const projectId = existingPayment.projectId;

		await PaymentItemServices.deleteMany({ where: { paymentId: id } });
		const payment = await PaymentServices.delete({ where: { id } });

		// Track activity for payment deletion
		if (projectId) {
			await trackActivity(userId, {
				projectId,
				entityType: ENTITY_TYPES.PAYMENT,
				entityId: id,
				entityName: `Payment #${existingPayment.sNo}`,
				activities: [`Payment deleted - Amount: ${existingPayment.totalAmount || 0}`],
				activityType: ACTIVITY_TYPES.DELETE,
			});
		}

		return responseHandler(payment, res);
	});
}

export default new PaymentController();
