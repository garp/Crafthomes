import { api } from '../api';
import type { TNotificationsResponse, TUnreadCountResponse } from '../../types/notification.types';

export const notificationApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getNotifications: builder.query<
      TNotificationsResponse,
      { pageNo?: number; pageLimit?: number; unreadOnly?: boolean }
    >({
      query: (arg) => ({
        url: '/notifications',
        method: 'GET',
        params: {
          pageNo: arg.pageNo ?? 0,
          pageLimit: arg.pageLimit ?? 20,
          ...(arg.unreadOnly ? { unreadOnly: 'true' } : {}),
        },
      }),
      providesTags: ['get_notifications'],
      transformResponse: (res: { data: TNotificationsResponse }) => res.data,
    }),

    getUnreadCount: builder.query<TUnreadCountResponse, void>({
      query: () => ({
        url: '/notifications/count',
        method: 'GET',
      }),
      providesTags: ['get_notifications'],
      transformResponse: (res: { data: TUnreadCountResponse }) => res.data,
    }),

    markNotificationAsRead: builder.mutation<unknown, string>({
      query: (id) => ({
        url: `/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['get_notifications'],
    }),

    markAllNotificationsAsRead: builder.mutation<unknown, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['get_notifications'],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationAsReadMutation,
  useMarkAllNotificationsAsReadMutation,
} = notificationApi;
