import { buildParams } from '../../../utils/helper';
import type { TAddUserFormData, TEditUserFormData } from '../../../validators/user';
import type { TGetUsersApiResponse, TUser } from '../../types/user.types';
import type { TGetUsersArgs } from '../../types/user.types';
import { api } from '../api';

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createUser: builder.mutation<void, TAddUserFormData>({
      query: (body) => ({
        url: '/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_users'],
    }),
    editUser: builder.mutation<void, TEditUserFormData & { userId: string }>({
      query: (args) => ({
        url: `/users/${args?.userId}`,
        method: 'PUT',
        body: {
          email: args.email,
          name: args.name,
          roleId: args.roleId,
          department: args.department,
          phoneNumber: args.phoneNumber,
          designationId: args.designationId,
          clientId: args.clientId,
          vendorId: args.vendorId,
          // Optional password update for client/vendor contacts and other users
          password: args.password,
        },
      }),
      invalidatesTags: ['get_users'],
    }),
    updateUserStatus: builder.mutation<void, { userId: string; status: 'ACTIVE' | 'INACTIVE' }>({
      query: ({ userId, status }) => ({
        url: `/users/${userId}`,
        method: 'PUT',
        body: { status },
      }),
      invalidatesTags: ['get_users'],
    }),
    deleteUser: builder.mutation<void, { userId: string }>({
      query: ({ userId }) => ({
        url: `/users/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_users'],
    }),
    getUsers: builder.query<{ users: TUser[]; totalCount: number }, TGetUsersArgs>({
      query: (arg) => {
        // const params: Record<string, string | number | undefined> = {};
        // if (userName || projectName) params.type = 'search';
        // if (userName) params.search = userName;
        // if (projectName) params.search = projectName;
        // if (userId) params.id = userId;
        // if (pageLimit) params.pageLimit = pageLimit;
        // if (pageNo) params.pageNo = pageNo;
        // if (searchText) params.searchText = searchText;
        // if (designation) params.designation = designation;
        // if (type) params.type = type;
        return {
          url: `/users`,
          params: buildParams(arg),
          method: 'GET',
        };
      },
      transformResponse(res: TGetUsersApiResponse) {
        return res?.data;
      },
      providesTags: ['get_users'],
    }),
    getSearchedUsers: builder.query<{ users: TUser[]; totalCount: number }, { userName: string }>({
      query: (arg) => ({
        url: `/users?search=${arg.userName}&type=name`,
      }),
      transformResponse(res: TGetUsersApiResponse) {
        return res?.data;
      },
    }),
    onboardingCheck: builder.query<{ message: string }, { userId: string }>({
      query: (arg) => ({
        url: `/users/onboarding/${arg.userId}`,
        method: 'GET',
      }),
    }),
    acceptInvite: builder.mutation<{ message: string }, { userId: string; email: string }>({
      query: (arg) => ({
        url: `/users/onboarding/${arg.userId}`,
        method: 'POST',
        body: {
          email: arg.email,
        },
      }),
    }),
    addPassword: builder.mutation<
      { message: string },
      { userId: string; email: string; password: string }
    >({
      query: (arg) => ({
        url: `/users/onboarding/${arg.userId}`,
        method: 'PUT',
        body: {
          email: arg.email,
          password: arg.password,
        },
      }),
    }),
  }),
});

export const {
  useCreateUserMutation,
  useGetUsersQuery,
  useEditUserMutation,
  useGetSearchedUsersQuery,
  useLazyGetSearchedUsersQuery,
  useDeleteUserMutation,
  useLazyGetUsersQuery,
  useOnboardingCheckQuery,
  useAcceptInviteMutation,
  useAddPasswordMutation,
  useUpdateUserStatusMutation,
} = userApi;
