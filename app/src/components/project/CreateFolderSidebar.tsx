import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import SidebarModal from '../base/SidebarModal';
import FormInput from '../base/FormInput';
import FormLabel from '../base/FormLabel';
import { Button } from '../base';
import { useCreateFolderMutation } from '../../store/services/fileManager/fileManager';
import { toast } from 'react-toastify';
import { cn } from '../../utils/helper';

type TCreateFolderSidebarProps = {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export default function CreateFolderSidebar({
  opened,
  onClose,
  onSuccess,
}: TCreateFolderSidebarProps) {
  const { id: projectId } = useParams<{ id: string }>();
  const [folderName, setFolderName] = useState('');
  const [createFolder, { isLoading: isCreating }] = useCreateFolderMutation();

  // Reset form when sidebar closes
  useEffect(() => {
    if (!opened) {
      setFolderName('');
    }
  }, [opened]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate projectId
    if (!projectId) {
      toast.error('Project ID is missing. Please refresh the page.');
      return;
    }

    // Validate folder name
    if (!folderName.trim()) {
      toast.error('Please enter a folder name');
      return;
    }

    try {
      await createFolder({
        name: folderName.trim(),
        projectId,
      }).unwrap();

      toast.success('Folder created successfully');
      setFolderName('');
      onClose();

      // Refetch folders list
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.data?.error || 'Failed to create folder';
      toast.error(errorMessage);
      console.error('Error creating folder:', error);
    }
  };

  return (
    <SidebarModal opened={opened} onClose={onClose} heading='Create Folder' size='600px'>
      <form onSubmit={handleSubmit} className='flex flex-col h-full'>
        <div className='flex-1 overflow-auto px-6 py-6 space-y-6'>
          {/* Folder Name Input */}
          <div className='space-y-2'>
            <FormLabel htmlFor='folder-name'>Folder name</FormLabel>
            <FormInput
              id='folder-name'
              placeholder='Enter folder name'
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              disabled={isCreating}
              autoFocus
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className='sticky bottom-0 border-t border-gray-200 bg-white px-6 py-4 flex justify-end'>
          <Button
            type='submit'
            disabled={!projectId || !folderName.trim() || isCreating}
            className={cn(
              !projectId || !folderName.trim() || isCreating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : '',
            )}
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </div>
      </form>
    </SidebarModal>
  );
}
