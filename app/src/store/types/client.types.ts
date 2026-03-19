import type { TBaseArgs, TStats, TStatus } from './common.types';
// import type { TProject } from './project.types';

export type TClient = {
  id: string;
  name: string;
  email: string;
  location: string;
  phoneNumber: string;
  clientType: 'INDIVIDUAL' | 'ORGANIZATION';
  panDetails?: string | null;
  gstIn?: string | null;
  status: TStatus; // adjust if you have more statuses
  startDate: string; // or Date if you parse it
  sNo: number;
  // Optional list of lightweight projects associated with the client
  projects?: { id: string; name: string }[];
  // Convenience field for primary project name (first project)
  projectName?: string | null;
  addresses?: {
    id?: string;
    label: string;
    building?: string | null;
    street?: string | null;
    locality?: string | null;
    city?: string | null;
    state?: string | null;
    landmark?: string | null;
    pincode?: string | null;
    country?: string | null;
  }[];
  paymentProgress?: {
    totalProjectCost: number;
    totalPaidAmount: number;
    remainingProjectCost: number;
  };
  teamMembers?: {
    id: string;
    name: string;
    email?: string;
  }[];
};

export type TGetClientsApiResponse = {
  data: {
    clients: TClient[];
    totalCount: number;
    stats: TStats;
  };
};

export type TGetClientArgs = TBaseArgs & {
  projectId?: string | null;
  // clientName?: string;
  clientId?: string | null;
  status?: string | null;
};

export type TCreateClientBody = {
  name: string;
  phoneNumber: string;
  email: string;
  clientType: 'INDIVIDUAL' | 'ORGANIZATION';
  panDetails?: string | null;
  gstIn?: string | null;
  addresses?: {
    id?: string;
    label: string;
    building?: string | null;
    street?: string | null;
    locality?: string | null;
    city?: string | null;
    state?: string | null;
    landmark?: string | null;
    pincode?: string | null;
    country?: string | null;
  }[];
};

export type TEditClientBody = TCreateClientBody & {
  clientId: string;
};
