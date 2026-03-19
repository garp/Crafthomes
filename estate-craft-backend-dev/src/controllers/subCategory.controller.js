import { asyncHandler } from '../utils/asyncHandler.js';
import { errorHandler, responseHandler } from '../utils/responseHandler.js';
import SubCategoryServices from '../services/modelServices/subCategory.services.js';
import CategoryServices from '../services/modelServices/category.services.js';
import BrandServices from '../services/modelServices/master/brand.services.js';

class SubCategoryController {
	create = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const data = req.body;

		const category = await CategoryServices.findOne({ where: { id: data.categoryId } });
		if (!category) return errorHandler('E-1101', res);

		if (data.brandId) {
			const brand = await BrandServices.findOne({ where: { id: data.brandId } });
			if (!brand) return errorHandler('E-1104', res);
			data.brandId = brand.id;
		}

		const subCategory = await SubCategoryServices.create({ data: { ...data, createdBy: userId } });
		return responseHandler({ subCategory }, res);
	});

	get = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 10, categoryId } = req.query;
		const where = { status: 'ACTIVE' };
		if (id) {
			where.id = id;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		if (categoryId) {
			where.categoryId = categoryId;
		}
		const totalCount = await SubCategoryServices.count({ where });
		const subCategories = await SubCategoryServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy: { name: 'asc' },
		});
		return responseHandler({ subCategories, totalCount }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { subId } = req.params;
		const { name, description, brand, media, status, categoryId } = req.body;

		const existingSubCategory = await SubCategoryServices.findOne({ where: { id: subId } });
		if (!existingSubCategory) return errorHandler('E-1102', res);

		const updateData = { updatedBy: userId };
		if (name !== undefined) updateData.name = name;
		if (description !== undefined) updateData.description = description;
		if (brand !== undefined) updateData.brand = brand;
		if (media !== undefined) updateData.media = media;
		if (status !== undefined) updateData.status = status;
		if (categoryId !== undefined) {
			const category = await CategoryServices.findOne({ where: { id: categoryId } });
			if (!category) return errorHandler('E-1101', res);
			updateData.categoryId = categoryId;
		}

		const subCategory = await SubCategoryServices.update({ where: { id: subId }, data: updateData });

		return responseHandler({ subCategory }, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { subId } = req.params;
		const subCategory = await SubCategoryServices.update({
			where: { id: subId },
			data: { status: 'INACTIVE', updatedBy: userId },
		});
		return responseHandler({ subCategory }, res);
	});
}

export default new SubCategoryController();
