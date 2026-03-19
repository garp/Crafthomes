import type { TBaseArgs } from '../../types/common.types';
import type {
  TCreateProjectTypeGroupBody,
  TProjectTypeGroup,
  TProjectTypeGroupDetail,
  TProjectTypeGroupsResponse,
  TUpdateProjectTypeGroupBody,
  TRearrangeProjectTypesBody,
} from '../../types/projectTypeGroup.types';
import { api } from '../api';
import { buildParams } from '../../../utils/helper';

export const projectTypeGroupApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET project type groups (with pagination)
    getProjectTypeGroups: builder.query<TProjectTypeGroupsResponse, TBaseArgs>({
      query: (arg) => {
        return {
          url: '/project-type-group',
          method: 'GET',
          params: buildParams({
            ...arg,
            status: 'ACTIVE',
            sortType: 'createdAt',
            sortOrder: '-1',
          }),
        };
      },
      transformResponse(res: { data: TProjectTypeGroupsResponse }) {
        return res?.data;
      },
      providesTags: ['get_project_type_groups'],
    }),

    // POST (create new project type group)
    createProjectTypeGroup: builder.mutation<TProjectTypeGroup, TCreateProjectTypeGroupBody>({
      query: (body) => ({
        url: '/project-type-group',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_project_type_groups'],
    }),

    // PUT (update project type group by id)
    updateProjectTypeGroup: builder.mutation<TProjectTypeGroup, TUpdateProjectTypeGroupBody>({
      query: ({ id, ...body }) => ({
        url: `/project-type-group/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_project_type_groups'],
    }),

    // DELETE (delete project type group by id)
    deleteProjectTypeGroup: builder.mutation<{ success: boolean }, { id: string }>({
      query: ({ id }) => ({
        url: `/project-type-group/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_project_type_groups'],
    }),

    // GET project type group by ID (for detail page)
    getProjectTypeGroupById: builder.query<TProjectTypeGroupDetail, { id: string }>({
      query: ({ id }) => ({
        url: `/project-type-group/${id}`,
        method: 'GET',
      }),
      transformResponse(res: { data: TProjectTypeGroupDetail }) {
        return res?.data;
      },
      providesTags: (_result, _error, arg) => [{ type: 'get_project_type_groups', id: arg.id }],
    }),

    // PUT rearrange project types order in project type group
    rearrangeProjectTypes: builder.mutation<{ success: boolean }, TRearrangeProjectTypesBody>({
      query: (body) => ({
        url: '/project-type-group/rearrange/project-type',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_project_type_groups'],
    }),

    // BULK DELETE project type groups
    bulkDeleteProjectTypeGroups: builder.mutation<{ success: boolean }, { ids: string[] }>({
      query: (body) => ({
        url: '/project-type-group/bulk',
        method: 'DELETE',
        body,
      }),
      invalidatesTags: ['get_project_type_groups'],
    }),
  }),
});

export const {
  useGetProjectTypeGroupsQuery,
  useLazyGetProjectTypeGroupsQuery,
  useCreateProjectTypeGroupMutation,
  useUpdateProjectTypeGroupMutation,
  useDeleteProjectTypeGroupMutation,
  useGetProjectTypeGroupByIdQuery,
  useRearrangeProjectTypesMutation,
  useBulkDeleteProjectTypeGroupsMutation,
} = projectTypeGroupApi;
