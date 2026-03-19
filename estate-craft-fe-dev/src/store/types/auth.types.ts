import type { TRole } from './roles.types';

export type TRefreshResponse = {
  data: {
    accessToken: {
      token: string;
      expirationDate: string;
    };
  };
};

export type TLoginArgs = {
  email: string;
  password: string;
};

export type TSidebarItem = {
  name: string;
  slug: string;
  operations: Record<string, any>;
  frontendName: string;
};

export type TSidebarConfig = {
  mainSidebar: TSidebarItem[];
  projectSidebar: TSidebarItem[];
};

export type TModuleAccessEntry = {
  topLevel: string;
  typeLevel: string | null;
  subtypeLevel: string | null;
};

export type TAuthResponse = {
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
    accessToken: string;
    refreshToken: string;
    sidebar?: TSidebarConfig;
    moduleAccess?: TModuleAccessEntry[];
  };
};

export type TUser = {
  id: string;
  name: string;
  email: string;
  role: TRole;
  accessToken: string;
  refreshToken: string;
  passwordChangeRequired: boolean;
};

export type TCreateUserBody = {
  email: string;
  password: string;
  name: string;
  roleId: string;
  designation: string;
  location: string;
  department: string;
  startDate: string; // ISO8601 string
  lastActive: string; // ISO8601 string
  organization: string;
  phoneNumber: string;
};
