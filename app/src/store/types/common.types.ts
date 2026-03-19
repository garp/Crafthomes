import type { errorResponse } from '../../constants/auth';

export type TErrorResponse = {
  code: string;
  message: string;
};

export type TErrorCodes = keyof typeof errorResponse;

export type TStatus = 'ACTIVE' | 'INACTIVE';

export type TBaseArgs = {
  pageNo?: string | null;
  pageLimit?: string | null;
  searchText?: string | null;
  search?: string | null;
  taskStatus?: string | null;
  projectId?: string | null;
  id?: string | null;
};

export type TPagination = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

// export type TAttachment = {
//   files: TFile[];
// };

export type TAttachment = {
  id?: string;
  name: string;
  url: string;
  type: string;
  key: string;
};

export type TStats = {
  totalProjects: number;
  totalClients: number;
  pendingPayments: number;
  progress: number;
  avgProgress: number;
};
