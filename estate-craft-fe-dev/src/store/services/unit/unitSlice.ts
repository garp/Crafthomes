import { buildParams } from '../../../utils/helper';
import type { TBaseArgs } from '../../types/common.types';
import type { TUnit, TCreateUnitFormData, TUpdateUnitFormData } from '../../types/unit.types';
import { api } from '../api';

export const unitApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // CREATE
    createUnit: builder.mutation<TUnit, TCreateUnitFormData>({
      query: (body) => ({
        url: '/unit',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_unit'],
    }),

    // UPDATE
    editUnit: builder.mutation<TUnit, { id: string } & TUpdateUnitFormData>({
      query: ({ id, ...body }) => ({
        url: `/unit/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_unit'],
    }),

    // READ (GET ALL)
    getUnits: builder.query<
      { units: TUnit[]; totalCount: number },
      TBaseArgs & {
        id?: string;
        all?: boolean;
      }
    >({
      query: (arg) => {
        return {
          url: '/unit',
          method: 'GET',
          params: buildParams(arg),
        };
      },
      transformResponse(res: { data: { units: TUnit[]; totalCount: number } }) {
        return res.data;
      },
      providesTags: ['get_unit'],
    }),

    // DELETE
    deleteUnit: builder.mutation<void, { id: string }>({
      query: (arg) => ({
        url: `/unit/${arg.id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_unit'],
    }),
  }),
});

export const {
  useCreateUnitMutation,
  useEditUnitMutation,
  useGetUnitsQuery,
  useLazyGetUnitsQuery,
  useDeleteUnitMutation,
} = unitApi;
