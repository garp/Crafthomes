// export type TCreateProjectBody = yup.InferType<typeof createProjectSchema> & {

import type { TAttachment } from './common.types';

// };

export type TCreateProjectBody = {
  name: string;
  clientId: string | null;
  projectTypeId?: string | null;
  projectTypeGroupId?: string | null;
  projectTypeIds?: string[];
  masterPhases?: (string | undefined)[] | undefined;
  currency: TCurrency;
  estimatedBudget?: number | null;
  address: string;
  city: string;
  state: string;
  startDate: Date;
  endDate?: Date | null;
  assignProjectManager: string | null;
  assignClientContact?: string[];
  assignedInternalUsersId?: string[];
  description?: string | undefined;
  attachment?: TAttachment[];
};

export type TEditProjectBody = TCreateProjectBody & {
  id: string;
};
export type TCurrency = 'USD' | 'INR';

export type TProject = {
  sNo: string;
  id: string;
  name: string;
  clientId: string;
  projectTypeId: string;
  projectTypeGroupId?: string | null;
  projectTypeIds?: string[];
  projectTypes?: { id: string; name: string }[];
  timeline?: { id: string; name: string; order: number }[];
  estimatedBudget: number;
  currency: TCurrency;
  projectPhases: string[];
  phases: {
    id: string;
    name: string;
  }[];
  state: string;
  city: string;
  address: string;
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  assignProjectManager: string;
  assignClientContact: string;
  description: string;
  attachments: TAttachment[];
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  createdBy: string;
  updatedBy: string;
  projectStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'DELAYED' | 'COMPLETED' | string;
  paymentStatus: 'PENDING' | 'PAID';
  status: 'ACTIVE' | 'INACTIVE';
  currentPhaseId: string | null;
  // Progress fields
  totalTasks?: number;
  completedTasks?: number;
  progress?: number;
  client: {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    location: string;
  };
  projectType: {
    id: string;
    name: string;
    status: 'ACTIVE' | 'INACTIVE' | string;
  };
  projectManager: {
    name: string;
    id: string;
    email: string;
  };
  teamMembers?: {
    id: string;
    name: string;
    email?: string;
  }[];
  projectUsers?: {
    id: string;
    userId: string;
    user: {
      id: string;
      name: string;
      email?: string;
    };
  }[];
};
