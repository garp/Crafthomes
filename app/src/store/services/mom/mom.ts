import type {
  TCreateMOMBody,
  TGetMOMsArgs,
  TGetMOMsResponse,
  TUpdateMOMBody,
} from '../../types/mom.types';
import { api } from '../api';
import { buildParams } from '../../../utils/helper';

export const momApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // CREATE
    createMOM: builder.mutation<void, TCreateMOMBody>({
      query: (body) => ({
        url: '/mom',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_moms'],
    }),

    // GET
    getMOMs: builder.query<
      { moms: TGetMOMsResponse['data']['moms']; totalCount: number },
      TGetMOMsArgs
    >({
      query: (arg) => ({
        url: '/mom',
        params: buildParams(arg),
        method: 'GET',
      }),
      transformResponse: (res: TGetMOMsResponse) => res?.data,
      providesTags: ['get_moms'],
    }),

    // UPDATE
    updateMOM: builder.mutation<void, TUpdateMOMBody & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/mom/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_moms'],
    }),

    // DELETE
    deleteMOM: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/mom/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_moms'],
    }),

    // SHARE
    shareMOM: builder.mutation<{ message: string }, { id: string; emails: string[] }>({
      query: ({ id, emails }) => ({
        url: `/mom/${id}/share`,
        method: 'POST',
        body: { emails },
      }),
    }),
  }),
});

export const {
  useCreateMOMMutation,
  useGetMOMsQuery,
  useUpdateMOMMutation,
  useDeleteMOMMutation,
  useShareMOMMutation,
} = momApi;
