import type { TRole } from '../../types/roles.types';
import { api } from '../api';

export type TCreateRoleRequest = {
  name: string;
};

export type TUpdateRoleStatusRequest = {
  id: string;
};

export const roleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // All active roles
    getRoles: builder.query<{ data: TRole[] }, void>({
      query: () => ({
        url: `/roles?active=true`,
        method: 'GET',
      }),
      providesTags: ['get_roles'],
    }),

    // All roles (including inactive)
    getAllRoles: builder.query<{ data: TRole[] }, void>({
      query: () => ({
        url: `/roles`,
        method: 'GET',
      }),
      providesTags: ['get_roles'],
    }),

    // Roles filtered for INTERNAL users
    getInternalRoles: builder.query<{ data: TRole[] }, void>({
      query: () => ({
        url: `/roles?active=true&filterBy=INTERNAL`,
        method: 'GET',
      }),
      providesTags: ['get_roles'],
    }),

    // Create role
    createRole: builder.mutation<{ data: TRole }, TCreateRoleRequest>({
      query: (body) => ({
        url: `/roles`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_roles'],
    }),

    // Toggle role status (activate/deactivate)
    toggleRoleStatus: builder.mutation<{ data: TRole }, TUpdateRoleStatusRequest>({
      query: ({ id }) => ({
        url: `/roles/status/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: ['get_roles'],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetAllRolesQuery,
  useGetInternalRolesQuery,
  useCreateRoleMutation,
  useToggleRoleStatusMutation,
} = roleApi;
