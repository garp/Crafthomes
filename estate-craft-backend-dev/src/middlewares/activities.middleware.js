import ActivitiesServices from '../services/modelServices/activities.services.js';
import { updateProjectLastUpdated } from './projectLastUpdated.middleware.js';

/**
 * Unified activity tracking for all entities (project-level and task-level)
 *
 * @param {string} userId - User performing the action
 * @param {Object} options - Activity options
 * @param {string} [options.projectId] - Project ID (for project-level tracking)
 * @param {string} [options.entityType] - Type of entity ('project' | 'phase' | 'task' | 'subtask' | 'payment' | 'quotation' | 'snag' | 'mom' | 'deliverable')
 * @param {string} [options.entityId] - ID of the entity
 * @param {string} [options.entityName] - Human-readable name of the entity
 * @param {string[]} options.activities - Array of activity messages
 * @param {string} [options.activityType='update'] - Type of activity
 * @param {string} [options.fieldUpdated] - Field that was updated
 * @param {string} [options.taskId] - Task ID (for backwards compatibility)
 * @param {string} [options.subTaskId] - SubTask ID (for backwards compatibility)
 * @param {Object} [options.metadata] - Additional metadata (old/new values)
 * @param {Object} [tx] - Prisma transaction
 * @returns {Promise<Object|null>} Created activity record or null on error
 */
export default async function trackActivity(userId, options, tx) {
	try {
		// Validate required parameters
		if (!userId || typeof userId !== 'string') {
			console.error('trackActivity: Invalid userId provided');
			return null;
		}

		if (!options || typeof options !== 'object') {
			console.error('trackActivity: Invalid options provided');
			return null;
		}

		const {
			projectId,
			entityType,
			entityId,
			entityName,
			activities,
			activityType = 'update',
			fieldUpdated,
			taskId,
			subTaskId,
			metadata,
		} = options;

		// Validate activities array
		if (!activities || !Array.isArray(activities) || activities.length === 0) {
			console.error('trackActivity: Activities must be a non-empty array');
			return null;
		}

		// Build activity data
		const data = {
			userId,
			activity: activities,
			activityType,
		};

		// Add optional fields for project-level tracking
		if (projectId) data.projectId = projectId;
		if (entityType) data.entityType = entityType;
		if (entityId) data.entityId = entityId;
		if (entityName) data.entityName = entityName;
		if (fieldUpdated) data.fieldUpdated = fieldUpdated;
		if (metadata) data.metadata = metadata;

		// Backwards compatibility: taskId and subTaskId
		if (taskId) data.taskId = taskId;
		if (subTaskId) data.subTaskId = subTaskId;

		// Create activity record (optionally within a transaction)
		const activityRecord = await ActivitiesServices.create({ data }, tx);

		// Update project's lastUpdated timestamp if projectId is provided
		if (projectId) {
			await updateProjectLastUpdated(projectId, tx);
		}

		return activityRecord;
	} catch (error) {
		console.error('trackActivity: Failed to create activity record', error);
		// Don't throw error - activity tracking should not break the main flow
		return null;
	}
}
