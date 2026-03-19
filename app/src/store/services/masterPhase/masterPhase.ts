import type { TCreateMasterPhaseFormData } from '../../../validators/masterPhase';
import type { TBaseArgs } from '../../types/common.types';
import type { TMasterPhase } from '../../types/masterPhase.types';
import { api } from '../api';

export const masterPhaseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    //GET
    getMasterPhases: builder.query<
      { masterPhases: TMasterPhase[]; totalCount: number },
      TBaseArgs & { search?: string | null; id?: string; projectTypeId?: string }
    >({
      query: (arg) => {
        const params: Record<string, string | number | undefined> = {};
        if (arg?.pageNo) params.pageNo = arg?.pageNo;
        if (arg?.pageLimit) params.pageLimit = arg?.pageLimit;
        if (arg?.search) params.search = arg?.search;
        if (arg?.id) params.id = arg?.id;
        if (arg?.projectTypeId) params.projectTypeId = arg?.projectTypeId;
        return {
          url: '/masterPhase',
          params,
          method: 'GET',
        };
      },
      transformResponse: (res: { data: { masterPhases: TMasterPhase[]; totalCount: number } }) => {
        return res?.data;
      },
      providesTags: ['get_master_phases'],
    }),
    //CREATE
    addMasterPhase: builder.mutation<void, TCreateMasterPhaseFormData>({
      query: (body) => ({
        url: 'masterPhase',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_master_phases', 'get_projectTypes', 'get_phases_by_project_type'],
    }),

    //UPDATE
    updateMasterPhase: builder.mutation<void, TCreateMasterPhaseFormData & { id: string }>({
      query: ({ id, ...body }) => ({
        url: `masterPhase/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_master_phases', 'get_projectTypes', 'get_phases_by_project_type'],
    }),

    // DELETE
    deleteMasterPhase: builder.mutation<void, string>({
      query: (id) => ({
        url: `masterPhase/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_master_phases', 'get_projectTypes', 'get_phases_by_project_type'],
    }),

    // BULK DELETE master phases
    bulkDeleteMasterPhases: builder.mutation<{ success: boolean }, { ids: string[] }>({
      query: (body) => ({
        url: '/masterPhase/bulk',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: ['get_master_phases', 'get_projectTypes', 'get_phases_by_project_type'],
    }),
  }),
});

export const {
  useAddMasterPhaseMutation,
  useDeleteMasterPhaseMutation,
  useGetMasterPhasesQuery,
  useUpdateMasterPhaseMutation,
  useLazyGetMasterPhasesQuery,
  useBulkDeleteMasterPhasesMutation,
} = masterPhaseApi;
