import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class TimesheetApproverAssignmentServices extends Dal {
  constructor() {
    super(PrismaService.getInstance().timesheetApproverAssignment, 'timesheetApproverAssignment');
  }
}

export default new TimesheetApproverAssignmentServices();

