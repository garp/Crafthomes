import { buildParams } from '../../../utils/helper';
import type { TBaseArgs, TStatus } from '../../types/common.types';
import type { TPhase } from '../../types/phase.types';
import type { TCreateProjectPhaseBody } from '../../types/projectPhase.types';
import { api } from '../api';

export type TMasterPhaseMinimal = {
  id: string;
  name: string;
  description: string;
  status: TStatus;
};

export const phaseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPhases: builder.query<
      { phases: TPhase[]; totalCount: number },
      TBaseArgs & { projectId?: string; timelineId?: string }
    >({
      query: (arg) => ({
        url: `/phase`,
        method: 'GET',
        params: buildParams(arg),
      }),
      transformResponse(res: { data: { phases: TPhase[]; totalCount: number } }) {
        return res.data;
      },
      providesTags: ['get_phases'],
    }),
    getPhasesByProjectTypeId: builder.query<
      { masterPhases: TMasterPhaseMinimal[]; totalCount: number },
      { projectTypeId: string }
    >({
      // Use project-type path so phases are returned in timeline template order (MasterPhaseOrder)
      query: (arg) => ({
        url: `/masterPhase/project-type/${arg.projectTypeId}`,
        method: 'GET',
      }),
      transformResponse(res: {
        data: { masterPhases: TMasterPhaseMinimal[]; totalCount: number };
      }) {
        return res.data;
      },
      providesTags: ['get_phases_by_project_type'],
    }),
    addPhase: builder.mutation<void, TCreateProjectPhaseBody>({
      query: (body) => ({
        url: '/phase',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_phases'],
    }),
    rearrangePhases: builder.mutation<void, { timelineId: string; phases: string[] }>({
      query: (body) => ({
        url: '/timeline/rearrange/phase',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_phases', 'get_timelines'],
    }),
    rearrangeTasks: builder.mutation<
      void,
      { timelineId: string; phaseId: string; tasks: string[] }
    >({
      query: (body) => ({
        url: '/timeline/rearrange/task',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_phases', 'get_timelines'],
    }),
    editPhase: builder.mutation<void, { id: string; name: string; description?: string }>({
      query: ({ id, ...body }) => ({
        url: `/phase/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_phases'],
    }),
    deletePhase: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/phase/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_phases'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPhasesQuery,
  useLazyGetPhasesQuery,
  useAddPhaseMutation,
  useGetPhasesByProjectTypeIdQuery,
  useRearrangePhasesMutation,
  useRearrangeTasksMutation,
  useEditPhaseMutation,
  useDeletePhaseMutation,
} = phaseApi;
