import { buildParams } from '../../../utils/helper';
import type { TBaseArgs } from '../../types/common.types';
import type { TCreateTaskBody, TTask, TUpdateTaskBody } from '../../types/task.types';
import { api } from '../api';

export const taskApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // getTasks: builder.query<{ tasks: TTask[]; totalCount: number },
    //   { taskStatus?: string; projectId?: string; phaseId?: string } & TBaseArgs>({
    //     query: (arg) => {
    //       return {
    //         url: `/task`,
    //         method: "GET",
    //         params: buildParams(arg)
    //       }
    //     },
    //     providesTags: ['get_tasks'],
    //     transformResponse(res: { data: { tasks: TTask[]; totalCount: number } }) {
    //       return res.data;
    //     },
    //   }),
    getInfiniteTasks: builder.infiniteQuery<
      { tasks: TTask[]; totalCount: number },
      {
        taskStatus?: string;
        projectId?: string;
        phaseId?: string;
        assignedToMe?: boolean;
        approvalPending?: boolean;
      } & TBaseArgs,
      number
    >({
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages, lastPageParam) => {
          if (lastPage.tasks.length === 0) return undefined;

          // Or stop if we already fetched everything
          const loadedCount = allPages.reduce((sum, p) => sum + p.tasks.length, 0);
          if (loadedCount >= lastPage.totalCount) return undefined;
          return lastPageParam + 1;
        },
        getPreviousPageParam: (firstPage, allPages, firstPageParam) => {
          console.log({ firstPage, allPages });
          return firstPageParam > 0 ? firstPageParam - 1 : undefined;
        },
      },
      query: (arg) => {
        // console.log({ arg })
        return {
          url: `/task`,
          method: 'GET',
          params: buildParams({
            ...arg.queryArg,
            pageNo: arg.pageParam, // or `page` depending on your backend
          }),
        };
      },
      transformResponse(res: { data: { tasks: TTask[]; totalCount: number } }) {
        return res.data;
      },
      providesTags: ['get_tasks'],
    }),
    getProjectTasks: builder.query<
      { tasks: TTask[]; totalCount: number },
      TBaseArgs & {
        phaseId?: string;
        projectId?: string;
        timelineId?: string;
        assignedToMe?: boolean;
        approvalPending?: boolean;
      }
    >({
      query: (arg) => ({
        url: `/task`,
        method: 'GET',
        params: buildParams(arg),
      }),
      providesTags: ['get_tasks'],
      transformResponse: (res: { data: { tasks: TTask[]; totalCount: number } }) => {
        return res?.data;
      },
    }),
    getTaskById: builder.query<TTask, { id: string; pageLimit?: number }>({
      query: ({ id, pageLimit = 10 }) => ({
        url: `/task`,
        method: 'GET',
        params: {
          id,
          pageLimit,
        },
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'get_tasks', id }, 'edit_task'],
      transformResponse: (res: { data: { tasks: TTask[]; totalCount: number } }) => {
        // API returns { data: { tasks: [...], totalCount: number } }
        // Extract the first task from the tasks array
        if (res.data?.tasks && res.data.tasks.length > 0) {
          return res.data.tasks[0];
        }
        throw new Error('Task not found');
      },
    }),
    createTask: builder.mutation<{ data: TTask }, TCreateTaskBody>({
      query: (body) => ({
        url: `/task`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_tasks', 'get_project_phases', 'get_phases'], // refresh tasks after creating one
    }),
    editTask: builder.mutation<void, TUpdateTaskBody>({
      query: ({ id, ...body }) => ({
        url: `/task/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_tasks', 'edit_task', 'get_project_phases', 'get_phases'], // refresh tasks after creating one
    }),
    deleteTask: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/task/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_project_tasks', 'get_project_phases', 'get_tasks', 'get_phases'], // ✅ refresh cache
    }),
    markTaskComplete: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/task/mark-complete/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: [
        'get_project_tasks',
        'get_project_phases',
        'get_tasks',
        'get_phases',
        'edit_task',
      ], // ✅ refresh cache
    }),
    approveTask: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/task/approve/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: [
        'get_project_tasks',
        'get_project_phases',
        'get_tasks',
        'get_phases',
        'edit_task',
      ],
    }),
  }),
  overrideExisting: false,
});
export const {
  useGetInfiniteTasksInfiniteQuery,
  useCreateTaskMutation,
  useEditTaskMutation,
  useDeleteTaskMutation,
  useMarkTaskCompleteMutation,
  useApproveTaskMutation,
  useLazyGetProjectTasksQuery,
  useGetProjectTasksQuery,
  useGetTaskByIdQuery,
  // useGetTasksQuery
} = taskApi;
