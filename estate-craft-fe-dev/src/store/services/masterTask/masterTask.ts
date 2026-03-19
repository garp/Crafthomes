import type { TBaseArgs } from '../../types/common.types';
import type { TCreateMasterTaskFormData } from '../../../validators/masterTask';
import type { TMasterTask } from '../../types/masterTask.types';
import { api } from '../api';

export const masterTaskApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET
    getMasterTasks: builder.query<
      { masterTasks: TMasterTask[]; totalCount: number },
      TBaseArgs & { id?: string; masterPhaseId?: string; projectTypeId?: string }
    >({
      query: (arg) => {
        const params: Record<string, string | number | undefined> = {};
        if (arg?.pageNo) params.pageNo = arg.pageNo;
        if (arg?.pageLimit) params.pageLimit = arg.pageLimit;
        if (arg?.search) params.search = arg.search;
        if (arg?.id) params.id = arg.id;
        if (arg?.masterPhaseId) params.masterPhaseId = arg.masterPhaseId;
        if (arg?.projectTypeId) params.projectTypeId = arg.projectTypeId;
        return {
          url: '/masterTask',
          params,
          method: 'GET',
        };
      },
      transformResponse: (res: { data: { masterTasks: TMasterTask[]; totalCount: number } }) =>
        res?.data,
      providesTags: ['get_master_tasks'],
    }),

    // CREATE
    createMasterTask: builder.mutation<void, TCreateMasterTaskFormData>({
      query: (body) => ({
        url: '/masterTask',
        method: 'POST',
        body,
      }),
      invalidatesTags: [
        'get_master_tasks',
        'get_master_phases',
        'get_projectTypes',
        'get_phases_by_project_type',
      ],
    }),

    // UPDATE
    updateMasterTask: builder.mutation<void, TCreateMasterTaskFormData & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `/masterTask/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: [
        'get_master_tasks',
        'get_master_phases',
        'get_projectTypes',
        'get_phases_by_project_type',
      ],
    }),

    // DELETE
    deleteMasterTask: builder.mutation<void, string>({
      query: (id) => ({
        url: `/masterTask/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [
        'get_master_tasks',
        'get_master_phases',
        'get_projectTypes',
        'get_phases_by_project_type',
      ],
    }),

    // BULK DELETE master tasks
    bulkDeleteMasterTasks: builder.mutation<{ success: boolean }, { ids: string[] }>({
      query: (body) => ({
        url: '/masterTask/bulk',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: [
        'get_master_tasks',
        'get_master_phases',
        'get_projectTypes',
        'get_phases_by_project_type',
      ],
    }),
  }),
});

export const {
  useCreateMasterTaskMutation,
  useDeleteMasterTaskMutation,
  useGetMasterTasksQuery,
  useUpdateMasterTaskMutation,
  useLazyGetMasterTasksQuery,
  useBulkDeleteMasterTasksMutation,
} = masterTaskApi;
