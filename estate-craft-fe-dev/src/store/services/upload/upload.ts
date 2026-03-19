import type { TUploadFilesBody, TUploadFilesResponse } from '../../types/upload.types';
import { api } from '../api';

export const uploadApi = api.injectEndpoints({
  endpoints: (builder) => ({
    uploadFiles: builder.mutation<TUploadFilesResponse, TUploadFilesBody>({
      query: (body) => ({
        url: `/upload`,
        body,
        method: 'POST',
      }),
    }),
    deleteFile: builder.mutation<void, { key: string }>({
      query: (body) => ({
        url: '/upload',
        body,
        method: 'DELETE',
      }),
    }),
  }),
});

export const { useUploadFilesMutation, useDeleteFileMutation } = uploadApi;
