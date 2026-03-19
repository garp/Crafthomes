import AddressService from '../services/modelServices/address.service.js';
import ClientServices from '../services/modelServices/client.services.js';
import VendorServices from '../services/modelServices/vendor.services.js';
import PincodeServices from '../services/modelServices/pincode.services.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';

class AddressController {
	create = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { clientId, vendorId, label, building, street, locality, city, state, landmark, pincode, country } = req.body;

		// Validate clientId if provided
		if (clientId) {
			const clientExists = await ClientServices.findOne({ where: { id: clientId } });
			if (!clientExists) {
				return errorHandler('E-301', res); // Client not found
			}
		}

		// Validate vendorId if provided
		if (vendorId) {
			const vendorExists = await VendorServices.findOne({ where: { id: vendorId } });
			if (!vendorExists) {
				return errorHandler('E-701', res); // Vendor not found
			}
		}

		// Pincode is used only for optional city/state prefilling. Save the address even if no master pincode row exists.
		const pincodeRow = await PincodeServices.findFirst({ where: { pincode: Number(pincode) } });

		const address = await AddressService.create({
			data: {
				client: clientId
					? {
						connect: { id: clientId },
					}
					: undefined,
				vendor: vendorId
					? {
						connect: { id: vendorId },
					}
					: undefined,
				label,
				building,
				street,
				locality,
				city,
				state,
				landmark,
				pincodeCode: Number(pincode),
				pincode: pincodeRow
					? {
						connect: { id: pincodeRow.id },
					}
					: undefined,
				country,
				createdBy: userId,
			},
		});

		return responseHandler(address, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const { id, clientId, vendorId } = req.query;
		const where = { status: 'ACTIVE' };

		if (id) where.id = id;
		if (clientId) where.clientId = clientId;
		if (vendorId) where.vendorId = vendorId;

		const addresses = await AddressService.findMany({
			where,
			include: {
				client: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				vendor: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
				pincode: {
					select: {
						id: true,
						pincode: true,
						city: true,
						district: true,
						state: true,
					},
				},
				pincodeCode: true,
				pincodeId: true,
			},
		});

		return responseHandler({ addresses }, res, 200);
	});

	update = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { id } = req.params;
		const { clientId, vendorId, label, building, street, locality, city, state, landmark, pincode, country, status } = req.body;

		// Check if address exists
		const existingAddress = await AddressService.findOne({ where: { id } });
		if (!existingAddress) {
			return errorHandler('E-804', res); // Address not found
		}

		const updateData = { updatedBy: userId };

		// Validate clientId if provided
		if (clientId !== undefined) {
			if (clientId) {
				const clientExists = await ClientServices.findOne({ where: { id: clientId } });
				if (!clientExists) {
					return errorHandler('E-301', res);
				}
			}
			updateData.clientId = clientId || null;
		}

		// Validate vendorId if provided
		if (vendorId !== undefined) {
			if (vendorId) {
				const vendorExists = await VendorServices.findOne({ where: { id: vendorId } });
				if (!vendorExists) {
					return errorHandler('E-701', res);
				}
			}
			updateData.vendorId = vendorId || null;
		}

		// Pincode is optional for lookup only; keep the address saveable even when there is no matching master pincode row.
		if (pincode !== undefined) {
			const pincodeRow = await PincodeServices.findFirst({ where: { pincode: Number(pincode) } });
			updateData.pincodeCode = Number(pincode);
			updateData.pincode = pincodeRow
				? {
					connect: { id: pincodeRow.id },
				}
				: {
					disconnect: true,
				};
		}

		if (label !== undefined) updateData.label = label;
		if (building !== undefined) updateData.building = building;
		if (street !== undefined) updateData.street = street;
		if (locality !== undefined) updateData.locality = locality;
		if (city !== undefined) updateData.city = city;
		if (state !== undefined) updateData.state = state;
		if (landmark !== undefined) updateData.landmark = landmark;
		if (country !== undefined) updateData.country = country;
		if (status !== undefined) updateData.status = status;

		const address = await AddressService.update({
			where: { id },
			data: updateData,
		});

		return responseHandler(address, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { id } = req.params;

		// Check if address exists
		const existingAddress = await AddressService.findOne({ where: { id } });
		if (!existingAddress) {
			return errorHandler('E-804', res); // Address not found
		}

		const address = await AddressService.update({
			where: { id },
			data: { status: 'INACTIVE', updatedBy: userId },
		});

		return responseHandler(address, res, 200);
	});
}

export default new AddressController();
