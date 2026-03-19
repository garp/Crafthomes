import { errorHandler } from './responseHandler.js';
import { logError } from './logger.js';
import PrismaService from '../services/databaseServices/db.js';

export const asyncHandler = fn => async (req, res, next) => {
	try {
		await fn(req, res, next);
	} catch (error) {
		console.log('error-->', error);
		if (res.headersSent) {
			console.error('Headers already sent, cannot send error response');
			return;
		}
		const errorCode = error instanceof Error ? error.message : 'E-001';
		logError(error);
		errorHandler(errorCode, res);
	}
};

/**
 * Transaction handler that:
 * 1. Uses increased timeout (60s) to handle complex operations
 * 2. Returns data from transaction, sends response AFTER commit succeeds
 * 3. Guards against double-response via headersSent check
 *
 * Handler should return { data, status? } object, NOT call responseHandler directly
 */
export const transactionHandler = handler => async (req, res, next) => {
	const prisma = PrismaService.getInstance();
	try {
		const result = await prisma.$transaction(
			async tx => {
				return await handler(req, res, next, tx);
			},
			{ timeout: 60000, maxWait: 10000 }
		);

		// Response is sent AFTER transaction commits successfully
		if (res.headersSent) {
			console.warn('Headers already sent after transaction commit');
			return;
		}

		// If handler returned raw data (legacy support), send it as success response
		if (result !== undefined && result !== null) {
			return res.status(result.status || 200).json({
				success: true,
				data: result.data !== undefined ? result.data : result,
			});
		}
	} catch (error) {
		console.error('🔥 Transaction failed:', error);

		// Guard against sending response twice
		if (res.headersSent) {
			console.error('Headers already sent, cannot send error response');
			return;
		}

		const errorCode = error instanceof Error ? error.message : 'E-001';
		logError(error);
		return errorHandler(errorCode, res);
	}
};
