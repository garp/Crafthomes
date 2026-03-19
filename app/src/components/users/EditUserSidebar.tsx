import { useEditUserMutation } from '../../store/services/user/userSlice';
import type { TEditUserSidebarProps } from '../../types/users';
import type { TErrorResponse } from '../../store/types/common.types';
import { toast } from 'react-toastify';
import { getUser } from '../../utils/auth';

import { type TAddUserFormData } from '../../validators/user';
import SidebarModal from '../base/SidebarModal';
import { UserForm } from './UserForm';

export default function EditUserSidebar({
  isOpen,
  onClose,
  userData,
  userId,
}: TEditUserSidebarProps) {
  const [editUser, { isLoading: isSubmitting }] = useEditUserMutation();
  const currentUser = getUser();
  const isSuperAdmin = currentUser?.role?.name?.toLowerCase?.() === 'super_admin';
  const targetRoleName = userData?.role?.name?.toLowerCase?.() ?? '';
  const isClientOrVendorManaged =
    targetRoleName === 'client_contact' ||
    targetRoleName === 'vendor_client' ||
    targetRoleName === 'client' ||
    targetRoleName === 'vendor';
  const canEditPassword =
    isSuperAdmin &&
    isClientOrVendorManaged &&
    (userData?.inviteState === 'COMPLETED' || userData?.inviteState === 'PASSWORD_ADDED');
  const initialValues = {
    name: userData?.name || '',
    phoneNumber: userData?.phoneNumber || '',
    email: userData?.email || '',
    department: userData?.department || '',
    // Never prefill existing password; always start empty for security
    password: '',
    designationId:
      typeof userData?.designation === 'object'
        ? userData?.designation?.id
        : userData?.designationId || '',
    roleId: userData?.role?.id || '',
    clientId: userData?.client?.id || '',
    vendorId: userData?.vendor?.id || '',
  };
  function onSubmit(values: TAddUserFormData, resetForm: () => void) {
    editUser({
      ...values,
      userId: userId,
    })
      .unwrap()
      .then(() => {
        toast.success('User updated successfully');
        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in updating user:', error);
      });
  }
  // const roleOptions = roles?.data?.map((role) => ({ label: role?.name, value: role?.id }));
  // const isFormValid = formik.isValid && formik.dirty;

  return (
    <SidebarModal heading='Edit User' opened={isOpen} onClose={onClose}>
      <div className='h-full bg-white'>
        <UserForm
          mode='edit'
          disabled={isSubmitting}
          onSubmit={onSubmit}
          initialValues={initialValues}
          // Allow password edit only for client/vendor contacts after onboarding completion
          showPasswordField={canEditPassword}
        />
      </div>
    </SidebarModal>
  );
}
