import { buildParams } from '../../../utils/helper';
import type { TCreateSnagFormData } from '../../../validators/snag';
import type { TBaseArgs } from '../../types/common.types';
import type { TSnag } from '../../types/snag.types';
import { api } from '../api';

export const snagApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjectSnags: builder.query<
      { snags: TSnag[]; totalCount: number },
      TBaseArgs & { projectId?: string; snagStatus?: string | null }
    >({
      query: (arg) => {
        return {
          url: `/snag`,
          params: buildParams(arg),
        };
      },
      transformResponse(res: { data: { snags: TSnag[]; totalCount: number } }) {
        return res.data;
      },
      providesTags: ['get_project_snags'],
    }),
    createProjectSnag: builder.mutation<void, TCreateSnagFormData>({
      query: (body) => ({
        url: '/snag',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_project_snags'],
    }),
    updateProjectSnag: builder.mutation<void, TCreateSnagFormData & { id: string | undefined }>({
      query: ({ id, ...body }) => ({
        url: `/snag/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_project_snags'],
    }),
    deleteProjectSnag: builder.mutation<{ success: boolean }, string>({
      query: (id) => ({
        url: `/snag/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_project_snags'],
    }),
  }),
});

export const {
  useGetProjectSnagsQuery,
  useLazyGetProjectSnagsQuery,
  useCreateProjectSnagMutation,
  useUpdateProjectSnagMutation,
  useDeleteProjectSnagMutation,
} = snagApi;
