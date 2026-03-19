import { api } from '../api';
import { buildParams } from '../../../utils/helper';
import type {
  TCreateTimesheetBody,
  TGetTimesheetApprovalsArgs,
  TGetTimesheetApprovalsResponse,
  TGetTimesheetArgs,
  TGetTimesheetResponse,
  TSubmitTimesheetWeekBody,
  TTimesheetDecisionBody,
  TTimesheet,
  TUpdateTimesheetBody,
} from '../../types/timesheet.types';

export const timesheetApi = api.injectEndpoints({
  endpoints: (builder) => ({
    createTimesheet: builder.mutation<TTimesheet, TCreateTimesheetBody>({
      query: (body) => ({
        url: '/timesheet',
        method: 'POST',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['get_timesheets', 'get_activities', 'get_project_activities'],
    }),

    getTimesheets: builder.query<TGetTimesheetResponse, TGetTimesheetArgs>({
      query: (arg) => ({
        url: '/timesheet',
        method: 'GET',
        params: buildParams(arg),
      }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: (result) => {
        const listTag = { type: 'get_timesheets' as const, id: 'LIST' };
        const items = result?.timesheets ?? [];
        return [
          listTag,
          ...items
            .filter((t) => Boolean(t?.id))
            .map((t) => ({ type: 'get_timesheets' as const, id: t.id })),
        ];
      },
    }),

    getTimesheetById: builder.query<TTimesheet, { id: string }>({
      query: ({ id }) => ({
        url: '/timesheet',
        method: 'GET',
        params: buildParams({ id }),
      }),
      transformResponse: (res: any) => {
        const data = res?.data ?? res;

        // Support both possible shapes:
        // 1) { timesheets: [...] } (list response)
        // 2) { timesheet: {...} } or direct object
        if (Array.isArray(data?.timesheets)) {
          if (data.timesheets.length > 0) return data.timesheets[0];
          throw new Error('Timesheet not found');
        }
        if (data?.timesheet) return data.timesheet;
        return data as TTimesheet;
      },
      providesTags: (_result, _error, { id }) => [{ type: 'get_timesheets', id }],
    }),

    updateTimesheet: builder.mutation<TTimesheet, { id: string; body: TUpdateTimesheetBody }>({
      query: ({ id, body }) => ({
        url: `/timesheet/${id}`,
        method: 'PUT',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'get_timesheets', id },
        'get_timesheets',
        'get_activities',
        'get_project_activities',
      ],
    }),

    deleteTimesheet: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/timesheet/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'get_timesheets', id },
        'get_timesheets',
        'get_activities',
        'get_project_activities',
      ],
    }),

    submitTimesheetWeek: builder.mutation<{ week: any }, TSubmitTimesheetWeekBody | void>({
      query: (body) => ({
        url: '/timesheet/week/submit',
        method: 'POST',
        body: body ?? {},
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['get_timesheets'],
    }),

    getTimesheetApprovals: builder.query<
      TGetTimesheetApprovalsResponse,
      TGetTimesheetApprovalsArgs
    >({
      query: (arg) => ({
        url: '/timesheet/approvals',
        method: 'GET',
        params: buildParams(arg),
      }),
      transformResponse: (res: any) => res?.data ?? res,
      providesTags: ['get_timesheet_approvals'],
    }),

    decideTimesheetEntry: builder.mutation<
      TTimesheet,
      { id: string; body: TTimesheetDecisionBody }
    >({
      query: ({ id, body }) => ({
        url: `/timesheet/${id}/decision`,
        method: 'PUT',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'get_timesheets', id },
        'get_timesheets',
        'get_timesheet_approvals',
      ],
    }),

    decideTimesheetWeek: builder.mutation<any, { id: string; body: TTimesheetDecisionBody }>({
      query: ({ id, body }) => ({
        url: `/timesheet/week/${id}/decision`,
        method: 'PUT',
        body,
      }),
      transformResponse: (res: any) => res?.data ?? res,
      invalidatesTags: ['get_timesheet_approvals', 'get_timesheets'],
    }),
  }),
});

export const {
  useCreateTimesheetMutation,
  useGetTimesheetsQuery,
  useGetTimesheetByIdQuery,
  useUpdateTimesheetMutation,
  useDeleteTimesheetMutation,
  useSubmitTimesheetWeekMutation,
  useGetTimesheetApprovalsQuery,
  useDecideTimesheetEntryMutation,
  useDecideTimesheetWeekMutation,
} = timesheetApi;
