import { api } from '../api';
import type {
  TSummaryTaskResponse,
  TSummaryPaymentProgressResponse,
  TSummaryMomSummaryResponse,
  TSummaryTasksByTypeResponse,
  TSummaryTasksByTypeArgs,
} from '../../types/summary.types';

export const summaryApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSummary: builder.query<TSummaryTaskResponse, void>({
      query: () => ({
        url: `/summary/task`,
        method: 'GET',
      }),
      transformResponse: (res: { data?: TSummaryTaskResponse } | TSummaryTaskResponse) => {
        // Backend currently wraps payload as: { data: {...} }
        return (res as { data?: TSummaryTaskResponse })?.data ?? (res as TSummaryTaskResponse);
      },
      providesTags: ['get_summary'],
    }),

    getPaymentProgress: builder.query<TSummaryPaymentProgressResponse, void>({
      query: () => ({
        url: `/summary/payment-progress`,
        method: 'GET',
      }),
      transformResponse: (
        res: { data?: TSummaryPaymentProgressResponse } | TSummaryPaymentProgressResponse,
      ) => {
        return (
          (res as { data?: TSummaryPaymentProgressResponse })?.data ??
          (res as TSummaryPaymentProgressResponse)
        );
      },
    }),

    getMomProgress: builder.query<TSummaryMomSummaryResponse, void>({
      query: () => ({
        url: `/summary/mom-progress`,
        method: 'GET',
      }),
      transformResponse: (
        res: { data?: TSummaryMomSummaryResponse } | TSummaryMomSummaryResponse,
      ) => {
        return (
          (res as { data?: TSummaryMomSummaryResponse })?.data ??
          (res as TSummaryMomSummaryResponse)
        );
      },
    }),

    getTasksByType: builder.query<TSummaryTasksByTypeResponse, TSummaryTasksByTypeArgs | void>({
      query: (arg) => {
        const params: Record<string, number> = {};
        if (arg?.pageNo !== undefined) params.pageNo = arg.pageNo;
        if (arg?.pageLimit !== undefined) params.pageLimit = arg.pageLimit;
        return {
          url: `/summary/tasks-by-type`,
          method: 'GET',
          params,
        };
      },
      transformResponse: (
        res: { data?: TSummaryTasksByTypeResponse } | TSummaryTasksByTypeResponse,
      ) => {
        return (
          (res as { data?: TSummaryTasksByTypeResponse })?.data ??
          (res as TSummaryTasksByTypeResponse)
        );
      },
    }),
  }),
});

export const {
  useGetSummaryQuery,
  useGetPaymentProgressQuery,
  useGetMomProgressQuery,
  useGetTasksByTypeQuery,
} = summaryApi;
