import { api } from '../api';
import type { TBaseArgs } from '../../types/common.types';
import { buildParams } from '../../../utils/helper';

export type TDepartment = {
  id: string;
  sNo: number;
  name: string;
  displayName: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'INACTIVE';
};

export type TDepartmentResponse = {
  departments: TDepartment[];
  totalCount: number;
};

export type TCreateDepartmentRequest = {
  name: string;
  displayName?: string;
  description?: string;
};

export type TUpdateDepartmentRequest = {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
};

export const departmentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDepartments: builder.query<TDepartmentResponse, TBaseArgs>({
      query: (arg) => ({
        url: '/settings/department',
        method: 'GET',
        params: buildParams({ ...arg, status: 'ACTIVE' }),
      }),
      transformResponse: (res: { data: TDepartmentResponse }) => res.data,
      providesTags: ['get_departments'],
    }),

    createDepartment: builder.mutation<{ data: TDepartment }, TCreateDepartmentRequest>({
      query: (body) => ({
        url: '/settings/department',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_departments'],
    }),

    updateDepartment: builder.mutation<{ data: TDepartment }, TUpdateDepartmentRequest>({
      query: ({ id, ...body }) => ({
        url: `/settings/department/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_departments'],
    }),

    deleteDepartment: builder.mutation<void, string>({
      query: (id) => ({
        url: `/settings/department/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_departments'],
    }),
  }),
});

export const {
  useGetDepartmentsQuery,
  useLazyGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useDeleteDepartmentMutation,
} = departmentApi;
