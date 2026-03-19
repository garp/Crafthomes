import type { TProjectTask } from './projectTask.types';

export type TProjectPhase = {
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
  Task: TProjectTask[];
  masterPhase: {
    id: string;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
    status: string;
    createdBy: string;
    updatedBy: string | null;
  };
};

export type TCreateProjectPhaseBody = {
  name: string;
  description: string;
  projectId: string;
  timelineId: string;
  masterPhaseCheck: boolean;
};
