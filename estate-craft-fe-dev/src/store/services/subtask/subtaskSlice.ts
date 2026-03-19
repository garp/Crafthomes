import type { TSubTask } from '../../types/task.types';
import { api } from '../api';

export const subtaskApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // Subtask APIs
    createSubTask: builder.mutation<
      { data: TSubTask },
      { parentTaskId: string; name: string; assignee?: string[]; assignedBy?: string }
    >({
      query: (body) => ({
        url: `/subTask`,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_tasks', 'edit_task', 'get_subtasks'], // refresh tasks after creating subtask
    }),
    getSubTasks: builder.query<
      { subTasks: TSubTask[]; totalCount: number },
      { parentTaskId: string }
    >({
      query: (arg) => ({
        url: `/subTask`,
        method: 'GET',
        params: { parentTaskId: arg.parentTaskId },
      }),
      providesTags: ['get_subtasks'],
      transformResponse: (res: { data: { subTasks: TSubTask[]; totalCount: number } }) =>
        res?.data || { subTasks: [], totalCount: 0 },
    }),
    getSubTaskById: builder.query<TSubTask, { id: string }>({
      query: ({ id }) => ({
        url: `/subTask/${id}`,
        method: 'GET',
      }),
      providesTags: (_result, _error, { id }) => [{ type: 'get_subtasks', id }],
      transformResponse: (res: { data: TSubTask }) => res?.data,
    }),
    updateSubTask: builder.mutation<void, { id: string; taskStatus?: string; [key: string]: any }>({
      query: ({ id, ...body }) => ({
        url: `/subTask/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_tasks', 'edit_task', 'get_subtasks'], // refresh tasks after updating subtask
    }),
    deleteSubTask: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/subTask/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_tasks', 'edit_task', 'get_subtasks'], // ✅ refresh cache
    }),
    markSubTaskComplete: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/subTask/mark-complete/${id}`,
        method: 'PUT',
      }),
      invalidatesTags: [
        'get_project_tasks',
        'get_project_phases',
        'get_tasks',
        'get_phases',
        'edit_task',
        'get_subtasks',
      ], // ✅ refresh cache
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateSubTaskMutation,
  useGetSubTasksQuery,
  useGetSubTaskByIdQuery,
  useUpdateSubTaskMutation,
  useDeleteSubTaskMutation,
  useMarkSubTaskCompleteMutation,
} = subtaskApi;
