import { useState, useEffect } from 'react';
import DialogModal from '../base/ModalWrapper';
import FormInput from '../base/FormInput';
import FormLabel from '../base/FormLabel';
import { Button } from '../base';
import { Image } from '../base';
import { useRenameFileMutation } from '../../store/services/fileManager/fileManager';
import { toast } from 'react-toastify';
import type { TFileManagerFile } from '../../store/types/fileManager.types';

type TRenameFileModalProps = {
  opened: boolean;
  onClose: () => void;
  file: TFileManagerFile | null;
  onSuccess?: () => void;
};

export default function RenameFileModal({
  opened,
  onClose,
  file,
  onSuccess,
}: TRenameFileModalProps) {
  const [fileName, setFileName] = useState('');
  const [renameFile, { isLoading }] = useRenameFileMutation();

  useEffect(() => {
    if (file) {
      setFileName(file.name || '');
    }
  }, [file]);

  const handleRename = async () => {
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

  if (!file) return null;

  const isImage = file.type === 'image' || file.mimeType?.startsWith('image/');

  return (
    <DialogModal opened={opened} onClose={onClose} title='Rename File' size='md'>
      <div className='space-y-6'>
        <div className='flex gap-4'>
          {/* Thumbnail Image */}
          {isImage && (
            <div className='flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center'>
              <Image
                src={file.url}
                alt={file.name}
                className='w-full h-full object-cover'
                height={80}
                width={80}
              />
            </div>
          )}

          {/* File Name Input */}
          <div className='flex-1 space-y-2'>
            <FormLabel htmlFor='file-name'>File Name</FormLabel>
            <FormInput
              id='file-name'
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder='Enter file name'
              autoFocus
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex justify-end gap-3 pt-4 border-t border-gray-200'>
          <Button variant='outline' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleRename} disabled={!fileName.trim() || isLoading}>
            {isLoading ? 'Renaming...' : 'Rename'}
          </Button>
        </div>
      </div>
    </DialogModal>
  );
}
