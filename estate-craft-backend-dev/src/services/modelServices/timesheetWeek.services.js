import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class TimesheetWeekServices extends Dal {
  constructor() {
    super(PrismaService.getInstance().timesheetWeek, 'timesheetWeek');
  }
}

export default new TimesheetWeekServices();

