import type { TCreateTimelineFormData } from '../../../validators/projectTimeline';
import { type TBaseArgs } from '../../types/common.types';
import type {
  TTimeline,
  TTimelineDetailResponse,
  TTimelineStatus,
} from '../../types/timeline.types';
import { api } from '../api'; // your base api slice

export const timelineApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTimelineById: builder.query<TTimelineDetailResponse, { id: string }>({
      query: ({ id }) => ({
        url: `/timeline/${id}`,
        method: 'GET',
      }),
      transformResponse: (res: { data: TTimelineDetailResponse }) => res.data,
      providesTags: (_result, _error, arg) => [{ type: 'get_timelines', id: arg.id }, 'get_phases'],
    }),
    getProjectTimeline: builder.query<
      { timelines: TTimeline[]; totalCount: number },
      TBaseArgs & { projectId?: string; id?: string; timelineStatus?: TTimelineStatus }
    >({
      query: (arg) => {
        const params: Record<string, string | number | undefined> = {};
        if (arg?.projectId) params.projectId = arg?.projectId;
        if (arg?.id) params.id = arg?.id;
        if (arg?.pageNo) params.pageNo = arg?.pageNo;
        if (arg?.pageLimit) params.pageLimit = arg?.pageLimit;
        if (arg?.timelineStatus) params.timelineStatus = arg?.timelineStatus;

        return {
          url: `/timeline`,
          method: 'GET',
          params,
        };
      },
      transformResponse(res: { data: { timelines: TTimeline[]; totalCount: number } }) {
        return res.data;
      },
      providesTags: ['get_timelines'],
    }),
    createProjectTimeline: builder.mutation<void, TCreateTimelineFormData & { projectId: string }>({
      query: (body) => ({
        url: '/timeline',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_timelines'],
    }),
    editProjectTimeline: builder.mutation<
      { success: boolean; message: string },
      {
        id: string;
        data: {
          name?: string;
          plannedStart?: Date;
          plannedEnd?: Date | null;
          timelineStatus?: TTimelineStatus;
        };
      }
    >({
      query: ({ id, data }) => ({
        url: `/timeline/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['get_timelines'],
    }),
    deleteProjectTimeline: builder.mutation<
      { success: boolean; message: string }, // response type
      { id: string } // request type
    >({
      query: ({ id }) => ({
        url: `/timeline/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_timelines'], // refresh timeline cache
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTimelineByIdQuery,
  useGetProjectTimelineQuery,
  useCreateProjectTimelineMutation,
  useEditProjectTimelineMutation,
  useDeleteProjectTimelineMutation,
  useLazyGetProjectTimelineQuery,
} = timelineApi;
