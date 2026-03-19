import type { TProjectSummary } from '../../types/projectSummary.types';
import { api } from '../api';

export const projectSummaryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjectSummary: builder.query<TProjectSummary, { projectId: string }>({
      query: ({ projectId }) => ({
        url: `/project/summary/${projectId}`,
        method: 'GET',
      }),
      transformResponse(res: { data: TProjectSummary }) {
        return res.data;
      },
      providesTags: ['get_project_summary'],
    }),
  }),
});

export const { useGetProjectSummaryQuery, useLazyGetProjectSummaryQuery } = projectSummaryApi;
