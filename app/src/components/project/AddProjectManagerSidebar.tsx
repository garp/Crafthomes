import { toast } from 'react-toastify';
import SidebarModal from '../base/SidebarModal';
import { InternalUserForm } from '../users/InternalUserForm';
import {
  useCreateUserSettingsMutation,
  useGetUserSettingsQuery,
} from '../../store/services/settings/settings';
// import { useGetDesignationsQuery } from '../../store/services/designation/designationSlice';
import type { TFunc } from '../../types/common.types';
import type { TCreateInternalUserFormData } from '../../validators/internalUser';
import type { TErrorResponse } from '../../store/types/common.types';

type Props = {
  opened: boolean;
  onClose: TFunc;
  onCreated?: (id: string) => void;
  defaultName?: string;
};

export default function AddProjectManagerSidebar({
  opened,
  onClose,
  onCreated,
  defaultName,
}: Props) {
  const [createUser, { isLoading }] = useCreateUserSettingsMutation();
  // const { data: designationsData } = useGetDesignationsQuery({ pageLimit: '50' });
  // Refetch users after creation to find the newly created user
  const { refetch: refetchUsers } = useGetUserSettingsQuery(
    { pageLimit: '100', status: 'ACTIVE' },
    { skip: true },
  );

  function handleSubmit(values: TCreateInternalUserFormData, resetForm: () => void) {
    // Allow any designation to be selected, no restriction to PROJECT_MANAGER
    const submitValues = {
      ...values,
    };

    createUser(submitValues)
      .unwrap()
      .then(async () => {
        toast.success('Project manager added successfully');

        // Since the API doesn't return the user ID, we need to refetch and find the user by email
        if (onCreated && submitValues.email) {
          try {
            // Wait a bit for cache invalidation to complete
            await new Promise((resolve) => setTimeout(resolve, 500));
            const { data: usersData } = await refetchUsers();
            const newUser = usersData?.data?.users?.find(
              (u: any) => u.email === submitValues.email,
            );
            if (newUser?.id) {
              onCreated(newUser.id);
            }
          } catch (error) {
            console.error('Error finding created user:', error);
            // Continue anyway - the parent component will handle refetching
          }
        }

        resetForm();
        onClose();
      })
      .catch((error: { data: TErrorResponse }) => {
        if (error?.data?.message) {
          toast.error(error?.data?.message);
        } else {
          toast.error('Unable to add project manager');
        }
        console.error('Error creating project manager:', error);
      });
  }

  return (
    <SidebarModal heading='Add Project Manager' opened={opened} onClose={onClose}>
      <div className='bg-white h-full'>
        <InternalUserForm
          mode='add'
          disabled={isLoading}
          onSubmit={handleSubmit}
          initialValues={{
            name: defaultName || '',
            phoneNumber: '',
            email: '',
            department: '',
            roleId: '',
            designationId: undefined,
            userType: 'INTERNAL',
            reportsToId: undefined,
          }}
        />
      </div>
    </SidebarModal>
  );
}
