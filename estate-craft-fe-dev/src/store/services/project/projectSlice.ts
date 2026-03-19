import type { TCreateProjectBody, TEditProjectBody, TProject } from '../../types/project.types';
import type { TBaseArgs, TStats } from '../../types/common.types';
import { api } from '../api';
import type {} from '../../../types/project';

export const projectApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createProject: builder.mutation<void, TCreateProjectBody>({
      query: (body) => ({
        url: '/project',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_projects'],
    }),
    editProject: builder.mutation<void, TEditProjectBody>({
      query: ({ id, ...body }) => ({
        url: `/project/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_projects'],
    }),
    getProjects: builder.query<
      { projects: TProject[]; totalCount: number; stats: TStats },
      { projectStatus?: string; id?: string; avgProgress?: boolean } & TBaseArgs
    >({
      query: (arg) => {
        const params: Record<string, string | number | undefined> = {};
        if (arg?.pageNo) params.pageNo = arg?.pageNo;
        if (arg?.pageLimit) params.pageLimit = arg?.pageLimit;
        if (arg?.search) params.search = arg?.search;
        if (arg?.searchText) params.searchText = arg?.searchText;
        if (arg?.projectStatus) params.projectStatus = arg?.projectStatus;
        if (arg?.id) params.id = arg?.id;
        if (arg?.searchText) params.searchText = arg?.searchText;

        return {
          url: '/project',
          method: 'GET',
          params,
        };
      },

      transformResponse(res: {
        data: { projects: TProject[]; totalCount: number; stats: TStats };
      }) {
        return res.data;
      },
      providesTags: ['get_projects'],
    }),
    deleteProject: builder.mutation<void, { id: string }>({
      query: (arg) => ({
        url: `/project/${arg?.id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_projects'],
    }),
    getProjectAssignedUsers: builder.query<
      {
        users: {
          id: string;
          name: string;
          email?: string;
          userType?: string;
          designation?: { id: string; name: string; displayName: string };
        }[];
      },
      { projectId: string; search?: string }
    >({
      query: ({ projectId, search }) => {
        const params: Record<string, string> = {};
        if (search) params.search = search;
        return {
          url: `/project/users/assigned-list/${projectId}`,
          method: 'GET',
          params,
        };
      },
      transformResponse(res: {
        data: {
          users: {
            id: string;
            name: string;
            email?: string;
            userType?: string;
            designation?: { id: string; name: string; displayName: string };
          }[];
        };
      }) {
        return res.data;
      },
    }),
    getProjectLinkedData: builder.query<TProjectLinkedData, { projectId: string }>({
      query: ({ projectId }) => ({
        url: `/project/linked-data/${projectId}`,
        method: 'GET',
      }),
      transformResponse(res: { data: TProjectLinkedData }) {
        return res.data;
      },
    }),
    updateProjectStatus: builder.mutation<void, { id: string; projectStatus: TProjectStatus }>({
      query: ({ id, projectStatus }) => ({
        url: `/project/${id}`,
        method: 'PUT',
        body: { projectStatus },
      }),
      // Optimistic update - update cache immediately without refetching
      async onQueryStarted({ id, projectStatus }, { dispatch, queryFulfilled, getState }) {
        // Get all cached getProjects queries and update them
        const state = getState() as { api: { queries: Record<string, { originalArgs: unknown }> } };
        const queries = state.api?.queries || {};

        const patchResults: { undo: () => void }[] = [];

        // Find all getProjects queries in cache and update them
        Object.keys(queries).forEach((key) => {
          if (key.startsWith('getProjects(')) {
            const queryState = queries[key];
            if (queryState?.originalArgs !== undefined) {
              const patch = dispatch(
                projectApi.util.updateQueryData(
                  'getProjects',
                  queryState.originalArgs as { projectStatus?: string; id?: string } & TBaseArgs,
                  (draft) => {
                    const project = draft.projects?.find((p) => p.id === id);
                    if (project) {
                      project.projectStatus = projectStatus;
                    }
                  },
                ),
              );
              patchResults.push(patch);
            }
          }
        });

        try {
          await queryFulfilled;
        } catch {
          // Rollback all patches on error
          patchResults.forEach((patch) => patch.undo());
        }
      },
    }),
  }),
});

export type TProjectStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'DELAYED' | 'COMPLETED';

// Type for linked data response
export type TProjectLinkedData = {
  project: {
    id: string;
    name: string;
    status: string;
    projectStatus: string;
  };
  summary: {
    totalPhases: number;
    totalTasks: number;
    completedTasks: number;
    incompleteTasks: number;
    totalAttachments: number;
    totalFolders: number;
    totalSnags: number;
    openSnags: number;
    totalMOMs: number;
    totalQuotations: number;
    totalPayments: number;
    totalDeliverables: number;
    pendingDeliverables: number;
    totalSubTasks: number;
    assignedUsers: number;
  };
  attention: {
    incompleteTasks: {
      id: string;
      name: string;
      status: string;
      priority: string;
      dueDate: string | null;
      phaseName: string;
    }[];
    openSnags: unknown[];
    pendingDeliverables: unknown[];
  };
  warnings: string[];
};

export const {
  useCreateProjectMutation,
  useGetProjectsQuery,
  useEditProjectMutation,
  useDeleteProjectMutation,
  useLazyGetProjectsQuery,
  useGetProjectAssignedUsersQuery,
  useLazyGetProjectAssignedUsersQuery,
  useGetProjectLinkedDataQuery,
  useLazyGetProjectLinkedDataQuery,
  useUpdateProjectStatusMutation,
} = projectApi;
