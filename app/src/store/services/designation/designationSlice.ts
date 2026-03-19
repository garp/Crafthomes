import { api } from '../api';
import type { TDesignation, TDesignationResponse } from '../../types/designation.types';
import type { TBaseArgs } from '../../types/common.types';
import { buildParams } from '../../../utils/helper';

export type TCreateDesignationRequest = {
  name: string;
  displayName: string;
  description?: string;
  meta?: {
    role?: string;
    accessLevel?: string;
  };
};

export type TUpdateDesignationRequest = {
  id: string;
  name?: string;
  displayName?: string;
  description?: string;
  meta?: {
    role?: string;
    accessLevel?: string;
  };
};

export const designationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDesignations: builder.query<TDesignationResponse, TBaseArgs>({
      query: (arg) => ({
        url: '/settings/designation',
        method: 'GET',
        params: buildParams({ ...arg, status: 'ACTIVE' }),
      }),
      transformResponse: (res: { data: TDesignationResponse }) => res.data,
      providesTags: ['get_designations'],
    }),

    createDesignation: builder.mutation<{ data: TDesignation }, TCreateDesignationRequest>({
      query: (body) => ({
        url: '/settings/designation',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_designations'],
    }),

    updateDesignation: builder.mutation<{ data: TDesignation }, TUpdateDesignationRequest>({
      query: ({ id, ...body }) => ({
        url: `/settings/designation/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_designations'],
    }),

    deleteDesignation: builder.mutation<void, string>({
      query: (id) => ({
        url: `/settings/designation/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_designations'],
    }),
  }),
});

export const {
  useGetDesignationsQuery,
  useLazyGetDesignationsQuery,
  useCreateDesignationMutation,
  useUpdateDesignationMutation,
  useDeleteDesignationMutation,
} = designationApi;
