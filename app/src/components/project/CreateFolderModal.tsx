import { useState, useEffect } from 'react';
import DialogModal from '../base/ModalWrapper';
import FormInput from '../base/FormInput';
import FormLabel from '../base/FormLabel';
import { Button } from '../base';
import FolderIcon from '../icons/FolderIcon';
import { useCreateFolderMutation } from '../../store/services/fileManager/fileManager';
import { toast } from 'react-toastify';

type TCreateFolderModalProps = {
  opened: boolean;
  onClose: () => void;
  projectId?: string;
  parentFolderId?: string;
  onSuccess?: () => void;
};

export default function CreateFolderModal({
  opened,
  onClose,
  projectId,
  parentFolderId,
  onSuccess,
}: TCreateFolderModalProps) {
  const [folderName, setFolderName] = useState('');
  const [createFolder, { isLoading }] = useCreateFolderMutation();

  // Reset folder name when modal closes
  useEffect(() => {
    if (!opened) {
      setFolderName('');
    }
  }, [opened]);

  const handleCreate = async () => {
    // Prevent multiple calls if already loading
    if (isLoading) {
      return;
    }

    if (!projectId) {
      toast.error('Project ID is missing. Please refresh the page.');
      return;
    }

    if (!folderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      await createFolder({
        name: folderName.trim(),
        projectId,
        ...(parentFolderId && { parentFolderId }),
      }).unwrap();

      // Only show success toast if API call was successful
      toast.success('Folder created successfully');
      setFolderName('');
      onClose();

      // Trigger refetch
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      // Only show error toast in catch block
      const errorMessage = error?.data?.message || error?.data?.error || 'Failed to create folder';
      toast.error(errorMessage);
      console.error('Error creating folder:', error);
    }
  };

  return (
    <DialogModal opened={opened} onClose={onClose} title='Create Folder' size='md'>
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
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isLoading && folderName.trim() && projectId) {
                  e.preventDefault();
                  handleCreate();
                }
              }}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!folderName.trim() || isLoading || !projectId}
            type='button'
          >
            {isLoading ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </div>
    </DialogModal>
  );
}
