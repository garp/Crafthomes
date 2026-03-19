import { Router } from 'express';
import TimesheetController from '../../controllers/timesheet.controller.js';
import checkPermission from '../../middlewares/auth.middleware.js';
import Validator from '../../middlewares/validators.middleware.js';
import {
	createTimesheetSchema,
	getTimesheetSchema,
	updateTimesheetSchema,
	submitTimesheetWeekSchema,
	getTimesheetApprovalsSchema,
	timesheetDecisionSchema,
	createTimesheetApproverAssignmentSchema,
	updateTimesheetApproverAssignmentSchema,
	getTimesheetApproverAssignmentSchema,
} from '../../validators/timesheet.validators.js';

const router = Router();

router
	.route('/')
	.post(checkPermission(), Validator.body(createTimesheetSchema), TimesheetController.create)
	.get(checkPermission(), Validator.query(getTimesheetSchema), TimesheetController.get);

// Weekly submission
router.route('/week/submit').post(checkPermission(), Validator.body(submitTimesheetWeekSchema), TimesheetController.submitWeek);

// Approver queue
router.route('/approvals').get(checkPermission(), Validator.query(getTimesheetApprovalsSchema), TimesheetController.getApprovals);

// Approver assignment management (admin/internal)
router
	.route('/approvers')
	.post(checkPermission(), Validator.body(createTimesheetApproverAssignmentSchema), TimesheetController.createApproverAssignment)
	.get(checkPermission(), Validator.query(getTimesheetApproverAssignmentSchema), TimesheetController.getApproverAssignments);

router
	.route('/approvers/:id')
	.put(checkPermission(), Validator.body(updateTimesheetApproverAssignmentSchema), TimesheetController.updateApproverAssignment)
	.delete(checkPermission(), TimesheetController.deleteApproverAssignment);

router
	.route('/:id')
	.get(checkPermission(), TimesheetController.getById)
	.put(checkPermission(), Validator.body(updateTimesheetSchema), TimesheetController.update)
	.delete(checkPermission(), TimesheetController.delete);

// Week-level decision
router
	.route('/week/:id/decision')
	.put(checkPermission(), Validator.body(timesheetDecisionSchema), TimesheetController.decideWeek);

// Entry-level decision (approve/reject/bill)
router.route('/:id/decision').put(checkPermission(), Validator.body(timesheetDecisionSchema), TimesheetController.decideEntry);

export default router;
