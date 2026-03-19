import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SidebarModal from '../base/SidebarModal';
import FormSelect from '../base/FormSelect';
import FormLabel from '../base/FormLabel';
import { Button } from '../base';
import IconButton from '../base/button/IconButton';
import { IconX, IconArrowUp, IconFile, IconCheck, IconLoader2 } from '@tabler/icons-react';
import { toast } from 'react-toastify';
import { cn } from '../../utils/helper';
import { useFileUpload } from '../../hooks/useFileUpload';
import { validateFiles, formatBytes, MAX_FILES_PER_UPLOAD } from '../../constants/fileUpload';
import { useGetFoldersQuery } from '../../store/services/fileManager/fileManager';

type TUploadFileSidebarProps = {
  opened: boolean;
  onClose: () => void;
  onUploadSuccess?: () => void;
  currentFolderId?: string | null;
};

type TFileWithProgress = {
  file: File;
  fileId: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  uploadedAttachment?: {
    name: string;
    url: string;
    type: string;
    key: string;
  };
};

/**
 * Generate unique ID for a file
 */
function generateFileId(file: File, index: number): string {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

export default function UploadFileSidebar({
  opened,
  onClose,
  onUploadSuccess,
  currentFolderId,
}: TUploadFileSidebarProps) {
  const { id: projectId } = useParams<{ id: string }>();
  const [selectedFolder, setSelectedFolder] = useState<string | null>(currentFolderId || null);
  const [files, setFiles] = useState<TFileWithProgress[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Update selectedFolder when currentFolderId changes
  useEffect(() => {
    if (opened && currentFolderId) {
      setSelectedFolder(currentFolderId);
    }
  }, [opened, currentFolderId]);

  // Fetch folders from API
  const { data: foldersData } = useGetFoldersQuery(
    { projectId: projectId || '' },
    { skip: !projectId || !opened },
  );

  // Transform folders data to options format
  const folderOptions =
    foldersData?.data?.folders.map((folder) => ({
      label: folder.name,
      value: folder.id,
    })) || [];

  // Use the new file upload hook
  const {
    uploadFiles: uploadFilesHook,
    progress: uploadProgress,
    isUploading,
    reset: resetUpload,
    retryFailed,
  } = useFileUpload();
  const hasRefetchedRef = useRef(false);

  // Reset state when sidebar closes
  useEffect(() => {
    if (!opened) {
      setSelectedFolder(null);
      setFiles([]);
      setIsDragging(false);
      resetUpload();
      hasRefetchedRef.current = false;
    }
  }, [opened, resetUpload]);

  // Sync hook progress with local files state
  useEffect(() => {
    setFiles((prev) =>
      prev.map((fileItem) => {
        const fileProgress = uploadProgress[fileItem.fileId];
        if (fileProgress) {
          return {
            ...fileItem,
            progress: fileProgress.progress,
            status: fileProgress.status,
            error: fileProgress.error,
            uploadedAttachment: fileProgress.uploadedFile,
          };
        }
        return fileItem;
      }),
    );
  }, [uploadProgress]);

  // Refetch files list when all uploads are completed
  useEffect(() => {
    if (!isUploading && files.length > 0 && !hasRefetchedRef.current) {
      const allCompleted = files.every((f) => f.status === 'completed' || f.status === 'error');
      const hasCompleted = files.some((f) => f.status === 'completed');

      // If all files are done (completed or error) and at least one completed, refetch
      if (allCompleted && hasCompleted && onUploadSuccess) {
        hasRefetchedRef.current = true;
        onUploadSuccess();
      }
    }
  }, [isUploading, files, onUploadSuccess]);

  const handleFileSelect = useCallback(
    async (selectedFiles: FileList | null) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      const filesArray = Array.from(selectedFiles);

      // Validate files using the centralized validation function
      const { valid, errors } = validateFiles(filesArray);

      // Show validation errors
      if (errors.length > 0) {
        errors.forEach((error) => {
          toast.error(error);
        });
      }

      // If no valid files, return
      if (valid.length === 0) {
        return;
      }

      // Validate projectId before proceeding
      if (!projectId) {
        toast.error('Project ID is missing. Please refresh the page.');
        return;
      }

      // Remove completed files from existing files, keep only failed/pending files
      const existingFiles = files.filter((f) => f.status !== 'completed');

      // Check if adding these files would exceed the limit
      const currentFileCount = existingFiles.length;
      if (currentFileCount + valid.length > MAX_FILES_PER_UPLOAD) {
        toast.error(`Maximum ${MAX_FILES_PER_UPLOAD} files allowed per upload`);
        return;
      }

      // Add valid files to state
      const newFiles: TFileWithProgress[] = valid.map((file, index) => {
        const fileId = generateFileId(file, currentFileCount + index);
        return {
          file,
          fileId,
          progress: 0,
          status: 'pending' as const,
        };
      });

      // Set files: keep only failed/pending files + add new files
      const updatedFiles = [...existingFiles, ...newFiles];
      setFiles(updatedFiles);

      // Auto-upload: Start upload immediately after files are added
      try {
        // Reset refetch flag for new upload batch
        hasRefetchedRef.current = false;

        // Extract fileIds from newFiles to ensure they match
        const fileIds = newFiles.map((f) => f.fileId);

        // Use the hook to upload files with matching fileIds
        // folderId is optional - only pass it if a folder is selected
        await uploadFilesHook(
          valid,
          projectId,
          selectedFolder || undefined, // folderId is the folder UUID from API
          fileIds, // Pass fileIds to ensure they match with component state
        );

        // Show success message
        toast.success(`${valid.length} file(s) upload started`);
      } catch (error) {
        // Error handling is done in the hook
        console.error('Auto-upload error:', error);
      }
    },
    [files, projectId, selectedFolder, uploadFilesHook],
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input so same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleUploadClick = async () => {
    // Validate projectId
    if (!projectId) {
      toast.error('Project ID is missing. Please refresh the page.');
      return;
    }

    // Get pending files
    const pendingFiles = files.filter((f) => f.status === 'pending' || f.status === 'error');
    if (pendingFiles.length === 0) {
      toast.error('No files to upload');
      return;
    }

    try {
      // Reset refetch flag for new upload batch
      hasRefetchedRef.current = false;

      // Extract fileIds to ensure they match
      const fileIds = pendingFiles.map((f) => f.fileId);

      // Use the hook to upload files with matching fileIds
      // folderId is optional - only pass it if a folder is selected
      await uploadFilesHook(
        pendingFiles.map((f) => f.file),
        projectId,
        selectedFolder || undefined, // folderId is the folder UUID from API
        fileIds, // Pass fileIds to ensure they match with component state
      );

      // Show success message
      const successCount = pendingFiles.length;
      toast.success(`${successCount} file(s) uploaded successfully`);
    } catch (error) {
      // Error handling is done in the hook, but show a general message if needed
      console.error('Upload error:', error);
    }
  };

  const handleRetryFailed = async () => {
    if (!projectId) {
      toast.error('Project ID is missing. Please refresh the page.');
      return;
    }

    try {
      await retryFailed();
      toast.success('Retrying failed uploads...');
    } catch (error) {
      console.error('Retry error:', error);
    }
  };

  const completedCount = files.filter((f) => f.status === 'completed').length;
  const totalFiles = files.length;
  const failedCount = files.filter((f) => f.status === 'error').length;
  const pendingCount = files.filter((f) => f.status === 'pending').length;
  const hasFailedFiles = failedCount > 0;
  const hasPendingFiles = pendingCount > 0;
  const hasFilesToUpload = hasPendingFiles || hasFailedFiles;

  return (
    <SidebarModal opened={opened} onClose={onClose} heading='Upload File' size='600px'>
      <div className='flex flex-col h-full'>
        <div className='flex-1 overflow-auto px-6 py-6 space-y-6'>
          {/* Folder Selection */}
          <div className='space-y-2'>
            <FormLabel>Select folder (optional)</FormLabel>
            <FormSelect
              placeholder='Choose a folder (optional)'
              value={selectedFolder}
              onChange={(value) => setSelectedFolder(value)}
              options={folderOptions}
            />
          </div>

          {/* Drag and Drop Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
              isDragging ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50',
            )}
            onClick={() => fileInputRef.current?.click()}
          >
            <IconArrowUp className='mx-auto mb-3 text-gray-400 size-8' />
            <p className='text-sm text-gray-600 mb-1'>
              Drag and drop files here or{' '}
              <span className='font-semibold text-gray-900'>Browse</span>
            </p>
            <p className='text-xs text-gray-500'>
              Accepted file types: Documents, Images, Videos, Compressed files, CAD files, and more
            </p>
            <input
              ref={fileInputRef}
              type='file'
              multiple
              accept='.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpeg,.jpg,.png,.webp,.gif,.svg,.mp4,.mov,.avi,.wmv,.zip,.rar,.7z,.dwg,.dxf,.rtf,.odt,.ods'
              onChange={handleFileInputChange}
              className='hidden'
            />
          </div>

          {/* Upload Progress Section */}
          {files.length > 0 && (
            <div className='space-y-4'>
              <h3 className='font-semibold text-sm text-gray-900'>
                {completedCount} of {totalFiles} files uploaded
              </h3>
              <div className='space-y-3'>
                {files.map((fileWithProgress, index) => (
                  <div
                    key={fileWithProgress.fileId || index}
                    className='flex items-center gap-3 p-3 bg-gray-50 rounded-lg'
                  >
                    {/* File Icon */}
                    <IconFile className='size-6 text-gray-400 flex-shrink-0' />

                    {/* File Info and Progress */}
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium text-gray-900 truncate'>
                        {fileWithProgress.file.name}
                      </p>
                      <p className='text-xs text-gray-500'>
                        {formatBytes(fileWithProgress.file.size)}
                      </p>

                      {/* Error Message */}
                      {fileWithProgress.status === 'error' && fileWithProgress.error && (
                        <p className='text-xs text-red-500 mt-1'>{fileWithProgress.error}</p>
                      )}

                      {/* Progress Bar Container with Percentage and Status */}
                      <div className='mt-2'>
                        {/* Percentage and Status Icon - above the progress bar, side by side */}
                        <div className='flex items-center justify-end gap-2 mb-1 pr-10'>
                          {/* Percentage Text */}
                          {fileWithProgress.progress > 0 && (
                            <span className='text-xs font-medium text-gray-700 whitespace-nowrap'>
                              {fileWithProgress.progress}%
                            </span>
                          )}

                          {/* Status Icon with Circle */}
                          {fileWithProgress.status === 'completed' ? (
                            <div className='flex items-center justify-center w-5 h-5 rounded-full bg-green-500'>
                              <IconCheck className='size-3 text-white' />
                            </div>
                          ) : fileWithProgress.status === 'uploading' ? (
                            <IconLoader2 className='size-5 text-green-500 animate-spin' />
                          ) : fileWithProgress.status === 'error' ? (
                            <IconX className='size-5 text-red-500' />
                          ) : (
                            <div className='size-5' />
                          )}
                        </div>

                        {/* Progress Bar and Cross Button - in line */}
                        <div className='flex items-center gap-2'>
                          {/* Progress Bar */}
                          <div className='flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden'>
                            <div
                              className={cn(
                                'h-full transition-all duration-300',
                                fileWithProgress.status === 'completed'
                                  ? 'bg-green-500'
                                  : fileWithProgress.status === 'error'
                                    ? 'bg-red-500'
                                    : 'bg-gray-800',
                              )}
                              style={{ width: `${fileWithProgress.progress}%` }}
                            />
                          </div>

                          {/* Remove Button - aligned with progress bar */}
                          <IconButton
                            onClick={() => removeFile(index)}
                            className='flex-shrink-0'
                            disabled={fileWithProgress.status === 'uploading'}
                          >
                            <IconX className='size-4 text-gray-400' />
                          </IconButton>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Upload Button - Only show if there are pending or failed files */}
        {hasFilesToUpload && (
          <div className='sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 flex justify-end gap-3'>
            {hasFailedFiles && (
              <Button
                onClick={handleRetryFailed}
                disabled={isUploading || !projectId}
                variant='outline'
                className={cn(
                  isUploading || !projectId ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : '',
                )}
              >
                Retry Failed
              </Button>
            )}
            <Button
              onClick={handleUploadClick}
              disabled={!projectId || !hasFilesToUpload || isUploading}
              className={cn(
                !projectId || !hasFilesToUpload || isUploading
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : '',
              )}
            >
              {isUploading ? 'Uploading...' : hasPendingFiles ? 'Upload' : 'Retry'}
            </Button>
          </div>
        )}
      </div>
    </SidebarModal>
  );
}
