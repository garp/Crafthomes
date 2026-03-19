import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class TimesheetReminderLogServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().timesheetReminderLog, 'timesheetReminderLog');
	}
}

export default new TimesheetReminderLogServices();
