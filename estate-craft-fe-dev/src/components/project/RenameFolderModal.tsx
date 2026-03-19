import { useState, useEffect } from 'react';
import DialogModal from '../base/ModalWrapper';
import FormInput from '../base/FormInput';
import FormLabel from '../base/FormLabel';
import { Button } from '../base';
import FolderIcon from '../icons/FolderIcon';
import { useRenameFolderMutation } from '../../store/services/fileManager/fileManager';
import { toast } from 'react-toastify';
import type { TFileManagerFolder, TFolderDetail } from '../../store/types/fileManager.types';

type TRenameFolderModalProps = {
  opened: boolean;
  onClose: () => void;
  folder: TFileManagerFolder | TFolderDetail | null;
  onSuccess?: () => void;
};

export default function RenameFolderModal({
  opened,
  onClose,
  folder,
  onSuccess,
}: TRenameFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [renameFolder, { isLoading }] = useRenameFolderMutation();

  useEffect(() => {
    if (folder) {
      setFolderName(folder.name || '');
    }
  }, [folder]);

  const handleRename = async () => {
    if (!folder || !folderName.trim()) {
      return;
    }

    try {
      await renameFolder({
        folderId: folder.id,
        body: {
          name: folderName.trim(),
        },
      }).unwrap();

      toast.success('Folder renamed successfully');
      onClose();

      // Trigger refetch
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.data?.error || 'Failed to rename folder';
      toast.error(errorMessage);
      console.error('Error renaming folder:', error);
    }
  };

  if (!folder) return null;

  return (
    <DialogModal opened={opened} onClose={onClose} title='Rename Folder' size='md'>
      <div className='space-y-6'>
        <div className='flex gap-4'>
          {/* Folder Icon */}
          <div className='flex-shrink-0 w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center'>
            <FolderIcon className='w-16 h-16' />
          </div>

          {/* Folder Name Input */}
          <div className='flex-1 space-y-2'>
            <FormLabel htmlFor='folder-name'>Folder Name</FormLabel>
            <FormInput
              id='folder-name'
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder='Enter folder name'
              autoFocus
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={!folderName.trim() || isLoading}>
            {isLoading ? 'Renaming...' : 'Rename'}
          </Button>
        </div>
      </div>
    </DialogModal>
  );
}
