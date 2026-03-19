import { asyncHandler } from '../../utils/asyncHandler.js';
import { errorHandler, responseHandler } from '../../utils/responseHandler.js';
import BrandServices from '../../services/modelServices/master/brand.services.js';

class BrandController {
	create = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { name } = req.body;
		const brand = await BrandServices.create({ data: { name, createdBy: userId } });
		return responseHandler({ brand }, res);
	});

	get = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 10 } = req.query;
		const where = { status: 'ACTIVE' };
		if (id) {
			where.id = id;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		const totalCount = await BrandServices.count({ where });
		const brands = await BrandServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy: { name: 'asc' },
		});
		return responseHandler({ brands, totalCount }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { brandId } = req.params;
		const { name, status } = req.body;

		const existingBrand = await BrandServices.findOne({ where: { id: brandId } });
		if (!existingBrand) return errorHandler('E-1101', res);

		const updateData = { updatedBy: userId };
		if (name !== undefined) updateData.name = name;
		if (status !== undefined) updateData.status = status;
		const brand = await BrandServices.update({ where: { id: brandId }, data: updateData });
		return responseHandler({ brand }, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { brandId } = req.params;
		const brand = await BrandServices.update({ where: { id: brandId }, data: { status: 'INACTIVE', updatedBy: userId } });
		return responseHandler({ brand }, res);
	});
}

export default new BrandController();
