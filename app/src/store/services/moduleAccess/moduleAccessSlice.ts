import { api } from '../api';

export type TModuleDefinition = {
  topLevel: string;
  typeLevel: string | null;
  subtypeLevel: string | null;
  displayName: string;
};

export type TModuleAccessEntry = {
  id?: string;
  topLevel: string;
  typeLevel: string | null;
  subtypeLevel: string | null;
  status?: string;
};

export type TRoleModuleAccess = {
  roleId: string;
  roleName: string;
  moduleAccess: TModuleAccessEntry[];
};

export type TBulkUpdateRequest = {
  roleId: string;
  modules: {
    topLevel: string;
    typeLevel?: string | null;
    subtypeLevel?: string | null;
  }[];
};

export type TBulkUpdateResponse = {
  roleId: string;
  created: number;
  deleted: number;
  errors?: { error: string }[];
};

export const moduleAccessApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all module definitions (static list of available modules)
    getModuleDefinitions: builder.query<{ data: TModuleDefinition[] }, void>({
      query: () => ({
        url: '/module-access/definitions',
        method: 'GET',
      }),
      providesTags: ['get_module_definitions'],
    }),

    // Get module access for a specific role
    getRoleModuleAccess: builder.query<{ data: TRoleModuleAccess }, string>({
      query: (roleId) => ({
        url: `/module-access?roleId=${roleId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, roleId) => [{ type: 'get_module_access', id: roleId }],
    }),

    // Bulk update module access for a role
    updateRoleModuleAccess: builder.mutation<{ data: TBulkUpdateResponse }, TBulkUpdateRequest>({
      query: ({ roleId, modules }) => ({
        url: `/module-access/role/${roleId}`,
        method: 'PUT',
        body: { modules },
      }),
      invalidatesTags: (_result, _error, { roleId }) => [{ type: 'get_module_access', id: roleId }],
    }),
  }),
});

export const {
  useGetModuleDefinitionsQuery,
  useGetRoleModuleAccessQuery,
  useUpdateRoleModuleAccessMutation,
} = moduleAccessApi;
