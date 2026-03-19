import { CloseIcon } from '@mantine/core';
import type { TAttachment } from '../../store/types/common.types';
import IconButton from '../base/button/IconButton';
import FormLabel from '../base/FormLabel';
import PlusCircle from '../icons/PlusCircle';
import Spinner from './loaders/Spinner';
import { Image } from '../base';
import { IconFile } from '@tabler/icons-react';

export type TAttachmentFieldProps = {
  attachment: TAttachment[] | undefined;
  disabled: boolean;
  isDeletingFile: boolean;
  handleAttachmentChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (att: TAttachment) => void;
};

export default function AttachmentField({
  attachment,
  disabled,
  isDeletingFile,
  handleAttachmentChange,
  removeAttachment,
}: TAttachmentFieldProps) {
  return (
    <div className='flex flex-col gap-2'>
      <div className='flex flex-col'>
        <FormLabel className='w-[40%]'>Attachment</FormLabel>
        <label
          htmlFor='attachment'
          className='shadow-sm hover:scale-[1.01] cursor-pointer px-5 mt-1 py-3 border w-fit border-gray-300 rounded '
        >
          <PlusCircle />
        </label>
        <input
          type='file'
          id='attachment'
          multiple
          onChange={handleAttachmentChange}
          className='hidden '
        />
      </div>

      {/* Attachment Preview */}
      {attachment && attachment?.length > 0 && (
        <section className='grid grid-cols-2 gap-x-5 gap-y-5 mt-5'>
          {attachment?.map((attachment) => (
            <div key={attachment?.key} className='flex gap-3 items-center'>
              {isDeletingFile ? (
                <Spinner />
              ) : (
                <IconButton disabled={disabled} onClick={() => removeAttachment(attachment)}>
                  <CloseIcon size='16' />
                </IconButton>
              )}
              <div>
                {attachment?.type === 'image' ? (
                  <Image
                    className='h-16 w-auto object-contain'
                    src={attachment?.url}
                    alt={attachment?.name}
                    height={100}
                    width={100}
                  />
                ) : (
                  <IconFile className='size-14 text-text-subHeading' />
                )}
                <p className='text-sm line-clamp-1  text-gray-600'>{attachment?.name}</p>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
