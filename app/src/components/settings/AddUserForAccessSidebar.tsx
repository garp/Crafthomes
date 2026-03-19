import { useState } from 'react';
import { motion } from 'framer-motion';
import DrawerModal from '../base/DrawerModal';
import { IconX } from '@tabler/icons-react';
import type { AddUserSidebarProps, TAddUserForAccessFormData } from '../../types/settings.types';
import { projectOptions } from '../../constants/settings';
import FormInput from '../base/FormInput';
import FormSelect from '../base/FormSelect';

export const AddUserForAccessSidebar = ({ isOpen, onClose, onSubmit }: AddUserSidebarProps) => {
  const [formData, setFormData] = useState<TAddUserForAccessFormData>({
    name: '',
    department: '',
    role: '',
    designation: '',
    organization: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (
    field: keyof TAddUserForAccessFormData,
    value: string | Date | null,
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
      // Reset form on successful submission
      setFormData({
        name: '',
        department: '',
        role: '',
        designation: '',
        organization: '',
      });
      onClose();
    } catch (error) {
      console.error('Error adding client:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    formData.name &&
    formData.department &&
    formData.role &&
    formData.organization &&
    formData.designation;

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
          <h2 className=' font-semibold text-gray-900'>Add User for access</h2>
          <button onClick={onClose} className='p-1 rounded-md hover:bg-gray-100 transition-colors'>
            <IconX className='size-4 text-text-subHeading' />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh] '>
          <div className='space-y-6'>
            {/* Name */}
            <div className='flex items-center'>
              <label className='block text-sm font-medium mb-2 w-[40%]'>Name</label>
              <FormInput
                placeholder='Enter Name'
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className='w-[60%]'
              />
            </div>
            {/* DEPARTMENT */}
            <div className='flex items-center'>
              <label className='block text-sm font-medium mb-2 w-[40%]'>Department</label>
              <FormSelect
                placeholder='Select Department'
                value={formData.department}
                onChange={(value) => handleInputChange('department', value || '')}
                options={projectOptions}
                className='w-[60%]'
                required
              />
            </div>
            {/* DESIGNATION */}
            <div className='flex items-center'>
              <label className='block text-sm font-medium mb-2 w-[40%]'>Designation</label>
              <FormSelect
                placeholder='Select Designation'
                value={formData.designation}
                onChange={(value) => handleInputChange('designation', value || '')}
                options={projectOptions}
                className='w-[60%]'
                required
              />
            </div>
            {/* ROLE */}
            <div className='flex items-center'>
              <label className='block text-sm font-medium mb-2 w-[40%]'>Role</label>
              <FormSelect
                placeholder='Select Role'
                value={formData.role}
                onChange={(value) => handleInputChange('role', value || '')}
                options={projectOptions}
                className='w-[60%]'
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            disabled={!isFormValid || isSubmitting}
            className='mt-auto bg-black hover:bg-[#484848] cursor-pointer text-white px-10 py-[6px] rounded-full w-fit ml-auto'
          >
            {isSubmitting ? 'Adding...' : 'Confirm'}
          </button>
        </form>
      </motion.div>
    </DrawerModal>
  );
};
