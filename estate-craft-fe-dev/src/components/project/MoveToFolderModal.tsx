import { useState, useEffect } from 'react';
import DialogModal from '../base/ModalWrapper';
import FormSelect from '../base/FormSelect';
import FormLabel from '../base/FormLabel';
import { Button } from '../base';
import FolderIcon from '../icons/FolderIcon';
import { IconHome, IconFolder } from '@tabler/icons-react';
import {
  useGetFoldersQuery,
  useMoveFileOrFolderMutation,
} from '../../store/services/fileManager/fileManager';
import { toast } from 'react-toastify';
import type { TFileManagerFile } from '../../store/types/fileManager.types';

// Special value to represent root folder
const ROOT_FOLDER_VALUE = '__ROOT__';

type TMoveToFolderModalProps = {
  opened: boolean;
  onClose: () => void;
  file: TFileManagerFile | null;
  projectId?: string;
  onSuccess?: () => void;
};

export default function MoveToFolderModal({
  opened,
  onClose,
  file,
  projectId,
  onSuccess,
}: TMoveToFolderModalProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [moveFileOrFolder, { isLoading }] = useMoveFileOrFolderMutation();

  // Fetch folders from API
  const { data: foldersData, isLoading: isLoadingFolders } = useGetFoldersQuery(
    { projectId: projectId || '' },
    { skip: !projectId || !opened },
  );

  // Transform folders data to options format with Root option first
  const folderOptions = [
    { label: 'All Files', value: ROOT_FOLDER_VALUE },
    ...(foldersData?.data?.folders.map((folder) => ({
      label: folder.name,
      value: folder.id,
    })) || []),
  ];

  // Custom render option with icons
  const renderOption = ({ option }: { option: { label: string; value: string } }) => (
    <div className='flex items-center gap-2'>
      {option.value === ROOT_FOLDER_VALUE ? (
        <IconHome className='size-4 text-gray-600' />
      ) : (
        <IconFolder className='size-4 text-gray-600' />
      )}
      <span>{option.label}</span>
    </div>
  );

  // Reset selected folder when modal closes
  useEffect(() => {
    if (!opened) {
      setSelectedFolderId(null);
    }
  }, [opened]);

  const handleMove = async () => {
    if (!file) {
      toast.error('File information is missing. Cannot move file.');
      return;
    }
    if (!selectedFolderId) {
      toast.error('Please select a destination folder.');
      return;
    }

    // Determine the actual targetFolderId - null for root, otherwise the selected folder
    const targetFolderId = selectedFolderId === ROOT_FOLDER_VALUE ? null : selectedFolderId;

    try {
      await moveFileOrFolder({
        fileId: file.id,
        targetFolderId: targetFolderId,
      }).unwrap();

      toast.success('File moved successfully');
      onClose();

      // Trigger refetch
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.data?.error || 'Failed to move file';
      toast.error(errorMessage);
      console.error('Error moving file:', error);
    }
  };

  if (!file) return null;

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
              placeholder='Select a folder'
              value={selectedFolderId}
              onChange={(value) => setSelectedFolderId(value)}
              options={folderOptions}
              renderOption={renderOption}
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
