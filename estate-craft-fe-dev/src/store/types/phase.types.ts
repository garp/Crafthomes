import type { TComment } from '../services/commentAndActivities/commentSlice';
import type { TAttachment, TStatus } from './common.types';
import type { TMasterPhase } from './masterPhase.types';
import type { TSubTask, TTaskAssignee } from './task.types';

export type TPhase = {
  [x: string]: any;
  //   createdBy: string;
  //   updatedBy: string | null;
  id: string;
  sNo: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  status: TStatus;
  projectId: string;
  timelineId: string;
  Task: TPhaseTask[];
  masterPhase: TMasterPhase;
};

export type TPhaseTask = {
  id: string;
  sNo: number;
  name: string;
  attachment: TAttachment[]; // adjust type if you know attachment structure
  duration: number;
  notes: string;
  priority: string;
  plannedStart: string;
  plannedEnd: string;
  description: string;
  status: string;
  taskStatus: string;
  unit: string;
  progress: number;
  phaseId: string;
  predecessorTaskId: string;
  predecessorTask: {
    name: string;
    id: string;
  };
  delayedBy: number;
  assigneeUser: {
    id: string;
    name: string;
  };
  TaskAssignee?: TTaskAssignee[];
  assignedByUser: {
    id: string;
    name: string;
  };
  subTask: TSubTask[];
  comments: TComment[];
};
