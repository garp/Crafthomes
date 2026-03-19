import type { TMasterTask } from './masterTask.types';

export type TMasterPhase = {
  id: string;
  name: string;
  // projectTypeId: string;
  createdAt: string;
  // updatedAt: string;
  // createdBy: string;
  // updatedBy: string;
  status: string;
  description: string | null;
  // masterTasks: TMasterTask[];
  MasterPhaseMasterTask: {
    MasterTask: Pick<TMasterTask, 'id' | 'name' | 'description'>;
  }[];
  projectType?: {
    ProjectType: {
      id: string;
      name: string;
    };
  }[];
};

export type TGetMasterPhasesResponse = {
  data: {
    projectTypePhases: TMasterPhase[];
    totalCount: number;
  };
};

// export type TTask = {
//   id: string;
//   name: string;
//   projectTypePhaseId: string;
//   createdAt: string;
//   updatedAt: string;
//   createdBy: string;
//   updatedBy: string | null;
//   status: string;
//   description: string | null;
// };
