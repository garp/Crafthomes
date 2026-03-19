import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class TimelineTaskOrderServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().timeLineTaskOrder, 'timeLineTaskOrder');
	}
}

export default new TimelineTaskOrderServices();
