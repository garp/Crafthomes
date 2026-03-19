import { buildParams } from '../../../utils/helper';
import type { TBaseArgs } from '../../types/common.types';
import type { TArea, TCreateAreaFormData, TUpdateAreaFormData } from '../../types/area.types';
import { api } from '../api';

export const areaApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createArea: builder.mutation<TArea, TCreateAreaFormData>({
      query: (body) => ({
        url: '/area',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_area'],
    }),

    editArea: builder.mutation<TArea, { id: string } & TUpdateAreaFormData>({
      query: ({ id, ...body }) => ({
        url: `/area/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_area'],
    }),

    getAreas: builder.query<
      { areas: TArea[]; totalCount: number },
      TBaseArgs & { id?: string; all?: boolean }
    >({
      query: (arg) => ({
        url: '/area',
        method: 'GET',
        params: buildParams(arg),
      }),
      transformResponse(res: { data: { areas: TArea[]; totalCount: number } }) {
        return res.data;
      },
      providesTags: ['get_area'],
    }),

    deleteArea: builder.mutation<void, { id: string }>({
      query: (arg) => ({
        url: `/area/${arg.id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_area'],
    }),
  }),
});

export const {
  useCreateAreaMutation,
  useEditAreaMutation,
  useGetAreasQuery,
  useLazyGetAreasQuery,
  useDeleteAreaMutation,
} = areaApi;
