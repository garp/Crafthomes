export type TNotificationType =
  | 'TASK_ASSIGNED'
  | 'TASK_UPDATED'
  | 'COMMENT_MENTION'
  | 'SUBTASK_ASSIGNED'
  | 'PROJECT_ASSIGNED'
  | 'STATUS_CHANGED'
  | 'TIMESHEET_REMINDER'
  | 'TIMESHEET_WEEK_SUBMITTED'
  | 'TIMESHEET_APPROVED'
  | 'TIMESHEET_REJECTED'
  | 'TIMESHEET_BILLED';

export type TNotification = {
  id: string;
  type: TNotificationType;
  title: string;
  message?: string | null;
  metadata?: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    name: string;
  } | null;
};

export type TNotificationsResponse = {
  notifications: TNotification[];
  totalCount: number;
};

export type TUnreadCountResponse = {
  unreadCount: number;
};
