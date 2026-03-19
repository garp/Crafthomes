import DialogModal from '../base/ModalWrapper';
import { Button } from '../base';
import FolderIcon from '../icons/FolderIcon';
import { IconAlertTriangle } from '@tabler/icons-react';
import { useDeleteFileOrFolderMutation } from '../../store/services/fileManager/fileManager';
import { toast } from 'react-toastify';
import type { TFileManagerFolder, TFolderDetail } from '../../store/types/fileManager.types';

type TDeleteFolderModalProps = {
  opened: boolean;
  onClose: () => void;
  folder: TFileManagerFolder | TFolderDetail | null;
  onSuccess?: () => void;
};

export default function DeleteFolderModal({
  opened,
  onClose,
  folder,
  onSuccess,
}: TDeleteFolderModalProps) {
  const [deleteFileOrFolder, { isLoading }] = useDeleteFileOrFolderMutation();

  const handleDelete = async () => {
    if (!folder) {
      return;
    }

    try {
      await deleteFileOrFolder({
        folderId: folder.id,
      }).unwrap();

      toast.success('Folder deleted successfully');
      onClose();

      // Trigger refetch
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.data?.error || 'Failed to delete folder';
      toast.error(errorMessage);
      console.error('Error deleting folder:', error);
    }
  };

  if (!folder) return null;

  return (
    <DialogModal opened={opened} onClose={onClose} title='Delete Folder' size='md'>
      <div className='space-y-6'>
        <div className='flex gap-4 items-start'>
          {/* Folder Icon */}
          <div className='flex-shrink-0 w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center'>
            <FolderIcon className='w-16 h-16' />
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
                  <span className='font-semibold text-gray-900'>{folder.name}</span> permanently?
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
