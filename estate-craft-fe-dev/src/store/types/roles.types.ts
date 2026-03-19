export type TRole = {
  id: string;
  name: string;
  active: boolean;
};

export type TDesignationRef = {
  id: string;
  name: string;
  displayName: string;
  meta?: {
    role: string;
    accessLevel: string;
  };
};

export type TUserSettings = {
  totalCount: number;
  users: {
    sNo: number;
    id: string;
    name: string;
    phoneNumber: string;
    email: string;
    designation?: string | TDesignationRef;
    designationId?: string;
    department: string;
    location: string;
    startDate: string;
    status: string;
    role: TRole;
    lastActive: string;
    dateAdded: string;
    inviteState?: string;
    reportsToId?: string | null;
    ReportsTo?: { id: string; name: string; email: string } | null;
    profilePhoto?: string | null;
  }[];
};
