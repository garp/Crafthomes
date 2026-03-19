import PincodeServices from '../services/modelServices/pincode.services.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';

class PincodeController {
	create = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { pincode, state, city, district, circle, region, division, office, officeType, delivery } = req.body;

		// Allow multiple rows per pincode number (no duplicate check)

		const newPincode = await PincodeServices.create({
			data: {
				pincode: parseInt(pincode),
				state,
				city,
				district,
				circle,
				region,
				division,
				office,
				officeType,
				delivery,
				createdBy: userId,
			},
		});

		return responseHandler(newPincode, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const { pincode } = req.query;

		if (!pincode) {
			return errorHandler('E-803', res); // Pincode required
		}

		const pincodeData = await PincodeServices.findFirst({
			where: { pincode: parseInt(pincode) },
		});

		if (!pincodeData) {
			return errorHandler('E-802', res); // Pincode not found
		}

		return responseHandler(pincodeData, res, 200);
	});

	getById = asyncHandler(async (req, res) => {
		const { id } = req.params;

		const pincode = await PincodeServices.findOne({ where: { id } });
		if (!pincode) {
			return errorHandler('E-802', res);
		}

		return responseHandler(pincode, res, 200);
	});

	update = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { id } = req.params;
		const { pincode, state, city, district, circle, region, division, office, officeType, delivery, status } = req.body;

		const existingPincode = await PincodeServices.findOne({ where: { id } });
		if (!existingPincode) {
			return errorHandler('E-802', res); // Pincode not found
		}

		const updateData = { updatedBy: userId };

		if (pincode !== undefined) updateData.pincode = parseInt(pincode);
		if (state !== undefined) updateData.state = state;
		if (city !== undefined) updateData.city = city;
		if (district !== undefined) updateData.district = district;
		if (circle !== undefined) updateData.circle = circle;
		if (region !== undefined) updateData.region = region;
		if (division !== undefined) updateData.division = division;
		if (office !== undefined) updateData.office = office;
		if (officeType !== undefined) updateData.officeType = officeType;
		if (delivery !== undefined) updateData.delivery = delivery;
		if (status !== undefined) updateData.status = status;

		const updatedPincode = await PincodeServices.update({
			where: { id },
			data: updateData,
		});

		return responseHandler(updatedPincode, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { id } = req.params;

		const existingPincode = await PincodeServices.findOne({ where: { id } });
		if (!existingPincode) {
			return errorHandler('E-802', res); // Pincode not found
		}

		const pincode = await PincodeServices.update({
			where: { id },
			data: { status: 'INACTIVE', updatedBy: userId },
		});

		return responseHandler(pincode, res, 200);
	});
}

export default new PincodeController();
