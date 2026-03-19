export const INPUT_DEFAULTS = {
  BORDER: '1px solid #E0E0E0',
  HEIGHT: '48px',
  WIDTH: '144px',
  BACKGROUND_COLOR: '#F9FAFB',
  PLACEHOLDER_INTERVAL: 2000,
} as const;

export const TASK_PRIORITIES = {
  HIGH: 'High',
  LOW: 'Low',
} as const;

export const TASK_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  BLOCKED: 'BLOCKED',
  COMPLETED: 'COMPLETED',
} as const;

export const TASK_STATUS_OPTIONS = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'BLOCKED', label: 'Blocked' },
  { value: 'COMPLETED', label: 'Completed' },
];
