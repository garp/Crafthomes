import type { TBaseArgs } from './common.types';

export type TTimesheetStatus = 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'BILLED';
export type TTimesheetWeekStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'BILLED';

export type TTimesheetDecisionAction = 'APPROVE' | 'REJECT' | 'BILL';

export type TTimesheet = {
  id: string;
  timesheetWeekId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
  taskIds?: string[] | null;
  tasks?: { id: string; name?: string | null }[] | null;
  date: string; // ISO date
  startTime: string; // ISO datetime
  endTime?: string | null; // ISO datetime
  duration?: number | null; // in minutes
  /** Some APIs return duration as durationMinutes instead of duration */
  durationMinutes?: number | null;
  description?: string | null;
  status?: TTimesheetStatus;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionComment?: string | null;
  billedAt?: string | null;
  billingRef?: string | null;
  createdAt?: string;
  updatedAt?: string;
  // backend may return additional fields
  [key: string]: any;
};

export type TTimesheetWeek = {
  id: string;
  userId: string;
  weekStartDate: string; // ISO date
  weekEndDate: string; // ISO date
  status: TTimesheetWeekStatus;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  rejectionComment?: string | null;
  billedAt?: string | null;
  billingRef?: string | null;
  user?: {
    id: string;
    name?: string;
    email?: string;
    designation?: { name?: string; displayName?: string } | null;
  } | null;
  timesheets?: TTimesheet[];
  totals?: { totalMinutes: number; formatted: string; entryCount: number };
  [key: string]: any;
};

export type TCreateTimesheetBody = {
  projectId?: string;
  /** Legacy/single task support (prefer taskIds) */
  taskId?: string;
  /** Preferred: create timesheet(s) against multiple tasks */
  taskIds?: string[];
  date: string | Date;
  startTime: string | Date;
  duration?: number;
  endTime?: string | Date;
  description?: string;
};

export type TUpdateTimesheetBody = {
  projectId?: string;
  /** Legacy/single task support (prefer taskIds) */
  taskId?: string;
  /** Optional multi-task support (if backend supports it) */
  taskIds?: string[];
  date?: string | Date;
  startTime?: string | Date;
  endTime?: string | Date;
  duration?: number;
  description?: string;
  status?: TTimesheetStatus;
};

export type TSubmitTimesheetWeekBody = {
  weekStartDate?: string | Date;
};

export type TTimesheetDecisionBody = {
  action: TTimesheetDecisionAction;
  comment?: string;
  billingRef?: string;
};

export type TGetTimesheetArgs = TBaseArgs & {
  id?: string;
  projectId?: string;
  taskId?: string;
  date?: string | Date;
  startTime?: string | Date;
  endTime?: string | Date;
  fromDate?: string | Date;
  toDate?: string | Date;
  status?: TTimesheetStatus;
  sortType?: 'createdAt' | 'updatedAt' | 'date' | 'startTime' | 'endTime';
  sortOrder?: -1 | 1;
  pageNo?: number | string;
  pageLimit?: number | string;
};

export type TGetTimesheetResponse = {
  timesheets: TTimesheet[];
  totalCount: number;
  stats?: {
    today?: { totalMinutes: number; formatted: string };
    thisWeek?: { totalMinutes: number; formatted: string };
    thisMonth?: { totalMinutes: number; formatted: string };
    thisFinancialYear?: { totalMinutes: number; formatted: string };
  };
};

export type TGetTimesheetApprovalsArgs = TBaseArgs & {
  employeeId?: string;
  weekStartDate?: string | Date;
  status?: TTimesheetWeekStatus;
  pageNo?: number | string;
  pageLimit?: number | string;
};

export type TGetTimesheetApprovalsResponse = {
  weeks: TTimesheetWeek[];
  totalCount: number;
};
