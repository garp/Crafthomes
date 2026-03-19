import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class TimesheetTaskServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().timesheetTask, 'timesheetTask');
	}
}

export default new TimesheetTaskServices();

