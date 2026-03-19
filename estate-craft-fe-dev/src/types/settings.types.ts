// import type { TCreateProjectPhaseFormData } from '../validators/projectPhase';

import type { TMasterPhase } from '../store/types/masterPhase.types';
import type { TMasterTask } from '../store/types/masterTask.types';

export interface TAddMasterPhaseSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phaseName: string) => void;
}

export type TAddProjectTypeFormData = {
  projectType: string;
  phases: string[];
  tasks: string[];
};

export type TAddMasterTaskSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  // activePhase:
  //   | {
  //       id?: string | undefined;
  //       tasks?: (string | undefined)[] | undefined;
  //       name: string;
  //     }
  //   | undefined;
  // onSubmit: (data: TAddTaskFormData) => void;
};

export type TAddTaskFormData = {
  taskName: string;
  phase: string;
  description: string;
};

export type AddUserSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TAddUserForAccessFormData) => void;
};

export type TAddUserForAccessFormData = {
  name: string;
  organization: string;
  department: string;
  designation: string;
  role: string;
};

export type TEditMasterPhaseSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  phaseData: TMasterPhase | null;
};

export type TAddEditMasterPhaseSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (phaseName: string) => void;
  onPhaseUpdated?: (phaseId: string, newName: string) => void;
  phaseData?: TMasterPhase | null;
  mode?: 'create' | 'edit';
  initialPhaseName?: string;
  projectTypeId?: string;
};

export type TEditTaskSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  taskData: TMasterTask | null;
  projectTypeId?: string;
};
