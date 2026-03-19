// import type { TPriority } from '../../constants/common';
import type { TPriority } from '../../types/common.types';
import type { TMasterPhase } from './masterPhase.types';

type TMasterTaskReference = {
  id: string;
  name: string;
};

export type TMasterSubTask = {
  id: string;
  name: string;
  description?: string | null;
  duration?: number | null;
  predecessorTaskId?: string | null;
  priority: TPriority;
  notes?: string | null;
};

export type TMasterTask = {
  projectTypePhaseId: string;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'INACTIVE'; // adjust if more statuses exist
  description: string | null;
  MasterPhaseMasterTask: { MasterPhase: Pick<TMasterPhase, 'id' | 'name' | 'description'> }[];
  priority: TPriority;
  duration?: number | null;
  notes?: string | null;
  predecessorTaskId?: string | null;
  predecessorTask?: TMasterTaskReference | null;
  subTasks?: TMasterSubTask[] | null;
  // masterPhaseIds: string[];
  // projectTypePhase: {
  //   id: string;
  //   name: string;
  // };
};
