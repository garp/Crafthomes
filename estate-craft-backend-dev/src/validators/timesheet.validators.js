import Joi from 'joi';

export const createTimesheetSchema = Joi.object({
	projectId: Joi.string().uuid().optional(),
	// Backward compatible: accept single taskId
	taskId: Joi.string().uuid().optional(),
	// New: accept multiple taskIds (junction table)
	taskIds: Joi.array().items(Joi.string().uuid()).min(0).optional(),
	description: Joi.string().optional().allow(''),
	date: Joi.date().required(),
	startTime: Joi.date().required(),
	// duration in minutes (used to compute endTime)
	duration: Joi.number()
		.integer()
		.min(1)
		.max(24 * 60)
		.optional(),
	endTime: Joi.date().optional(),
})
	// project and task are optional; must provide either duration or endTime (or both; controller will validate consistency)
	.or('duration', 'endTime');

export const getTimesheetSchema = Joi.object({
	id: Joi.string().uuid().optional(),
	// optional userId filter; if not provided, defaults to token user
	userId: Joi.string().uuid().optional(),
	projectId: Joi.string().uuid().optional(),
	// filter by multiple taskIds (via junction table)
	taskIds: Joi.alternatives()
		.try(
			Joi.array().items(Joi.string().uuid()).min(1),
			Joi.string().uuid() // allow single taskId as string (will be normalized to array in controller)
		)
		.optional(),
	date: Joi.date().optional(),
	startTime: Joi.date().optional(),
	endTime: Joi.date().optional(),
	fromDate: Joi.date().optional(),
	toDate: Joi.date().optional(),
	status: Joi.string().valid('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'BILLED').optional(),
	// pagination + sorting (match rest of codebase)
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(10),
	sortType: Joi.string().optional().valid('createdAt', 'updatedAt', 'date', 'startTime', 'endTime'),
	sortOrder: Joi.number().integer().valid(-1, 1).optional().default(-1),
});

export const updateTimesheetSchema = Joi.object({
	projectId: Joi.string().uuid().optional(),
	// Backward compatible: replace tasks with single taskId
	taskId: Joi.string().uuid().optional(),
	// New: replace tasks with taskIds (junction table); null clears all tasks
	taskIds: Joi.array().items(Joi.string().uuid()).min(0).optional().allow(null),
	description: Joi.string().optional().allow(''),
	date: Joi.date().optional(),
	startTime: Joi.date().optional(),
	endTime: Joi.date().optional(),
	// duration in minutes (used to compute endTime)
	duration: Joi.number()
		.integer()
		.min(1)
		.max(24 * 60)
		.optional(),
	status: Joi.string().valid('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED', 'BILLED').optional(),
})
	// allow partial updates, but require at least one field
	.min(1);

export const submitTimesheetWeekSchema = Joi.object({
	// If not provided, backend can infer current week from server date
	weekStartDate: Joi.date().optional(),
});

export const getTimesheetApprovalsSchema = Joi.object({
	// Optional filters for approver queue
	employeeId: Joi.string().uuid().optional(),
	weekStartDate: Joi.date().optional(),
	status: Joi.string().valid('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'BILLED').optional(),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(20),
});

export const timesheetDecisionSchema = Joi.object({
	action: Joi.string().valid('APPROVE', 'REJECT', 'BILL').required(),
	comment: Joi.string().allow('').optional(),
	billingRef: Joi.string().allow('').optional(),
});

export const createTimesheetApproverAssignmentSchema = Joi.object({
	employeeId: Joi.string().uuid().required(),
	approverId: Joi.string().uuid().required(),
	active: Joi.boolean().optional(),
	effectiveFrom: Joi.date().optional().allow(null),
	effectiveTo: Joi.date().optional().allow(null),
});

export const updateTimesheetApproverAssignmentSchema = Joi.object({
	active: Joi.boolean().optional(),
	effectiveFrom: Joi.date().optional().allow(null),
	effectiveTo: Joi.date().optional().allow(null),
}).min(1);

export const getTimesheetApproverAssignmentSchema = Joi.object({
	employeeId: Joi.string().uuid().optional(),
	approverId: Joi.string().uuid().optional(),
	active: Joi.boolean().optional(),
	pageNo: Joi.number().integer().optional().default(0),
	pageLimit: Joi.number().integer().optional().default(20),
});
