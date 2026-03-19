import { v4 as uuidv4 } from 'uuid';
import { logInfo } from '../utils/logger.js';

const apiLogger = (req, res, next) => {
	const requestId = uuidv4();
	const logRequest = {
		requestId,
		timestamp: new Date().toISOString(),
		userId: req.user?.userId || 'Unknown',
		method: req.method,
		path: req.originalUrl,
		body: req.body,
		query: req.query,
		params: req.params,
	};
	logInfo(logRequest);
	const originalSend = res.send;
	res.send = function sendResponse(body) {
		const logResponse = {
			requestId,
			timestamp: new Date().toISOString(),
			userId: req.user?.userId || 'Unknown',
			status: res.statusCode,
			responseBody: body,
		};
		logInfo(logResponse);
		originalSend.call(this, body);
	};
	next();
};

export default apiLogger;
