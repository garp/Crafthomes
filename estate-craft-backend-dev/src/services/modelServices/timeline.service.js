import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class TimelineService extends Dal {
	constructor() {
		super(PrismaService.getInstance().timeline, 'timeline');
	}
}

export default new TimelineService();
