import { useState } from 'react';
import { motion } from 'framer-motion';
import DrawerModal from '../base/DrawerModal';
import { IconX } from '@tabler/icons-react';
import type { TSendMessageFormData, TSendMessageSidebarProps } from '../../types/message.types';
import FormSelect from '../base/FormSelect';
import TextEditor from '../common/TextEditor';
// import { Button } from '../base';
// import { Textarea } from '@mantine/core';
// import { EmojiIcon } from '../icons/EmojiIcon';
// import { PhotoIcon } from '../icons/PhotoIcon';
// import { TextEditIcon } from '../icons/TextEditIcon';
// import { LinkIcon } from '../icons/LinkIcon';
// import { AttachmentIcon } from '../icons/AttachmentIcon';

export default function SendMessageSidebar({
  isOpen,
  onClose,
  onSubmit,
}: TSendMessageSidebarProps) {
  const [formData, setFormData] = useState<TSendMessageFormData>({
    attachment: null,
    message: '',
    receiver: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    field: keyof TSendMessageFormData,
    value: string | Date | File | null,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData({
        attachment: null,
        message: '',
        receiver: '',
      });
      onClose();
    } catch (error) {
      console.error('Error adding client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.message.trim() && formData.receiver.trim() ? true : false;
  console.log({ formData });
  return (
    <DrawerModal opened={isOpen} onClose={onClose}>
      <motion.div
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 50 }}
        transition={{ duration: 0.3 }}
        className='h-full bg-white'
      >
        {/* Header */}
        <div className='py-3 px-6 border-b border-gray-200 flex items-center justify-between bg-[#F3F4F7]'>
          <h2 className=' font-semibold text-gray-900'>New Message</h2>
          <button onClick={onClose} className='p-1 rounded-md hover:bg-gray-100 transition-colors'>
            <IconX className='size-4 text-text-subHeading' />
          </button>
        </div>
        {/* Form */}
        <form onSubmit={handleSubmit} className=' px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh] '>
          {/* DESCRIPTION */}
          <div className='flex items-center'>
            <label className='w-[40%] font-bold text-sm'>Send to</label>
            <FormSelect
              placeholder='Select member(s)'
              options={[{ label: 'person', value: 'person' }]}
              className='w-[60%]'
              value={formData.receiver}
              onChange={(val) => handleInputChange('receiver', val)}
            />
          </div>
          <TextEditor
            isSubmitting={isSubmitting}
            isFormValid={isFormValid}
            value={formData.message}
            handleInputChange={handleInputChange}
          />
        </form>
      </motion.div>
    </DrawerModal>
  );
}

{
  /* <button className='cursor-pointer hover:bg-gray-200 rounded-full px-2 py-2'>
              <TextEditIcon className=' size-6' />
            </button>
            <button className='cursor-pointer hover:bg-gray-200 rounded-full px-2 py-2 '>
              <AttachmentIcon className=' size-6' />
            </button>
            <button className='cursor-pointer hover:bg-gray-200 rounded-full px-2 py-2'>
              <LinkIcon className=' size-6' />
            </button>
            <button className='cursor-pointer hover:bg-gray-200 rounded-full px-2 py-2'>
              <EmojiIcon className=' size-6' />
            </button>
            <button className='cursor-pointer hover:bg-gray-200 rounded-full px-2 py-2'>
              <PhotoIcon className=' size-6' />
            </button>
            <button className='cursor-pointer hover:bg-gray-200 rounded-full px-2 py-2'>
              <IconDotsVertical className='text-gray-500 size-5' />
            </button> */
}
