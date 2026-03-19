import { useState, useEffect } from 'react';
import DialogModal from '../base/ModalWrapper';
import FormInput from '../base/FormInput';
import FormLabel from '../base/FormLabel';
import { Button } from '../base';
import IconButton from '../base/button/IconButton';
import { IconDownload, IconTrash } from '@tabler/icons-react';
import { Image } from '../base';
import { formatBytes } from '../../constants/fileUpload';
import {
  useRenameFileMutation,
  useDeleteFileOrFolderMutation,
} from '../../store/services/fileManager/fileManager';
import { toast } from 'react-toastify';
import { downloadFile } from '../../utils/helper';
import type { TFileManagerFile } from '../../store/types/fileManager.types';
import PdfViewer from '../common/PdfViewer';
import DocxViewer from '../common/DocxViewer';

type TPreviewEditModalProps = {
  opened: boolean;
  onClose: () => void;
  file: TFileManagerFile | null;
  onSuccess?: () => void;
};

export default function PreviewEditModal({
  opened,
  onClose,
  file,
  onSuccess,
}: TPreviewEditModalProps) {
  const [fileName, setFileName] = useState('');
  const [renameFile, { isLoading: isRenaming }] = useRenameFileMutation();
  const [deleteFileOrFolder, { isLoading: isDeleting }] = useDeleteFileOrFolderMutation();
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (file) {
      setFileName(file.name || '');
    }
  }, [file]);

  const handleSave = async () => {
    if (!file || !fileName.trim()) {
      return;
    }

    try {
      await renameFile({
        fileId: file.id,
        body: {
          name: fileName.trim(),
        },
      }).unwrap();

      toast.success('File renamed successfully');
      onClose();

      // Trigger refetch
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.data?.error || 'Failed to rename file';
      toast.error(errorMessage);
      console.error('Error renaming file:', error);
    }
  };

  const handleDelete = async () => {
    if (!file) {
      return;
    }

    try {
      await deleteFileOrFolder({
        fileId: file.id,
      }).unwrap();

      toast.success('File deleted successfully');
      onClose();

      // Trigger refetch
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.data?.error || 'Failed to delete file';
      toast.error(errorMessage);
      console.error('Error deleting file:', error);
    }
  };

  const handleDownload = async () => {
    if (!file) {
      return;
    }

    setIsDownloading(true);
    try {
      await downloadFile(file.url, file.name);
      toast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      toast.error('Failed to download file. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!file) return null;

  const isImage = file.type === 'image' || file.mimeType?.startsWith('image/');
  const isVideo = file.type === 'video' || file.mimeType?.startsWith('video/');
  const isPdf = file.type === 'pdf' || file.mimeType === 'application/pdf';
  const isDocx =
    file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    file.name.toLowerCase().endsWith('.docx');
  const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
  const fileSize = file.size ? formatBytes(file.size) : '';

  return (
    <DialogModal opened={opened} onClose={onClose} title='Preview and Edit' size='lg'>
      <div className='space-y-6'>
        {/* Image Preview */}
        {isImage && (
          <div className='w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center'>
            <Image
              src={file.url}
              alt={file.name}
              className='w-full h-auto max-h-[400px] object-contain'
            />
          </div>
        )}

        {/* Video Preview */}
        {isVideo && (
          <div className='w-full rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center'>
            <video
              src={file.url}
              controls
              className='w-full h-auto max-h-[400px] object-contain'
              preload='metadata'
            >
              Your browser does not support the video tag.
            </video>
          </div>
        )}

        {/* PDF Preview */}
        {isPdf && <PdfViewer url={file.url} />}

        {/* DOCX Preview */}
        {isDocx && <DocxViewer url={file.url} />}

        {/* Non-previewable file placeholder */}
        {!isImage && !isVideo && !isPdf && !isDocx && (
          <div className='w-full h-32 rounded-lg border border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-2'>
            <div className='text-4xl font-bold text-gray-400'>{fileExtension}</div>
            <span className='text-sm text-gray-500'>Preview not available - Download to view</span>
          </div>
        )}

        {/* File Info and Actions */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2 text-sm text-gray-600'>
            {fileExtension && <span className='font-medium'>{fileExtension}</span>}
            {fileSize && (
              <>
                {fileExtension && <span>•</span>}
                <span>{fileSize}</span>
              </>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <IconButton
              onClick={handleDownload}
              disabled={isDownloading}
              className='hover:bg-gray-100 p-2 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
            >
              <IconDownload className='size-5 text-gray-600' />
            </IconButton>
            <IconButton
              onClick={handleDelete}
              className='hover:bg-gray-100 p-2 rounded-md transition-colors'
            >
              <IconTrash className='size-5 text-red-500' />
            </IconButton>
          </div>
        </div>

        {/* File Name Input */}
        <div className='space-y-2'>
          <FormLabel htmlFor='file-name'>File Name</FormLabel>
          <FormInput
            id='file-name'
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder='Enter file name'
          />
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
          <Button variant='outline' onClick={onClose} disabled={isRenaming || isDeleting}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!fileName.trim() || isRenaming || isDeleting}>
            {isRenaming ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>
    </DialogModal>
  );
}
