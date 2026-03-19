import { toast } from 'react-toastify';
import { useUpdateUserSettingsMutation } from '../../store/services/settings/settings';
import type { TErrorResponse } from '../../store/types/common.types';
import { type TCreateInternalUserFormData } from '../../validators/internalUser';
import SidebarModal from '../base/SidebarModal';
import { InternalUserForm } from '../users/InternalUserForm';
import type { TUser } from '../../store/types/user.types';
import { getUser } from '../../utils/auth';

type TEditUserSettingsSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  userData: TUser | null;
  userId: string;
};

export default function EditUserSettingsSidebar({
  isOpen,
  onClose,
  userData,
  userId,
}: TEditUserSettingsSidebarProps) {
  const [editUser, { isLoading: isSubmitting }] = useUpdateUserSettingsMutation();
  const currentUser = getUser();
  const isSuperAdmin = currentUser?.role?.name?.toLowerCase?.() === 'super_admin';
  const canEditPassword =
    isSuperAdmin &&
    (userData?.inviteState === 'COMPLETED' || userData?.inviteState === 'PASSWORD_ADDED');

  // const initialValues = {
  //   name: userData?.name || '',
  //   phoneNumber: userData?.phoneNumber || '',
  //   email: userData?.email || '',
  //   department: userData?.department || '',
  //   roleId: userData?.role?.id || '',
  //   designationId: userData?.designationId || '',
  //   userType: 'INTERNAL',
  // };

  function onSubmit(values: TCreateInternalUserFormData, resetForm: () => void) {
    console.log('Form submitted with values:', values);
    console.log('User ID:', userId);

    if (!userId) {
      toast.error('User ID is missing');
      console.error('User ID is missing or empty');
      return;
    }

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

  return (
    <SidebarModal heading='Edit User' opened={isOpen} onClose={onClose}>
      <div className='h-full bg-white'>
        {userData && userId ? (
          <InternalUserForm
            mode='edit'
            disabled={isSubmitting}
            onSubmit={onSubmit}
            initialValues={{
              name: userData?.name || '',
              phoneNumber: userData?.phoneNumber || '',
              email: userData?.email || '',
              department: userData?.department || undefined,
              roleId: userData?.role?.id || '',
              designationId:
                typeof userData?.designation === 'object'
                  ? userData?.designation?.id
                  : userData?.designationId || undefined,
              userType: 'INTERNAL',
              password: '',
              reportsToId: userData?.reportsToId || undefined,
              profilePhoto: userData?.profilePhoto || undefined,
            }}
            showPasswordField={canEditPassword}
          />
        ) : (
          <div className='flex items-center justify-center h-full'>
            <p className='text-gray-500'>Loading user data...</p>
          </div>
        )}
      </div>
    </SidebarModal>
  );
}
