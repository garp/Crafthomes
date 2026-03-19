/**
 * Entity types for activity tracking
 * Used to categorize what type of entity was changed
 */
export const ENTITY_TYPES = {
	PROJECT: 'project',
	PHASE: 'phase',
	TASK: 'task',
	SUBTASK: 'subtask',
	PAYMENT: 'payment',
	QUOTATION: 'quotation',
	SNAG: 'snag',
	MOM: 'mom',
	DELIVERABLE: 'deliverable',
	ATTACHMENT: 'attachment',
	COMMENT: 'comment',
	CLIENT: 'client',
	USER: 'user',
	TIMESHEET: 'timesheet',
	SITE_VISIT: 'siteVisit',
	TIMELINE: 'timeline',
};

/**
 * Activity types for tracking what kind of action was performed
 */
export const ACTIVITY_TYPES = {
	CREATE: 'create',
	UPDATE: 'update',
	DELETE: 'delete',
	COMMENT: 'comment',
	STATUS_CHANGE: 'status_change',
	ASSIGNMENT: 'assignment',
	TIMESHEET: 'timesheet',
};

export default {
	ENTITY_TYPES,
	ACTIVITY_TYPES,
};
