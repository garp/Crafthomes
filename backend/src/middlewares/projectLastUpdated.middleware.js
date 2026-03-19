import ProjectServices from '../services/modelServices/project.services.js';

/**
 * Updates the lastUpdated timestamp for a project.
 * This should be called whenever any activity happens within a project
 * (e.g., task created/updated, file uploaded, snag added, etc.)
 *
 * @param {string} projectId - The project ID to update
 * @param {Object} [tx] - Optional Prisma transaction
 * @returns {Promise<Object|null>} Updated project or null on error
 */
export async function updateProjectLastUpdated(projectId, tx) {
	try {
		if (!projectId || typeof projectId !== 'string') {
			return null;
		}

		const updatedProject = await ProjectServices.update(
			{
				where: { id: projectId },
				data: { lastUpdated: new Date() },
				select: { id: true, lastUpdated: true },
			},
			tx
		);

		return updatedProject;
	} catch (error) {
		console.error('updateProjectLastUpdated: Failed to update lastUpdated', error);
		// Don't throw error - this should not break the main flow
		return null;
	}
}

/**
 * Express middleware to update project lastUpdated after a request.
 * Attach projectId to req.projectIdToUpdate before calling this.
 *
 * Usage in routes:
 *   router.post('/', someController, updateProjectLastUpdatedMiddleware);
 *
 * Or set req.projectIdToUpdate in your controller and use as middleware
 */
export function updateProjectLastUpdatedMiddleware(req, res, next) {
	// Store original json method
	const originalJson = res.json.bind(res);

	// Override json method to update lastUpdated after successful response
	res.json = async function (data) {
		// Only update if response is successful and projectId is available
		if (res.statusCode >= 200 && res.statusCode < 300 && req.projectIdToUpdate) {
			try {
				await updateProjectLastUpdated(req.projectIdToUpdate);
			} catch (error) {
				console.error('Failed to update project lastUpdated:', error);
			}
		}
		return originalJson(data);
	};

	next();
}

export default updateProjectLastUpdated;
