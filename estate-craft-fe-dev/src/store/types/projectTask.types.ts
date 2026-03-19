import type { TAttachment } from './common.types';
import type { TSubTask } from './task.types';

export type TProjectTask = {
  id: string;
  delayedBy: number;
  // predecessorTaskId: string;
  predecessorTask: {
    id: string;
    name: string;
  };
  sNo: number;
  name: string;
  // assignedBy: string | null;
  // assignee: string | null;
  attachment: TAttachment;
  duration: string;
  notes: string;
  priority: string;
  plannedStart: string;
  plannedEnd: string;
  description: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  taskStatus: string;
  unit: string;
  progress: number;
  phaseId: string;
  assignedByUser: { id: string; name: string };
  assigneeUser: { id: string; name: string };
  subTask: TSubTask[];
  phase: {
    id: string;
    sNo: number;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    updatedBy: string | null;
    status: string;
    masterPhaseId: string;
    projectId: string;
    timelineId: string;
    timeline: {
      id: string;
      sNo: number;
      name: string;
      createdAt: string;
      updatedAt: string;
      createdBy: string;
      updatedBy: string | null;
      status: string;
      createdOn: string;
      sentToId: string | null;
      projectId: string;
      timelineStatus: string;
    };
    project: {
      id: string;
      sNo: number;
      name: string;
      clientId: string;
      projectTypeId: string;
      estimatedBudget: number;
      currency: string;
      paymentStatus: string;
      projectPhases: string[];
      city: string;
      address: string;
      startDate: string;
      endDate: string;
      assignProjectManager: string;
      assignClientContact: string | null;
      description: string;
      attachment: { files: any[] };
      createdAt: string;
      updatedAt: string;
      createdBy: string;
      updatedBy: string | null;
      status: string;
      projectStatus: string;
    };
  };
};

export type TAddProjectPhaseBody = {
  name: string;
  timelineId: string;
  phaseId: string;
  plannedStart: Date; // ISO string
  plannedEnd: Date; // ISO string
  // duration: string; // e.g. "14 days"
  predecessorTask?: string | null | undefined;
};
