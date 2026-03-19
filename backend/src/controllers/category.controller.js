import { asyncHandler } from '../utils/asyncHandler.js';
import { errorHandler, responseHandler } from '../utils/responseHandler.js';
import CategoryServices from '../services/modelServices/category.services.js';

class CategoryController {
	create = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { name, description, media } = req.body;
		const category = await CategoryServices.create({ data: { name, description, media, createdBy: userId } });
		return responseHandler({ category }, res);
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
		const totalCount = await CategoryServices.count({ where });
		const categories = await CategoryServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			select: {
				id: true,
				sNo: true,
				name: true,
				description: true,
				media: true,
				createdAt: true,
				updatedAt: true,
				createdBy: true,
				updatedBy: true,
				SubCategory: {
					select: {
						id: true,
						sNo: true,
						name: true,
						description: true,
						media: true,
						brand: {
							select: {
								id: true,
								sNo: true,
								name: true,
							},
						},
					},
				},
			},
			orderBy: { name: 'asc' },
		});
		return responseHandler({ categories, totalCount }, res);
	});

	update = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { id } = req.params;
		const { name, description, media, status } = req.body;

		const existingCategory = await CategoryServices.findOne({ where: { id } });
		if (!existingCategory) return errorHandler('E-1101', res);

		const updateData = { updatedBy: userId };
		if (name !== undefined) updateData.name = name;
		if (description !== undefined) updateData.description = description;
		if (media !== undefined) updateData.media = media;
		if (status !== undefined) updateData.status = status;
		const category = await CategoryServices.update({ where: { id }, data: updateData });
		return responseHandler({ category }, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { userId } = req.user;
		const { id } = req.params;
		const category = await CategoryServices.update({ where: { id }, data: { status: 'INACTIVE', updatedBy: userId } });
		return responseHandler({ category }, res);
	});
}

export default new CategoryController();
