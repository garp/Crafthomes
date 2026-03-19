import { api } from '../api';

// Types for endpoints
export type TEndpoint = {
  endpoint: string;
  method: string;
  name: string;
  displayName: string;
  description?: string;
  group: string;
};

export type TEndpointGroup = {
  group: string;
  endpoints: Omit<TEndpoint, 'group'>[];
};

// Types for permissions
export type TPermission = {
  id: string;
  name: string;
  displayName?: string;
  group: string;
  description?: string;
  endpoint: string;
  method: string;
  status: 'ACTIVE' | 'INACTIVE';
};

export type TRolePermissions = {
  roleId: string;
  roleName: string;
  permissions: TPermission[];
};

// Request types
export type TUpdateRolePermissionsRequest = {
  roleId: string;
  permissions: {
    endpoint: string;
    method: string;
    enabled: boolean;
    name?: string;
    displayName?: string;
    group?: string;
    description?: string;
  }[];
};

export type TUpdateRolePermissionsResponse = {
  roleId: string;
  created: number;
  deleted: number;
  errors?: {
    endpoint: string;
    method: string;
    error: string;
  }[];
};

export const permissionApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Get all available API endpoints grouped by module
    getEndpoints: builder.query<{ data: TEndpointGroup[] }, void>({
      query: () => ({
        url: '/endpoints',
        method: 'GET',
      }),
      providesTags: ['get_endpoints'],
    }),

    // Get flat list of all available API endpoints
    getEndpointsFlat: builder.query<{ data: TEndpoint[] }, void>({
      query: () => ({
        url: '/endpoints/flat',
        method: 'GET',
      }),
      providesTags: ['get_endpoints'],
    }),

    // Get all permissions (with optional filters)
    getPermissions: builder.query<
      { data: { permissions: TPermission[]; totalCount: number } },
      { roleId?: string; group?: string; roleName?: string } | void
    >({
      query: (params) => ({
        url: '/permissions',
        method: 'GET',
        params: params || {},
      }),
      providesTags: ['get_permissions'],
    }),

    // Get permissions for a specific role
    getRolePermissions: builder.query<{ data: TRolePermissions }, string>({
      query: (roleId) => ({
        url: `/permissions/role/${roleId}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, roleId) => [{ type: 'get_role_permissions', id: roleId }],
    }),

    // Bulk update permissions for a role
    updateRolePermissions: builder.mutation<
      { data: TUpdateRolePermissionsResponse },
      TUpdateRolePermissionsRequest
    >({
      query: ({ roleId, permissions }) => ({
        url: `/permissions/role/${roleId}`,
        method: 'PUT',
        body: { permissions },
      }),
      invalidatesTags: (_result, _error, { roleId }) => [
        { type: 'get_role_permissions', id: roleId },
        'get_permissions',
      ],
    }),

    // Clear permission cache
    clearPermissionCache: builder.mutation<void, void>({
      query: () => ({
        url: '/permissions/clear-cache',
        method: 'GET',
      }),
      invalidatesTags: ['get_permissions', 'get_role_permissions'],
    }),
  }),
});

export const {
  useGetEndpointsQuery,
  useGetEndpointsFlatQuery,
  useGetPermissionsQuery,
  useGetRolePermissionsQuery,
  useUpdateRolePermissionsMutation,
  useClearPermissionCacheMutation,
} = permissionApi;
