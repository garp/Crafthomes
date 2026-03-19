import type { TBaseArgs } from './common.types';
import type { TRole } from './roles.types';

export type TDesignationRef = {
  id: string;
  name: string;
  displayName: string;
  meta?: {
    role: string;
    accessLevel: string;
  };
};

export type TUser = {
  id: string;
  name: string;
  email: string;
  password: string;
  designation?: string | TDesignationRef;
  designationId?: string;
  organization: string;
  department: string;
  location: string;
  phoneNumber: string;
  role: TRole;
  client?: { id: string; name: string } | null;
  vendor?: { id: string; name: string } | null;
  inviteState?: string;
  status: string;
  startDate: string; // ISO date string
  lastActive: string; // ISO date string
  sNo: number;
  reportsToId?: string | null;
  ReportsTo?: { id: string; name: string; email: string } | null;
  profilePhoto?: string | null;
};

export type TOrgUser = {
  id: string;
  name: string;
  email: string;
  profilePhoto?: string | null;
  designation?: { id: string; name: string; displayName: string } | null;
  department?: string | null;
  reportsToId?: string | null;
  ReportsTo?: TOrgUser | null;
};

export type TOrganizationData = {
  user: TOrgUser;
  directReports: TOrgUser[];
  alsoWorksWith: TOrgUser[];
};

export type TGetUsersApiResponse = {
  data: {
    users: TUser[];
    totalCount: number;
  };
};

export type TGetUsersArgs = TBaseArgs & {
  userName?: string;
  projectId?: string;
  id?: string;
  type?: string;
  designation?: string;
  filterBy?: string;
  clientId?: string;
  vendorId?: string;
  status?: string | null;
  userType?: string;
};
