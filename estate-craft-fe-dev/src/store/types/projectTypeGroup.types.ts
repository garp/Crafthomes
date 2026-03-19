import type { TProjectType } from './projectType.types';

export type TProjectTypeGroup = {
  id: string;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  projectTypes: TProjectType[];
  projectTypesCount?: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
  sNo?: number;
};

export type TCreateProjectTypeGroupBody = {
  name: string;
  description?: string;
  projectTypes?: string[];
};

export type TUpdateProjectTypeGroupBody = {
  id: string;
  name?: string;
  description?: string;
  projectTypes?: string[];
};

export type TProjectTypeGroupsResponse = {
  projectTypeGroups: TProjectTypeGroup[];
  totalCount: number;
};

// Detailed type for getProjectTypeGroupById response
export type TProjectTypeGroupDetail = {
  id: string;
  sNo?: number;
  name: string;
  description: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string | null;
  projectTypes: TProjectType[];
};

export type TRearrangeProjectTypesBody = {
  projectTypeGroupId: string;
  projectTypes: string[];
};
