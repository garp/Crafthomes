import { useState, useEffect } from 'react';
import DialogModal from '../base/ModalWrapper';
import FormSelect from '../base/FormSelect';
import FormLabel from '../base/FormLabel';
import { Button } from '../base';
import FolderIcon from '../icons/FolderIcon';
import {
  useGetFoldersQuery,
  useMoveFileOrFolderMutation,
} from '../../store/services/fileManager/fileManager';
import { toast } from 'react-toastify';
import type { TFileManagerFolder, TFolderDetail } from '../../store/types/fileManager.types';

type TMoveFolderModalProps = {
  opened: boolean;
  onClose: () => void;
  folder: TFileManagerFolder | TFolderDetail | null;
  projectId?: string;
  onSuccess?: () => void;
};

export default function MoveFolderModal({
  opened,
  onClose,
  folder,
  projectId,
  onSuccess,
}: TMoveFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [moveFileOrFolder, { isLoading }] = useMoveFileOrFolderMutation();

  // Fetch folders from API
  const { data: foldersData, isLoading: isLoadingFolders } = useGetFoldersQuery(
    { projectId: projectId || '' },
    { skip: !projectId || !opened },
  );

  // Transform folders data to options format, excluding the current folder
  const folderOptions =
    foldersData?.data?.folders
      .filter((f) => f.id !== folder?.id) // Exclude current folder from options
      .map((f) => ({
        label: f.name,
        value: f.id,
      })) || [];

  // Reset selected folder when modal closes
  useEffect(() => {
    if (!opened) {
      setSelectedFolderId(null);
    }
  }, [opened]);

  const handleMove = async () => {
    if (!folder) {
      toast.error('Folder information is missing. Cannot move folder.');
      return;
    }
    if (!selectedFolderId) {
      toast.error('Please select a destination folder.');
      return;
    }

    try {
      await moveFileOrFolder({
        folderId: folder.id,
        targetFolderId: selectedFolderId,
      }).unwrap();

      toast.success('Folder moved successfully');
      onClose();

      // Trigger refetch
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.data?.error || 'Failed to move folder';
      toast.error(errorMessage);
      console.error('Error moving folder:', error);
    }
  };

  if (!folder) return null;

  return (
    <DialogModal opened={opened} onClose={onClose} title='Move To a Folder' size='md'>
      <div className='space-y-6'>
        <div className='flex gap-4 items-start'>
          {/* Folder Icon */}
          <div className='flex-shrink-0 w-20 h-20 rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center'>
            <FolderIcon className='w-16 h-16' />
          </div>

          {/* Select Folder Dropdown */}
          <div className='flex-1 space-y-2'>
            <FormLabel htmlFor='select-folder'>Select A Folder</FormLabel>
            <FormSelect
              id='select-folder'
              placeholder='Choose a folder'
              value={selectedFolderId}
              onChange={(value) => setSelectedFolderId(value)}
              options={folderOptions}
              disabled={isLoadingFolders}
              noOptionsPlaceholder={
                isLoadingFolders ? 'Loading folders...' : 'No folders available'
              }
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
          <Button variant='outline' onClick={onClose} disabled={isLoading || isLoadingFolders}>
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={!selectedFolderId || isLoading || isLoadingFolders}
          >
            {isLoading ? 'Moving...' : 'Move'}
          </Button>
        </div>
      </div>
    </DialogModal>
  );
}
