import Dal from '../../databaseServices/dal.js';
import PrismaService from '../../databaseServices/db.js';

class TimelinePhaseOrderServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().timelinePhaseOrder, 'timelinePhaseOrder');
	}
}

export default new TimelinePhaseOrderServices();
