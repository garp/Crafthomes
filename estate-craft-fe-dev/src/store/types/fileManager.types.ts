/**
 * Request body for file manager upload
 */
export type TFileManagerUploadBody = {
  projectId: string;
  folderId?: string;
  files: File[];
};

/**
 * Response from file manager upload API
 */
export type TFileManagerUploadResponse = {
  data: {
    uploaded: Array<{
      id: string;
      name: string;
      url: string;
      key: string;
      type: string;
      mimeType?: string | null;
      size?: number | null;
      description?: string | null;
      status?: string;
      taskId?: string | null;
      subTaskId?: string | null;
      projectId: string;
      commentId?: string | null;
      folderId?: string | null;
      snagId?: string | null;
      createdAt: string;
      updatedAt: string;
      createdBy?: {
        id: string;
        name: string;
      } | null;
      updatedBy?: {
        id: string;
        name: string;
      } | null;
    }>;
    message?: string;
  };
};

/**
 * File Manager Folder
 */
export type TFileManagerFolder = {
  [x: string]: any;
  id: string;
  name: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
};

/**
 * File Manager File
 */
export type TFileManagerFile = {
  id: string;
  name: string;
  description?: string | null;
  url: string;
  key: string;
  mimeType?: string | null;
  size?: number | null;
  type: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  task?: {
    id: string;
    name: string;
    phaseId: string;
    phase?: {
      id: string;
      name: string;
    };
  } | null;
  CreatedBy?: {
    id: string;
    name: string;
  } | null;
  UpdatedBy?: {
    id: string;
    name: string;
  } | null;
};

/**
 * Query parameters for getting file manager data
 */
export type TFileManagerQueryArgs = {
  projectId: string;
  sortBy?: string;
  search?: string;
};

/**
 * Response from file manager GET API
 */
export type TFileManagerGetResponse = {
  data: {
    folders: TFileManagerFolder[];
    files: TFileManagerFile[];
    totalFolders: number;
    totalFiles: number;
  };
};

/**
 * Request body for creating a folder
 */
export type TCreateFolderBody = {
  name: string;
  projectId: string;
  parentFolderId?: string;
};

/**
 * Response from create folder API
 */
export type TCreateFolderResponse = {
  data: TFileManagerFolder;
};

/**
 * Detailed folder type from folders API
 */
export type TFolderDetail = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  status: string;
  parentFolderId?: string | null;
  projectId: string;
  _count: {
    attachments: number;
    subfolders: number;
  };
  parentFolder?: {
    id: string;
    name: string;
  } | null;
  CreatedBy?: {
    id: string;
    name: string;
  } | null;
  UpdatedBy?: {
    id: string;
    name: string;
  } | null;
};

/**
 * Response from get folders API
 */
export type TGetFoldersResponse = {
  data: {
    folders: TFolderDetail[];
    totalCount: number;
  };
};

/**
 * Request body for renaming a folder
 */
export type TRenameFolderBody = {
  name: string;
  description?: string | null;
};

/**
 * Response from rename folder API
 */
export type TRenameFolderResponse = {
  data: TFileManagerFolder;
};

/**
 * Request body for renaming a file
 */
export type TRenameFileBody = {
  name: string;
  description?: string | null;
};

/**
 * Response from rename file API
 */
export type TRenameFileResponse = {
  data: TFileManagerFile;
};

/**
 * Request parameters for deleting a file or folder
 */
export type TDeleteFileOrFolderArgs = {
  fileId?: string;
  folderId?: string;
};

/**
 * Response from delete file/folder API
 */
export type TDeleteFileOrFolderResponse = {
  message?: string;
  data?: any;
};

/**
 * Request body for moving a file or folder
 */
export type TMoveFileOrFolderBody = {
  fileId?: string;
  folderId?: string;
  targetFolderId: string | null;
};

/**
 * Response from move file/folder API
 */
export type TMoveFileOrFolderResponse = {
  message?: string;
  data?: any;
};

/**
 * Query parameters for getting folder contents
 */
export type TGetFolderContentsArgs = {
  folderId: string;
  sortBy?: string;
  search?: string;
};

/**
 * Response from get folder contents API
 */
export type TGetFolderContentsResponse = {
  data: {
    folder: TFileManagerFolder;
    folders: TFileManagerFolder[];
    files: TFileManagerFile[];
    totalFolders: number;
    totalFiles: number;
  };
};
