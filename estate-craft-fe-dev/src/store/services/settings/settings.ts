import type { TUserSettings } from '../../types/roles.types';
import type {
  TCreateInternalUserFormData,
  TUpdateInternalUserFormData,
} from '../../../validators/internalUser';
import type { TOrganizationData } from '../../types/user.types';
import { buildParams } from '../../../utils/helper';
import { api } from '../api';

export const settingsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUserSettings: builder.query<
      { data: TUserSettings },
      {
        pageNo?: string | number;
        pageLimit?: string | number;
        status?: string | null;
        projectPurpose?: boolean;
      }
    >({
      query: (arg) => ({
        url: `/settings/internal-users`,
        method: 'GET',
        params: buildParams({
          ...arg,
          ...(arg.projectPurpose ? { 'project-purpose': 'true' } : {}),
        }),
      }),
      providesTags: ['get_user_settings'],
    }),

    createUserSettings: builder.mutation<void, TCreateInternalUserFormData>({
      query: (body) => ({
        url: '/settings/internal-users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_user_settings', 'get_users'],
    }),

    updateUserSettings: builder.mutation<void, TUpdateInternalUserFormData & { userId: string }>({
      query: (args) => ({
        url: `/settings/internal-users/${args?.userId}`,
        method: 'PUT',
        body: {
          name: args.name,
          roleId: args.roleId,
          phoneNumber: args.phoneNumber,
          department: args.department,
          designationId: args.designationId,
          status: args.status,
          organization: args.organization,
          clientId: args.clientId,
          vendorId: args.vendorId,
          password: args.password,
          reportsToId: args.reportsToId,
          profilePhoto: args.profilePhoto,
        },
      }),
      invalidatesTags: ['get_user_settings'],
    }),

    updateUserSettingsStatus: builder.mutation<
      void,
      { userId: string; status: 'ACTIVE' | 'INACTIVE' }
    >({
      query: ({ userId, status }) => ({
        url: `/settings/internal-users/${userId}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['get_user_settings'],
    }),

    deleteUserSettings: builder.mutation<void, { userId: string }>({
      query: ({ userId }) => ({
        url: `/settings/internal-users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_user_settings', 'get_organization'],
    }),

    getOrganization: builder.query<{ data: TOrganizationData }, { userId?: string } | void>({
      query: (arg) => ({
        url: arg?.userId ? `/settings/organization/${arg.userId}` : '/settings/organization',
        method: 'GET',
      }),
      providesTags: ['get_organization'],
    }),
  }),
});

export const {
  useGetUserSettingsQuery,
  useCreateUserSettingsMutation,
  useUpdateUserSettingsMutation,
  useDeleteUserSettingsMutation,
  useUpdateUserSettingsStatusMutation,
  useGetOrganizationQuery,
} = settingsApi;
