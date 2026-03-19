import type { TPriority } from '../../types/common.types';

export type TProjectTypeGroup = {
  id: string;
  name: string;
};

export type TProjectType = {
  id: string;
  name: string;
  status: 'ACTIVE' | 'INACTIVE';
  // phases: [
  //   {
  //     id: string;
  //     name: string;
  //   },
  // ];
  phasesCount: number;
  tasksCount: number;
  totalDuration?: number;
  sNo: number;
  projectTypeGroups?: TProjectTypeGroup[];
};

// Detailed type for getProjectTypeById response
export type TProjectTypeMasterTask = {
  id: string;
  sNo: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'ACTIVE' | 'INACTIVE';
  updatedBy: string | null;
  priority: TPriority;
  notes: string | null;
  duration: number | null;
  predecessorTaskId: string | null;
  predecessorTask?: {
    id: string;
    name: string;
  } | null;
};

export type TProjectTypeMasterPhase = {
  id: string;
  sNo: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'ACTIVE' | 'INACTIVE';
  updatedBy: string | null;
  masterTasks: TProjectTypeMasterTask[];
};

export type TProjectTypeDetail = {
  id: string;
  sNo: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'ACTIVE' | 'INACTIVE';
  updatedBy: string | null;
  masterPhases: TProjectTypeMasterPhase[];
};

export type TCreateProjectTypeBody = {
  name: string;
  phases?: string[] | undefined;
};
