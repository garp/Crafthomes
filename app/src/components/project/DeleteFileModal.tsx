import DialogModal from '../base/ModalWrapper';
import { Button } from '../base';
import { Image } from '../base';
import { IconFile, IconAlertTriangle } from '@tabler/icons-react';
import { useDeleteFileOrFolderMutation } from '../../store/services/fileManager/fileManager';
import { toast } from 'react-toastify';
import type { TFileManagerFile } from '../../store/types/fileManager.types';

type TDeleteFileModalProps = {
  opened: boolean;
  onClose: () => void;
  file: TFileManagerFile | null;
  onSuccess?: () => void;
};

export default function DeleteFileModal({
  opened,
  onClose,
  file,
  onSuccess,
}: TDeleteFileModalProps) {
  const [deleteFileOrFolder, { isLoading }] = useDeleteFileOrFolderMutation();

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

  if (!file) return null;

  const isImage = file.type === 'image' || file.mimeType?.startsWith('image/');

  return (
    <DialogModal opened={opened} onClose={onClose} title='Delete File' size='md'>
      <div className='space-y-6'>
        <div className='flex gap-4 items-start'>
          {/* Image or Icon Fallback */}
          <div className='flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center'>
            {isImage && file.url ? (
              <Image
                src={file.url}
                alt={file.name}
                className='w-full h-full object-cover'
                height={80}
                width={80}
              />
            ) : (
              <div className='w-full h-full flex items-center justify-center bg-gray-100'>
                <IconFile className='size-10 text-gray-400' />
              </div>
            )}
          </div>

          {/* Warning Icon and Message */}
          <div className='flex-1 space-y-3'>
            <div className='flex items-start gap-3'>
              <div className='flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center'>
                <IconAlertTriangle className='size-6 text-red-600' />
              </div>
              <div className='flex-1'>
                <p className='text-sm text-gray-700'>
                  Do you want to delete{' '}
                  <span className='font-semibold text-gray-900'>{file.name}</span> permanently?
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleDelete}
            disabled={isLoading}
            className='bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600'
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </div>
      </div>
    </DialogModal>
  );
}
