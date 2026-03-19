import { asyncHandler } from '../../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../../utils/responseHandler.js';
import DepartmentServices from '../../services/modelServices/department.services.js';

class DepartmentController {
	get = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 100, sortType = 'sNo', sortOrder = 1, status } = req.query;

		const where = {};

		if (id) {
			where.id = id;
		}

		if (status) {
			where.status = status;
		}

		if (search) {
			where.OR = [
				{ name: { contains: search, mode: 'insensitive' } },
				{ displayName: { contains: search, mode: 'insensitive' } },
				{ description: { contains: search, mode: 'insensitive' } },
			];
		}

		const skip = parseInt(pageNo, 10) * parseInt(pageLimit, 10);
		const take = parseInt(pageLimit, 10);

		const orderBy = {
			[sortType]: sortOrder == 1 ? 'asc' : 'desc',
		};

		const totalCount = await DepartmentServices.count({ where });

		const departments = await DepartmentServices.findMany({
			where,
			skip,
			take,
			orderBy,
		});

		return responseHandler({ departments, totalCount }, res);
	});

	getById = asyncHandler(async (req, res) => {
		const { id } = req.params;

		const department = await DepartmentServices.findOne({
			where: { id },
		});

		if (!department) return errorHandler('E-1701', res);

		return responseHandler(department, res);
	});

	create = asyncHandler(async (req, res) => {
		const { name, displayName, description } = req.body;

		// Check if department with same name already exists
		const existingDepartment = await DepartmentServices.findOne({
			where: { name },
		});

		if (existingDepartment) {
			return errorHandler('E-1702', res);
		}

		const department = await DepartmentServices.create({
			data: {
				name,
				displayName,
				description,
			},
		});

		return responseHandler(department, res, 201);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { name, displayName, description, status } = req.body;

		const existingDepartment = await DepartmentServices.findOne({ where: { id } });
		if (!existingDepartment) return errorHandler('E-1701', res);

		// Check if name is being changed and if new name already exists
		if (name && name !== existingDepartment.name) {
			const duplicateName = await DepartmentServices.findOne({
				where: { name },
			});
			if (duplicateName) {
				return errorHandler('E-1702', res);
			}
		}

		const updateData = {};

		if (name !== undefined) updateData.name = name;
		if (displayName !== undefined) updateData.displayName = displayName;
		if (description !== undefined) updateData.description = description;
		if (status !== undefined) updateData.status = status;

		const department = await DepartmentServices.update({
			where: { id },
			data: updateData,
		});

		return responseHandler(department, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;

		const existingDepartment = await DepartmentServices.findOne({ where: { id } });
		if (!existingDepartment) return errorHandler('E-1701', res);

		// Soft delete - set status to INACTIVE
		const department = await DepartmentServices.update({
			where: { id },
			data: { status: 'INACTIVE' },
		});

		return responseHandler(department, res);
	});
}

export default new DepartmentController();
