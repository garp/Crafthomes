import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class ActivitiesServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().activities, 'activities');
	}
}

export default new ActivitiesServices();
