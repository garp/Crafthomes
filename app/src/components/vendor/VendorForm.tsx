import { FormikProvider, useFormik } from 'formik';
import { useState } from 'react';
import type React from 'react';

import FormInput from '../base/FormInput';
import { Button } from '../base';
import DialogModal from '../base/ModalWrapper';

import { addVendorSchema, type TAddVendorFormData } from '../../validators/vendor'; // <-- create Yup schema

// import FormDate from '../base/FormDate';
import type { TAddVendorFormProps } from '../../types/vendor';
import FormLabel from '../base/FormLabel';
import SepcializationCombobox from './SpecializationCombobox';
import VendorAddressSidebar from './VendorAddressSidebar';
import IconButton from '../base/button/IconButton';
import { IconArrowLeft } from '@tabler/icons-react';
import { validateVendorAddress } from '../../utils/addressValidation';

export default function VendorForm({
  handleSubmit,
  disabled,
  mode,
  initialValues,
}: TAddVendorFormProps) {
  const [isAddressOpen, setIsAddressOpen] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);

  const formik = useFormik<TAddVendorFormData>({
    initialValues,
    validationSchema: addVendorSchema,
    onSubmit: async (values, { resetForm }) => {
      // Validate address before submitting
      const isAddressValid = await validateVendorAddress(values.address);

      if (!isAddressValid) {
        setShowAddressModal(true);
        return;
      }

      handleSubmit(values, resetForm);
    },
  });

  return (
    <FormikProvider value={formik}>
      <form
        onSubmit={formik.handleSubmit}
        className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh]'
      >
        <div className='space-y-6'>
          {/* Name */}
          <div className='flex items-center'>
            <FormLabel className='w-[40%]'>Name*</FormLabel>
            <FormInput
              disabled={disabled}
              placeholder='Enter Name'
              name='name'
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className='w-[60%]'
              error={formik.touched.name && formik.errors.name ? formik.errors.name : undefined}
            />
          </div>

          {/* Phone Number */}
          <div className='flex items-center'>
            <FormLabel className='w-[40%]'>Phone Number*</FormLabel>
            <FormInput
              disabled={disabled}
              placeholder='Enter Phone Number'
              name='phoneNumber'
              value={formik.values.phoneNumber}
              type='tel'
              inputMode='numeric'
              maxLength={10}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const numeric = e.target.value.replace(/\D/g, '');
                formik.setFieldValue('phoneNumber', numeric);
              }}
              onBlur={formik.handleBlur}
              className='w-[60%]'
              error={
                formik.touched.phoneNumber && formik.errors.phoneNumber
                  ? formik.errors.phoneNumber
                  : undefined
              }
            />
          </div>

          {/* Email */}
          <div className='flex items-center'>
            <FormLabel className='w-[40%]'>Email*</FormLabel>
            <FormInput
              disabled={disabled}
              placeholder='Enter Email'
              type='email'
              name='email'
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              className='w-[60%]'
              error={formik.touched.email && formik.errors.email ? formik.errors.email : undefined}
            />
          </div>

          {/* Pan Details */}
          <div className='flex items-center'>
            <FormLabel className='w-[40%]'>Pan Details</FormLabel>
            <FormInput
              disabled={disabled}
              placeholder='Enter PAN (e.g., ABCDE1234F)'
              name='panDetails'
              value={formik.values.panDetails || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                const upperCase = e.target.value.toUpperCase();
                formik.setFieldValue('panDetails', upperCase);
              }}
              onBlur={formik.handleBlur}
              maxLength={10}
              className='w-[60%]'
              error={
                formik.touched.panDetails && formik.errors.panDetails
                  ? (formik.errors.panDetails as string)
                  : undefined
              }
            />
          </div>

          {/* Specialized In */}
          <div className='flex items-center'>
            <FormLabel className='w-[40%]'>Specialized In*</FormLabel>
            <div className='w-[60%] flex flex-col gap-1'>
              <SepcializationCombobox
                value={formik.values.specializedId}
                setValue={(val) => formik.setFieldValue('specializedId', val)}
                error={
                  formik.touched.specializedId && formik.errors.specializedId
                    ? (formik.errors.specializedId as string)
                    : undefined
                }
              />
              {formik.touched.specializedId && formik.errors.specializedId && (
                <div className='text-red-500 text-sm mt-1'>
                  {formik.errors.specializedId as string}
                </div>
              )}
            </div>
          </div>
          {/* Address (single) */}
          <div className='flex items-center'>
            <FormLabel className='w-[40%]'>Address*</FormLabel>
            <div className='w-[60%] flex flex-col gap-1'>
              <FormInput
                placeholder='Address Label'
                name='address.label'
                value={formik.values.address?.label || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className='w-full cursor-pointer'
                onClick={() => {
                  if (!formik.values.address) {
                    formik.setFieldValue('address', {
                      id: null,
                      label: '',
                      building: '',
                      street: '',
                      locality: '',
                      city: '',
                      state: '',
                      landmark: '',
                      pincode: '',
                      country: 'INDIA',
                    });
                  }
                  setIsAddressOpen(true);
                }}
                readOnly
                rightSection={
                  <IconButton
                    type='button'
                    onClick={() => {
                      if (!formik.values.address) {
                        formik.setFieldValue('address', {
                          id: null,
                          label: '',
                          building: '',
                          street: '',
                          locality: '',
                          city: '',
                          state: '',
                          landmark: '',
                          pincode: '',
                          country: 'INDIA',
                        });
                      }
                      setIsAddressOpen(true);
                    }}
                  >
                    <IconArrowLeft className='size-4 rotate-180' />
                  </IconButton>
                }
              />
              {formik.touched.address?.label && formik.errors.address?.label && (
                <div className='text-red-500 text-sm mt-1'>Address is required</div>
              )}
            </div>
          </div>

          {/* Start Date */}
          {/* <div className='flex items-center'>
            <FormLabel className='w-[40%]'>Start Date</FormLabel>
            {/* <div className='flex pr-3 border items-center border-[#D1D5DB] w-[60%] rounded-[6px]'> */}
          {/* <FormDate
              disabled={disabled}
              placeholder='Select Date'
              name='startDate'
              value={formik.values.startDate}
              onChange={(date) => formik.setFieldValue('startDate', date)}
              onBlur={() => formik.setFieldTouched('startDate', true)}
              className='border-none w-[60%]'
              error={formik.touched.startDate ? (formik.errors.startDate as string) : undefined}
            /> */}
          {/* <IconCalendarWeek className='text-gray-500' />
            </div> */}
          {/* </div> */}
        </div>

        {/* Submit Button */}
        <Button radius='full' type='submit' disabled={disabled} className='mt-auto ml-auto'>
          {disabled
            ? mode === 'create'
              ? 'Creating...'
              : 'Updating...'
            : mode === 'create'
              ? 'Create Vendor'
              : 'Update Vendor'}
        </Button>
        <VendorAddressSidebar isOpen={isAddressOpen} onClose={() => setIsAddressOpen(false)} />
      </form>

      {/* Address Validation Modal */}
      <DialogModal
        opened={showAddressModal}
        onClose={() => setShowAddressModal(false)}
        title='Incomplete Address'
        centered
      >
        <p className='font-medium text-text-subHeading'>
          Please fill all required address fields before submitting. Click on the address to
          complete it.
        </p>
        <div className='flex justify-end mt-8'>
          <Button onClick={() => setShowAddressModal(false)}>OK</Button>
        </div>
      </DialogModal>
    </FormikProvider>
  );
}
