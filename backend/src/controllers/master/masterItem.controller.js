import MasterItemService from '../../services/modelServices/master/masterItem.service.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../../utils/responseHandler.js';
import CategoryServices from '../../services/modelServices/category.services.js';
import SubCategoryServices from '../../services/modelServices/subCategory.services.js';
import VendorServices from '../../services/modelServices/vendor.services.js';
import UnitServices from '../../services/modelServices/unit.services.js';

class MasterItemController {
	create = asyncHandler(async (req, res) => {
		const data = req.body;
		data.createdBy = req.user.userId;

		if (data.categoryId) {
			const category = await CategoryServices.findOne({ where: { id: data.categoryId } });
			if (!category) return errorHandler('E-1101', res);
			data.categoryId = category.id;
		}

		if (data.subCategoryId) {
			const subCategory = await SubCategoryServices.findOne({ where: { id: data.subCategoryId } });
			if (!subCategory) return errorHandler('E-1101', res);
			data.subCategoryId = subCategory.id;
		}

		if (data.vendorId) {
			const vendor = await VendorServices.findOne({ where: { id: data.vendorId } });
			if (!vendor) return errorHandler('E-1101', res);
			data.vendorId = vendor.id;
		}

		if (data.unitId) {
			const unit = await UnitServices.findOne({ where: { id: data.unitId } });
			if (!unit) return errorHandler('E-1101', res);
		}
		if (data.unit != null) delete data.unit;

		const masterItem = await MasterItemService.create({ data });
		return responseHandler(masterItem, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const {
			id,
			search,
			pageNo = 0,
			pageLimit = 10,
			categoryId,
			subCategoryId,
			brandId,
			sortType = 'createdAt',
			sortOrder = -1,
		} = req.query;
		const where = { status: 'ACTIVE' };
		if (id) {
			where.id = id;
		}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		if (categoryId) {
			where.categoryId = { contains: categoryId };
		}
		if (subCategoryId) {
			where.subCategoryId = { contains: subCategoryId };
		}
		if (brandId) {
			where.subCategory = {
				brandId,
			};
		}
		const totalCount = await MasterItemService.count({ where });
		const masterItems = await MasterItemService.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			select: {
				id: true,
				sNo: true,
				name: true,
				primaryFile: true,
				secondaryFile: true,
				description: true,
				category: {
					select: {
						id: true,
						name: true,
					},
				},
				subCategory: {
					select: {
						id: true,
						name: true,
						brand: {
							select: {
								id: true,
								name: true,
							},
						},
					},
				},
				vendor: {
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

				materialFile: true,
				materialCode: true,
				colorCode: true,
				mrp: true,
				currency: true,
				tags: true,
				createdAt: true,
				status: true,
			},
			orderBy: { [sortType]: sortOrder === 1 ? 'asc' : 'desc' },
		});
		return responseHandler({ masterItems, totalCount }, res, 200);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const data = req.body;
		data.updatedBy = req.user.userId;
		if (data.categoryId) {
			const category = await CategoryServices.findOne({ where: { id: data.categoryId } });
			if (!category) return errorHandler('E-1101', res);
			data.categoryId = category.id;
		}
		if (data.subCategoryId) {
			const subCategory = await SubCategoryServices.findOne({ where: { id: data.subCategoryId } });
			if (!subCategory) return errorHandler('E-1101', res);
			data.subCategoryId = subCategory.id;
		}
		if (data.vendorId) {
			const vendor = await VendorServices.findOne({ where: { id: data.vendorId } });
			if (!vendor) return errorHandler('E-1101', res);
			data.vendorId = vendor.id;
		}

		if (data.unitId) {
			const unit = await UnitServices.findOne({ where: { id: data.unitId } });
			if (!unit) return errorHandler('E-1101', res);
		}
		if (data.unit != null) delete data.unit;
		const masterItem = await MasterItemService.update({ where: { id }, data });
		return responseHandler(masterItem, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;
		const masterItem = await MasterItemService.update({ where: { id }, data: { status: 'INACTIVE', updatedBy: userId } });
		return responseHandler(masterItem, res, 200);
	});
}

export default new MasterItemController();
