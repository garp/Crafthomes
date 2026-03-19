import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class MomAttendeesServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().momAttendees, 'momAttendees');
	}
}

export default new MomAttendeesServices();
