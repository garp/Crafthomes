import { asyncHandler } from '../../utils/asyncHandler.js';
import { responseHandler, errorHandler } from '../../utils/responseHandler.js';
import DesignationServices from '../../services/modelServices/designation.services.js';

class DesignationController {
	get = asyncHandler(async (req, res) => {
		const { id, search, pageNo = 0, pageLimit = 10, sortType = 'sNo', sortOrder = 1, status } = req.query;

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

		const totalCount = await DesignationServices.count({ where });

		const designations = await DesignationServices.findMany({
			where,
			skip,
			take,
			orderBy,
		});

		return responseHandler({ designations, totalCount }, res);
	});

	getById = asyncHandler(async (req, res) => {
		const { id } = req.params;

		const designation = await DesignationServices.findOne({
			where: { id },
			include: {
				users: {
					select: {
						id: true,
						name: true,
						email: true,
					},
				},
			},
		});

		if (!designation) return errorHandler('E-1601', res);

		return responseHandler(designation, res);
	});

	create = asyncHandler(async (req, res) => {
		const { name, displayName, description, meta } = req.body;
		const { userId } = req.user;

		// Check if designation with same name already exists
		const existingDesignation = await DesignationServices.findOne({
			where: { name },
		});

		if (existingDesignation) {
			return errorHandler('E-1602', res);
		}

		const designation = await DesignationServices.create({
			data: {
				name,
				displayName,
				description,
				meta,
				createdBy: userId,
			},
		});

		return responseHandler(designation, res, 201);
	});

	bulkCreate = asyncHandler(async (req, res) => {
		const { designations } = req.body;
		const { userId } = req.user;

		// Get all existing designation names
		const existingDesignations = await DesignationServices.findMany({
			where: {
				name: { in: designations.map(d => d.name) },
			},
			select: { name: true },
		});

		const existingNames = new Set(existingDesignations.map(d => d.name));

		// Filter out duplicates and prepare data
		const newDesignations = designations
			.filter(d => !existingNames.has(d.name))
			.map(d => ({
				name: d.name,
				displayName: d.displayName,
				description: d.description || null,
				meta: d.meta || null,
				createdBy: userId,
			}));

		if (newDesignations.length === 0) {
			return responseHandler({
				created: [],
				skipped: designations.map(d => d.name),
				message: 'All designations already exist',
			}, res, 200);
		}

		const created = await DesignationServices.createMany({
			data: newDesignations,
		});

		const skippedNames = designations
			.filter(d => existingNames.has(d.name))
			.map(d => d.name);

		return responseHandler({
			createdCount: created.count,
			skipped: skippedNames,
			message: `${created.count} designations created, ${skippedNames.length} skipped (already exist)`,
		}, res, 201);
	});

	update = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { name, displayName, description, status, meta } = req.body;
		const { userId } = req.user;

		const existingDesignation = await DesignationServices.findOne({ where: { id } });
		if (!existingDesignation) return errorHandler('E-1601', res);

		// Check if name is being changed and if new name already exists
		if (name && name !== existingDesignation.name) {
			const duplicateName = await DesignationServices.findOne({
				where: { name },
			});
			if (duplicateName) {
				return errorHandler('E-1602', res);
			}
		}

		const updateData = { updatedBy: userId };

		if (name !== undefined) updateData.name = name;
		if (displayName !== undefined) updateData.displayName = displayName;
		if (description !== undefined) updateData.description = description;
		if (status !== undefined) updateData.status = status;
		if (meta !== undefined) updateData.meta = meta;

		const designation = await DesignationServices.update({
			where: { id },
			data: updateData,
		});

		return responseHandler(designation, res);
	});

	delete = asyncHandler(async (req, res) => {
		const { id } = req.params;
		const { userId } = req.user;

		const existingDesignation = await DesignationServices.findOne({ where: { id } });
		if (!existingDesignation) return errorHandler('E-1601', res);

		// Soft delete - set status to INACTIVE
		const designation = await DesignationServices.update({
			where: { id },
			data: { status: 'INACTIVE', updatedBy: userId },
		});

		return responseHandler(designation, res);
	});
}

export default new DesignationController();
