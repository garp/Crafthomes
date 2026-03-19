import { useFormik } from 'formik';
import type React from 'react';
import FormInput from '../base/FormInput';
import { Button } from '../base';
import IconButton from '../base/button/IconButton';
import {
  createPolicySchema,
  updatePolicySchema,
  type TCreatePolicyFormData,
} from '../../validators/policy';
import { useLazyGetPincodeDetailsQuery } from '../../store/services/pincode/pincodeSlice';
import { useUploadFilesMutation } from '../../store/services/upload/upload';
import { toast } from 'react-toastify';
import { IconTrash, IconUpload } from '@tabler/icons-react';
import { Image } from '@mantine/core';
import RichTextEditorDescription from '../common/RichTextEditorDescription';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

type PolicyFormProps = {
  mode: 'add' | 'edit';
  initialValues: TCreatePolicyFormData;
  onSubmit: (values: TCreatePolicyFormData, resetForm: () => void) => void;
  disabled: boolean;
};

export default function PolicyForm({ mode, initialValues, onSubmit, disabled }: PolicyFormProps) {
  const [triggerPincodeLookup, { isFetching: isFetchingPincode }] = useLazyGetPincodeDetailsQuery();
  const [uploadFiles, { isLoading: isUploadingLogo }] = useUploadFilesMutation();

  const formik = useFormik<TCreatePolicyFormData>({
    initialValues,
    validationSchema: mode === 'edit' ? updatePolicySchema : createPolicySchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => onSubmit(values, resetForm),
  });

  const handlePincodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numericValue = value.replace(/\D/g, ''); // Remove non-digits
    formik.setFieldValue('pincode', numericValue ? parseInt(numericValue, 10) : '');

    // Trigger pincode lookup when exactly 6 digits are entered
    if (numericValue.length === 6) {
      triggerPincodeLookup({ pincode: numericValue })
        .unwrap()
        .then((res) => {
          if (!res) return;
          formik.setFieldValue('city', res.city || '');
          formik.setFieldValue('state', res.state || '');
          formik.setFieldValue('country', res.country || 'India');
        })
        .catch(() => {
          // silently ignore pincode lookup errors
        });
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 10 MB');
      return;
    }

    const formData = new FormData();
    formData.append('files', file);
    formData.append('folder', 'estatecraft-policy-logos');

    uploadFiles(formData)
      .unwrap()
      .then((res) => {
        const uploadedFiles = res?.data?.files;
        if (uploadedFiles && uploadedFiles.length > 0 && uploadedFiles[0]?.url) {
          formik.setFieldValue('logo', uploadedFiles[0].url);
          toast.success('Logo uploaded successfully');
        } else {
          toast.error('Failed to upload logo');
        }
      })
      .catch((error) => {
        console.error('Error uploading logo:', error);
        toast.error('Failed to upload logo');
      });

    // Reset input value to allow re-uploading same file
    e.target.value = '';
  };

  const handleRemoveLogo = () => {
    formik.setFieldValue('logo', '');
  };

  return (
    <form
      onSubmit={formik.handleSubmit}
      className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh]'
    >
      <div className='space-y-5 overflow-y-auto flex-1 pr-2'>
        {/* Company Information Section */}
        <div className='border-b border-gray-200 pb-4'>
          <h3 className='text-sm font-semibold text-gray-700 mb-4'>Company Information</h3>

          <div className='space-y-4'>
            <FormRow label='Company Name' required>
              <FormInput
                disabled={disabled}
                placeholder='Enter Company Name'
                name='companyName'
                value={formik.values.companyName}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.companyName && (formik.errors.companyName as string)}
              />
            </FormRow>

            <div className='flex items-start'>
              <label className='block text-sm font-medium mb-2 w-[35%] text-text-subHeading pt-2'>
                Logo<span className='ml-1'>*</span>
              </label>
              <div className='w-[65%]'>
                {formik.values.logo ? (
                  <div className='relative group w-fit'>
                    <Image
                      src={formik.values.logo}
                      alt='Company Logo'
                      className='h-20 w-20 object-contain rounded-lg border border-gray-200'
                      fallbackSrc='https://placehold.co/80x80?text=Logo'
                    />
                    <IconButton
                      onClick={handleRemoveLogo}
                      disabled={disabled}
                      className='absolute -top-2 -right-2 bg-white shadow-md rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity'
                    >
                      <IconTrash className='size-4 text-red-500' />
                    </IconButton>
                  </div>
                ) : (
                  <label
                    htmlFor='logo-upload'
                    className={`flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors ${
                      disabled || isUploadingLogo ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <IconUpload className='size-5 text-gray-500' />
                    <span className='text-sm text-gray-600'>
                      {isUploadingLogo ? 'Uploading...' : 'Upload Logo'}
                    </span>
                  </label>
                )}
                <input
                  type='file'
                  id='logo-upload'
                  accept='image/*'
                  onChange={handleLogoUpload}
                  disabled={disabled || isUploadingLogo}
                  className='hidden'
                />
                {formik.touched.logo && formik.errors.logo && (
                  <p className='text-xs text-red-500 mt-1'>{formik.errors.logo}</p>
                )}
              </div>
            </div>

            <FormRow label='Website'>
              <FormInput
                disabled={disabled}
                placeholder='https://example.com'
                name='website'
                value={formik.values.website || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.website && (formik.errors.website as string)}
              />
            </FormRow>
          </div>
        </div>

        {/* Address Section */}
        <div className='border-b border-gray-200 pb-4'>
          <h3 className='text-sm font-semibold text-gray-700 mb-4'>Address Details</h3>

          <div className='space-y-4'>
            <FormRow label='Address' required>
              <FormInput
                disabled={disabled}
                placeholder='Enter Address'
                name='address'
                value={formik.values.address}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.address && (formik.errors.address as string)}
              />
            </FormRow>

            <FormRow label='Pincode' required>
              <FormInput
                disabled={disabled || isFetchingPincode}
                placeholder='Enter Pincode'
                name='pincode'
                maxLength={6}
                value={formik.values.pincode || ''}
                onChange={handlePincodeChange}
                onBlur={formik.handleBlur}
                error={formik.touched.pincode && (formik.errors.pincode as string)}
              />
            </FormRow>

            <FormRow label='City' required>
              <FormInput
                disabled={disabled}
                placeholder='Enter City'
                name='city'
                value={formik.values.city}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.city && (formik.errors.city as string)}
              />
            </FormRow>

            <FormRow label='State' required>
              <FormInput
                disabled={disabled}
                placeholder='Enter State'
                name='state'
                value={formik.values.state}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.state && (formik.errors.state as string)}
              />
            </FormRow>

            <FormRow label='Country' required>
              <FormInput
                disabled={disabled}
                placeholder='Enter Country'
                name='country'
                value={formik.values.country}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.country && (formik.errors.country as string)}
              />
            </FormRow>
          </div>
        </div>

        {/* Tax Details Section */}
        <div className='border-b border-gray-200 pb-4'>
          <h3 className='text-sm font-semibold text-gray-700 mb-4'>Tax Details</h3>

          <div className='space-y-4'>
            <FormRow label='GST IN' required>
              <FormInput
                disabled={disabled}
                placeholder='Enter GST IN'
                name='gstIn'
                value={formik.values.gstIn || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.gstIn && (formik.errors.gstIn as string)}
              />
            </FormRow>

            <FormRow label='Tax ID'>
              <FormInput
                disabled={disabled}
                placeholder='Enter Tax ID'
                name='taxId'
                value={formik.values.taxId || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.taxId && (formik.errors.taxId as string)}
              />
            </FormRow>
          </div>
        </div>

        {/* Banking Details Section */}
        <div className='border-b border-gray-200 pb-4'>
          <h3 className='text-sm font-semibold text-gray-700 mb-4'>Banking Details</h3>

          <div className='space-y-4'>
            <FormRow label='Bank Name' required>
              <FormInput
                disabled={disabled}
                placeholder='Enter Bank Name'
                name='bankName'
                value={formik.values.bankName || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.bankName && (formik.errors.bankName as string)}
              />
            </FormRow>

            <FormRow label='Account Name' required>
              <FormInput
                disabled={disabled}
                placeholder='Enter Account Name'
                name='bankAccountName'
                value={formik.values.bankAccountName || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.bankAccountName && (formik.errors.bankAccountName as string)}
              />
            </FormRow>

            <FormRow label='Account Number' required>
              <FormInput
                disabled={disabled}
                placeholder='Enter Account Number'
                name='bankAccountNumber'
                value={formik.values.bankAccountNumber || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={
                  formik.touched.bankAccountNumber && (formik.errors.bankAccountNumber as string)
                }
              />
            </FormRow>

            <FormRow label='IFSC Code' required>
              <FormInput
                disabled={disabled}
                placeholder='Enter IFSC Code'
                name='bankIFSC'
                value={formik.values.bankIFSC || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  // Convert to uppercase for IFSC
                  formik.setFieldValue('bankIFSC', e.target.value.toUpperCase());
                }}
                onBlur={formik.handleBlur}
                error={formik.touched.bankIFSC && (formik.errors.bankIFSC as string)}
              />
            </FormRow>

            <FormRow label='Branch' required>
              <FormInput
                disabled={disabled}
                placeholder='Enter Branch Name'
                name='bankBranch'
                value={formik.values.bankBranch || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.bankBranch && (formik.errors.bankBranch as string)}
              />
            </FormRow>
          </div>
        </div>

        {/* Terms and Conditions Section */}
        <div className='pb-4'>
          <h3 className='text-sm font-semibold text-gray-700 mb-4'>
            Terms and Conditions<span className='ml-1'>*</span>
          </h3>

          <div className='w-full'>
            <RichTextEditorDescription
              value={formik.values.termsAndConditions || ''}
              setValue={(val) => formik.setFieldValue('termsAndConditions', val)}
              placeholder='Enter terms and conditions...'
              imageFolder='estatecraft-policy-tnc-images'
            />
            {formik.touched.termsAndConditions && formik.errors.termsAndConditions && (
              <p className='text-xs text-red-500 mt-1'>{formik.errors.termsAndConditions}</p>
            )}
          </div>
        </div>
      </div>

      <Button type='submit' disabled={disabled} className='mt-auto ml-auto'>
        {disabled
          ? mode === 'add'
            ? 'Adding...'
            : 'Updating...'
          : mode === 'add'
            ? 'Create Policy'
            : 'Update Policy'}
      </Button>
    </form>
  );
}

const FormRow = ({
  label,
  children,
  required = false,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) => (
  <div className='flex items-center'>
    <label className='block text-sm font-medium mb-2 w-[35%] text-text-subHeading'>
      {label}
      {required && <span className='ml-1'>*</span>}
    </label>
    <div className='w-[65%]'>{children}</div>
  </div>
);
