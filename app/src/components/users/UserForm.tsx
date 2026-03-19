import { useFormik } from 'formik';
import type React from 'react';
import { addUserSchema, editUserSchema, type TAddUserFormData } from '../../validators/user';
import FormInput from '../base/FormInput';
import FormSelect from '../base/FormSelect';
import { Button } from '../base';
import { useGetRolesQuery } from '../../store/services/role/roleSlice';
import { parseSnakeCase } from '../../utils/helper';
import { getUser } from '../../utils/auth';
import ClientSelector from '../common/selectors/ClientSelector';
import VendorSelector from '../common/selectors/VendorSelector';

type UserFormProps = {
  mode: 'add' | 'edit';
  initialValues: TAddUserFormData;
  onSubmit: (values: TAddUserFormData, resetForm: () => void) => void;
  disabled: boolean;
  showPasswordField?: boolean;
};

export const UserForm = ({
  mode,
  initialValues,
  onSubmit,
  disabled,
  showPasswordField,
}: UserFormProps) => {
  const { data: roles, isLoading: isLoadingRoles } = useGetRolesQuery();
  const currentUserRoleName = getUser()?.role?.name?.toLowerCase?.() ?? '';
  const hideRoleField =
    currentUserRoleName === 'client_contact' || currentUserRoleName === 'vendor_client';

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: mode === 'edit' ? editUserSchema : addUserSchema,
    enableReinitialize: true,
    onSubmit: async (values, { resetForm }) => onSubmit(values, resetForm),
  });

  const clientContactRole = roles?.data?.find(
    (role) => role?.name?.toLowerCase?.() === 'client_contact',
  );
  const vendorContactRole = roles?.data?.find(
    (role) => role?.name?.toLowerCase?.() === 'vendor_client',
  );
  console.log('🚀 ~ UserForm ~ roles:', roles);

  const roleOptions: { label: string; value: string }[] = [];
  if (clientContactRole) {
    roleOptions.push({ label: 'Client Contact', value: clientContactRole.id });
  }
  if (vendorContactRole) {
    roleOptions.push({ label: 'Vendor Contact', value: vendorContactRole.id });
  }

  const selectedRoleName =
    roles?.data?.find((r) => r.id === formik.values.roleId)?.name?.toLowerCase?.() ?? '';
  const isSuperAdmin = currentUserRoleName === 'super_admin';
  // Treat both *_CONTACT and plain CLIENT/VENDOR as client/vendor user types
  const isClientUserType = selectedRoleName === 'client_contact' || selectedRoleName === 'client';
  const isVendorUserType = selectedRoleName === 'vendor_client' || selectedRoleName === 'vendor';
  const showClientSelector = isSuperAdmin && isClientUserType;
  const showVendorSelector = isSuperAdmin && isVendorUserType;

  // Hide role field if it's pre-set to client_contact or vendor_client (e.g., when adding from client/vendor detail page)
  // But show it as read-only text if the role is already set
  const shouldHideRoleField =
    hideRoleField || (mode === 'add' && (isClientUserType || isVendorUserType));

  return (
    <form
      onSubmit={formik.handleSubmit}
      className='px-6 pt-6 pb-3 space-y-6 flex flex-col h-[92vh]'
    >
      <div className='space-y-6'>
        {!shouldHideRoleField && (
          <FormRow label='User Type'>
            {mode === 'edit' ? (
              // In edit mode, User Type is read-only. Show text based on existing role.
              <p className='text-sm font-medium text-gray-900'>
                {isClientUserType ? 'Client Contact' : isVendorUserType ? 'Vendor Contact' : '—'}
              </p>
            ) : (
              <FormSelect
                disabled={isLoadingRoles || disabled}
                placeholder='Select Type'
                name='roleId'
                value={formik.values.roleId || ''}
                onChange={(value) => formik.setFieldValue('roleId', value || '')}
                onBlur={() => formik.setFieldTouched('roleId', true)}
                options={parseSnakeCase(roleOptions)}
                error={formik.touched.roleId && (formik.errors.roleId as string)}
              />
            )}
          </FormRow>
        )}
        {shouldHideRoleField && (isClientUserType || isVendorUserType) && (
          <FormRow label='User Type'>
            <p className='text-sm font-medium text-gray-900'>
              {isClientUserType ? 'Client Contact' : 'Vendor Contact'}
            </p>
          </FormRow>
        )}
        {showClientSelector && (
          <FormRow label='Client'>
            <ClientSelector
              inputClassName='!border-0 !rounded-lg'
              disabled={mode === 'edit' || disabled}
              value={formik.values.clientId || null}
              setValue={(val) => formik.setFieldValue('clientId', val || '')}
              allowFilter
            />
          </FormRow>
        )}

        {showVendorSelector && (
          <FormRow label='Vendor'>
            <VendorSelector
              disabled={mode === 'edit' || disabled}
              value={formik.values.vendorId || ''}
              setValue={(val) => formik.setFieldValue('vendorId', val || '')}
              allowFilter
            />
          </FormRow>
        )}

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
            type='tel'
            inputMode='numeric'
            maxLength={10}
            name='phoneNumber'
            value={formik.values.phoneNumber}
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
            disabled={disabled || mode === 'edit'} // 👈 lock email on edit
            placeholder='Enter Email'
            type='email'
            name='email'
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.email && (formik.errors.email as string)}
          />
        </FormRow>

        {/* Password field - only for edit mode when explicitly allowed (e.g. client/vendor users & contacts) */}
        {mode === 'edit' && showPasswordField && (
          <FormRow label='Password'>
            <div className='flex items-center gap-2 w-full'>
              <FormInput
                disabled={disabled}
                placeholder='Enter or generate password'
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
                  // Generate password that matches validation: at least one letter and one number, min 6 chars
                  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
                  const numbers = '23456789';
                  const allChars = `${letters}${numbers}`;

                  let pwd = '';
                  // Ensure at least one letter and one number
                  pwd += letters.charAt(Math.floor(Math.random() * letters.length));
                  pwd += numbers.charAt(Math.floor(Math.random() * numbers.length));

                  const targetLength = 6;
                  for (let i = 2; i < targetLength; i += 1) {
                    pwd += allChars.charAt(Math.floor(Math.random() * allChars.length));
                  }

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
            ? 'Invite'
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
