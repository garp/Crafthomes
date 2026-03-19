import type { TCreateProjectPhaseBody, TProjectPhase } from '../../types/projectPhase.types';
import { api } from '../api';

export const timelinePhaseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjectPhases: builder.query<
      { phases: TProjectPhase[]; totalCount: number },
      { timelineId: string }
    >({
      query: (arg) => {
        const params: Record<string, string | number | undefined> = {};
        if (arg?.timelineId) params.timelineId = arg?.timelineId;
        return {
          url: `/timeline/phase`,
          method: 'GET',
          params,
        };
      },
      transformResponse: (res: { data: { phases: TProjectPhase[]; totalCount: number } }) => {
        return res.data;
      },
      providesTags: ['get_project_phases'],
    }),
    addProjectPhase: builder.mutation<void, TCreateProjectPhaseBody>({
      query: (body) => ({
        url: '/timeline/phase',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_project_phases'],
    }),
  }),

  overrideExisting: false,
});

// Hook to use in components
// export const { useGetProjectPhasesQuery, useAddProjectPhaseMutation } = timelinePhaseApi;
