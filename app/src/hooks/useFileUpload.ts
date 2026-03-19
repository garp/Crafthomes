import { useState, useCallback, useRef } from 'react';
import type { TAttachment } from '../store/types/common.types';
import { getToken } from '../utils/auth';

const BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Progress and status for a single file upload
 */
type TFileUploadStatus = {
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedFile?: TAttachment;
};

/**
 * Progress tracking for all files
 * Key is file ID (unique identifier for each file)
 */
type TFileUploadProgress = {
  [fileId: string]: TFileUploadStatus;
};

/**
 * Return type for useFileUpload hook
 */
type TUseFileUploadReturn = {
  uploadFiles: (
    files: File[],
    projectId: string,
    folderId?: string,
    fileIds?: string[],
  ) => Promise<void>;
  progress: TFileUploadProgress;
  isUploading: boolean;
  reset: () => void;
  retryFailed: () => Promise<void>;
  cancel: () => void;
};

/**
 * Generate unique ID for a file
 */
function generateFileId(file: File, index: number): string {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

/**
 * Map API response file to TAttachment format
 */
function mapApiFileToAttachment(apiFile: any): TAttachment {
  return {
    name: apiFile.name,
    url: apiFile.url,
    type: apiFile.type || apiFile.mimeType || 'unknown',
    key: apiFile.key || apiFile.id,
  };
}

/**
 * Custom hook for file upload with real progress tracking
 * Uses XMLHttpRequest for accurate progress updates
 * Uploads all files in a single request
 */
export function useFileUpload(): TUseFileUploadReturn {
  const [progress, setProgress] = useState<TFileUploadProgress>({});
  const [isUploading, setIsUploading] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);
  const filesRef = useRef<{
    files: File[];
    projectId: string;
    folderId?: string;
    fileIds: string[];
  } | null>(null);

  /**
   * Update progress for a specific file
   */
  const updateFileProgress = useCallback((fileId: string, updates: Partial<TFileUploadStatus>) => {
    setProgress((prev) => ({
      ...prev,
      [fileId]: {
        ...prev[fileId],
        ...updates,
      },
    }));
  }, []);

  /**
   * Update progress for all files (for overall upload progress)
   */
  const updateAllFilesProgress = useCallback((percentComplete: number) => {
    setProgress((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((fileId) => {
        if (updated[fileId].status === 'uploading') {
          updated[fileId] = {
            ...updated[fileId],
            progress: percentComplete,
          };
        }
      });
      return updated;
    });
  }, []);

  /**
   * Upload multiple files in a single request
   */
  const uploadFiles = useCallback(
    async (files: File[], projectId: string, folderId?: string, providedFileIds?: string[]) => {
      if (files.length === 0) {
        return;
      }

      // Use provided fileIds if available (for retry), otherwise generate new ones
      const fileIds = providedFileIds || files.map((file, index) => generateFileId(file, index));

      // Store files for retry functionality
      filesRef.current = { files, projectId, folderId, fileIds };

      // Initialize progress for all files
      const initialProgress: TFileUploadProgress = {};
      fileIds.forEach((fileId) => {
        initialProgress[fileId] = {
          progress: 0,
          status: 'pending',
        };
      });
      setProgress(initialProgress);
      setIsUploading(true);

      // Set all files to uploading status
      fileIds.forEach((fileId) => {
        updateFileProgress(fileId, { status: 'uploading', progress: 0 });
      });

      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        // Track upload progress
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            updateAllFilesProgress(percentComplete);
          }
        });

        // Handle completion
        xhr.addEventListener('load', () => {
          xhrRef.current = null;

          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              // API returns { data: { uploaded: TAttachment[] } }
              const uploadedFiles = response?.data?.uploaded;

              if (uploadedFiles && Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
                // Map uploaded files to TAttachment format
                const attachments = uploadedFiles.map(mapApiFileToAttachment);

                // Match uploaded files to file IDs by index
                // The API should return files in the same order they were uploaded
                fileIds.forEach((fileId, index) => {
                  const uploadedFile = attachments[index];

                  if (uploadedFile) {
                    updateFileProgress(fileId, {
                      status: 'completed',
                      progress: 100,
                      uploadedFile,
                    });
                  } else {
                    // File not found at this index (file count mismatch)
                    updateFileProgress(fileId, {
                      status: 'error',
                      error: 'File not found in upload response',
                    });
                  }
                });

                setIsUploading(false);
                resolve();
              } else {
                // No files in response
                const errorMessage = 'No files returned in response';
                fileIds.forEach((fileId) => {
                  updateFileProgress(fileId, {
                    status: 'error',
                    error: errorMessage,
                  });
                });
                setIsUploading(false);
                reject(new Error(errorMessage));
              }
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : 'Failed to parse response';
              fileIds.forEach((fileId) => {
                updateFileProgress(fileId, {
                  status: 'error',
                  error: errorMessage,
                });
              });
              setIsUploading(false);
              reject(new Error(errorMessage));
            }
          } else {
            // HTTP error status
            let errorMessage = `Upload failed with status ${xhr.status}`;
            try {
              const errorResponse = JSON.parse(xhr.responseText);
              errorMessage =
                errorResponse?.data?.message ||
                errorResponse?.message ||
                errorResponse?.error ||
                errorMessage;
            } catch {
              // Use default error message
            }
            fileIds.forEach((fileId) => {
              updateFileProgress(fileId, {
                status: 'error',
                error: errorMessage,
              });
            });
            setIsUploading(false);
            reject(new Error(errorMessage));
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          xhrRef.current = null;
          const errorMessage = 'Network error occurred during upload';
          fileIds.forEach((fileId) => {
            updateFileProgress(fileId, {
              status: 'error',
              error: errorMessage,
            });
          });
          setIsUploading(false);
          reject(new Error(errorMessage));
        });

        // Handle abort
        xhr.addEventListener('abort', () => {
          xhrRef.current = null;
          const errorMessage = 'Upload cancelled';
          fileIds.forEach((fileId) => {
            updateFileProgress(fileId, {
              status: 'error',
              error: errorMessage,
            });
          });
          setIsUploading(false);
          reject(new Error(errorMessage));
        });

        // Handle timeout
        xhr.addEventListener('timeout', () => {
          xhrRef.current = null;
          const errorMessage = 'Upload timeout - request took too long';
          fileIds.forEach((fileId) => {
            updateFileProgress(fileId, {
              status: 'error',
              error: errorMessage,
            });
          });
          setIsUploading(false);
          reject(new Error(errorMessage));
        });

        // Set timeout (5 minutes for large files)
        xhr.timeout = 5 * 60 * 1000;

        // Prepare FormData with all files
        const formData = new FormData();
        formData.append('projectId', projectId);
        if (folderId) {
          formData.append('folderId', folderId);
        }
        // Append all files
        files.forEach((file) => {
          formData.append('files', file);
        });

        // Set up request
        xhr.open('POST', `${BASE_URL}/file-manager/file`);

        // Set authorization header
        const token = getToken();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        // Send request
        xhr.send(formData);
      });
    },
    [updateFileProgress, updateAllFilesProgress],
  );

  /**
   * Retry failed uploads
   */
  const retryFailed = useCallback(async () => {
    if (!filesRef.current) {
      return;
    }

    const failedFiles: File[] = [];
    const failedFileIds: string[] = [];

    // Find failed files and their original IDs
    filesRef.current.files.forEach((file, index) => {
      const fileId = filesRef.current!.fileIds[index];
      if (progress[fileId]?.status === 'error') {
        failedFiles.push(file);
        failedFileIds.push(fileId);
      }
    });

    if (failedFiles.length === 0) {
      return;
    }

    // Reset failed files to pending
    failedFileIds.forEach((fileId) => {
      updateFileProgress(fileId, {
        status: 'pending',
        progress: 0,
        error: undefined,
      });
    });

    // Store the mapping for retry
    const originalFilesRef = filesRef.current;
    filesRef.current = {
      files: failedFiles,
      projectId: originalFilesRef.projectId,
      folderId: originalFilesRef.folderId,
      fileIds: failedFileIds, // Use original fileIds
    };

    // Upload failed files with original fileIds
    await uploadFiles(
      failedFiles,
      originalFilesRef.projectId,
      originalFilesRef.folderId,
      failedFileIds, // Pass original fileIds
    );
  }, [progress, uploadFiles, updateFileProgress]);

  /**
   * Cancel ongoing upload
   */
  const cancel = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsUploading(false);
  }, []);

  /**
   * Reset all progress and state
   */
  const reset = useCallback(() => {
    // Cancel any ongoing upload
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setProgress({});
    setIsUploading(false);
    filesRef.current = null;
  }, []);

  return {
    uploadFiles,
    progress,
    isUploading,
    reset,
    retryFailed,
    cancel,
  };
}
