import ClientServices from '../services/modelServices/client.services.js';
import UserServices from '../services/modelServices/user.services.js';
import ProjectServices from '../services/modelServices/project.services.js';
import RoleServices from '../services/modelServices/roles.services.js';
import EmailService from '../services/modelServices/email.services.js';
import AddressService from '../services/modelServices/address.service.js';
import PincodeServices from '../services/modelServices/pincode.services.js';
import PaymentServices from '../services/modelServices/payment.services.js';
import { asyncHandler, transactionHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';

class ClientController {
	create = transactionHandler(async (req, res, _, tx) => {
		const { userId } = req.user;
		const { name, phoneNumber, email, status, clientType, gstIn, panDetails, addresses, organizationName } = req.body;

		// Validation Check
		const existingEmail = await ClientServices.findFirst({ where: { email } }, tx);
		const existingPhoneNumber = await ClientServices.findFirst({ where: { phoneNumber } }, tx);
		if (existingEmail) return errorHandler('E-302a', res);
		if (existingPhoneNumber) return errorHandler('E-302b', res);

		// Create client
		const client = await ClientServices.create(
			{
				data: { name, phoneNumber, email, status, clientType, gstIn, panDetails, createdBy: userId, organizationName },
			},
			tx
		);

		// Create addresses if provided
		let createdAddresses = [];
		if (addresses && addresses.length > 0) {
			for (const address of addresses) {
				const pincodeRow = await PincodeServices.findFirst(
					{ where: { pincode: Number(address.pincode) } },
					tx
				);
				const newAddress = await AddressService.create(
					{
						data: {
							client: {
								connect: { id: client.id },
							},
							label: address.label,
							building: address.building,
							street: address.street,
							locality: address.locality,
							city: address.city,
							state: address.state,
							landmark: address.landmark,
							pincodeCode: Number(address.pincode),
							pincode: pincodeRow
								? {
									connect: { id: pincodeRow.id },
								}
								: undefined,
							country: address.country || 'INDIA',
							createdBy: userId,
						},
					},
					tx
				);
				createdAddresses.push(newAddress);
			}
		}

		// Create user for the client
		const role = await RoleServices.findFirst({ where: { name: 'client' } }, tx);

		const user = await UserServices.create(
			{
				data: {
					name,
					phoneNumber,
					email,
					userType: 'CLIENT',
					createdBy: userId,
					roleId: role.id,
					inviteState: 'SENT',
					invitedBy: userId,
					clientId: client.id,
				},
			},
			tx
		);

		// Prepare response payload
		const responsePayload = {
			...client,
			addresses: createdAddresses,
			// Email sending is now done in the background, so this
			// indicates the invitation has been queued.
			invitationSent: true,
		};

		// Send invitation email in the background so the client
		// does not have to wait for email delivery.
		setImmediate(async () => {
			try {
				const emailResult = await EmailService.sendClientInvitationEmail(email, name, user.id);
				if (!emailResult.success) {
					console.error('Failed to send client invitation email:', emailResult.error);
				}
			} catch (err) {
				console.error('Unexpected error while sending client invitation email:', err);
			}
		});

		return responseHandler(responsePayload, res);
	});

	get = asyncHandler(async (req, res) => {
		const {
			type,
			search,
			pageNo = 0,
			pageLimit = 10,
			searchText,
			id,
			status,
			sortType = 'createdAt',
			sortOrder = -1,
			projectId,
		} = req.query;

		const validFields = ['name', 'email', 'phoneNumber', 'status'];

		if (type && !validFields.includes(type)) {
			return errorHandler('E-002', res);
		}
		const where = {};
		const orderBy = {
			[sortType]: sortOrder === 1 ? 'asc' : 'desc',
		};

		if (id) {
			where.id = id;
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ email: { contains: search, mode: 'insensitive' } },
				{ phoneNumber: { contains: search, mode: 'insensitive' } },
				{ organizationName: { contains: search, mode: 'insensitive' } },
			];
		}

		// Status filter: active (default), inactive, all
		if (status) {
			const normalizedStatus = String(status).toLowerCase();
			if (normalizedStatus === 'active') {
				where.status = 'ACTIVE';
			} else if (normalizedStatus === 'inactive') {
				where.status = 'INACTIVE';
			} // 'all' => no status condition
		}

		// Filter clients by associated projectId if provided
		if (projectId) {
			where.Project = {
				some: {
					id: projectId,
				},
			};
		}

		const skip = parseInt(pageNo, 10) * parseInt(pageLimit, 10);
		const take = parseInt(pageLimit, 10);

		const totalCount = await ClientServices.count({ where });

		const clients = await ClientServices.findMany({
			where,
			skip,
			take,
			select: {
				id: true,
				name: true,
				email: true,
				phoneNumber: true,
				status: true,
				sNo: true,
				clientType: true,
				gstIn: true,
				panDetails: true,
				createdAt: true,
				Address: {
					where: { status: 'ACTIVE' },
					select: {
						id: true,
						label: true,
						building: true,
						street: true,
						locality: true,
						city: true,
						state: true,
						landmark: true,
						country: true,
						pincodeCode: true,
						pincodeId: true,
						pincode: {
							select: {
								id: true,
								pincode: true,
								city: true,
								district: true,
								state: true,
							},
						},
					},
				},
				Project: {
					select: {
						id: true,
						name: true,
						estimatedBudget: true,
					},
				},
				organizationName: true,
			},
			orderBy,
		});

		// Calculate payment progress for each client
		const clientIds = clients.map(client => client.id);

		let payments = [];
		if (clientIds.length > 0) {
			payments = await PaymentServices.findMany({
				where: {
					clientId: { in: clientIds },
					paymentStatus: 'PAID',
					status: 'ACTIVE',
				},
				select: {
					clientId: true,
					totalAmount: true,
				},
			});
		}

		// Group total paid amount per client
		const paidAmountByClientId = payments.reduce((acc, payment) => {
			if (!payment.clientId) return acc;
			if (!acc[payment.clientId]) {
				acc[payment.clientId] = 0;
			}
			acc[payment.clientId] += payment.totalAmount ?? 0;
			return acc;
		}, {});

		const clientsWithPaymentProgress = clients.map(client => {
			const totalProjectCost = (client.Project || []).reduce(
				(sum, project) => sum + (project.estimatedBudget ?? 0),
				0
			);

			const totalPaidAmount = paidAmountByClientId[client.id] ?? 0;
			const remainingProjectCost = Math.max(totalProjectCost - totalPaidAmount, 0);

			return {
				...client,
				paymentProgress: {
					totalProjectCost,
					totalPaidAmount,
					remainingProjectCost,
				},
			};
		});

		// Stats should always reflect ACTIVE clients and projects,
		// regardless of current filters applied to the list.
		const stats = await ProjectServices.stats();
		const totalActiveClients = await ClientServices.count({ where: { status: 'ACTIVE' } });
		stats.totalClients = totalActiveClients;

		return responseHandler({ clients: clientsWithPaymentProgress, totalCount, stats }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const { addresses, ...data } = req.body;
		const updateData = {};

		// Validate addresses if provided
		if (addresses && addresses.length > 0) {
			for (const address of addresses) {
				// Validate address exists and belongs to this client (if id is provided)
				if (address.id) {
					const existingAddress = await AddressService.findOne({
						where: { id: address.id, clientId: id },
					});
					if (!existingAddress) {
						return errorHandler('E-804', res); // Address not found or doesn't belong to this client
					}
				}
			}
		}

		// Add fields to updateData only if they are provided in the request body
		if (data.name !== undefined) updateData.name = data.name;
		if (data.phoneNumber !== undefined) updateData.phoneNumber = data.phoneNumber;
		if (data.status !== undefined) updateData.status = data.status;
		if (data.clientType !== undefined) updateData.clientType = data.clientType;
		if (data.gstIn !== undefined) updateData.gstIn = data.gstIn;
		if (data.panDetails !== undefined) updateData.panDetails = data.panDetails;
		if (data.organizationName !== undefined) updateData.organizationName = data.organizationName;

		updateData.updatedBy = userId;

		const client = await ClientServices.update({
			where: { id },
			data: updateData,
		});

		// Handle addresses if provided
		let updatedAddresses = [];
		if (addresses && addresses.length > 0) {
			for (const address of addresses) {
				if (address.id) {
					// Update existing address
					const addressUpdateData = { updatedBy: userId };
					if (address.label !== undefined) addressUpdateData.label = address.label;
					if (address.building !== undefined) addressUpdateData.building = address.building;
					if (address.street !== undefined) addressUpdateData.street = address.street;
					if (address.locality !== undefined) addressUpdateData.locality = address.locality;
					if (address.city !== undefined) addressUpdateData.city = address.city;
					if (address.state !== undefined) addressUpdateData.state = address.state;
					if (address.landmark !== undefined) addressUpdateData.landmark = address.landmark;
					if (address.pincode !== undefined) {
						const pincodeRow = await PincodeServices.findFirst({
							where: { pincode: Number(address.pincode) },
						});
						addressUpdateData.pincodeCode = Number(address.pincode);
						addressUpdateData.pincode = pincodeRow
							? {
								connect: { id: pincodeRow.id },
							}
							: {
								disconnect: true,
							};
					}
					if (address.country !== undefined) addressUpdateData.country = address.country;

					const updatedAddress = await AddressService.update({
						where: { id: address.id },
						data: addressUpdateData,
					});
					updatedAddresses.push(updatedAddress);
				} else {
					// Create new address
					const pincodeRow = await PincodeServices.findFirst({
						where: { pincode: Number(address.pincode) },
					});
					const newAddress = await AddressService.create({
						data: {
							client: {
								connect: { id },
							},
							label: address.label,
							building: address.building,
							street: address.street,
							locality: address.locality,
							city: address.city,
							state: address.state,
							landmark: address.landmark,
							pincodeCode: Number(address.pincode),
							pincode: pincodeRow
								? {
									connect: { id: pincodeRow.id },
								}
								: undefined,
							country: address.country || 'INDIA',
							createdBy: userId,
						},
					});
					updatedAddresses.push(newAddress);
				}
			}
		}

		return responseHandler(
			{
				...client,
				addresses: updatedAddresses,
			},
			res
		);
	});

	delete = transactionHandler(async (req, res, _, tx) => {
		const { id } = req.params;
		const { userId } = req.user;

		// First, soft delete all associated users
		await UserServices.updateMany(
			{
				where: { clientId: id },
				data: { status: 'INACTIVE', updatedBy: userId },
			},
			tx
		);

		// Then, soft delete the client
		const client = await ClientServices.update(
			{
				where: { id },
				data: { status: 'INACTIVE', updatedBy: userId },
			},
			tx
		);

		return responseHandler(client, res);
	});
}

export default new ClientController();
