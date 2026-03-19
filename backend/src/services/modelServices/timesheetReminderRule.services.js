import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class TimesheetReminderRuleServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().timesheetReminderRule, 'timesheetReminderRule');
	}
}

export default new TimesheetReminderRuleServices();
