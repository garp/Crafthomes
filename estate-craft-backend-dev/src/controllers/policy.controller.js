import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../utils/responseHandler.js';
import PolicyServices from '../services/modelServices/policy.services.js';

class PolicyController {
	get = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 10, sortType = 'sNo', sortOrder = 1 } = req.query;

		const where = {};

		const orderBy = {
			[sortType]: sortOrder == 1 ? 'asc' : 'desc',
		};

		if (id) {
			where.id = id;
		}

		if (search) {
			where.OR = [
				{ companyName: { contains: search, mode: 'insensitive' } },
				{ city: { contains: search, mode: 'insensitive' } },
				{ state: { contains: search, mode: 'insensitive' } },
			];
		}

		const skip = parseInt(pageNo, 10) * parseInt(pageLimit, 10);
		const take = parseInt(pageLimit, 10);

		const totalCount = await PolicyServices.count({ where });

		const policies = await PolicyServices.findMany({
			where,
			skip,
			take,
			orderBy,
		});

		return responseHandler({ policies, totalCount }, res);
	});

	getById = asyncHandler(async (req, res) => {
		const { id } = req.params;

		const policy = await PolicyServices.findOne({
			where: { id },
		});

		if (!policy) return errorHandler('E-1501', res);

		return responseHandler(policy, res);
	});

	create = asyncHandler(async (req, res) => {
		const {
			logo,
			companyName,
			address,
			pincode,
			city,
			state,
			country,
			website,
			termsAndConditions,
			gstIn,
			taxId,
			bankAccountNumber,
			bankAccountName,
			bankName,
			bankBranch,
			bankIFSC,
		} = req.body;

		const policy = await PolicyServices.create({
			data: {
				logo,
				companyName,
				address,
				pincode,
				city,
				state,
				country,
				website,
				termsAndConditions,
				gstIn,
				taxId,
				bankAccountNumber,
				bankAccountName,
				bankName,
				bankBranch,
				bankIFSC,
			},
		});

		return responseHandler(policy, res);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;

		const existingPolicy = await PolicyServices.findOne({ where: { id } });
		if (!existingPolicy) return errorHandler('E-1501', res);

		const updateData = {
			updatedBy: req.user.id,
			...req.body,
		};

		const policy = await PolicyServices.update({
			where: { id },
			data: updateData,
		});

		return responseHandler(policy, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;

		const existingPolicy = await PolicyServices.findOne({ where: { id } });
		if (!existingPolicy) return errorHandler('E-1501', res);

		const policy = await PolicyServices.delete({
			where: { id },
		});

		return responseHandler(policy, res);
	});
}

export default new PolicyController();

