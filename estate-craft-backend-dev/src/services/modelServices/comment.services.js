import Dal from '../databaseServices/dal.js';
import PrismaService from '../databaseServices/db.js';

class CommentServices extends Dal {
	constructor() {
		super(PrismaService.getInstance().comment, 'comment');
	}
}

export default new CommentServices();
