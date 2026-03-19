import type { TProject } from './project.types';
import type { TProjectPhase } from './projectPhase.types';
import type { TUser } from './user.types';
import type { TTask } from './task.types';

export type TTimelineStatus =
  | 'PENDING'
  | 'PENDING_APPROVAL'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'ARCHIVED'
  | 'DELETED';

export type TTimeline = {
  id: string;
  sNo: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdByUser: TUser | null;
  updatedBy: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdOn: string;
  plannedStart: string | null;
  plannedEnd: string | null;
  sentToId: string | null;
  sentTo: {
    name: string;
    id: string;
  } | null;
  projectId: string;
  timelineStatus: TTimelineStatus;
  project: TProject;
  Phase: TProjectPhase[];
};

export type TTimelineStats = {
  totalTasks: number;
  totalSubTasks: number;
  completedTasks: number;
  completedSubTasks: number;
  progressPercentage: number;
};

export type TTimelinePhaseWithTasks = {
  phaseDetails: {
    id: string;
    name: string;
    description: string | null;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt: string;
    updatedAt: string;
    tasks: TTask[];
    taskCount: number;
  };
  order: number;
};

export type TTimelineDetailResponse = {
  timelineId: string;
  stats: TTimelineStats;
  phases: TTimelinePhaseWithTasks[];
};
