import { buildParams } from '../../../utils/helper';
import type { TCreateQuotationFormData } from '../../../validators/quotation';
import type { TBaseArgs } from '../../types/common.types';
import type { TQuotation } from '../../types/projectQuotation.types';
import { api } from '../api';

export const projectQuotationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjectQuotations: builder.query<
      { quotations: TQuotation[]; totalCount: number },
      TBaseArgs & {
        type?: string | null;
        quotationStatus?: string | null;
        id?: string;
        projectId?: string;
      }
    >({
      query: (arg) => {
        return {
          url: `/quotations`,
          params: buildParams(arg),
        };
      },
      transformResponse(res: { data: { quotations: TQuotation[]; totalCount: number } }) {
        return res.data;
      },
      providesTags: ['get_project_quotations'],
    }),
    createProjectQuotation: builder.mutation<void, TCreateQuotationFormData>({
      query: (body) => ({
        url: '/quotations',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_project_quotations'],
    }),
    updateProjectQuotation: builder.mutation<
      void,
      TCreateQuotationFormData & { id: string | undefined }
    >({
      query: ({ id, ...body }) => ({
        url: `/quotations/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_project_quotations'],
    }),

    deleteProjectQuotation: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/quotations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_project_quotations'],
    }),
  }),
});

export const {
  useDeleteProjectQuotationMutation,
  useGetProjectQuotationsQuery,
  useLazyGetProjectQuotationsQuery,
  useCreateProjectQuotationMutation,
  useUpdateProjectQuotationMutation,
} = projectQuotationApi;
