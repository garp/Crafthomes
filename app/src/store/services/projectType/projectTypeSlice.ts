import type { TBaseArgs } from '../../types/common.types';
import type {
  TCreateProjectTypeBody,
  TProjectType,
  TProjectTypeDetail,
} from '../../types/projectType.types';
import type { TCreateProjectTypeFormData } from '../../../validators/projectType';
import { api } from '../api';
import { buildParams } from '../../../utils/helper';

export const projectTypeApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ GET project types (with pagination)
    getProjectTypes: builder.query<
      { projectTypes: TProjectType[]; totalCount: number },
      TBaseArgs & { id?: string; projectTypeGroupId?: string }
    >({
      query: (arg) => {
        // const params: Record<string, string | number | undefined> = {};
        // if (arg?.pageNo) params.pageNo = arg?.pageNo;
        // if (arg?.pageLimit) params.pageLimit = arg?.pageLimit;
        // if (arg?.search) params.search = arg?.search;
        // if (arg?.id) params.id = arg?.id;
        return {
          url: '/project-type',
          method: 'GET',
          params: buildParams(arg),
        };
      },
      transformResponse(res: { data: { projectTypes: TProjectType[]; totalCount: number } }) {
        return res?.data;
      },
      providesTags: ['get_projectTypes'],
    }),

    // ✅ POST (create new project type)
    createProjectType: builder.mutation<TProjectType[], TCreateProjectTypeBody>({
      query: (body) => ({
        url: '/project-type',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_projectTypes'],
    }),

    // ✅ PUT (update project type by id)
    updateProjectType: builder.mutation<TProjectType, { id: string } & TCreateProjectTypeFormData>({
      query: ({ id, ...body }) => ({
        url: `/project-type/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_projectTypes', 'get_phases_by_project_type'],
    }),

    // ✅ DELETE (delete project type by id)
    deleteProjectType: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/project-type/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_projectTypes'],
    }),

    // ✅ GET project type by ID (for detail page)
    getProjectTypeById: builder.query<TProjectTypeDetail, { id: string }>({
      query: ({ id }) => ({
        url: `/project-type/${id}`,
        method: 'GET',
      }),
      transformResponse(res: { data: TProjectTypeDetail }) {
        return res?.data;
      },
      providesTags: (_result, _error, arg) => [
        { type: 'get_projectTypes', id: arg.id },
        'get_phases_by_project_type',
      ],
    }),

    // ✅ PUT rearrange master phases order in project type
    rearrangeMasterPhases: builder.mutation<
      { success: boolean },
      { projectTypeId: string; masterPhases: string[] }
    >({
      query: (body) => ({
        url: '/project-type/rearrange/master-phase',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_projectTypes', 'get_phases_by_project_type'],
    }),

    // ✅ PUT rearrange master tasks order in phase
    rearrangeMasterTasks: builder.mutation<
      { success: boolean },
      { projectTypeId: string; masterPhaseId: string; masterTasks: string[] }
    >({
      query: (body) => ({
        url: '/project-type/rearrange/master-task',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_projectTypes', 'get_phases_by_project_type'],
    }),

    // ✅ DELETE remove master phase from project type
    removeMasterPhaseFromProjectType: builder.mutation<
      { success: boolean },
      { projectTypeId: string; masterPhaseId: string }
    >({
      query: ({ projectTypeId, masterPhaseId }) => ({
        url: `/project-type/${projectTypeId}/masterPhase/${masterPhaseId}/remove`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_projectTypes', 'get_phases_by_project_type'],
    }),

    // ✅ DELETE remove master task from master phase of project type
    removeMasterTaskFromMasterPhase: builder.mutation<
      { success: boolean },
      { projectTypeId: string; masterPhaseId: string; masterTaskId: string }
    >({
      query: ({ projectTypeId, masterPhaseId, masterTaskId }) => ({
        url: `/project-type/${projectTypeId}/masterPhase/${masterPhaseId}/masterTask/${masterTaskId}/remove`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_projectTypes', 'get_phases_by_project_type'],
    }),

    // ✅ BULK DELETE project types
    bulkDeleteProjectTypes: builder.mutation<{ success: boolean }, { ids: string[] }>({
      query: (body) => ({
        url: '/project-type/bulk',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: ['get_projectTypes', 'get_phases_by_project_type'],
    }),
  }),
});

export const {
  useGetProjectTypesQuery,
  useCreateProjectTypeMutation,
  useUpdateProjectTypeMutation,
  useDeleteProjectTypeMutation,
  useLazyGetProjectTypesQuery,
  useGetProjectTypeByIdQuery,
  useRearrangeMasterPhasesMutation,
  useRearrangeMasterTasksMutation,
  useRemoveMasterPhaseFromProjectTypeMutation,
  useRemoveMasterTaskFromMasterPhaseMutation,
  useBulkDeleteProjectTypesMutation,
} = projectTypeApi;
