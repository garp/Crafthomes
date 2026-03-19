import { asyncHandler } from '../utils/asyncHandler.js';
import { responseHandler } from '../utils/responseHandler.js';
import { getGroupedEndpoints, getAllEndpoints } from '../../config/endpoints.js';

class EndpointsController {
	/**
	 * Get all available API endpoints grouped by module
	 * GET /api/v1/endpoints
	 */
	getGrouped = asyncHandler(async (req, res) => {
		const endpoints = getGroupedEndpoints();
		return responseHandler(endpoints, res);
	});

	/**
	 * Get flat list of all available API endpoints
	 * GET /api/v1/endpoints/flat
	 */
	getFlat = asyncHandler(async (req, res) => {
		const endpoints = getAllEndpoints();
		return responseHandler(endpoints, res);
	});
}

export default new EndpointsController();
