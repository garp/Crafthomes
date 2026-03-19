import UnitServices from '../services/modelServices/unit.services.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler } from '../utils/responseHandler.js';

class UnitController {
    create = asyncHandler(async (req, res) => {
        const data = req.body;
        const unit = await UnitServices.create({ data });
        return responseHandler(unit, res, 201);
    });

    get = asyncHandler(async (req, res) => {
        const {
            pageNo = 0,
            pageLimit = 10,
            search,
            sortType = 'createdAt',
            sortOrder = -1,
        } = req.query;

        const where = { status: 'ACTIVE' };
        if (search) {
            where.name = { contains: search, mode: 'insensitive' };
        }

        if (req.query.all === 'true') {
            const units = await UnitServices.findMany({
                where,
                orderBy: { [sortType]: sortOrder === 1 ? 'asc' : 'desc' },
            });
            return responseHandler(units, res, 200);
        }

        const totalCount = await UnitServices.count({ where });
        const units = await UnitServices.findMany({
            where,
            skip: parseInt(pageNo, 10) * parseInt(pageLimit, 10),
            take: parseInt(pageLimit, 10),
            orderBy: { [sortType]: sortOrder === 1 ? 'asc' : 'desc' },
        });

        return responseHandler({ units, totalCount }, res, 200);
    });

    update = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const data = req.body;
        const unit = await UnitServices.update({ where: { id }, data });
        return responseHandler(unit, res, 200);
    });

    delete = asyncHandler(async (req, res) => {
        const { id } = req.params;
        const unit = await UnitServices.update({ where: { id }, data: { status: 'INACTIVE' } });
        return responseHandler(unit, res, 200);
    });
}

export default new UnitController();
