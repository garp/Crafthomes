import type {
  TFileManagerUploadBody,
  TFileManagerUploadResponse,
  TFileManagerQueryArgs,
  TFileManagerGetResponse,
  TCreateFolderBody,
  TCreateFolderResponse,
  TGetFoldersResponse,
  TRenameFolderBody,
  TRenameFolderResponse,
  TRenameFileBody,
  TRenameFileResponse,
  TDeleteFileOrFolderArgs,
  TDeleteFileOrFolderResponse,
  TMoveFileOrFolderBody,
  TMoveFileOrFolderResponse,
  TGetFolderContentsArgs,
  TGetFolderContentsResponse,
} from '../../types/fileManager.types';
import { api } from '../api';

/**
 * File Manager API Service
 * Handles file uploads and fetching files/folders from the file-manager endpoint
 */
export const fileManagerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    // GET files and folders
    getFileManager: builder.query<TFileManagerGetResponse, TFileManagerQueryArgs>({
      query: (args) => ({
        url: '/file-manager',
        method: 'GET',
        params: {
          projectId: args.projectId,
          ...(args.sortBy && { sortBy: args.sortBy }),
          ...(args.search && { search: args.search }),
        },
      }),
      transformResponse: (response: TFileManagerGetResponse) => response,
      providesTags: ['get_file_manager'],
    }),

    // POST upload files
    uploadFiles: builder.mutation<TFileManagerUploadResponse, TFileManagerUploadBody>({
      query: (body) => {
        const formData = new FormData();

        // Add projectId (required)
        formData.append('projectId', body.projectId);

        // Add folderId (optional)
        if (body.folderId) {
          formData.append('folderId', body.folderId);
        }

        // Add files
        body.files.forEach((file) => {
          formData.append('files', file);
        });

        return {
          url: '/file-manager/file',
          method: 'POST',
          body: formData,
        };
      },
      invalidatesTags: ['get_file_manager', 'get_folder_contents'],
    }),

    // POST create folder
    createFolder: builder.mutation<TCreateFolderResponse, TCreateFolderBody>({
      query: (body) => ({
        url: '/file-manager/folder',
        method: 'POST',
        body: {
          name: body.name,
          projectId: body.projectId,
          ...(body.parentFolderId && { parentFolderId: body.parentFolderId }),
        },
      }),
      invalidatesTags: ['get_file_manager', 'get_folders', 'get_folder_contents'],
    }),

    // GET folders
    getFolders: builder.query<TGetFoldersResponse, TFileManagerQueryArgs>({
      query: (args) => ({
        url: '/file-manager/folders',
        method: 'GET',
        params: {
          projectId: args.projectId,
        },
      }),
      transformResponse: (response: TGetFoldersResponse) => response,
      providesTags: ['get_folders'],
    }),

    // GET folder contents
    getFolderContents: builder.query<TGetFolderContentsResponse, TGetFolderContentsArgs>({
      query: (args) => ({
        url: `/file-manager/folder/${args.folderId}`,
        method: 'GET',
        params: {
          ...(args.sortBy && { sortBy: args.sortBy }),
          ...(args.search && { search: args.search }),
        },
      }),
      transformResponse: (response: TGetFolderContentsResponse) => response,
      providesTags: ['get_folder_contents'],
    }),

    // PUT rename folder
    renameFolder: builder.mutation<
      TRenameFolderResponse,
      { folderId: string; body: TRenameFolderBody }
    >({
      query: ({ folderId, body }) => ({
        url: `/file-manager/folder/${folderId}`,
        method: 'PUT',
        body: {
          name: body.name,
          description: body.description || null,
        },
      }),
      invalidatesTags: ['get_file_manager', 'get_folders', 'get_folder_contents'],
    }),

    // PUT rename file
    renameFile: builder.mutation<TRenameFileResponse, { fileId: string; body: TRenameFileBody }>({
      query: ({ fileId, body }) => ({
        url: `/file-manager/file/${fileId}`,
        method: 'PUT',
        body: {
          name: body.name,
          description: body.description || null,
        },
      }),
      invalidatesTags: ['get_file_manager', 'get_folder_contents'],
    }),

    // DELETE file or folder
    deleteFileOrFolder: builder.mutation<TDeleteFileOrFolderResponse, TDeleteFileOrFolderArgs>({
      query: (args) => {
        const params: Record<string, string> = {};
        if (args.fileId) {
          params.fileId = args.fileId;
        }
        if (args.folderId) {
          params.folderId = args.folderId;
        }
        return {
          url: '/file-manager',
          method: 'DELETE',
          params,
        };
      },
      invalidatesTags: ['get_file_manager', 'get_folders', 'get_folder_contents'],
    }),

    // PUT move file or folder
    moveFileOrFolder: builder.mutation<TMoveFileOrFolderResponse, TMoveFileOrFolderBody>({
      query: (body) => ({
        url: '/file-manager/move',
        method: 'PUT',
        body: {
          fileId: body.fileId || undefined,
          folderId: body.folderId || undefined,
          targetFolderId: body.targetFolderId,
        },
      }),
      invalidatesTags: ['get_file_manager', 'get_folders', 'get_folder_contents'],
    }),

    // POST download folder as zip
    downloadFolder: builder.mutation<Blob, { projectId: string; folderIds: string[] }>({
      query: (body) => ({
        url: '/file-manager/download',
        method: 'POST',
        body: {
          projectId: body.projectId,
          folderIds: body.folderIds,
        },
        responseHandler: async (response) => {
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Download failed');
          }
          return response.blob();
        },
        cache: 'no-cache',
      }),
    }),
  }),
});

export const {
  useGetFileManagerQuery,
  useUploadFilesMutation,
  useCreateFolderMutation,
  useGetFoldersQuery,
  useGetFolderContentsQuery,
  useRenameFolderMutation,
  useRenameFileMutation,
  useDeleteFileOrFolderMutation,
  useMoveFileOrFolderMutation,
  useDownloadFolderMutation,
} = fileManagerApi;
