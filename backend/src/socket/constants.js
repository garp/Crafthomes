// Room prefixes
export const ROOMS = {
	USER: 'user:', // user:<userId>
	PROJECT: 'project:', // project:<projectId> (future)
};

// Server → Client events
export const SERVER_EVENTS = {
	NOTIFICATION_NEW: 'notification:new',
	NOTIFICATION_READ: 'notification:read',
	NOTIFICATIONS_COUNT: 'notification:count',
	USER_ME: 'user:me',
};

// Client → Server events
export const CLIENT_EVENTS = {
	NOTIFICATION_MARK_READ: 'notification:markRead',
	NOTIFICATION_MARK_ALL_READ: 'notification:markAllRead',
	ME: 'me',
};

// Notification types
export const NOTIFICATION_TYPES = {
	TASK_ASSIGNED: 'TASK_ASSIGNED',
	TASK_UPDATED: 'TASK_UPDATED',
	COMMENT_MENTION: 'COMMENT_MENTION',
	SUBTASK_ASSIGNED: 'SUBTASK_ASSIGNED',
	PROJECT_ASSIGNED: 'PROJECT_ASSIGNED',
	STATUS_CHANGED: 'STATUS_CHANGED',
	TIMESHEET_REMINDER: 'TIMESHEET_REMINDER',
	TIMESHEET_WEEK_SUBMITTED: 'TIMESHEET_WEEK_SUBMITTED',
	TIMESHEET_APPROVED: 'TIMESHEET_APPROVED',
	TIMESHEET_REJECTED: 'TIMESHEET_REJECTED',
	TIMESHEET_BILLED: 'TIMESHEET_BILLED',
};

