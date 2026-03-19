import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler } from '../utils/responseHandler.js';
import AreaServices from '../services/modelServices/area.services.js';

class AreaController {
	create = asyncHandler(async (req, res) => {
		const { name } = req.body;
		const area = await AreaServices.create({
			data: { name: name.trim() },
		});
		return responseHandler(area, res, 201);
	});

	get = asyncHandler(async (req, res) => {
		const {
			pageNo = 0,
			pageLimit = 100,
			search,
			sortType = 'name',
			sortOrder = 1,
		} = req.query;

		const where = {};
		if (search) {
			where.name = { contains: search, mode: 'insensitive' };
		}
		if (req.query.id) {
			where.id = req.query.id;
		}

		const totalCount = await AreaServices.count({ where });
		const areas = await AreaServices.findMany({
			where,
			skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
			take: parseInt(pageLimit, 10),
			orderBy: { [sortType]: sortOrder === 1 ? 'asc' : 'desc' },
		});

		return responseHandler({ areas, totalCount }, res, 200);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { name } = req.body;
		const area = await AreaServices.update({
			where: { id },
			data: name != null ? { name: name.trim() } : {},
		});
		return responseHandler(area, res, 200);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		await AreaServices.delete({ where: { id } });
		return responseHandler({ message: 'Area deleted' }, res, 200);
	});
}

export default new AreaController();
