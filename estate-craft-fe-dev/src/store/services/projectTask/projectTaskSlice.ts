import { type TBaseArgs } from '../../types/common.types';
import type { TAddProjectPhaseBody, TProjectTask } from '../../types/projectTask.types';
import { api } from '../api';

export const projectTaskApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getProjectTasks: builder.query<
      { tasks: TProjectTask[]; totalCount: number },
      TBaseArgs & { phaseId: string }
    >({
      query: (arg) => {
        const params: Record<string, string | number | undefined> = {};
        if (arg?.pageNo) params.pageNo = arg?.pageNo;
        if (arg?.pageLimit) params.pageLimit = arg?.pageLimit;
        if (arg?.phaseId) params.phaseId = arg?.phaseId;
        return {
          url: `/task`,
          method: 'GET',
          params,
        };
      },
      providesTags: ['get_project_tasks'],
      transformResponse: (res: { data: { tasks: TProjectTask[]; totalCount: number } }) => {
        return res?.data;
      },
    }),
    addProjectTask: builder.mutation<void, TAddProjectPhaseBody>({
      query: (body) => ({
        url: '/task',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_project_tasks', 'get_project_phases'],
    }),
    updateProjectTask: builder.mutation<
      void,
      { id: string; data: Omit<TAddProjectPhaseBody, 'timelineId' | 'phaseId'> }
    >({
      query: ({ id, data }) => ({
        url: `/task/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['get_project_tasks', 'get_project_phases'],
    }),
    deleteProjectTask: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/task/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_project_tasks', 'get_project_phases'], // ✅ refresh cache
    }),
  }),

  overrideExisting: false,
});

// export const {
//   useGetProjectTasksQuery,
//   useLazyGetProjectTasksQuery,
//   useAddProjectTaskMutation,
//   useUpdateProjectTaskMutation,
//   useDeleteProjectTaskMutation,
// } = projectTaskApi;
