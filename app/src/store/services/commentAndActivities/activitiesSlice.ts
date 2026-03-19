import { buildParams } from '../../../utils/helper';
import { api } from '../api';

export type TActivity = {
  id: string;
  activityType: string;
  activity: string[];
  taskId: string;
  createdAt: string;
  fieldUpdated: string;
  entityType?: string;
  entityId?: string;
  entityName?: string;
  metadata?: {
    timesheetId?: string;
    durationMinutes?: number;
    date?: string;
    action?: string;
    [key: string]: unknown;
  };
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type TProjectActivity = {
  id: string;
  activity: string[];
  activityType: string;
  entityType: string;
  entityId: string;
  entityName: string | null;
  fieldUpdated: string | null;
  taskId: string | null;
  subTaskId: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
};

export type TProjectActivitiesResponse = {
  activities: TProjectActivity[];
  totalCount: number;
  project: {
    id: string;
    name: string;
  };
};

export type TProjectActivitiesParams = {
  projectId: string;
  pageNo?: string;
  pageLimit?: string;
  entityType?: string;
  activityType?: string;
  startDate?: string;
  endDate?: string;
};

export const activityApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getActivities: builder.query<{ activities: TActivity[] }, { taskId?: string }>({
      query: (arg) => ({
        url: '/activities',
        params: buildParams(arg),
      }),
      transformResponse(res: { data: { activities: TActivity[] } }) {
        return res.data;
      },
      providesTags: ['get_activities'],
    }),
    getProjectActivities: builder.query<TProjectActivitiesResponse, TProjectActivitiesParams>({
      query: ({ projectId, ...params }) => ({
        url: `/activities/project/${projectId}`,
        params: buildParams(params),
      }),
      transformResponse(res: { data: TProjectActivitiesResponse }) {
        return res.data;
      },
      providesTags: ['get_project_activities'],
    }),
  }),
});

export const {
  useGetActivitiesQuery,
  useLazyGetActivitiesQuery,
  useGetProjectActivitiesQuery,
  useLazyGetProjectActivitiesQuery,
} = activityApi;
