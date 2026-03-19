import type { TAttachment } from '../../types/common.types';
import { api } from '../api';

export type TCreateCommentBody = {
  taskId: string;
  content: string;
  attachment?: TAttachment[];
};

export type TUpdateCommentBody = {
  id: string;
  content: string;
  attachment?: TAttachment[];
};

export type TComment = {
  id: string;
  sNo: number;
  content: string;
  createdAt: string;
  taskId: string;
  subTaskId: string | null;
  createdByUser: { id: string; name: string };
  attachments: TAttachment[];
};

export type TGetCommentsResponse = {
  data: {
    comments: TComment[];
    totalCount: number;
  };
};

export const commentApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // ✅ Create Comment
    createComment: builder.mutation<void, TCreateCommentBody>({
      query: (body) => ({
        url: '/comment',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['get_tasks', 'edit_task', 'get_activities', 'get_comments'],
    }),

    // ✅ Get Comments
    getComments: builder.query<
      {
        comments: TComment[];
        totalCount: number;
      },
      { taskId: string }
    >({
      query: ({ taskId }) => ({
        url: `/comment?taskId=${taskId}`,
        method: 'GET',
      }),
      providesTags: ['get_comments'],
      transformResponse(res: TGetCommentsResponse) {
        return res.data;
      },
    }),

    // ✅ Update Comment
    updateComment: builder.mutation<void, TUpdateCommentBody>({
      query: ({ id, ...body }) => ({
        url: `/comment/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['get_comments', 'get_tasks', 'edit_task', 'get_activities'],
    }),

    // ✅ Delete Comment
    deleteComment: builder.mutation<void, { id: string }>({
      query: ({ id }) => ({
        url: `/comment/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['get_comments', 'get_tasks', 'edit_task', 'get_activities'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useCreateCommentMutation,
  useGetCommentsQuery,
  useUpdateCommentMutation,
  useDeleteCommentMutation,
} = commentApi;
