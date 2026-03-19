import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class TimesheetServices extends Dal {
  constructor() {
    super(PrismaService.getInstance().timesheet, 'timesheet');
  }
}

export default new TimesheetServices();