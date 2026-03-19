import type { TCreateTaskFormData } from '../../validators/task';
import type { TComment } from '../services/commentAndActivities/commentSlice';
import type { TAttachment } from './common.types';

export type TTaskAssignee = {
  User?: {
    id: string;
    name: string;
    email?: string;
  };
};

export type TTask = {
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
  approvalStatus?: 'PENDING' | 'APPROVED' | string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvedByUser?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  unit: string;
  progress: number;
  phaseId: string;
  phase: {
    id: string;
    // name: string;
    project: {
      id: string;
      assignProjectManager?: string | null;
      // name: string;
    };
    timeline: {
      id: string;
      // name: string;
    };
  };
  project?: {
    id: string;
    name?: string;
    assignProjectManager?: string | null;
  };
  predecessorTaskId: string;
  predecessorTask: {
    name: string;
    id: string;
  };
  delayedBy: number;
  assigneeUser:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]; // Support both single and array for backward compatibility
  TaskAssignee?: TTaskAssignee[];
  assignedByUser: {
    id: string;
    name: string;
  };
  subTask: TSubTask[];
  comments: TComment[];
};

// export type TComment = {
//   id: string;
//   content: string;
//   createdAt: string;
//   createdByUser: {
//     id: string;
//     name: string;
//   };
//   attachment: TAttachment[];
// };

export type Comments = Comment[];

export type TSubTask = Omit<TTask, 'subTask'> & {
  subTasks: TSubTask[];
  totalCount: number;
};

export type TCreateTaskBody =
  | (TCreateTaskFormData & {
      attachment?: TAttachment[];
    })
  | undefined;

export type TUpdateTaskBody = TCreateTaskBody & { id: string };
