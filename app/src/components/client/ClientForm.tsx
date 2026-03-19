import { FieldArray, FormikProvider, useFormik } from 'formik';
import { useState } from 'react';
import type React from 'react';
import { Button } from '../base';
import FormInput from '../base/FormInput';
import FormLabel from '../base/FormLabel';
import FormSelect from '../base/FormSelect';
import DialogModal from '../base/ModalWrapper';
import { type TCreateClientFormData } from '../../validators/client';
import type { TFormProps } from '../../types/common.types';
import { AddressRow } from './AddAddressSidebar';
import { validateClientAddresses } from '../../utils/addressValidation';
// import ProjectSelector from '../common/ProjectSelector';

export default function ClientForm({
  mode,
  initialValues,
  onSubmit,
  disabled,
}: TFormProps<TCreateClientFormData>) {
  const [showAddressModal, setShowAddressModal] = useState(false);

  const formik = useFormik<TCreateClientFormData>({
    enableReinitialize: true,
    initialValues,
    onSubmit: async (data, { resetForm }) => {
      // Validate addresses before submitting
      const addressValidation = await validateClientAddresses(data.addresses || []);
      if (!addressValidation.isValid) {
        setShowAddressModal(true);
        return;
      }

      onSubmit({ data, resetForm });
    },
  });

  return (
    <FormikProvider value={formik}>
      <form
        onSubmit={formik.handleSubmit}
        className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh]'
      >
        <div className='space-y-6'>
          {/* Client Type */}
          <div className='flex items-center'>
            <FormLabel className='w-[40%]'>Client Type*</FormLabel>
            <FormSelect
              className='w-[60%]'
              placeholder='Select Client Type'
              name='clientType'
              value={formik.values.clientType}
              onChange={(val) => formik.setFieldValue('clientType', val)}
              onBlur={() => formik.setFieldTouched('clientType', true)}
              options={[
                { label: 'INDIVIDUAL', value: 'INDIVIDUAL' },
                { label: 'ORGANIZATION', value: 'ORGANIZATION' },
              ]}
              error={
                formik.touched.clientType && formik.errors.clientType
                  ? (formik.errors.clientType as string)
                  : undefined
              }
            />
          </div>
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
              type='email'
              placeholder='Enter Email'
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

          {/* GSTIN (only for ORGANIZATION) */}
          {formik.values.clientType === 'ORGANIZATION' && (
            <div className='flex items-center'>
              <FormLabel className='w-[40%]'>GSTIN</FormLabel>
              <FormInput
                disabled={disabled}
                placeholder='Enter GSTIN'
                name='gstIn'
                value={formik.values.gstIn || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                className='w-[60%]'
                error={
                  formik.touched.gstIn && formik.errors.gstIn
                    ? (formik.errors.gstIn as string)
                    : undefined
                }
              />
            </div>
          )}

          {/* Addresses (like Sub Task UI) */}
          <div>
            <FormLabel>Addresses*</FormLabel>
            <FieldArray name='addresses'>
              {({ remove, push }) => (
                <div className='space-y-5'>
                  {formik.values.addresses?.map((_, index) => (
                    <AddressRow key={index} index={index} removeAddress={remove} />
                  ))}
                  <Button
                    variant='outline'
                    className='bg-white gap-2 mt-5 border-border-light'
                    type='button'
                    onClick={() =>
                      push({
                        label: '',
                        building: '',
                        street: '',
                        locality: '',
                        city: '',
                        state: '',
                        landmark: '',
                        pincode: '',
                        country: 'INDIA',
                      })
                    }
                  >
                    + Add Address
                  </Button>
                </div>
              )}
            </FieldArray>
            {formik.touched.addresses &&
              formik.errors.addresses &&
              typeof formik.errors.addresses === 'string' && (
                <div className='text-red-500 text-sm mt-1'>{formik.errors.addresses}</div>
              )}
          </div>
        </div>

        {/* Submit Button */}
        <Button type='submit' disabled={disabled} className='text-sm! mt-auto ml-auto'>
          {disabled ? 'Adding...' : mode === 'create' ? 'Invite' : 'Save'}
        </Button>
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
