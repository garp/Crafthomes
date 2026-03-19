import VendorServices from '../services/modelServices/vendor.services.js';
import SpecializedServices from '../services/modelServices/specialized.services.js';
import VendorSpecializedMappingServices from '../services/modelServices/mapping/vendorSpecializedMapping.services.js';
import { asyncHandler, transactionHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import UserServices from '../services/modelServices/user.services.js';
import RoleServices from '../services/modelServices/roles.services.js';
import ProjectServices from '../services/modelServices/project.services.js';
import EmailService from '../services/modelServices/email.services.js';
import AddressService from '../services/modelServices/address.service.js';
import PincodeServices from '../services/modelServices/pincode.services.js';

class VendorController {
	create = transactionHandler(async (req, res, _, tx) => {
		const { userId } = req.user;
		const { specializedId, name, phoneNumber, email, status, panDetails, address } = req.body;

		// Validation Check
		const existingEmail = await VendorServices.findFirst({ where: { email } }, tx);
		const existingPhoneNumber = await VendorServices.findFirst({ where: { phoneNumber } }, tx);
		if (existingEmail) return errorHandler('E-701a', res);
		if (existingPhoneNumber) return errorHandler('E-701b', res);

		// Create vendor
		const vendor = await VendorServices.create(
			{
				data: { name, phoneNumber, email, status, panDetails, createdBy: userId },
			},
			tx
		);

		// Handle specializations
		if (specializedId && specializedId.length > 0) {
			const existingSpecialized = await SpecializedServices.findMany(
				{
					where: { id: { in: specializedId } },
				},
				tx
			);
			if (existingSpecialized.length !== specializedId.length) {
				return errorHandler('E-702', res);
			}
			await VendorSpecializedMappingServices.createMany(
				{
					data: specializedId.map(sId => ({ vendorId: vendor.id, specializedId: sId })),
				},
				tx
			);
		}

		// Create address if provided
		let createdAddress = null;
		if (address) {
			const pincodeRow = await PincodeServices.findFirst(
				{ where: { pincode: Number(address.pincode) } },
				tx
			);
			createdAddress = await AddressService.create(
				{
					data: {
						vendor: {
							connect: { id: vendor.id },
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
		}

		// Create user for the vendor
		const role = await RoleServices.findFirst({ where: { name: 'vendor' } }, tx);
		const user = await UserServices.create(
			{
				data: {
					name,
					phoneNumber,
					email,
					userType: 'VENDOR',
					createdBy: userId,
					roleId: role.id,
					inviteState: 'SENT',
					invitedBy: userId,
					vendorId: vendor.id,
				},
			},
			tx
		);

		// Prepare response payload
		const responsePayload = {
			...vendor,
			address: createdAddress,
			// Email sending is now done in the background, so this
			// indicates the invitation has been queued.
			invitationSent: true,
		};

		// Send invitation email in the background so the vendor
		// does not have to wait for email delivery.
		setImmediate(async () => {
			try {
				const emailResult = await EmailService.sendVendorInvitationEmail(email, name, user.id);
				if (!emailResult.success) {
					console.error('Failed to send vendor invitation email:', emailResult.error);
				}
			} catch (err) {
				console.error('Unexpected error while sending vendor invitation email:', err);
			}
		});

		return responseHandler(responsePayload, res);
	});

	get = asyncHandler(async (req, res) => {
		const { type, search, pageNo = 0, pageLimit = 10, searchText, id, status, sortType = 'sNo', sortOrder = 1 } = req.query;

		const validFields = ['name', 'email', 'phoneNumber', 'status'];

		if (type && !validFields.includes(type)) {
			return errorHandler('E-002', res);
		}
		const where = {};
		const orderBy = {
			[sortType]: sortOrder == 1 ? 'asc' : 'desc',
		};

		if (id) {
			where.id = id;
		}

		if (search && type) {
			where[type] = { contains: search, mode: 'insensitive' };
		}

		if (searchText) {
			where.OR = [
				{ name: { contains: searchText, mode: 'insensitive' } },
				{ email: { contains: searchText, mode: 'insensitive' } },
				{ phoneNumber: { contains: searchText, mode: 'insensitive' } },
			];
		}

		// Status filter: active (default), inactive, all
		const normalizedStatus = status ? String(status).toLowerCase() : 'active';
		if (normalizedStatus === 'active') {
			where.status = 'ACTIVE';
		} else if (normalizedStatus === 'inactive') {
			where.status = 'INACTIVE';
		} // 'all' => no status condition
		const skip = parseInt(pageNo, 10) * parseInt(pageLimit, 10);
		const take = parseInt(pageLimit, 10);

		const totalCount = await VendorServices.count({ where });

		const vendor = await VendorServices.findMany({
			where,
			skip,
			take,
			select: {
				id: true,
				sNo: true,
				name: true,
				phoneNumber: true,
				email: true,
				panDetails: true,
				status: true,
				createdAt: true,
				specializations: {
					select: {
						id: true,
						specialized: {
							select: {
								id: true,
								sNo: true,
								name: true,
							},
						},
					},
				},
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
			},
			orderBy,
		});

		const stats = await ProjectServices.stats();
		stats.totalVendors = totalCount;

		return responseHandler({ vendor, totalCount, stats }, res);
	});

	update = transactionHandler(async (req, res, _, tx) => {
		const { id } = req.params;
		const existingVendor = await VendorServices.findOne({ where: { id } }, tx);
		if (!existingVendor) return errorHandler('E-701', res);
		const { name, phoneNumber, email, startDate, status, panDetails, specializedId, address } = req.body;
		const { userId } = req.user;

		// Validate address if provided
		if (address) {
			// Validate address exists and belongs to this vendor (if id is provided)
			if (address.id) {
				const existingAddress = await AddressService.findOne(
					{
						where: { id: address.id, vendorId: id },
					},
					tx
				);
				if (!existingAddress) {
					return errorHandler('E-804', res); // Address not found or doesn't belong to this vendor
				}
			}
		}

		const updateData = { updatedBy: userId };

		if (name !== undefined) updateData.name = name;
		if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
		if (email !== undefined) updateData.email = email;
		if (panDetails !== undefined) updateData.panDetails = panDetails;
		if (status !== undefined) updateData.status = status;
		if (specializedId !== undefined) {
			const existingSpecialized = await SpecializedServices.findMany(
				{ where: { id: { in: specializedId } } },
				tx
			);
			if (existingSpecialized.length !== specializedId.length) return errorHandler('E-702', res);
			await VendorSpecializedMappingServices.deleteMany({ where: { vendorId: id } }, tx);
			await VendorSpecializedMappingServices.createMany(
				{
					data: specializedId.map(sId => ({ vendorId: id, specializedId: sId })),
				},
				tx
			);
		}

		const vendor = await VendorServices.update({ where: { id }, data: updateData }, tx);

		// Handle address if provided
		let updatedAddress = null;
		if (address) {
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
					const pincodeRow = await PincodeServices.findFirst(
						{ where: { pincode: Number(address.pincode) } },
						tx
					);
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

				updatedAddress = await AddressService.update(
					{
						where: { id: address.id },
						data: addressUpdateData,
					},
					tx
				);
			} else {
				// Create new address
				const pincodeRow = await PincodeServices.findFirst(
					{ where: { pincode: Number(address.pincode) } },
					tx
				);
				updatedAddress = await AddressService.create(
					{
						data: {
							vendor: {
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
					},
					tx
				);
			}
		}

		return responseHandler(
			{
				...vendor,
				address: updatedAddress,
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
				where: { vendorId: id },
				data: { status: 'INACTIVE', updatedBy: userId },
			},
			tx
		);

		// Then, soft delete the vendor
		const vendor = await VendorServices.update(
			{
				where: { id },
				data: { status: 'INACTIVE', updatedBy: userId },
			},
			tx
		);

		if (!vendor) return errorHandler('E-701', res);
		return responseHandler(vendor, res);
	});

	createSpecialized = asyncHandler(async (req, res) => {
		const { name } = req.body;
		const { userId } = req.user;
		const existingSpecialized = await SpecializedServices.findFirst({
			where: { name: { equals: name, mode: 'insensitive' } },
		});
		if (existingSpecialized) return errorHandler('E-702', res);
		const specialized = await SpecializedServices.create({ data: { name, createdBy: userId } });
		return responseHandler(specialized, res);
	});

	getSpecialized = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 10 } = req.query;
		const where = { status: 'ACTIVE' };
		if (id) {
			where.id = id;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		const specialized = await SpecializedServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			select: {
				id: true,
				name: true,
				status: true,
			},
		});
		const totalCount = await SpecializedServices.count({ where });
		return responseHandler({ specialized, totalCount }, res);
	});

	updateSpecialized = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { name, status = 'ACTIVE' } = req.body;
		const { userId } = req.user;
		const existingSpecialized = await SpecializedServices.findOne({ where: { id } });
		if (!existingSpecialized) return errorHandler('E-702', res);
		const specialized = await SpecializedServices.update({ where: { id }, data: { name, status, updatedBy: userId } });
		return responseHandler(specialized, res);
	});

	deleteSpecialized = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const specialized = await SpecializedServices.update({ where: { id }, data: { status: 'INACTIVE', updatedBy: userId } });
		if (!specialized) return errorHandler('E-702', res);
		return responseHandler(specialized, res);
	});
}

export default new VendorController();
