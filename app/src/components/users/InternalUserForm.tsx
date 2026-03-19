import { useFormik } from 'formik';
import type React from 'react';
import { useRef } from 'react';
import FormInput from '../base/FormInput';
import FormSelect from '../base/FormSelect';
import { Button } from '../base';
import { useGetInternalRolesQuery } from '../../store/services/role/roleSlice';
import { useGetDesignationsQuery } from '../../store/services/designation/designationSlice';
import { useGetDepartmentsQuery } from '../../store/services/department/departmentSlice';
import { useGetUsersQuery } from '../../store/services/user/userSlice';
import { useUploadFilesMutation } from '../../store/services/upload/upload';
import { getUser } from '../../utils/auth';
import {
  createInternalUserSchema,
  updateInternalUserSchema,
  type TCreateInternalUserFormData,
} from '../../validators/internalUser';

type InternalUserFormProps = {
  mode: 'add' | 'edit';
  initialValues: TCreateInternalUserFormData;
  onSubmit: (values: TCreateInternalUserFormData, resetForm: () => void) => void;
  disabled: boolean;
  showPasswordField?: boolean;
};

export const InternalUserForm = ({
  mode,
  initialValues,
  onSubmit,
  disabled,
  showPasswordField = false,
}: InternalUserFormProps) => {
  // Fetch only INTERNAL roles for internal user creation/update
  const { data: roles, isLoading: isLoadingRoles } = useGetInternalRolesQuery();

  // Fetch designations from API
  const { data: designationsData, isLoading: isLoadingDesignations } = useGetDesignationsQuery({
    pageLimit: '50',
  });

  // Fetch departments from API
  const { data: departmentsData, isLoading: isLoadingDepartments } = useGetDepartmentsQuery({});

  // Fetch internal users for Reports To selector
  const { data: usersData, isLoading: isLoadingUsers } = useGetUsersQuery({
    pageLimit: '100',
    userType: 'INTERNAL',
    status: 'ACTIVE',
  });

  // Upload hook for profile photo
  const [uploadFiles, { isLoading: isUploading }] = useUploadFilesMutation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current user is super_admin
  const currentUser = getUser();
  const isSuperAdmin = currentUser?.role?.name?.toLowerCase?.() === 'super_admin';

  const designationOptions =
    designationsData?.designations?.map((d) => ({ label: d.displayName, value: d.id })) ?? [];

  const departmentOptions =
    departmentsData?.departments?.map((d) => ({ label: d.displayName || d.name, value: d.name })) ??
    [];

  const reportsToOptions = usersData?.users?.map((u) => ({ label: u.name, value: u.id })) ?? [];

  // Role options for internal users
  const roleDisplayNames: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    internal_user: 'Internal User',
  };
  const roleOptions =
    roles?.data?.map((r) => ({
      label:
        roleDisplayNames[r.name] ||
        r.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value: r.id,
    })) ?? [];

  const formik = useFormik<TCreateInternalUserFormData>({
    initialValues,
    validationSchema: mode === 'edit' ? updateInternalUserSchema : createInternalUserSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => onSubmit(values, resetForm),
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('files', file);
    formData.append('folder', 'profile-photos');

    try {
      const result = await uploadFiles(formData).unwrap();
      const uploadedUrl = result?.data?.files?.[0]?.url;
      if (uploadedUrl) {
        formik.setFieldValue('profilePhoto', uploadedUrl);
      }
    } catch (err) {
      console.error('Failed to upload profile photo:', err);
    }
  };

  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    return parts[0].charAt(0).toUpperCase() + (parts[1]?.charAt(0)?.toUpperCase() || '');
  };

  return (
    <form
      onSubmit={formik.handleSubmit}
      className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh]'
    >
      <div className='space-y-6'>
        {/* Profile Photo Upload */}
        <FormRow label='Photo'>
          <div className='flex items-center gap-3'>
            <div
              className='relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity'
              onClick={() => !disabled && fileInputRef.current?.click()}
            >
              {formik.values.profilePhoto ? (
                <img
                  src={formik.values.profilePhoto}
                  alt='Profile'
                  className='w-full h-full object-cover'
                />
              ) : formik.values.name ? (
                <span className='text-sm font-semibold text-gray-600'>
                  {getInitials(formik.values.name)}
                </span>
              ) : (
                <svg
                  className='w-6 h-6 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z'
                  />
                </svg>
              )}
              {isUploading && (
                <div className='absolute inset-0 bg-black/40 flex items-center justify-center'>
                  <div className='w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin' />
                </div>
              )}
            </div>
            <div className='flex flex-col gap-1'>
              <button
                type='button'
                className='text-xs text-black font-medium cursor-pointer'
                disabled={disabled || isUploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {formik.values.profilePhoto ? 'Change Profile Photo' : 'Add Profile Photo'}
              </button>
              {formik.values.profilePhoto && (
                <button
                  type='button'
                  className='text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer'
                  disabled={disabled}
                  onClick={() => formik.setFieldValue('profilePhoto', null)}
                >
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type='file'
              accept='image/jpeg,image/png,image/webp,image/gif'
              className='hidden'
              onChange={handlePhotoUpload}
            />
          </div>
        </FormRow>

        <FormRow label='Name'>
          <FormInput
            disabled={disabled}
            placeholder='Enter Name'
            name='name'
            value={formik.values.name}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.name && (formik.errors.name as string)}
          />
        </FormRow>

        <FormRow label='Phone Number'>
          <FormInput
            disabled={disabled}
            placeholder='Enter Phone Number'
            name='phoneNumber'
            maxLength={10}
            value={formik.values.phoneNumber}
            type='tel'
            inputMode='numeric'
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
              const numeric = e.target.value.replace(/\D/g, '');
              formik.setFieldValue('phoneNumber', numeric);
            }}
            onBlur={formik.handleBlur}
            error={formik.touched.phoneNumber && (formik.errors.phoneNumber as string)}
          />
        </FormRow>

        <FormRow label='Email ID'>
          <FormInput
            disabled={disabled || mode === 'edit'}
            placeholder='Enter Email'
            type='email'
            name='email'
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && (formik.errors.email as string)}
          />
        </FormRow>

        <FormRow label='Department'>
          <FormSelect
            options={departmentOptions}
            disabled={disabled || isLoadingDepartments}
            placeholder='Select Department'
            name='department'
            value={formik.values.department || ''}
            onChange={(val) => formik.setFieldValue('department', val)}
            onBlur={formik.handleBlur}
            error={formik.touched.department && (formik.errors.department as string)}
            clearable
          />
        </FormRow>

        <FormRow label='Designation'>
          <FormSelect
            options={designationOptions}
            disabled={disabled || isLoadingDesignations}
            placeholder='Select Designation'
            name='designationId'
            value={formik.values.designationId || ''}
            onChange={(val) => formik.setFieldValue('designationId', val)}
            onBlur={formik.handleBlur}
            error={formik.touched.designationId && (formik.errors.designationId as string)}
            clearable
          />
        </FormRow>

        {/* Role field - only visible to SUPER_ADMIN */}
        {isSuperAdmin && (
          <FormRow label='Role'>
            <FormSelect
              options={roleOptions}
              disabled={disabled || isLoadingRoles}
              placeholder='Select Role'
              name='roleId'
              value={formik.values.roleId || ''}
              onChange={(val) => formik.setFieldValue('roleId', val)}
              onBlur={formik.handleBlur}
              error={formik.touched.roleId && (formik.errors.roleId as string)}
            />
          </FormRow>
        )}

        {/* Reports To field - only visible to SUPER_ADMIN */}
        {isSuperAdmin && (
          <FormRow label='Reports To'>
            <FormSelect
              options={reportsToOptions}
              disabled={disabled || isLoadingUsers}
              placeholder='Select Manager'
              name='reportsToId'
              value={formik.values.reportsToId || ''}
              onChange={(val) => formik.setFieldValue('reportsToId', val)}
              onBlur={formik.handleBlur}
              error={formik.touched.reportsToId && (formik.errors.reportsToId as string)}
              clearable
            />
          </FormRow>
        )}

        {/* Password field - only for edit mode when explicitly enabled */}
        {mode === 'edit' && showPasswordField && (
          <FormRow label='Password'>
            <div className='flex items-center gap-2 w-full'>
              <FormInput
                disabled={disabled}
                placeholder='Generated password'
                name='password'
                type='text'
                value={formik.values.password || ''}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.password && (formik.errors.password as string)}
              />
              <Button
                type='button'
                variant='light'
                disabled={disabled}
                className='whitespace-nowrap'
                onClick={() => {
                  // Ensure generated password always has at least one letter and one number
                  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
                  const numbers = '23456789';
                  const allChars = `${letters}${numbers}`;

                  // Start with one random letter and one random number to satisfy validation
                  let pwd = '';
                  pwd += letters.charAt(Math.floor(Math.random() * letters.length));
                  pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));

                  // Fill remaining characters (min length 6 per validation)
                  const targetLength = 6;
                  for (let i = 2; i < targetLength; i += 1) {
                    pwd += allChars.charAt(Math.floor(Math.random() * allChars.length));
                  }

                  // Shuffle to avoid predictable first characters
                  const shuffled = pwd
                    .split('')
                    .sort(() => Math.random() - 0.5)
                    .join('');

                  formik.setFieldValue('password', shuffled);
                }}
              >
                Generate
              </Button>
            </div>
          </FormRow>
        )}
      </div>

      <Button type='submit' disabled={disabled} className='mt-auto ml-auto'>
        {disabled
          ? mode === 'add'
            ? 'Adding...'
            : 'Updating...'
          : mode === 'add'
            ? 'Create'
            : 'Update'}
      </Button>
    </form>
  );
};

const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className='flex items-center'>
    <label className='block text-sm font-medium mb-2 w-[40%]'>{label}</label>
    <div className='w-[60%]'>{children}</div>
  </div>
);
