import { toast } from 'react-toastify';
import { useCreateUserSettingsMutation } from '../../store/services/settings/settings';
import { type TCreateInternalUserFormData } from '../../validators/internalUser';
import type { TErrorResponse } from '../../store/types/common.types';
import SidebarModal from '../base/SidebarModal';
import { InternalUserForm } from '../users/InternalUserForm';

type TAddUserSettingsSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export const AddUserSettingsSidebar = ({ isOpen, onClose }: TAddUserSettingsSidebarProps) => {
  const [createUser, { isLoading: isSubmitting }] = useCreateUserSettingsMutation();

  function onSubmit(values: TCreateInternalUserFormData, resetForm: () => void) {
    createUser(values)
      .unwrap()
      .then(() => {
        toast.success('Invite Sent Successfully');
        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else toast.error('Internal server error');
        console.log('Error in creating user:', error);
      });
  }

  return (
    <SidebarModal heading='Add User' opened={isOpen} onClose={onClose}>
      <div className=' bg-white'>
        <InternalUserForm
          mode='add'
          disabled={isSubmitting}
          onSubmit={onSubmit}
          initialValues={{
            name: '',
            phoneNumber: '',
            email: '',
            department: '',
            roleId: '',
            designationId: undefined,
            userType: 'INTERNAL',
            reportsToId: undefined,
            profilePhoto: undefined,
          }}
        />
      </div>
    </SidebarModal>
  );
};
