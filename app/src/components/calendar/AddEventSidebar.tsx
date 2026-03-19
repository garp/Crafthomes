import { useState } from 'react';
import { motion } from 'framer-motion';
import { Textarea } from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { IconCalendarWeek, IconX } from '@tabler/icons-react';
import DrawerModal from '../base/DrawerModal';
import { projectOptions } from '../../constants/settings';
import type { TAddEventFormData, TAddEventSidebarProps } from '../../types/calendar';
import FormInput from '../base/FormInput';
import FormSelect from '../base/FormSelect';

export const AddEventSidebar = ({ isOpen, onClose, onSubmit }: TAddEventSidebarProps) => {
  const [formData, setFormData] = useState<TAddEventFormData>({
    date: null,
    guests: '',
    meetingDescription: '',
    meetingLink: '',
    meetingTitle: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof TAddEventFormData, value: string | Date | null) => {
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
      // Reset form on successful submission
      setFormData({
        date: null,
        guests: '',
        meetingDescription: '',
        meetingLink: '',
        meetingTitle: '',
      });
      onClose();
    } catch (error) {
      console.error('Error adding client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.date &&
    formData.guests &&
    formData.meetingDescription &&
    formData.meetingLink &&
    formData.meetingTitle;
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
          <h2 className=' font-semibold text-gray-900'>Create Event</h2>
          <button onClick={onClose} className='p-1 rounded-md hover:bg-gray-100 transition-colors'>
            <IconX className='size-4 text-text-subHeading' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh] '>
          <div className='space-y-6'>
            {/* Meeting Title */}
            <div className='flex items-center'>
              <label className='block text-sm font-medium mb-2 w-[40%]'>Meeting Title</label>
              <FormInput
                placeholder='Enter Name'
                value={formData.meetingTitle}
                onChange={(e) => handleInputChange('meetingTitle', e.target.value)}
                required
                className='w-[60%]'
              />
            </div>
            {/* DATE */}
            <div className='flex items-center'>
              <label className='block text-sm font-medium mb-2 w-[40%]'>Select Date</label>
              <div className='flex pr-3 border items-center border-[#D1D5DB] w-[60%] rounded-[6px]'>
                <DateInput
                  placeholder='Select Date'
                  value={formData.date}
                  onChange={(date) => handleInputChange('date', date)}
                  className='w-full border-none '
                  required
                  styles={{
                    input: {
                      paddingTop: '21px',
                      paddingBottom: '21px',
                      fontSize: '14px',
                      border: 'none',
                      fontWeight: 500,
                      '&:focus': {
                        boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
                      },
                    },
                  }}
                />
                <IconCalendarWeek className='text-gray-500' />
              </div>
            </div>
            {/* Meeting Link */}
            <div className='flex items-center'>
              <label className='block text-sm font-medium mb-2 w-[40%]'>Meeting Link</label>
              <FormInput
                placeholder='Add Meeting Link'
                value={formData.meetingLink}
                onChange={(e) => handleInputChange('meetingLink', e.target.value)}
                className='w-[60%]'
                required
              />
            </div>

            {/* Members */}
            <div className='flex items-center'>
              <label className='block text-sm font-medium mb-2 w-[40%]'>Add guests</label>
              <FormSelect
                placeholder='Select Members'
                value={formData.guests}
                onChange={(value) => handleInputChange('guests', value || '')}
                options={projectOptions}
                className='w-[60%]'
                required
              />
            </div>

            {/* Meeting DESCRIPTION */}
            <div className='flex'>
              <label className='block text-sm font-medium mb-2 w-[40%]'>Meeting Description</label>
              <Textarea
                placeholder='Add description'
                onChange={(e) => handleInputChange('meetingDescription', e.target.value)}
                value={formData.meetingDescription}
                className='w-[60%] !placeholder:font-semibold'
                styles={{
                  input: {
                    '::placeholder': {
                      fontWeight: 600,
                    },
                  },
                }}
                rows={7}
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            disabled={!isFormValid || isSubmitting}
            className='mt-auto bg-black hover:bg-[#484848] cursor-pointer text-white px-10 py-[6px] rounded-full w-fit ml-auto'
          >
            {isSubmitting ? 'Adding...' : 'Invite'}
          </button>
        </form>
      </motion.div>
    </DrawerModal>
  );
};
